const logoutBtn = document.getElementById('logoutBtn');

function ensureAuthenticated() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(storedUser);
    if (!user || user.role !== 'user') {
      window.location.href = 'login.html';
    }
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}

ensureAuthenticated();

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart-token');
    localStorage.removeItem('cart-email');
    window.location.href = 'login.html';
  });
}

// Đồng bộ token cho ứng dụng React
(function syncToken() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (token && storedUser) {
    try {
      const user = JSON.parse(storedUser);
      localStorage.setItem('cart-token', token);
      localStorage.setItem('cart-email', user.email || '');
    } catch (error) {
      localStorage.removeItem('cart-token');
      localStorage.removeItem('cart-email');
    }
  }
})();
