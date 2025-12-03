// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Đảm bảo đường dẫn này đúng
  ],
  theme: {
    extend: {
      // Container với max-width cố định để tránh content bị giãn quá rộng
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px', // Giới hạn max-width ở 1400px cho màn hình lớn
        },
      },
      // 1. Mở rộng bảng màu của Tailwind
      colors: {
        // 2. Đặt tên semantic (dễ nhớ) và trỏ vào CSS Variable
        'primary': 'var(--color-primary)',
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        
        // Màu text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-on-dark': 'var(--text-on-dark)',
        'text-accent': 'var(--text-accent)',
      }
    },
  },
  plugins: [],
}