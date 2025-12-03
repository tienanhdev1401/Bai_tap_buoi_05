const API_URL = 'http://localhost:4000/api';
const loginForm = document.getElementById('loginForm');
const resultBox = document.getElementById('loginResult');

function redirectByRole(role) {
  if (role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }
  window.location.href = 'cart.html';
}

function autoRedirectIfAuthenticated() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) return;
  try {
    const user = JSON.parse(storedUser);
    redirectByRole(user.role);
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

autoRedirectIfAuthenticated();

function showError(field, message) {
  const target = document.querySelector(`[data-for="${field}"]`);
  if (target) target.textContent = message;
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  showError('email', '');
  showError('password', '');
  resultBox.textContent = '';

  if (!email) {
    showError('email', 'Email không được để trống');
    return;
  }
  if (!password || password.length < 6) {
    showError('password', 'Mật khẩu tối thiểu 6 ký tự');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Đăng nhập thất bại, vui lòng kiểm tra lại');
    }

    const data = await response.json();
    saveSession(data.token, data.user);
    resultBox.textContent = `Xin chào ${data.user.name}! Đang chuyển hướng...`;
    setTimeout(() => redirectByRole(data.user.role), 600);
  } catch (error) {
    resultBox.textContent = error.message;
  }
});
