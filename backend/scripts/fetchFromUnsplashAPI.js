const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

// Unsplash API - lấy ảnh theo category
const UNSPLASH_ACCESS_KEY = 'TJ3zNYfDMIKRmUx_VvJ0PoYQb_1rZq-D9CxqnS3GZRI'; // Demo key - bạn nên tạo key riêng

const categorySearches = {
  'iphone': 'iphone smartphone',
  'samsung': 'samsung galaxy smartphone',
  'macbook': 'macbook laptop',
  'dell': 'dell laptop computer',
  'ipad': 'ipad tablet',
  'airpods': 'airpods headphones',
  'samsung-tab': 'samsung tablet',
  'apple-watch': 'apple watch smartwatch'
};

async function fetchUnsplashImages(query, count = 3) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: count,
        client_id: UNSPLASH_ACCESS_KEY
      }
    });
    
    return response.data.results.map(photo => photo.urls.regular);
  } catch (err) {
    console.error(`❌ Error fetching images for "${query}":`, err.message);
    return [];
  }
}

async function updateProductsWithUnsplashImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🖼️  Fetching images from Unsplash API...\n');
    
    const products = await Product.find();
    
    for (const product of products) {
      const categoryId = product.category?.categoryId;
      const searchQuery = categorySearches[categoryId] || product.productName;
      
      console.log(`📦 ${product.productName} - searching for "${searchQuery}"`);
      
      const images = await fetchUnsplashImages(searchQuery, 3);
      
      if (images.length > 0) {
        product.images = images;
        await product.save();
        console.log(`   ✅ Updated with ${images.length} images`);
        console.log(`   📸 ${images[0]}\n`);
      } else {
        console.log(`   ⚠️  No images found\n`);
      }
      
      // Delay để không spam API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Hoàn thành!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

updateProductsWithUnsplashImages();
