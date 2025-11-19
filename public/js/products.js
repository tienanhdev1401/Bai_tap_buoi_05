const API_URL = 'http://localhost:4000/api';
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

if (!token || !storedUser) {
  window.location.href = 'login.html';
}

const user = storedUser ? JSON.parse(storedUser) : null;
if (user && user.role === 'admin') {
  window.location.href = 'admin.html';
}
const currentUser = document.getElementById('currentUser');
const productGrid = document.getElementById('productGrid');
const statusText = document.getElementById('statusText');
const categoryFilter = document.getElementById('categoryFilter');
const logoutBtn = document.getElementById('logoutBtn');
const sentinel = document.getElementById('sentinel');

let page = 1;
let hasMore = true;
let loading = false;
let currentCategory = 'all';

currentUser.textContent = user ? `${user.name} (${user.role})` : 'Khách';

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

categoryFilter.addEventListener('change', () => {
  currentCategory = categoryFilter.value;
  page = 1;
  hasMore = true;
  productGrid.innerHTML = '';
  statusText.textContent = 'Đang tải sản phẩm...';
  loadProducts();
});

async function loadProducts() {
  if (loading || !hasMore) return;
  loading = true;
  statusText.textContent = 'Đang tải sản phẩm...';

  try {
    const url = `${API_URL}/products?category=${currentCategory}&page=${page}&limit=6`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Không tải được sản phẩm');
    }

    const data = await response.json();
    renderProducts(data.products);
    hasMore = data.hasMore;

    if (!hasMore) {
      statusText.textContent = 'Đã hết sản phẩm.';
    } else {
      statusText.textContent = '';
    }

    page += 1;
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    loading = false;
  }
}

function renderProducts(products) {
  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}" />
      <h4>${product.name}</h4>
      <p>${product.description}</p>
      <strong>${product.price.toLocaleString()} đ</strong>
    `;
    productGrid.appendChild(card);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadProducts();
    }
  });
});

observer.observe(sentinel);

// Tải trang đầu tiên ngay khi load
loadProducts();
