import { ApolloProvider } from "@apollo/client";
import { ThemeProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import theme from "../src/components/theme";
import { apolloDevToolsInit } from "react-native-apollo-devtools-client";
import { createApolloClient } from "./useApollo";

const token = "";
const graphqlEndpoint = "https://main--spacex-l4uc6p.apollographos.net/graphql";

const client = createApolloClient({
  token,
  graphqlEndpoint,
});

if (__DEV__) {
  apolloDevToolsInit(client);
}

export default function Layout() {
  console.log("layout renders");
  return (
    <ApolloProvider client={client}>
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
