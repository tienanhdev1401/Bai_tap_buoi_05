import { ApolloClient, InMemoryCache, ApolloLink, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';

export const cache = new InMemoryCache({
  typePolicies: {
    Cart: {
      keyFields: ['id'],
      fields: {
        items: {
          merge: false,
        },
        totals: {
          merge: true,
        },
      },
    },
  },
});

export function createApolloLink(token) {
  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));
    return forward(operation);
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach((err) => {
        console.error('[GraphQL error]', err.message);
      });
    }
    if (networkError) {
      console.error('[Network error]', networkError);
    }
  });

  const httpLink = new HttpLink({ uri: GRAPHQL_URL });

  return from([errorLink, authLink, httpLink]);
}

export function createApolloClient(token) {
  return new ApolloClient({
    link: createApolloLink(token),
    cache,
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
}
