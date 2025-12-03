const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Placeholder SVG - sử dụng được ngay
    const placeholderImages = [
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjNjM2NmYxIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjMyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5KOPC90ZXh0Pjwvc3ZnPg=='
    ];
    
    const result = await Product.updateMany(
      {},
      {
        $set: {
          images: placeholderImages
        }
      }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'products');
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
