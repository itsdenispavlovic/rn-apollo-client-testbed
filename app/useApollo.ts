import { sha256 } from "hash.js";
import { useMemo, useState } from "react";
import { createUploadLink, } from "apollo-upload-client";
import { RetryLink } from "@apollo/client/link/retry";
import { setContext } from "@apollo/client/link/context";
import { ApolloClient, InMemoryCache, NormalizedCacheObject, from } from "@apollo/client";

interface Props {
    token: string | null;
    graphqlEndpoint: string;
  }
  
export const useApollo = ({ token,  graphqlEndpoint}: Props) => {
    const authLink = (token: string | null) => {
      return setContext(async (_, { headers }) => {
        if (token) {
          return {
            headers: {
              ...headers,
              authorization: `Bearer ${token}`
            }
          };
        }
        return { headers };
      });
    };
  
    const retryLink = useMemo(() => {
      return new RetryLink({
        delay: {
          initial: 1000,
          max: 3,
          jitter: true
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
    }, []);
  
    const currentTime = Date.now();
    const [futureDate, setFutureDate] = useState<number>(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
    
  
    const cache = new InMemoryCache({
        dataIdFromObject(responseObject) {
          const jsonString = JSON.stringify(responseObject);
          const hash = sha256().update(jsonString).digest("hex");
          return `${responseObject.__typename}:${hash}`;
        }
      });

    const client =  new ApolloClient({
        cache,
        link: from([
          retryLink,
          authLink(token),
          createUploadLink({
            uri: graphqlEndpoint || "http://localhost:1337/graphql"
          })
        ]),
        connectToDevTools: process.env["NODE_ENV"] === "development"
      })
  
      if (futureDate && currentTime > futureDate) {
        client?.resetStore();
        setFutureDate(Date.now() + 3 * 24 * 60 * 60 * 1000); // Reset the cache after 3 days
      }

    return client;
  }