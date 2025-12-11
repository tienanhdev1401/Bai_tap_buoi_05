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

    const selectedProduct = products.find((item) => item.id === productId);
    if (selectedProduct) {
      const stock = typeof selectedProduct.stock === 'number' ? selectedProduct.stock : 0;
      if (stock <= 0) {
        setError('Sản phẩm đã hết hàng');
        return;
      }
      if (quantity > stock) {
        setError(`Chỉ còn ${stock} sản phẩm trong kho`);
        return;
      }
    }

    setError(null);
    try {
      const result = await onAdd(productId, quantity);
      if (result !== false) {
        setQuantity(1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thêm được sản phẩm vào giỏ';
      setError(message);
    }
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
              <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                {product.name} - {product.price.toLocaleString()} đ (Còn {product.stock ?? 0})
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
