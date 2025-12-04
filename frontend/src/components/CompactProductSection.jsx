const SECTION_SUBTITLE = {
  'Sản phẩm tương tự': 'Gợi ý dựa trên danh mục và thói quen mua sắm',
  'Sản phẩm bạn yêu thích': 'Những sản phẩm bạn đã đánh dấu quan tâm',
  'Bạn đã xem gần đây': 'Tiếp tục hành trình khám phá sản phẩm của bạn',
};

function CompactProductSection({ title, products, emptyText, onSelect, formatCurrency, renderMeta }) {
  const handleSelect = (productId) => {
    if (!productId) return;
    onSelect(productId);
  };

  const handleKeyDown = (event, productId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(productId);
    }
  };

  const subtitle = SECTION_SUBTITLE[title] || 'Được cá nhân hóa dựa trên hoạt động của bạn';

  return (
    <section className="detail-panel detail-related">
      <header className="detail-panel__header">
        <div className="detail-panel__title-group">
          <h2>{title}</h2>
          <span className="detail-panel__sub">{subtitle}</span>
        </div>
        <span className="detail-panel__count">{products.length}</span>
      </header>

      <div className="detail-related__grid">
        {products.length === 0 && <p className="empty-placeholder">{emptyText}</p>}
        {products.map((item) => {
          const productId = item.id || item._id;
          const meta = renderMeta ? renderMeta(item) : null;
          return (
            <article
              key={productId}
              className="compact-card"
              onClick={() => handleSelect(productId)}
              onKeyDown={(event) => handleKeyDown(event, productId)}
              role="button"
              tabIndex={0}
            >
              <div className="compact-card__media">
                <img src={item.imageUrl || 'https://via.placeholder.com/240x180?text=No+Image'} alt={item.name} />
              </div>
              <div className="compact-card__body">
                <h4>{item.name}</h4>
                <p className="compact-card__price">{formatCurrency(item.price)} đ</p>
                {meta && <span className="compact-card__meta">{meta}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CompactProductSection;
