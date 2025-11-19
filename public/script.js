const API_URL = 'http://localhost:4000/api';
let token = '';
let page = 1;
let selectedCategory = 'all';
let loading = false;
let hasMore = true;

const loginForm = document.getElementById('loginForm');
const productList = document.getElementById('productList');
const loadingText = document.getElementById('loading');
const categoryFilter = document.getElementById('categoryFilter');
const loginResult = document.getElementById('loginResult');

function showError(inputId, message) {
  const errorSpan = document.querySelector(`[data-for="${inputId}"]`);
  if (errorSpan) {
    errorSpan.textContent = message || '';
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  if (!email || !password || password.length < 6) {
    showError('email', !email ? 'Không được bỏ trống' : '');
    showError('password', password.length < 6 ? 'Tối thiểu 6 ký tự' : '');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error('Sai email/mật khẩu');

    const data = await res.json();
    token = data.token;
    loginResult.textContent = `Xin chào ${data.user.name} (${data.user.role})`;

    page = 1;
    productList.innerHTML = '';
    hasMore = true;
    await loadProducts();
  } catch (error) {
    loginResult.textContent = error.message;
  }
});

categoryFilter.addEventListener('change', () => {
  selectedCategory = categoryFilter.value;
  page = 1;
  productList.innerHTML = '';
  hasMore = true;
  loadProducts();
});

async function loadProducts() {
  if (!token || loading || !hasMore) return;
  loading = true;
  loadingText.style.display = 'block';

  try {
    const res = await fetch(
      `${API_URL}/products?category=${selectedCategory}&page=${page}&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error('Không tải được sản phẩm');

    const data = await res.json();
    renderProducts(data.products);
    hasMore = data.hasMore;
    page += 1;
    loadingText.style.display = hasMore ? 'block' : 'none';
  } catch (error) {
    loadingText.textContent = error.message;
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
    productList.appendChild(card);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadProducts();
    }
  });
});

observer.observe(loadingText);
