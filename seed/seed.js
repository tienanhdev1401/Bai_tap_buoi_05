require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const sampleData = require('./sampleData.json');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/products';

async function seed() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Product.deleteMany();
    await User.deleteMany();

    const insertedUsers = await User.create(sampleData.users);
    await Product.insertMany(sampleData.products);

    console.log('✅ Seed dữ liệu thành công');
    insertedUsers.forEach((u) => {
      console.log(`- ${u.role.toUpperCase()}: ${u.email}`);
    });
    console.log('Tổng sản phẩm:', sampleData.products.length);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed thất bại:', error.message);
    process.exit(1);
  }
}

seed();
