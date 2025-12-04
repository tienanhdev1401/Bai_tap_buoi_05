import { useState } from 'react';
import { Button, Card, TextInput } from 'tienanh-cart';

function AddToCartForm({ products, onAdd, loading }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productId) {
      setError('Vui lòng chọn sản phẩm');
      return;
    }
    if (quantity <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    setError(null);
    await onAdd(productId, quantity);
    setQuantity(1);
  };

  return (
    <Card title="Thêm sản phẩm vào giỏ">
      <form className="grid" onSubmit={handleSubmit}>
        <label className="grid">
          <span className="section-title">Sản phẩm</span>
          <select
            className="product-select"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price.toLocaleString()} đ
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Số lượng"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
        {error && <span className="status-text" style={{ color: '#dc2626' }}>{error}</span>}
        <Button type="submit" loading={loading}>
          Thêm vào giỏ hàng
        </Button>
      </form>
    </Card>
  );
}

export default AddToCartForm;
