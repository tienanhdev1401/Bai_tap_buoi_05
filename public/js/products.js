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
