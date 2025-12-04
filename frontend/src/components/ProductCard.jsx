function ProductCard({ product, onAddToCart, onOpenDetail, isAdding }) {
  const productId = product._id || product.id;

  const handleAdd = (event) => {
    event.stopPropagation();
    onAddToCart(productId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetail(productId);
    }
  };

  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(productId)}
      onKeyDown={handleKeyDown}
    >
      <div className="card-info">
        <img src={product.imageUrl || 'https://via.placeholder.com/320x200?text=No+Image'} alt={product.name} />
        <h4>{product.name}</h4>
        <p>{product.description}</p>
        <div className="price-row">
          <strong>{product.price.toLocaleString()} đ</strong>
          {product.isOnSale && <span className="badge sale">-{product.discountPercent}%</span>}
        </div>
        <small className="meta">{(product.views || 0).toLocaleString()} lượt xem</small>
      </div>
      <div className="card-actions">
        <button
          type="button"
          className="add-to-cart-btn"
          onClick={handleAdd}
          disabled={isAdding}
        >
          {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
