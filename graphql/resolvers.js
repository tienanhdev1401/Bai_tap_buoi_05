const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

function serialiseCart(cartDoc) {
  const items = cartDoc.items.map((item) => {
    const product = item.product && item.product._id ? item.product : null;
    const price = product ? Number(product.price) : 0;
    return {
      id: item._id.toString(),
      quantity: item.quantity,
      selected: item.selected,
      product: product
        ? {
            id: product._id.toString(),
            name: product.name,
            price,
            imageUrl: product.imageUrl,
            description: product.description,
            category: product.category,
            stock: typeof product.stock === 'number' ? product.stock : 0,
          }
        : null,
      subtotal: price * item.quantity,
    };
  });

  const totals = items.reduce(
    (acc, item) => {
      acc.totalQuantity += item.quantity;
      acc.totalPrice += item.subtotal;
      if (item.selected) {
        acc.selectedQuantity += item.quantity;
        acc.selectedPrice += item.subtotal;
      }
      return acc;
    },
    { totalQuantity: 0, totalPrice: 0, selectedQuantity: 0, selectedPrice: 0 }
  );

  return {
    id: cartDoc._id.toString(),
    items,
    totals,
  };
}

async function populateCart(cart) {
  return cart.populate('items.product');
}

function ensureAuthenticated(user) {
  if (!user) {
    throw new Error('Bạn cần đăng nhập để thao tác giỏ hàng');
  }
}

function ensureValidObjectId(id, message) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(message);
  }
}

const resolvers = {
  Query: {
    cart: async (_, __, { user }) => {
      ensureAuthenticated(user);
      const cart = await getOrCreateCart(user.id);
      await populateCart(cart);
      return serialiseCart(cart);
    },
  },
  Mutation: {
    addToCart: async (_, { productId, quantity = 1 }, { user }) => {
      ensureAuthenticated(user);
      ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');
      if (quantity <= 0) {
        throw new Error('Số lượng phải lớn hơn 0');
      }

      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      const maxStock = Number(product.stock ?? 0);
      if (maxStock <= 0) {
        throw new Error('Sản phẩm này hiện đã hết hàng');
      }

      const cart = await getOrCreateCart(user.id);
      const existingItem = cart.items.find((item) => {
        const itemProductId = item.product?._id ? item.product._id.toString() : item.product.toString();
        return itemProductId === productId;
      });

      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const desiredQuantity = currentQuantity + quantity;
      if (desiredQuantity > maxStock) {
        throw new Error(`Chỉ còn ${maxStock} sản phẩm trong kho`);
      }

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      await populateCart(cart);
      return serialiseCart(cart);
    },
    updateCartItem: async (_, { itemId, quantity, selected }, { user }) => {
      ensureAuthenticated(user);
      ensureValidObjectId(itemId, 'Mã sản phẩm trong giỏ không hợp lệ');

      const cart = await getOrCreateCart(user.id);
      const targetItem = cart.items.id(itemId);
      if (!targetItem) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ');
      }

      if (typeof quantity === 'number') {
        if (quantity <= 0) {
          targetItem.deleteOne();
        } else {
          const productId = targetItem.product?._id ? targetItem.product._id : targetItem.product;
          const product = await Product.findById(productId);
          if (!product) {
            targetItem.deleteOne();
            await cart.save();
            throw new Error('Không tìm thấy sản phẩm, đã xoá khỏi giỏ');
          }

          const maxStock = Number(product.stock ?? 0);
          if (maxStock <= 0) {
            throw new Error('Sản phẩm này hiện đã hết hàng');
          }

          if (quantity > maxStock) {
            throw new Error(`Chỉ còn ${maxStock} sản phẩm trong kho`);
          }

          targetItem.quantity = quantity;
        }
      }

      if (typeof selected === 'boolean') {
        targetItem.selected = selected;
      }

      await cart.save();
      await populateCart(cart);
      return serialiseCart(cart);
    },
    removeCartItem: async (_, { itemId }, { user }) => {
      ensureAuthenticated(user);
      ensureValidObjectId(itemId, 'Mã sản phẩm trong giỏ không hợp lệ');

      const cart = await getOrCreateCart(user.id);
      const targetItem = cart.items.id(itemId);
      if (!targetItem) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ');
      }

      targetItem.deleteOne();

      await cart.save();
      await populateCart(cart);
      return serialiseCart(cart);
    },
    selectCartItems: async (_, { itemIds }, { user }) => {
      ensureAuthenticated(user);
      if (!Array.isArray(itemIds)) {
        throw new Error('Danh sách sản phẩm không hợp lệ');
      }

      const cart = await getOrCreateCart(user.id);
      const idsToSelect = new Set(
        itemIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => id.toString())
      );

      cart.items.forEach((item) => {
        const shouldSelect = idsToSelect.has(item._id.toString());
        item.selected = shouldSelect;
      });

      await cart.save();
      await populateCart(cart);
      return serialiseCart(cart);
    },
  },
};

module.exports = resolvers;
