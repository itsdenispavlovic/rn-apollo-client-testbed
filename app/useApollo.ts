import { createUploadLink } from "apollo-upload-client";
import { RetryLink } from "@apollo/client/link/retry";
import { setContext } from "@apollo/client/link/context";
import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CachePersistor, AsyncStorageWrapper } from "apollo3-cache-persist";

interface Props {
  token: string | null;
  graphqlEndpoint: string;
}

const SCHEMA_VERSION = "4";
const SCHEMA_VERSION_KEY = "apollo-schema-version";

const authLink = (token: string | null) => {
  return setContext(async (_, { headers }) => {
    if (token) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      };
    }
    return { headers };
  });
};

const cache = new InMemoryCache({
  dataIdFromObject: (object: any) => {
    switch (object.__typename) {
      //User is whatever type "me" query resolves to
      // case 'User': return object.name;
      default: return object?.id || object?._id;
    }
  }
});

const retryLink = new RetryLink({
  delay: {
    initial: 1000,
    max: 3,
    jitter: true,
  },
  attempts: {
    max: 2,
    retryIf: (error, _operation) => {
      if (
        _operation.operationName === "signin" ||
        _operation.operationName === "register"
      ) {
        return false;
      }
      return !!error;
    },
  },
});

async function setupPersistCache() {
  const persistor = new CachePersistor({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
    trigger: "write",
    maxSize: false,
    debug: false
  });

  // Read the current schema version from AsyncStorage.
  const currentVersion = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);

  if (currentVersion === SCHEMA_VERSION) {
    // If the current version matches the latest version,
    // we're good to go and can restore the cache.
    await persistor.restore();
  } else {
    // Otherwise, we'll want to purge the outdated persisted cache
    // and mark ourselves as having updated to the latest version.
    await persistor.purge();
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  }
}

export function createApolloClient({ token, graphqlEndpoint }: Props) {
  setupPersistCache();

  return new ApolloClient({
    cache,
    link: from([
      retryLink,
      authLink(token),
      createUploadLink({
        uri: graphqlEndpoint || "http://localhost:1337/graphql"
      })
    ]),
    connectToDevTools: process.env["NODE_ENV"] === "development"
  });
}
