const adminInfo = document.getElementById('adminInfo');
const logoutBtn = document.getElementById('logoutBtn');
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

function go(path) {
  window.location.href = path;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  go('login.html');
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (!token || !storedUser) {
  logout();
} else {
  try {
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin') {
      go('products.html');
    } else {
      adminInfo.innerHTML = `
        <p><strong>Tên:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email || 'admin@example.com'}</p>
        <p><strong>Quyền:</strong> ${user.role}</p>
        <p>Đây chỉ là trang minh hoạ khu vực quản trị.</p>
      `;
    }
  } catch (error) {
    logout();
  }
}
