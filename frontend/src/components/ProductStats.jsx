function ProductStats({ stats }) {
  if (!stats?.length) {
    return null;
  }

  return (
    <div className="detail-stats">
      {stats.map((item) => (
        <span key={item.label}>
          {item.label}: <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

export default ProductStats;
