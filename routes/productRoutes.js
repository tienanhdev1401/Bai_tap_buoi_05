const express = require('express');
const mongoose = require('mongoose');
const validate = require('express-validation');
const Product = require('../models/Product');
const Comment = require('../models/Comment');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { createProductValidation } = require('../middleware/validators');

const router = express.Router();

function ensureValidObjectId(value, errorMessage) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const message = errorMessage || 'Mã không hợp lệ';
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

function toProductResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    price: doc.price,
    imageUrl: doc.imageUrl,
    discountPercent: doc.discountPercent,
    isOnSale: doc.isOnSale,
    views: doc.views,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapCommentToResponse(commentDoc) {
  return {
    id: commentDoc._id.toString(),
    content: commentDoc.content,
    createdAt: commentDoc.createdAt,
    updatedAt: commentDoc.updatedAt,
    user: commentDoc.user
      ? {
          id: commentDoc.user._id.toString(),
          name: commentDoc.user.name,
        }
      : null,
  };
}

router.get('/', authenticate, async (req, res) => {
  const {
    category = 'all',
    page = 1,
    limit = 6,
    q = '',
    minPrice,
    maxPrice,
    minDiscount,
    minViews,
    onSale,
    sortBy = 'newest',
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 6, 1), 24);

  const filters = {};
  if (category !== 'all') {
    filters.category = category;
  }

  if (q && q.trim().length > 0) {
    const normalized = q.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const fuzzyPattern = normalized.split(/\s+/).join('.*');
    const fuzzyRegex = new RegExp(fuzzyPattern, 'i');
    filters.$or = [
      { name: fuzzyRegex },
      { description: fuzzyRegex },
      { category: fuzzyRegex },
      { tags: fuzzyRegex },
    ];
  }

  const priceRange = {};
  if (minPrice) priceRange.$gte = Number(minPrice);
  if (maxPrice) priceRange.$lte = Number(maxPrice);
  if (Object.keys(priceRange).length) {
    filters.price = priceRange;
  }

  if (minDiscount) {
    filters.discountPercent = { $gte: Number(minDiscount) };
  }

  if (minViews) {
    filters.views = { $gte: Number(minViews) };
  }

  if (onSale === 'true') {
    filters.isOnSale = true;
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    discount: { discountPercent: -1 },
    views: { views: -1 },
    nameAsc: { name: 1 },
    nameDesc: { name: -1 },
  };
  const sortRule = sortOptions[sortBy] || sortOptions.newest;

  const query = Product.find(filters)
    .sort(sortRule)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const [products, total] = await Promise.all([
    query,
    Product.countDocuments(filters),
  ]);

  const hasMore = pageNumber * pageSize < total;
  const totalPages = Math.ceil(total / pageSize) || 1;

  res.json({ products, total, totalPages, hasMore });
});

router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  validate(createProductValidation),
  async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
  }
);

router.get('/favorites', authenticate, async (req, res) => {
  const userDoc = await User.findById(req.user._id).select('-password').populate({
    path: 'favorites',
    options: { sort: { updatedAt: -1 } },
  });
  const favorites = Array.isArray(userDoc?.favorites)
    ? userDoc.favorites.map((product) => toProductResponse(product))
    : [];
  res.json({ favorites });
});

router.get('/recently-viewed', authenticate, async (req, res) => {
  const userDoc = await User.findById(req.user._id)
    .select('-password')
    .populate({ path: 'recentlyViewed.product' });

  const recentlyViewed = Array.isArray(userDoc?.recentlyViewed)
    ? userDoc.recentlyViewed
        .filter((entry) => entry.product)
        .map((entry) => ({
          product: toProductResponse(entry.product),
          viewedAt: entry.viewedAt,
          viewCount: entry.views,
        }))
    : [];

  res.json({ recentlyViewed });
});

router.get('/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!updatedProduct) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  let userDoc = await User.findById(req.user._id).select('-password');
  if (!userDoc) {
    return res.status(401).json({ message: 'Không tìm thấy người dùng' });
  }

  const recentEntries = Array.isArray(userDoc.recentlyViewed) ? [...userDoc.recentlyViewed] : [];
  const existingIndex = recentEntries.findIndex((entry) => entry.product?.toString() === productId);
  let accumulatedViews = 1;
  if (existingIndex !== -1) {
    const existing = recentEntries.splice(existingIndex, 1)[0];
    accumulatedViews = (existing.views || 0) + 1;
  }
  recentEntries.unshift({ product: productId, viewedAt: new Date(), views: accumulatedViews });
  const trimmedRecents = recentEntries.slice(0, 10);

  if (!Array.isArray(userDoc.favorites)) {
    userDoc.favorites = [];
  }

  const isFavorite = userDoc.favorites.some((fav) => fav.toString() === productId);

  userDoc = await User.findOneAndUpdate(
    { _id: userDoc._id },
    {
      $set: {
        recentlyViewed: trimmedRecents,
        favorites: userDoc.favorites,
      },
    },
    { new: true, runValidators: false }
  );

  const favoriteIds = (userDoc.favorites || []).map((fav) => fav.toString());
  const recentIds = (userDoc.recentlyViewed || [])
    .map((entry) => entry.product?.toString())
    .filter(Boolean);

  const [
    favoriteCount,
    buyersCount,
    comments,
    commentsCount,
    favoritesDocs,
    recentDocs,
    similarByCategory,
  ] = await Promise.all([
    User.countDocuments({ favorites: productId }),
    Purchase.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          buyers: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]),
    Comment.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name')
      .lean(),
    Comment.countDocuments({ product: productId }),
    favoriteIds.length ? Product.find({ _id: { $in: favoriteIds } }).lean() : [],
    recentIds.length ? Product.find({ _id: { $in: recentIds } }).lean() : [],
    Product.find({ _id: { $ne: productId }, category: updatedProduct.category })
      .sort({ views: -1 })
      .limit(8)
      .lean(),
  ]);

  let similarProducts = [];
  if (Array.isArray(updatedProduct.tags) && updatedProduct.tags.length) {
    const tagQuery = { _id: { $ne: productId }, tags: { $in: updatedProduct.tags } };
    similarProducts = await Product.find(tagQuery)
      .sort({ views: -1 })
      .limit(8)
      .lean();
  }

  if (!similarProducts.length) {
    similarProducts = similarByCategory;
  }

  const favoritesMap = new Map(favoritesDocs.map((doc) => [doc._id.toString(), doc]));
  const orderedFavorites = favoriteIds
    .map((id) => favoritesMap.get(id))
    .filter(Boolean)
    .map((doc) => toProductResponse(doc));

  const recentsMap = new Map(recentDocs.map((doc) => [doc._id.toString(), doc]));
  const orderedRecent = userDoc.recentlyViewed
    .filter((entry) => entry.product)
    .map((entry) => {
      const product = recentsMap.get(entry.product.toString());
      if (!product) return null;
      return {
        ...toProductResponse(product),
        viewedAt: entry.viewedAt,
        viewCount: entry.views,
      };
    })
    .filter(Boolean);

  const responseComments = comments.map((comment) => mapCommentToResponse(comment));

  const purchaseSummary = buyersCount[0] || { buyers: 0, totalQuantity: 0 };

  res.json({
    product: toProductResponse(updatedProduct),
    status: { isFavorite },
    metrics: {
      views: updatedProduct.views,
      favoritesCount: favoriteCount,
      buyersCount: purchaseSummary.buyers || 0,
      purchasedQuantity: purchaseSummary.totalQuantity || 0,
      commentsCount,
    },
    comments: responseComments,
    similarProducts: similarProducts.map((doc) => toProductResponse(doc)),
    favorites: orderedFavorites,
    recentlyViewed: orderedRecent,
  });
});

router.post('/:productId/favorite', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const userDoc = await User.findById(req.user._id).select('-password');
  if (!userDoc) {
    return res.status(401).json({ message: 'Không tìm thấy người dùng' });
  }

  const alreadyFavorite = userDoc.favorites.some((fav) => fav.toString() === productId);
  if (!alreadyFavorite) {
    userDoc.favorites.unshift(productId);
    userDoc.favorites = userDoc.favorites.slice(0, 100);
    await userDoc.save();
  }

  const favoritesCount = await User.countDocuments({ favorites: productId });
  res.json({ message: 'Đã thêm sản phẩm vào danh sách yêu thích', favoritesCount });
});

router.delete('/:productId/favorite', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const userDoc = await User.findById(req.user._id).select('-password');
  if (!userDoc) {
    return res.status(401).json({ message: 'Không tìm thấy người dùng' });
  }

  const newFavorites = userDoc.favorites.filter((fav) => fav.toString() !== productId);
  userDoc.favorites = newFavorites;
  await userDoc.save();

  const favoritesCount = await User.countDocuments({ favorites: productId });
  res.json({ message: 'Đã bỏ sản phẩm khỏi danh sách yêu thích', favoritesCount });
});

router.get('/:productId/comments', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const comments = await Comment.find({ product: productId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('user', 'name')
    .lean();

  res.json({ comments: comments.map((comment) => mapCommentToResponse(comment)) });
});

router.post('/:productId/comments', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const { content } = req.body;
  if (!content || content.trim().length < 2) {
    return res.status(400).json({ message: 'Bình luận phải có ít nhất 2 ký tự' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const comment = await Comment.create({
    product: productId,
    user: req.user._id,
    content: content.trim(),
  });

  const populated = await comment.populate('user', 'name');
  res.status(201).json({ comment: mapCommentToResponse(populated) });
});

router.post('/:productId/purchase', authenticate, async (req, res) => {
  const { productId } = req.params;
  ensureValidObjectId(productId, 'Mã sản phẩm không hợp lệ');

  const { quantity } = req.body;
  const numericQuantity = quantity && Number(quantity) > 0 ? Number(quantity) : 1;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  await Purchase.findOneAndUpdate(
    { product: productId, user: req.user._id },
    { $inc: { quantity: numericQuantity } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const buyersCount = await Purchase.countDocuments({ product: productId });
  res.json({ message: 'Đã ghi nhận mua hàng', buyersCount });
});

module.exports = router;
