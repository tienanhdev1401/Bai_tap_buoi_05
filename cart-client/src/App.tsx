import { useMemo, useState } from 'react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { Button, Card } from 'tienanh-cart';
import { cache } from './apolloClient';
import { createApolloLink } from './apolloClient';
import CartView from './components/CartView';

type AuthState = {
  token: string | null;
  userEmail: string | null;
};

const initialAuth: AuthState = {
  token: null,
  userEmail: null,
};

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const storedToken = localStorage.getItem('cart-token');
    const storedEmail = localStorage.getItem('cart-email');
    return {
      token: storedToken,
      userEmail: storedEmail,
    };
  });

  const client = useMemo(() => {
    const link = createApolloLink(auth.token);
    return new ApolloClient({
      link,
      cache,
      devtools: {
        enabled: import.meta.env.DEV,
      },
    });
  }, [auth.token]);

  const handleLogout = () => {
    localStorage.removeItem('cart-token');
    localStorage.removeItem('cart-email');
    setAuth(initialAuth);
    window.location.href = 'login.html';
  };

  return (
    <main>
      {auth.token ? (
        <ApolloProvider client={client}>
          <CartView token={auth.token} email={auth.userEmail ?? ''} onLogout={handleLogout} />
        </ApolloProvider>
      ) : (
        <Card title="Bạn cần đăng nhập">
          <p className="status-text">
            Hãy quay lại trang đăng nhập chính để xác thực, sau đó trở lại trang giỏ hàng.
          </p>
          <Button variant="primary" onClick={() => (window.location.href = 'login.html')}>
            Về trang đăng nhập
          </Button>
        </Card>
      )}
    </main>
  );
}

export default App;
