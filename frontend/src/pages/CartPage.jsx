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

  const userDisplayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Người dùng';
  }, [user]);

  const userRoleLabel = useMemo(() => {
    if (!user?.role) return 'Chưa đăng nhập';
    if (user.role === 'admin') return 'Quản trị viên';
    if (user.role === 'user') return 'Thành viên';
    return user.role;
  }, [user]);

  const userInitials = useMemo(() => {
    const source = user?.name || user?.email || 'Người dùng';
    return source
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'N';
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    navigate('/products');
  };

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
          <nav className="top-nav" aria-label="Thanh điều hướng giỏ hàng">
            <div className="nav-left">
              <button type="button" className="nav-button nav-back" onClick={handleBack}>
                ← Quay lại
              </button>
              <div className="nav-titles">
                <h1 className="nav-title">Giỏ hàng của bạn</h1>
                <p className="nav-subtitle">Theo dõi những món đã thêm vào giỏ</p>
              </div>
            </div>
            <div className="nav-right">
              <div className="nav-user">
                <span className="nav-avatar" aria-hidden="true">{userInitials}</span>
                <div className="nav-user-meta">
                  <span className="nav-user-name">{userDisplayName}</span>
                  <span className="nav-user-role">{userRoleLabel}</span>
                </div>
              </div>
              <button type="button" className="nav-button danger" onClick={handleLogout}>
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
