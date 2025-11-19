const express = require('express');
const jwt = require('jsonwebtoken');
const validate = require('express-validation');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../middleware/validators');

const router = express.Router();

router.post('/register', validate(registerValidation), async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/login', validate(loginValidation), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
