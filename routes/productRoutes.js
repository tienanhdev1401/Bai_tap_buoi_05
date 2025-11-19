const express = require('express');
const validate = require('express-validation');
const Product = require('../models/Product');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { createProductValidation } = require('../middleware/validators');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { category = 'all', page = 1, limit = 6 } = req.query;
  const filters = category === 'all' ? {} : { category };
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 6;

  const products = await Product.find(filters)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  const total = await Product.countDocuments(filters);
  const hasMore = pageNumber * pageSize < total;

  res.json({ products, total, hasMore });
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
