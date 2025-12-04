const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Purchase = require('../models/Purchase');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

function ensureValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

router.post('/checkout', authenticate, async (req, res) => {
  const { itemIds } = req.body || {};

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    return res.status(404).json({ message: 'Không tìm thấy giỏ hàng của bạn' });
  }

  const filterIds = Array.isArray(itemIds) && itemIds.length
    ? new Set(itemIds.filter((id) => typeof id === 'string' && ensureValidObjectId(id)).map((id) => id.toString()))
    : null;

  const selectedItems = cart.items.filter((item) => {
    if (!item.selected || !item.product) {
      return false;
    }
    if (!filterIds) {
      return true;
    }
    return filterIds.has(item._id.toString());
  });

  if (!selectedItems.length) {
    return res.status(400).json({ message: 'Bạn chưa chọn sản phẩm nào để thanh toán' });
  }

  await Promise.all(
    selectedItems.map((item) =>
      Purchase.findOneAndUpdate(
        { product: item.product._id, user: req.user._id },
        { $inc: { quantity: item.quantity } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const productIds = Array.from(new Set(selectedItems.map((item) => item.product._id.toString())));
  const aggregation = await Purchase.aggregate([
    { $match: { product: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    {
      $group: {
        _id: '$product',
        buyers: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
      },
    },
  ]);

  const stats = aggregation.reduce((acc, entry) => {
    acc[entry._id.toString()] = {
      buyers: entry.buyers,
      totalQuantity: entry.totalQuantity,
    };
    return acc;
  }, {});

  const selectedIds = new Set(selectedItems.map((item) => item._id.toString()));
  cart.items = cart.items.filter((item) => !selectedIds.has(item._id.toString()));
  await cart.save();

  res.json({
    message: 'Thanh toán giả lập thành công',
    processedCount: selectedItems.length,
    productIds,
    stats,
    removedItemIds: Array.from(selectedIds),
  });
});

module.exports = router;
