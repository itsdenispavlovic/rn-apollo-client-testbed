import { createUploadLink } from "apollo-upload-client";
import { RetryLink } from "@apollo/client/link/retry";
import { setContext } from "@apollo/client/link/context";
import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { CachePersistor, AsyncStorageWrapper } from "apollo3-cache-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  token: string | null;
  graphqlEndpoint: string;
}

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
    }
  }
});

export function createApolloClient({ token, graphqlEndpoint }: Props) {
  const cache = new InMemoryCache();

  const persistor = new CachePersistor({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
    debug: process.env["NODE_ENV"] === "development",
    trigger: "write",
    maxSize: false
  });

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
