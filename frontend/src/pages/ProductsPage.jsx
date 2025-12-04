import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';

const PAGE_SIZE = 6;
const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';
const SORT_WHITELIST = new Set(['newest', 'views', 'priceAsc', 'priceDesc', 'discount', 'nameAsc', 'nameDesc']);
const BUILTIN_CATEGORY_NAMES = ['Điện thoại', 'Laptop', 'Âm thanh', 'Phụ kiện'];

const defaultFilters = {
  category: 'all',
  q: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
};

function ProductsPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [formState, setFormState] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState('#475569');
  const [addingProductId, setAddingProductId] = useState(null);
  const feedbackTimerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const normalizeProducts = useCallback((list) => {
    if (!Array.isArray(list)) {
      return [];
    }
    return list.map((item) => {
      const id = item._id || item.id;
      return id ? { ...item, _id: id } : item;
    });
  }, []);

  useEffect(() => {
    let canceled = false;
    async function fetchFirstPage() {
      setLoading(true);
      setStatusColor('#475569');
      setStatusMessage('Đang tải sản phẩm...');
      try {
        const params = buildQueryParams(filters, 1);
        const response = await http.get('/products', { params });
        if (canceled) return;
        const data = response.data || {};
        const items = normalizeProducts(data.products);
        setProducts(items);
        setHasMore(Boolean(data.hasMore));
        setPage(2);
        if (!data.hasMore) {
          if ((data.total ?? items.length) === 0) {
            setStatusMessage('Không tìm thấy sản phẩm phù hợp.');
          } else {
            setStatusMessage('Đã hết sản phẩm.');
          }
        } else {
          setStatusMessage('');
        }
      } catch (error) {
        if (canceled) return;
        const message = error.response?.data?.message || 'Không tải được sản phẩm';
        setStatusColor('#dc2626');
        setStatusMessage(message);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    fetchFirstPage();
    return () => {
      canceled = true;
    };
  }, [filters, normalizeProducts]);

  useEffect(() => () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
  }, []);

  const buildQueryParams = (targetFilters, targetPage) => {
    const params = {
      page: targetPage,
      limit: PAGE_SIZE,
    };
    if (targetFilters.category && targetFilters.category !== 'all') {
      params.category = targetFilters.category;
    }
    params.sortBy = SORT_WHITELIST.has(targetFilters.sortBy) ? targetFilters.sortBy : 'newest';
    if (targetFilters.q) params.q = targetFilters.q;
    if (targetFilters.minPrice) params.minPrice = targetFilters.minPrice;
    if (targetFilters.maxPrice) params.maxPrice = targetFilters.maxPrice;
    return params;
  };

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFilters(formState);
  };

  const handleReset = () => {
    setFormState(defaultFilters);
    setFilters(defaultFilters);
  };

  const categoryOptions = useMemo(() => {
    const map = new Map();
    const addCategory = (value, label = value) => {
      if (!value) return;
      if (!map.has(value)) {
        map.set(value, { value, label });
      }
    };

    addCategory('all', 'Tất cả');
    BUILTIN_CATEGORY_NAMES.forEach((value) => addCategory(value));
    products.forEach((product) => addCategory(product.category));

    const entries = Array.from(map.values());
    const allIndex = entries.findIndex((item) => item.value === 'all');
    const [allOption] = allIndex !== -1 ? entries.splice(allIndex, 1) : [{ value: 'all', label: 'Tất cả' }];
    entries.sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    return [allOption, ...entries];
  }, [products]);

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== 'all') count += 1;
    if (filters.q) count += 1;
    if (filters.minPrice) count += 1;
    if (filters.maxPrice) count += 1;
    if (filters.sortBy && filters.sortBy !== 'newest') count += 1;
    return count;
  }, [filters]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setStatusColor('#475569');
    setStatusMessage('Đang tải sản phẩm...');
    try {
      const params = buildQueryParams(filters, page);
      const response = await http.get('/products', { params });
      const data = response.data || {};
      const items = normalizeProducts(data.products);
      setProducts((prev) => {
        const existingIds = new Set(prev.map((item) => item._id || item.id));
        const deduped = items.filter((item) => {
          const nextId = item._id || item.id;
          if (!nextId) {
            return true;
          }
          if (existingIds.has(nextId)) {
            return false;
          }
          existingIds.add(nextId);
          return true;
        });
        return [...prev, ...deduped];
      });
      setHasMore(Boolean(data.hasMore));
      setPage((prevPage) => prevPage + 1);
      if (!data.hasMore) {
        setStatusMessage('Đã hết sản phẩm.');
      } else {
        setStatusMessage('');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Không tải được sản phẩm';
      setStatusColor('#dc2626');
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, filters, page, normalizeProducts]);

  useEffect(() => {
    if (!hasMore || loading) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px 0px 200px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, handleLoadMore]);

  const showFeedback = (message, isError = false) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setStatusColor(isError ? '#dc2626' : '#475569');
    setStatusMessage(message);
    feedbackTimerRef.current = setTimeout(() => {
      setStatusMessage('');
      setStatusColor('#475569');
    }, 2500);
  };

  const handleAddToCart = async (productId) => {
    if (!token) {
      showFeedback('Bạn cần đăng nhập để thêm sản phẩm vào giỏ.', true);
      return;
    }
    setAddingProductId(productId);
    try {
      const mutation = `
        mutation AddProduct($productId: ID!) {
          addToCart(productId: $productId) {
            id
          }
        }
      `;
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
      const message = error instanceof Error ? error.message : 'Không thêm được sản phẩm vào giỏ';
      showFeedback(message, true);
    } finally {
      setAddingProductId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentUserLabel = useMemo(() => {
    if (!user) return 'Khách';
    return `${user.name} (${user.role})`;
  }, [user]);

  const handleOpenDetail = (id) => {
    navigate(`/products/${id}`);
  };

  return (
    <div>
      <nav className="top-nav">
        <strong>Danh sách sản phẩm</strong>
        <div className="nav-right">
          <span id="currentUser">{currentUserLabel}</span>
          <button type="button" className="plain" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className="products-page">
        <aside>
          <ProductFilters
            formState={formState}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            loading={loading}
            categories={categoryOptions}
            appliedFiltersCount={appliedFiltersCount}
          />
        </aside>
        <section>
          <ProductGrid
            products={products}
            onOpenDetail={handleOpenDetail}
            onAddToCart={handleAddToCart}
            addingProductId={addingProductId}
          />
          <div ref={sentinelRef} id="sentinel" aria-hidden="true" />
          <p className="status" id="statusText" style={{ color: statusColor }}>
            {statusMessage}
          </p>
          {hasMore && (
            <button type="button" className="load-more" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Đang tải...' : 'Tải thêm sản phẩm'}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProductsPage;
