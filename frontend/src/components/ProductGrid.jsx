import ProductCard from './ProductCard';

function ProductGrid({ products, onOpenDetail, onAddToCart, addingProductId }) {
  return (
    <div className="grid" id="productGrid">
      {products.map((product, index) => {
        const productId = product._id || product.id;
        return (
        <ProductCard
          key={productId || `product-${index}`}
          product={product}
          onOpenDetail={onOpenDetail}
          onAddToCart={onAddToCart}
          isAdding={addingProductId === productId}
        />
        );
      })}
    </div>
  );
}

export default ProductGrid;
