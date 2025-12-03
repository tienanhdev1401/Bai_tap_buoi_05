const API_URL = 'http://localhost:4000/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

if (!token || !storedUser) {
  window.location.href = 'login.html';
}

const user = storedUser ? JSON.parse(storedUser) : null;
if (user && user.role === 'admin') {
  window.location.href = 'admin.html';
}
syncCartToken();
const currentUser = document.getElementById('currentUser');
const productGrid = document.getElementById('productGrid');
const statusText = document.getElementById('statusText');
const categoryFilter = document.getElementById('categoryFilter');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('searchInput');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const minDiscountInput = document.getElementById('minDiscount');
const minViewsInput = document.getElementById('minViews');
const saleOnlyCheckbox = document.getElementById('saleOnly');
const sortBySelect = document.getElementById('sortBy');
const resetFiltersBtn = document.getElementById('resetFilters');
const logoutBtn = document.getElementById('logoutBtn');
const sentinel = document.getElementById('sentinel');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let feedbackTimer = null;

let page = 1;
let hasMore = true;
let loading = false;
const PAGE_SIZE = 6;
const filters = {
  category: 'all',
  q: '',
  minPrice: '',
  maxPrice: '',
  minDiscount: '',
  minViews: '',
  onSale: false,
  sortBy: 'newest',
};

currentUser.textContent = user ? `${user.name} (${user.role})` : 'Khách';

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

if (filterForm) {
  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    filterForm.reset();
    filters.category = 'all';
    filters.q = '';
    filters.minPrice = '';
    filters.maxPrice = '';
    filters.minDiscount = '';
    filters.minViews = '';
    filters.onSale = false;
    filters.sortBy = 'newest';
    applyFilters();
  });
}

categoryFilter.addEventListener('change', () => filterForm.requestSubmit());
sortBySelect.addEventListener('change', () => filterForm.requestSubmit());
saleOnlyCheckbox.addEventListener('change', () => filterForm.requestSubmit());

function applyFilters() {
  filters.category = categoryFilter.value;
  filters.q = searchInput.value.trim();
  filters.minPrice = minPriceInput.value;
  filters.maxPrice = maxPriceInput.value;
  filters.minDiscount = minDiscountInput.value;
  filters.minViews = minViewsInput.value;
  filters.onSale = saleOnlyCheckbox.checked;
  filters.sortBy = sortBySelect.value;

  page = 1;
  hasMore = true;
  productGrid.innerHTML = '';
  statusText.style.color = '#475569';
  statusText.textContent = 'Đang tải sản phẩm...';
  updateLoadMoreButton();
  loadProducts(true);
}

async function loadProducts(isReset = false) {
  if (loading || (!hasMore && !isReset)) return;
  if (isReset) {
    hasMore = true;
  }

  loading = true;
  statusText.style.color = '#475569';
  updateLoadMoreButton();
  statusText.textContent = 'Đang tải sản phẩm...';

  try {
    const params = new URLSearchParams({
      category: filters.category,
      page: String(page),
      limit: String(PAGE_SIZE),
      sortBy: filters.sortBy,
    });

    if (filters.q) params.append('q', filters.q);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.minDiscount) params.append('minDiscount', filters.minDiscount);
    if (filters.minViews) params.append('minViews', filters.minViews);
    if (filters.onSale) params.append('onSale', 'true');

    const response = await fetch(`${API_URL}/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Không tải được sản phẩm');
    }

    const data = await response.json();
    if (page === 1) {
      productGrid.innerHTML = '';
    }
    renderProducts(data.products);
    hasMore = data.hasMore;

    if (!hasMore) {
      statusText.textContent = data.total === 0 ? 'Không tìm thấy sản phẩm phù hợp.' : 'Đã hết sản phẩm.';
    } else {
      statusText.textContent = '';
    }

    page += 1;
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    loading = false;
    updateLoadMoreButton();
    ensureScrollable();
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
      <div class="price-row">
        <strong>${product.price.toLocaleString()} đ</strong>
        ${product.isOnSale ? `<span class="badge sale">-${product.discountPercent}%</span>` : ''}
      </div>
      <small class="meta">${product.views?.toLocaleString() || 0} lượt xem</small>
      <div class="card-actions">
        <button class="add-to-cart-btn" data-product-id="${product._id}">Thêm vào giỏ</button>
      </div>
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

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    loadProducts();
  });
}

productGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('.add-to-cart-btn');
  if (!button) return;

  const { productId } = button.dataset;
  if (!productId) return;

  await addProductToCart(productId, button);
});

// Tải trang đầu tiên ngay khi load
loadProducts(true);

function updateLoadMoreButton() {
  if (!loadMoreBtn) return;
  if (!hasMore) {
    loadMoreBtn.style.display = 'none';
    return;
  }

  loadMoreBtn.style.display = 'block';
  loadMoreBtn.disabled = loading;
  loadMoreBtn.textContent = loading ? 'Đang tải...' : 'Tải thêm sản phẩm';
}

function ensureScrollable() {
  if (!hasMore || loading) return;
  const doc = document.documentElement;
  const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
  const viewportHeight = window.innerHeight;

  if (scrollHeight <= viewportHeight + 16) {
    loadProducts();
  }
}

async function addProductToCart(productId, triggerButton) {
  if (!token) {
    statusText.textContent = 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ.';
    return;
  }

  const mutation = `
    mutation AddProduct($productId: ID!) {
      addToCart(productId: $productId) {
        id
      }
    }
  `;

  try {
    triggerButton.disabled = true;
    triggerButton.textContent = 'Đang thêm...';
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: mutation, variables: { productId } }),
    });

    const result = await response.json();
    if (result.errors?.length) {
      throw new Error(result.errors[0].message || 'Không thêm được sản phẩm vào giỏ');
    }

    showFeedback('Đã thêm sản phẩm vào giỏ hàng');
  } catch (error) {
    showFeedback(error.message || 'Không thêm được sản phẩm vào giỏ', true);
  } finally {
    triggerButton.disabled = false;
    triggerButton.textContent = 'Thêm vào giỏ';
  }
}

function showFeedback(message, isError = false) {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
  }
  statusText.textContent = message;
  statusText.style.color = isError ? '#dc2626' : '#475569';
  feedbackTimer = setTimeout(() => {
    statusText.textContent = '';
    statusText.style.color = '#475569';
  }, 2500);
}

function syncCartToken() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) {
    localStorage.removeItem('cart-token');
    localStorage.removeItem('cart-email');
    return;
  }

  try {
    const user = JSON.parse(storedUser);
    localStorage.setItem('cart-token', token);
    localStorage.setItem('cart-email', user.email || '');
  } catch (error) {
    localStorage.removeItem('cart-token');
    localStorage.removeItem('cart-email');
  }
}
