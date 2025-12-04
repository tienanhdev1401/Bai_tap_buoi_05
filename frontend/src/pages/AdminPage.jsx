import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/products', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-page">
      <div className="glass-card">
        <h2>Trang admin</h2>
        <p className="muted">Đây là trang admin</p>
        <div className="admin-box">
          {user?.role === 'admin' ? (
            <>
              <p>
                <strong>Tên:</strong> {user?.name}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || 'admin@example.com'}
              </p>
              <p>
                <strong>Quyền:</strong> {user?.role}
              </p>
              <p>Đây chỉ là trang minh hoạ khu vực quản trị.</p>
            </>
          ) : (
            <p>Đang kiểm tra quyền...</p>
          )}
        </div>
        <button type="button" className="plain" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default AdminPage;
