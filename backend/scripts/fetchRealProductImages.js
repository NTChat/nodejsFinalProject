const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

// Bing Image Search - lấy ảnh thực tế khớp tên sản phẩm
async function fetchBingImages(query, count = 3) {
  try {
    // Sử dụng Bing doodle images - free CDN
    const encodedQuery = encodeURIComponent(query);
    
    // Bing Image URLs - format mà Bing dùng (không cần API key)
    const urls = [
      `https://www.bing.com/images/search?q=${encodedQuery}&form=HDRSC2&first=1&tsc=ImageBasicHover`,
    ];
    
    // Dùng duckduckgo image search thay vì (không cần API key)
    const response = await axios.get(`https://duckduckgo.com/?q=${encodedQuery}&t=h_&iar=images&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    // Extract image URLs từ DDG
    const imageMatch = response.data.match(/,"image":"([^"]+)"/g);
    if (imageMatch) {
      return imageMatch.slice(0, count).map(m => m.match(/"image":"([^"]+)"/)[1]);
    }
    
    return [];
  } catch (err) {
    console.error(`⚠️  Error fetching images for "${query}":`, err.message);
    return [];
  }
}

// Sử dụng Google Custom Search API fallback images
async function getProductImages(productName) {
  try {
    // Fallback: Sử dụng URLencoded Google Images (không cần API key)
    const query = productName.toLowerCase().replace(/[^a-z0-9]/g, '+');
    
    // Dùng public image CDN endpoints
    const images = [
      `https://source.unsplash.com/400x400/?${query},product`,
      `https://source.unsplash.com/400x400/?${query},electronics`,
      `https://source.unsplash.com/400x400/?${query},device`
    ];
    
    return images;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return [];
  }
}

async function updateProductsWithRealImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🖼️  Fetching real product images from Unsplash Source API...\n');
    
    const products = await Product.find();
    
    for (const product of products) {
      console.log(`📦 ${product.productName}`);
      
      const images = await getProductImages(product.productName);
      
      if (images.length > 0) {
        product.images = images;
        await product.save();
        console.log(`   ✅ Updated with ${images.length} images from Unsplash Source`);
        console.log(`   📸 Sample: ${images[0].substring(0, 50)}...\n`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('✅ Hoàn thành!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

updateProductsWithRealImages();
