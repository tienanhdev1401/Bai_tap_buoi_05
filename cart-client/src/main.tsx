import React from 'react';
import ReactDOM from 'react-dom/client';
import { CartProvider } from 'tienanh-cart';
import App from './App';
import './index.css';
import 'tienanh-cart/dist/index.css';

const target = document.getElementById('cartRoot') || document.getElementById('root');

if (!target) {
  throw new Error('Không tìm thấy phần tử gốc để gắn ứng dụng giỏ hàng');
}

ReactDOM.createRoot(target).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
