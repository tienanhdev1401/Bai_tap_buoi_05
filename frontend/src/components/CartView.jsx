import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  CartSummary,
  CartItemCard,
  Modal,
  useCartActions,
} from 'tienanh-cart';
import AddToCartForm from './AddToCartForm';
import {
  ADD_TO_CART,
  GET_CART,
  REMOVE_CART_ITEM,
  SELECT_CART_ITEMS,
  UPDATE_CART_ITEM,
} from '../api/cartQueries';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/products?limit=100`;
const CART_CHECKOUT_ENDPOINT = `${API_BASE_URL}/cart/checkout`;
const EMPTY_LIST = Object.freeze([]);

function CartView({ token }) {
  const { data, loading, error, refetch } = useQuery(GET_CART, {
    fetchPolicy: 'network-only',
  });
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(() => new Set());
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { clearCart, addItem } = useCartActions();

  const [addMutation, addState] = useMutation(ADD_TO_CART);
  const [updateMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeMutation] = useMutation(REMOVE_CART_ITEM);
  const [selectMutation, selectState] = useMutation(SELECT_CART_ITEMS);

  const cartItems = data?.cart?.items ?? EMPTY_LIST;
  const totals = data?.cart?.totals;

  const extractErrorMessage = useCallback((err, fallback = 'Đã xảy ra lỗi') => {
    if (!err) return fallback;
    if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length) {
      return err.graphQLErrors[0]?.message || fallback;
    }
    if (err.networkError?.result?.errors?.length) {
      return err.networkError.result.errors[0]?.message || fallback;
    }
    if (err.message) {
      return err.message;
    }
    return fallback;
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(PRODUCTS_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Không tải được danh sách sản phẩm');
        }
        const payload = await response.json();
        const options = (payload.products || payload).map((product) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          stock: typeof product.stock === 'number' ? product.stock : 0,
        }));
        setProducts(options);
      } catch (err) {
        setProductError(err instanceof Error ? err.message : 'Không tải được danh sách sản phẩm');
      }
    }

    fetchProducts();
  }, [token]);

  useEffect(() => {
    setSelectedDraft((prev) => {
      const next = new Set();
      cartItems.forEach((item) => {
        if (item.selected) {
          next.add(item.id);
        }
      });

      if (prev.size === next.size) {
        let identical = true;
        prev.forEach((id) => {
          if (!next.has(id)) {
            identical = false;
          }
        });
        if (identical) {
          return prev;
        }
      }

      return next;
    });
  }, [cartItems]);

  const libItems = useMemo(() => {
    return cartItems
      .filter((item) => item.product)
      .map((item) => ({
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        description: item.product.description,
        product: {
          stock: typeof item.product.stock === 'number' ? item.product.stock : 0,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          description: item.product.description,
        },
      }));
  }, [cartItems]);

  useEffect(() => {
    clearCart();
    libItems.forEach((item) => addItem(item));
  }, [data?.cart?.id, clearCart, addItem, libItems]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedDraft.has(item.id)),
    [cartItems, selectedDraft],
  );

  const handleAddToCart = useCallback(
    async (productId, quantity) => {
      try {
        await addMutation({ variables: { productId, quantity } });
        await refetch();
        setProductError(null);
      } catch (err) {
        const message = extractErrorMessage(err, 'Không thêm được sản phẩm vào giỏ');
        setProductError(message);
        throw new Error(message);
      }
    },
    [addMutation, refetch, extractErrorMessage],
  );

  const handleIncrease = useCallback(
    async (item) => {
      const nextQuantity = item.quantity + 1;
      const stock = typeof item.product?.stock === 'number' ? item.product.stock : Infinity;
      if (nextQuantity > stock) {
        setProductError(`Chỉ còn ${Number.isFinite(stock) ? stock.toLocaleString() : 0} sản phẩm trong kho`);
        return;
      }
      try {
        await updateMutation({ variables: { itemId: item.id, quantity: nextQuantity } });
        await refetch();
        setProductError(null);
      } catch (err) {
        const message = extractErrorMessage(err, 'Không thể cập nhật số lượng');
        setProductError(message);
      }
    },
    [updateMutation, refetch, extractErrorMessage],
  );

  const handleDecrease = useCallback(
    async (item) => {
      const nextQuantity = item.quantity - 1;
      try {
        await updateMutation({ variables: { itemId: item.id, quantity: nextQuantity } });
        await refetch();
        setProductError(null);
      } catch (err) {
        const message = extractErrorMessage(err, 'Không thể cập nhật số lượng');
        setProductError(message);
      }
    },
    [updateMutation, refetch, extractErrorMessage],
  );

  const handleRemove = useCallback(
    async (item) => {
      try {
        await removeMutation({ variables: { itemId: item.id } });
        await refetch();
        setProductError(null);
      } catch (err) {
        const message = extractErrorMessage(err, 'Không thể xoá sản phẩm');
        setProductError(message);
      }
    },
    [removeMutation, refetch, extractErrorMessage],
  );

  const handleToggleSelection = (itemId) => {
    setSelectedDraft((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleApplySelection = useCallback(async () => {
    await selectMutation({ variables: { itemIds: Array.from(selectedDraft) } });
    await refetch();
  }, [selectedDraft, selectMutation, refetch]);

  const handleCheckout = () => {
    if (selectedDraft.size === 0) {
      return;
    }
    setCheckoutError(null);
    setConfirmOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (selectedDraft.size === 0) {
      return;
    }
    const snapshot = selectedItems.map((item) => ({
      ...item,
      product: item.product ? { ...item.product } : null,
    }));
    setCheckoutLoading(true);
    try {
      await handleApplySelection();
      const response = await fetch(CART_CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: Array.from(selectedDraft) }),
      });

      if (!response.ok) {
        const fallback = await response.json().catch(() => ({ message: 'Thanh toán không thành công' }));
        throw new Error(fallback.message || 'Thanh toán không thành công');
      }

      const payload = await response.json();
      setCheckoutResult({
        message: payload.message,
        processedCount: payload.processedCount,
        productIds: payload.productIds || [],
        stats: payload.stats || {},
        items: snapshot,
      });
      setCheckoutOpen(true);
      setConfirmOpen(false);
      setSelectedDraft(new Set());
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thanh toán không thành công';
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelCheckout = () => {
    setConfirmOpen(false);
  };

  const summary = useMemo(() => {
    const computed = selectedItems.reduce(
      (acc, item) => {
        const unitPrice = Number(item.product?.price) || 0;
        const rawSubtotal = Number(item.subtotal);
        const subtotal = Number.isFinite(rawSubtotal) ? rawSubtotal : unitPrice * item.quantity;
        return {
          quantity: acc.quantity + item.quantity,
          subtotal: acc.subtotal + subtotal,
        };
      },
      { quantity: 0, subtotal: 0 },
    );

    if (selectedItems.length > 0) {
      return {
        totalItems: computed.quantity,
        subtotal: computed.subtotal,
      };
    }

    const serverSelectedQuantity = Number(totals?.selectedQuantity);
    const serverSelectedPrice = Number(totals?.selectedPrice);
    const serverTotalQuantity = Number(totals?.totalQuantity);
    const serverTotalPrice = Number(totals?.totalPrice);

    return {
      totalItems: Number.isFinite(serverSelectedQuantity)
        ? serverSelectedQuantity
        : Number.isFinite(serverTotalQuantity)
        ? serverTotalQuantity
        : 0,
      subtotal: Number.isFinite(serverSelectedPrice)
        ? serverSelectedPrice
        : Number.isFinite(serverTotalPrice)
        ? serverTotalPrice
        : 0,
    };
  }, [selectedItems, totals?.selectedQuantity, totals?.selectedPrice, totals?.totalQuantity, totals?.totalPrice]);

  const isMutating = addState.loading || selectState.loading || checkoutLoading;

  return (
    <div className="cart-layout">
      <Card title="Giỏ hàng của bạn">
        {loading && <p className="status-text">Đang tải giỏ hàng...</p>}
        {error && (
          <p className="status-text" style={{ color: '#dc2626' }}>
            Không tải được giỏ hàng: {error.message}
          </p>
        )}
        {!loading && cartItems.length === 0 && <p className="status-text">Giỏ hàng trống.</p>}
        <div className="cart-items">
          {libItems.map((item) => {
            const isSelected = selectedDraft.has(item.id);
            return (
              <div key={item.id} className="item-row">
                <div className="item-header">
                  <strong>{item.name}</strong>
                  <span>{item.price.toLocaleString()} đ</span>
                </div>
                {typeof item.product?.stock === 'number' && (
                  <span className="status-text">Tồn kho: {item.product.stock.toLocaleString()} sản phẩm</span>
                )}
                <CartItemCard
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                />
                <div className="selection-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelection(item.id)}
                    />
                    Chọn để thanh toán
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-actions">
          </div>
        )}
        {checkoutError && (
          <p className="status-text" style={{ color: '#dc2626' }}>
            {checkoutError}
          </p>
        )}
      </Card>

      <AddToCartForm products={products} onAdd={handleAddToCart} loading={addState.loading} />
      {productError && (
        <span className="status-text" style={{ color: '#dc2626' }}>
          {productError}
        </span>
      )}

      <Card title="Tổng quan" className="checkout-summary">
        <CartSummary summary={summary} currency="VND" onCheckout={handleCheckout} />
        <p className="status-text">
          Đã chọn {selectedItems.length} / {cartItems.length} sản phẩm.
        </p>
      </Card>

      <Modal
        title="Xác nhận thanh toán"
        open={isConfirmOpen}
        onClose={handleCancelCheckout}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="ghost" onClick={handleCancelCheckout} disabled={checkoutLoading}>
              Huỷ
            </Button>
            <Button variant="primary" onClick={handleConfirmCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </div>
        }
      >
        <p className="status-text">Bạn sắp thanh toán {selectedItems.length} sản phẩm đã chọn:</p>
        <ul>
          {selectedItems.map((item) => (
            <li key={item.id}>
              {(item.product?.name ?? 'Sản phẩm')} x {item.quantity} = {item.subtotal.toLocaleString()} đ
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        title="Thanh toán thành công"
        open={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setCheckoutOpen(false)}>
            Đóng
          </Button>
        }
      >
        <p className="status-text">{checkoutResult?.message ?? 'Thanh toán thành công.'}</p>
        <ul>
          {(checkoutResult?.items ?? []).map((item) => {
            const productId = item.product?._id ?? '';
            const productName = item.product?.name || 'Sản phẩm';
            const subtotal = item.subtotal?.toLocaleString?.() ?? '0';
            const productStats = productId ? checkoutResult?.stats?.[productId] : undefined;
            return (
              <li key={item.id}>
                {productName} x {item.quantity} = {subtotal} đ
                {productStats && (
                  <span className="status-text"> ({productStats.buyers.toLocaleString()} khách đã mua)</span>
                )}
              </li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}

export default CartView;
