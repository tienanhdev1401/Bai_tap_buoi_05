import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Button,
  Card,
  CartItem as CartItemModel,
  CartItemCard,
  CartSummary,
  CartSummaryType,
  Modal,
  useCartActions,
} from 'tienanh-cart';
import AddToCartForm, { ProductOption } from './AddToCartForm';
import { ADD_TO_CART, GET_CART, REMOVE_CART_ITEM, SELECT_CART_ITEMS, UPDATE_CART_ITEM } from '../graphql';

interface CartViewProps {
  token: string;
  email: string;
  onLogout: () => void;
}

interface RemoteProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
}

interface RemoteCartItem {
  id: string;
  quantity: number;
  selected: boolean;
  subtotal: number;
  product: RemoteProduct | null;
}

const PRODUCTS_ENDPOINT = 'http://localhost:4000/api/products?limit=100';

function CartView({ token, email, onLogout }: CartViewProps) {
  const { data, loading, error, refetch } = useQuery(GET_CART, {
    fetchPolicy: 'network-only',
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Set<string>>(new Set());
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const { clearCart, addItem } = useCartActions();

  const [addMutation, addState] = useMutation(ADD_TO_CART);
  const [updateMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeMutation] = useMutation(REMOVE_CART_ITEM);
  const [selectMutation, selectState] = useMutation(SELECT_CART_ITEMS);

  const cartItems: RemoteCartItem[] = data?.cart?.items ?? [];
  const totals = data?.cart?.totals;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(PRODUCTS_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Không tải được danh sách sản phẩm');
        }
        const payload = await response.json();
        const options: ProductOption[] = (payload.products || payload).map((product: any) => ({
          id: product._id,
          name: product.name,
          price: product.price,
        }));
        setProducts(options);
      } catch (err) {
        setProductError((err as Error).message);
      }
    }

    fetchProducts();
  }, [token]);

  useEffect(() => {
    setSelectedDraft((prev) => {
      const next = new Set<string>();
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

  const libItems = useMemo<CartItemModel[]>(() => {
    return cartItems
      .filter((item) => item.product)
      .map((item) => ({
        id: item.id,
        name: item.product!.name,
        price: item.product!.price,
        quantity: item.quantity,
        imageUrl: item.product!.imageUrl,
        description: item.product!.description,
      }));
  }, [cartItems]);

  useEffect(() => {
    clearCart();
    libItems.forEach((item) => addItem(item));
  }, [data?.cart?.id, clearCart, addItem, libItems]);

  const handleAddToCart = useCallback(
    async (productId: string, quantity: number) => {
      await addMutation({
        variables: { productId, quantity },
      });
      await refetch();
    },
    [addMutation, refetch]
  );

  const handleIncrease = useCallback(
    async (item: CartItemModel) => {
      await updateMutation({
        variables: { itemId: item.id, quantity: item.quantity + 1 },
      });
      await refetch();
    },
    [updateMutation, refetch]
  );

  const handleDecrease = useCallback(
    async (item: CartItemModel) => {
      const nextQuantity = item.quantity - 1;
      await updateMutation({
        variables: { itemId: item.id, quantity: nextQuantity },
      });
      await refetch();
    },
    [updateMutation, refetch]
  );

  const handleRemove = useCallback(
    async (item: CartItemModel) => {
      await removeMutation({
        variables: { itemId: item.id },
      });
      await refetch();
    },
    [removeMutation, refetch]
  );

  const handleToggleSelection = (itemId: string) => {
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

  const handleApplySelection = async () => {
    await selectMutation({
      variables: { itemIds: Array.from(selectedDraft) },
    });
    await refetch();
  };

  const handleCheckout = async () => {
    if (selectedDraft.size === 0) {
      return;
    }
    await handleApplySelection();
    setCheckoutOpen(true);
  };

  const summary: CartSummaryType = useMemo(() => {
    return {
      totalItems: totals?.totalQuantity ?? 0,
      subtotal: totals?.totalPrice ?? 0,
    };
  }, [totals]);

  const selectedItems = cartItems.filter((item) => selectedDraft.has(item.id));
  const isMutating = addState.loading || selectState.loading;

  return (
    <div className="cart-layout">
      <div className="cart-header">
        <div>
          <h2>Xin chào, {email}</h2>
        </div>
        <Button variant="ghost" onClick={onLogout}>
          Đăng xuất
        </Button>
      </div>

      <Card title="Giỏ hàng của bạn">
        {loading && <p className="status-text">Đang tải giỏ hàng...</p>}
        {error && <p className="status-text" style={{ color: '#dc2626' }}>Không tải được giỏ hàng: {error.message}</p>}
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
            <Button variant="secondary" onClick={handleApplySelection} disabled={selectedDraft.size === 0}>
              Lưu lựa chọn
            </Button>
            <Button variant="primary" onClick={handleCheckout} disabled={selectedDraft.size === 0 || isMutating}>
              Thanh toán các sản phẩm đã chọn
            </Button>
          </div>
        )}
      </Card>

      <AddToCartForm products={products} onAdd={handleAddToCart} loading={addState.loading} />
      {productError && <span className="status-text" style={{ color: '#dc2626' }}>{productError}</span>}

      <Card title="Tổng quan" className="checkout-summary">
        <CartSummary summary={summary} currency="VND" onCheckout={handleCheckout} />
        <p className="status-text">
          Đã chọn {selectedItems.length} / {cartItems.length} sản phẩm.
        </p>
      </Card>

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
        <p className="status-text">Bạn đã chọn {selectedItems.length} sản phẩm để thanh toán.</p>
        <ul>
          {selectedItems.map((item) => (
            <li key={item.id}>
              {item.product?.name} x {item.quantity} = {item.subtotal.toLocaleString()} đ
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

export default CartView;
