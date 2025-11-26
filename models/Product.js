const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
