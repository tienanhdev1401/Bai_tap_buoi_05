import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleNavigate = (target) => {
    switch (target) {
      case 'products':
        navigate('/products');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'logout':
        logout();
        navigate('/login', { replace: true });
        break;
      default:
        break;
    }
  };

  return (
    <div className="home-page">
      <main className="home-wrapper">
        <section className="home-card">
          <h1>
            Xin chào, <span>{user?.name || 'Khách'}</span>!
          </h1>
          <p className="home-subtitle">Chọn nơi bạn muốn truy cập.</p>
          <div className="home-actions">
            <button type="button" onClick={() => handleNavigate('products')}>
              Trang sản phẩm
            </button>
            <button type="button" className="ghost" onClick={() => handleNavigate('cart')}>
              Giỏ hàng
            </button>
            <button type="button" className="danger" onClick={() => handleNavigate('logout')}>
              Đăng xuất
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
