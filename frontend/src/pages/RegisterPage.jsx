import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const nextErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedPassword = formState.password.trim();
    const trimmedConfirm = formState.confirmPassword.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = 'Tên tối thiểu 2 ký tự';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Email không hợp lệ';
    }

    if (trimmedPassword.length < 6) {
      nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }

    if (trimmedConfirm !== trimmedPassword) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((message) => !message);
  };

  const extractErrorMessage = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    const details = error.response?.data?.details;
    if (details?.body?.length) {
      return details.body[0].message;
    }
    return 'Đăng ký không thành công, vui lòng thử lại';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setResult('');
    const payload = {
      name: formState.name.trim(),
      email: formState.email.trim().toLowerCase(),
      password: formState.password.trim(),
    };

    try {
      await http.post('/auth/register', payload);
      const loginResponse = await http.post('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      const { token, user } = loginResponse.data;
      login(token, user);
      setResult('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 600);
    } catch (error) {
      setResult(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <h2>Tạo tài khoản</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label>
            Họ và tên
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleFieldChange}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              disabled={submitting}
            />
            <span className="error">{errors.name}</span>
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleFieldChange}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={submitting}
            />
            <span className="error">{errors.email}</span>
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleFieldChange}
              placeholder="••••••"
              autoComplete="new-password"
              disabled={submitting}
            />
            <span className="error">{errors.password}</span>
          </label>
          <label>
            Nhập lại mật khẩu
            <input
              type="password"
              name="confirmPassword"
              value={formState.confirmPassword}
              onChange={handleFieldChange}
              placeholder="••••••"
              autoComplete="new-password"
              disabled={submitting}
            />
            <span className="error">{errors.confirmPassword}</span>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
        <div className="result">{result}</div>
        <div className="auth-switch">
          Đã có tài khoản?
          {' '}
          <button type="button" className="link-button" onClick={handleSwitchToLogin} disabled={submitting}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
