const defaultCategories = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Điện thoại', label: 'Điện thoại' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Âm thanh', label: 'Âm thanh' },
  { value: 'Phụ kiện', label: 'Phụ kiện' },
];

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'views', label: 'Lượt xem cao' },
  { value: 'priceAsc', label: 'Giá tăng dần' },
  { value: 'priceDesc', label: 'Giá giảm dần' },
  { value: 'discount', label: 'Giảm giá nhiều' },
  { value: 'nameAsc', label: 'Tên A → Z' },
  { value: 'nameDesc', label: 'Tên Z → A' },
];

function ProductFilters({
  formState,
  onFieldChange,
  onSubmit,
  onReset,
  loading,
  categories = defaultCategories,
  appliedFiltersCount = 0,
}) {
  return (
    <form className="filter-form" onSubmit={onSubmit}>
      <header className="filter-header">
        <div className="filter-header-row">
          <div>
            <h3>Bộ lọc</h3>
            <p className="filter-helper">Tinh chỉnh kết quả theo nhu cầu của bạn</p>
          </div>
          {appliedFiltersCount > 0 && <span className="filter-badge">{appliedFiltersCount}</span>}
        </div>
      </header>

      <div className="filter-group filter-group--accent">
        <label className="filter-field" htmlFor="filter-category">
          <span className="filter-label">Danh mục</span>
          <div className="filter-select">
            <select
              id="filter-category"
              name="category"
              value={formState.category}
              onChange={onFieldChange}
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label className="filter-field" htmlFor="filter-search">
          <span className="filter-label">Từ khóa</span>
          <div className="filter-search">
            <input
              id="filter-search"
              type="search"
              name="q"
              value={formState.q}
              onChange={onFieldChange}
              placeholder="Tên sản phẩm"
              autoComplete="off"
            />
          </div>
        </label>
      </div>

      <div className="filter-group">
        <span className="group-title">Khoảng giá</span>
        <div className="filter-columns">
          <label className="filter-field" htmlFor="filter-min-price">
            <span className="filter-label">Từ</span>
            <div className="filter-input-shell">
              <input
                id="filter-min-price"
                type="number"
                min="0"
                name="minPrice"
                value={formState.minPrice}
                onChange={onFieldChange}
                placeholder="0"
              />
            </div>
          </label>
          <label className="filter-field" htmlFor="filter-max-price">
            <span className="filter-label">Đến</span>
            <div className="filter-input-shell">
              <input
                id="filter-max-price"
                type="number"
                min="0"
                name="maxPrice"
                value={formState.maxPrice}
                onChange={onFieldChange}
                placeholder="50.000.000"
              />
            </div>
          </label>
        </div>
        <p className="filter-note">Giá tính theo đồng Việt Nam (đ)</p>
      </div>

      <div className="filter-group">
        <label className="filter-field" htmlFor="filter-sort">
          <span className="filter-label">Sắp xếp theo</span>
          <div className="filter-select">
            <select id="filter-sort" name="sortBy" value={formState.sortBy} onChange={onFieldChange}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <footer className="filter-footer filter-actions">
        <button type="submit" className="plain" disabled={loading}>
          Áp dụng
        </button>
        <button type="button" className="plain ghost" onClick={onReset} disabled={loading}>
          Đặt lại
        </button>
      </footer>
    </form>
  );
}

export default ProductFilters;
