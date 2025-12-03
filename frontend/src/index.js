// frontend/src/index.js
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
window.addEventListener('error', (e) => {
    if (e.message && e.message.includes(resizeObserverLoopErr)) {
        e.stopImmediatePropagation();
    }
});
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './routes/AppRoutes';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-datepicker/dist/react-datepicker.css'; // 👈 THÊM DÒNG NÀY
// --- IMPORT CÁC CONTEXT ---
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // 👈 ĐÂY LÀ ĐƯỜNG DẪN MỚI (Trở lại như cũ)
//MÀu lịch Flatpickr
import 'flatpickr/dist/themes/material_green.css'; // (Mình sẽ dùng theme này lấy cái lịch)
import 'flatpickr/dist/themes/light.css';  // (Theme sáng màu - chúng ta sẽ đè màu này)
// Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <BrowserRouter>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <App />
          <ToastContainer
            position="top-right" // Vẫn giữ top-right
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover={false}
            theme="colored"
            // 👇 THÊM mt-16 (margin-top) để né Header nếu Header cao
            // 👇 THÊM zIndex cực lớn để đè lên mọi thứ
            toastStyle={{ backgroundColor: "var(--toastify-color-success)" }}
            style={{ zIndex: 99999999, marginTop: "60px" }}
          />        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
  // </React.StrictMode>
);