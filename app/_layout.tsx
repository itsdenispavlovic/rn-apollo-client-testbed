import { ApolloClient, ApolloProvider, InMemoryCache, NormalizedCacheObject, from } from "@apollo/client";
import { ThemeProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import theme from "../src/components/theme";
import { apolloDevToolsInit } from "react-native-apollo-devtools-client";
import { useApollo } from "./useApollo";

const client = useApollo({
  token: "",
  graphqlEndpoint: "https://main--spacex-l4uc6p.apollographos.net/graphql"
})

if (__DEV__) {
  client && apolloDevToolsInit(client);
}

export default function Layout() {
  return (
    client && <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            statusBarColor: theme.colors.alternativeBackground,
            headerStyle: {
              backgroundColor: theme.colors.alternativeBackground,
            },
            headerTitleStyle: {
              color: theme.colors.secondaryText,
            },
          }}
        />
      </ThemeProvider>
    </ApolloProvider>
  );
}
