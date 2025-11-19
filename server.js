const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { ValidationError } = require('express-validation');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/demo_security_products');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// luôn trả về trang login khi truy cập root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Bạn gửi quá nhiều request, vui lòng thử lại sau',
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }
  console.error(err);
  return res.status(500).json({ message: 'Đã có lỗi xảy ra' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
