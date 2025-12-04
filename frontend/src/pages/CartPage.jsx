import { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { CartProvider } from 'tienanh-cart';
import { useNavigate } from 'react-router-dom';
import { createApolloClient } from '../api/apollo';
import { useAuth } from '../context/AuthContext';
import CartView from '../components/CartView';

function CartPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const client = useMemo(() => {
    if (!token) return null;
    return createApolloClient(token);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    navigate('/products');
  };

  const currentUserLabel = user.email || user.name || 'Người dùng';

  if (!token || !user) {
    return (
      <main className="cart-layout">
        <p className="status-text">Bạn cần đăng nhập lại để xem giỏ hàng.</p>
        <button type="button" className="add-to-cart-btn" onClick={() => navigate('/login')}>
          Về trang đăng nhập
        </button>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <div>
          <nav className="top-nav">
            <div className="nav-left">
              <button type="button" className="plain back-button" onClick={handleBack}>
                ← Quay lại
              </button>
              <strong>Giỏ hàng</strong>
            </div>
            <div className="nav-right">
              <span>Xin chào, {currentUserLabel}</span>
              <button type="button" className="plain" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </nav>
          <main>
            <CartView token={token} />
          </main>
        </div>
      </CartProvider>
    </ApolloProvider>
  );
}

export default CartPage;
