const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ValidationError } = require('express-validation');
const dotenv = require('dotenv');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const User = require('./models/User');

const app = express();

connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/demo_security_products');

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'API demo đang hoạt động' });
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Bạn gửi quá nhiều request, vui lòng thử lại sau',
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }
  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Đã có lỗi xảy ra';
  console.error(err);
  return res.status(status).json({ message });
});

async function start() {
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
          return { user: null };
        }

        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select('-password');
          if (!user) {
            return { user: null };
          }

          return { user: { id: user._id.toString(), role: user.role, email: user.email, name: user.name } };
        } catch (error) {
          return { user: null };
        }
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`REST server chạy tại http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

start().catch((error) => {
  console.error('Không thể khởi động server', error);
  process.exit(1);
});
