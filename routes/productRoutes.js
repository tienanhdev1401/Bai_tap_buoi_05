const express = require('express');
const validate = require('express-validation');
const Product = require('../models/Product');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { createProductValidation } = require('../middleware/validators');

const router = express.Router();

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

module.exports = router;
