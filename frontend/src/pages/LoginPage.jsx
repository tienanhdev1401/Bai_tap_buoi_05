import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = { email: '', password: '' };
    if (!email.trim()) {
      nextErrors.email = 'Email không được để trống';
    }
    if (!password.trim() || password.length < 6) {
      nextErrors.password = 'Mật khẩu không được để trống';
    }
    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    setResult('');
    try {
      const response = await http.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      setResult(`Xin chào ${user.name}! Đang chuyển hướng...`);
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 600);
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại';
      setResult(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <h2>Đăng nhập</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={submitting}
            />
            <span className="error" data-for="email">
              {errors.email}
            </span>
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
              disabled={submitting}
            />
            <span className="error" data-for="password">
              {errors.password}
            </span>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <div className="result" id="loginResult">
          {result}
        </div>
        <div className="auth-switch">
          Chưa có tài khoản?
          {' '}
          <button
            type="button"
            className="link-button"
            onClick={handleSwitchToRegister}
            disabled={submitting}
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
