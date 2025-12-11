import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ProductStats from '../components/ProductStats';
import CommentSection from '../components/CommentSection';
import CompactProductSection from '../components/CompactProductSection';

const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';

function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token, logout } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Đang tải thông tin sản phẩm...');
  const [statusColor, setStatusColor] = useState('#475569');
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/products', { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let canceled = false;
    async function fetchDetail() {
      setLoading(true);
      setStatusColor('#475569');
      setStatusMessage('Đang tải thông tin sản phẩm...');
      try {
        const response = await http.get(`/products/${id}`);
        if (canceled) return;
        setDetail(response.data);
        setStatusMessage('');
      } catch (error) {
        if (canceled) return;
        const message = error.response?.data?.message || 'Không tải được thông tin sản phẩm';
        setStatusColor('#dc2626');
        setStatusMessage(message);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchDetail();
    }

    return () => {
      canceled = true;
    };
  }, [id]);

  const product = detail?.product;
  const metrics = detail?.metrics;
  const isFavorite = Boolean(detail?.status?.isFavorite);
  const comments = detail?.comments ?? [];
  const similarProducts = detail?.similarProducts ?? [];
  const favoriteProducts = detail?.favorites ?? [];
  const recentlyViewed = detail?.recentlyViewed ?? [];
  const availableStock = Number(product?.stock ?? 0);
  const isOutOfStock = product ? availableStock <= 0 : false;

  const userDisplayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Khách';
  }, [user]);

  const userRoleLabel = useMemo(() => {
    if (!user?.role) return 'Chưa đăng nhập';
    if (user.role === 'admin') return 'Quản trị viên';
    if (user.role === 'user') return 'Thành viên';
    return user.role;
  }, [user]);

  const userInitials = useMemo(() => {
    const source = user?.name || user?.email || 'Khách';
    return source
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'K';
  }, [user]);

  const navTitle = product?.name || 'Chi tiết sản phẩm';
  const navSubtitle = product?.category
    ? `Danh mục: ${product.category}`
    : 'Xem thông tin sản phẩm chi tiết';

  const buyersCount = metrics?.buyersCount ?? 0;
  const purchasedQuantity = metrics?.purchasedQuantity ?? 0;

  const formatCurrency = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0';
    return numeric.toLocaleString();
  };

  const formatNumber = (value) => {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) return '0';
    return numeric.toLocaleString();
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const stats = useMemo(
    () => [
      { label: 'Lượt xem', value: formatNumber(metrics?.views) },
      { label: 'Yêu thích', value: formatNumber(metrics?.favoritesCount) },
      { label: 'Khách mua', value: formatNumber(buyersCount) },
      { label: 'Số lượng đã bán', value: formatNumber(purchasedQuantity) },
      { label: 'Bình luận', value: formatNumber(metrics?.commentsCount ?? comments.length) },
      { label: 'Tồn kho', value: isOutOfStock ? '0' : formatNumber(product?.stock) },
    ],
    [metrics, buyersCount, purchasedQuantity, comments.length, product?.stock, isOutOfStock],
  );

  const originalPrice = useMemo(() => {
    if (!product?.isOnSale || !product?.discountPercent) {
      return null;
    }
    const discount = Number(product.discountPercent);
    if (!Number.isFinite(discount) || discount <= 0 || discount >= 100) {
      return null;
    }
    const raw = Number(product.price);
    if (!Number.isFinite(raw)) {
      return null;
    }
    return Math.round(raw / (1 - discount / 100));
  }, [product?.isOnSale, product?.discountPercent, product?.price]);

  const promotionList = useMemo(() => {
    if (Array.isArray(product?.tags) && product.tags.length) {
      return product.tags.slice(0, 4).map((tag) => `Ưu đãi độc quyền cho sản phẩm thuộc nhóm "${tag}"`);
    }
    return [
      'Miễn phí vận chuyển nội thành (áp dụng trong 10km)',
      'Hỗ trợ đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất',
      'Tặng gói vệ sinh/bảo dưỡng cơ bản trong 6 tháng',
      'Ưu đãi 5% cho khách hàng thanh toán lần tiếp theo',
    ];
  }, [product?.tags]);

  const servicePolicies = useMemo(
    () => [
      'Giao hàng siêu tốc trong 2 giờ nội thành',
      'Thanh toán linh hoạt: COD, chuyển khoản, ví điện tử',
      'Hỗ trợ kỹ thuật 1-1 qua điện thoại: 1900 0111',
      'Bảo hành chính hãng, kiểm tra tình trạng online',
    ],
    [],
  );

  const specRows = useMemo(() => {
    const rows = [
      { label: 'Danh mục', value: product?.category || 'Đang cập nhật' },
      {
        label: 'Tồn kho',
        value: isOutOfStock ? 'Hết hàng' : `${formatNumber(product?.stock)} sản phẩm`,
      },
      { label: 'Mã sản phẩm', value: product?.id || product?._id || 'Đang cập nhật' },
      { label: 'Ngày tạo', value: formatDate(product?.createdAt) || 'Đang cập nhật' },
      { label: 'Cập nhật lần cuối', value: formatDate(product?.updatedAt) || 'Đang cập nhật' },
      { label: 'Số lượt xem', value: formatNumber(metrics?.views) },
      { label: 'Số người đã mua', value: formatNumber(buyersCount) },
      { label: 'Số lượng đã bán', value: formatNumber(purchasedQuantity) },
    ];
    if (Array.isArray(product?.tags) && product.tags.length) {
      rows.push({ label: 'Từ khóa nổi bật', value: product.tags.join(', ') });
    }
    return rows;
  }, [product, metrics?.views, buyersCount, purchasedQuantity]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const showStatus = (message, isError = false) => {
    setStatusColor(isError ? '#dc2626' : '#475569');
    setStatusMessage(message);
  };

  const reloadDetail = async () => {
    try {
      const response = await http.get(`/products/${id}`);
      setDetail(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Không tải được thông tin sản phẩm';
      showStatus(message, true);
    }
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'delete' : 'post';
      await http({ method, url: `/products/${id}/favorite` });
      await reloadDetail();
      showStatus(isFavorite ? 'Đã bỏ sản phẩm khỏi danh sách yêu thích' : 'Đã thêm sản phẩm vào danh sách yêu thích');
    } catch (error) {
      const message = error.response?.data?.message || 'Không thay đổi được trạng thái yêu thích';
      showStatus(message, true);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      showStatus('Sản phẩm hiện đã hết hàng', true);
      return;
    }
    setCartLoading(true);
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
        body: JSON.stringify({ query: mutation, variables: { productId: id } }),
      });
      const result = await response.json();
      if (result.errors?.length) {
        throw new Error(result.errors[0].message || 'Không thêm được sản phẩm vào giỏ');
      }
      showStatus('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thêm được sản phẩm vào giỏ';
      showStatus(message, true);
    } finally {
      setCartLoading(false);
    }
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    if (!commentContent.trim()) {
      showStatus('Vui lòng nhập nội dung bình luận', true);
      return;
    }
    setCommentSubmitting(true);
    try {
      const response = await http.post(`/products/${id}/comments`, { content: commentContent.trim() });
      const newComment = response.data?.comment;
      if (newComment) {
        setDetail((prev) => {
          if (!prev) return prev;
          const nextMetrics = {
            ...prev.metrics,
            commentsCount: (prev.metrics?.commentsCount ?? prev.comments?.length ?? 0) + 1,
          };
          return {
            ...prev,
            comments: [newComment, ...(prev.comments ?? [])],
            metrics: nextMetrics,
          };
        });
        setCommentContent('');
        showStatus('Đã gửi bình luận của bạn');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Không gửi được bình luận';
      showStatus(message, true);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleOpenProduct = (productId) => {
    if (!productId) return;
    navigate(`/products/${productId}`);
  };

  return (
    <div>
      <nav className="top-nav" aria-label="Thanh điều hướng chi tiết sản phẩm">
        <div className="nav-left">
          <button type="button" className="nav-button nav-back" onClick={() => navigate('/products')}>
            ← Quay lại danh sách
          </button>
          <div className="nav-titles">
            <h1 className="nav-title">{navTitle}</h1>
            <p className="nav-subtitle">{navSubtitle}</p>
          </div>
        </div>
        <div className="nav-right">
          <button type="button" className="nav-button secondary" onClick={() => navigate('/cart')}>
            Giỏ hàng
          </button>
          <div className="nav-user">
            <span className="nav-avatar" aria-hidden="true">{userInitials}</span>
            <div className="nav-user-meta">
              <span className="nav-user-name">{userDisplayName}</span>
              <span className="nav-user-role">{userRoleLabel}</span>
            </div>
          </div>
          <button type="button" className="nav-button danger" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className="product-detail-page">
        {loading && <p className="status" style={{ color: '#475569' }}>Đang tải thông tin sản phẩm...</p>}
        {!loading && !product && (
          <p className="status" style={{ color: '#dc2626' }}>
            Không tìm thấy sản phẩm
          </p>
        )}

        {product && (
          <section className="detail-top">
            <div className="detail-gallery">
              <div className="detail-gallery-main">
                <img src={product.imageUrl || 'https://via.placeholder.com/520x360?text=No+Image'} alt={product.name} />
              </div>
              <div className="detail-gallery-thumbs">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`thumb-${index}`} className="detail-gallery-thumb">
                    <img
                      src={product.imageUrl || `https://via.placeholder.com/120x90?text=Hình+${index + 1}`}
                      alt={`${product.name} thumbnail ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="detail-services">
                <h4>Chính sách bán hàng</h4>
                <ul>
                  {servicePolicies.map((item, index) => (
                    <li key={`policy-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="detail-overview">
              <div className="detail-overview-header">
                <span className="detail-breadcrumb">{product.category}</span>
                <h1>{product.name}</h1>
              </div>

              <div className="detail-price-box">
                <div>
                  <span className="detail-price-current">{formatCurrency(product.price)} đ</span>
                  {originalPrice && <span className="detail-price-old">{formatCurrency(originalPrice)} đ</span>}
                </div>
                {product.isOnSale && product.discountPercent && (
                  <span className="detail-price-tag">- {product.discountPercent}%</span>
                )}
                <span className="detail-price-note">Giá đã bao gồm VAT • Hỗ trợ trả góp 0%</span>
              </div>

              <div className="detail-stock">
                {isOutOfStock
                  ? 'Sản phẩm hiện đã hết hàng'
                  : `Số lượng còn lại: ${formatNumber(product.stock)} sản phẩm`}
              </div>

              <div className="detail-promotion-card">
                <div className="detail-promo-header">
                  <span className="detail-promo-title">Khuyến mãi - ưu đãi</span>
                  <span className="detail-promo-sub">Áp dụng cho mọi hình thức thanh toán</span>
                </div>
                <ul>
                  {promotionList.map((promo, index) => (
                    <li key={`promo-${index}`}>{promo}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  className="detail-buy-now"
                  onClick={handleAddToCart}
                  disabled={cartLoading || isOutOfStock}
                >
                  {isOutOfStock ? 'Hết hàng' : cartLoading ? 'Đang thêm...' : 'Mua ngay'}
                </button>
                <button
                  type="button"
                  className={`detail-favorite${isFavorite ? ' is-active' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                >
                  {favoriteLoading ? 'Đang xử lý...' : isFavorite ? 'Đã thêm yêu thích' : 'Thêm vào yêu thích'}
                </button>
              </div>

              {statusMessage && (
                <div className="detail-status-card" style={{ color: statusColor }}>
                  {statusMessage}
                </div>
              )}
            </div>
          </section>
        )}

        {product && (
          <section className="detail-info-grid">
            <article className="detail-section">
              <header className="detail-section__header">
                <h2>Thông tin sản phẩm</h2>
                <span>Mô tả tổng quan và chỉ số nổi bật</span>
              </header>
              <p className="detail-description-text">{product.description || 'Sản phẩm đang được cập nhật mô tả.'}</p>
              <div className="detail-quick-info">
                <ProductStats stats={stats} />
              </div>
            </article>

            <article className="detail-section detail-section--specs">
              <header className="detail-section__header">
                <h2>Thông số kỹ thuật</h2>
                <span>Thông tin được tổng hợp tự động</span>
              </header>
              <table className="detail-spec-table">
                <tbody>
                  {specRows.map((row) => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        )}

        {product && (
          <CommentSection
            comments={comments}
            commentContent={commentContent}
            onCommentChange={(event) => setCommentContent(event.target.value)}
            onSubmit={handleSubmitComment}
            submitting={commentSubmitting}
            formatDate={formatDate}
          />
        )}

        {product && (
          <>
            <CompactProductSection
              title="Sản phẩm tương tự"
              products={similarProducts}
              emptyText="Không có sản phẩm tương tự."
              onSelect={handleOpenProduct}
              formatCurrency={formatCurrency}
              renderMeta={(item) => item.category}
            />

            <CompactProductSection
              title="Sản phẩm bạn yêu thích"
              products={favoriteProducts}
              emptyText="Bạn chưa thêm sản phẩm nào vào yêu thích."
              onSelect={handleOpenProduct}
              formatCurrency={formatCurrency}
            />

            <CompactProductSection
              title="Bạn đã xem gần đây"
              products={recentlyViewed}
              emptyText="Chưa có lịch sử xem gần đây."
              onSelect={handleOpenProduct}
              formatCurrency={formatCurrency}
              renderMeta={(item) => `Đã xem ${formatNumber(item.viewCount || 1)} lần`}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default ProductDetailPage;
