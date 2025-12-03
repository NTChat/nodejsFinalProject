// backend/restorePexelsAndRemoveImages.js
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/dbConnection');
const Product = require('./models/productModel');

connectDB();

// Pexels CDN images (cũ - ok hơn)
const pexelsImages = {
  'iPhone 15 Pro Max': [
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'iPhone 14 Pro': [
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'Samsung Galaxy S24 Ultra': [
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'iPad Pro M2 12.9': [
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'AirPods Pro Gen 2': [
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'Samsung Galaxy Tab S9': [
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'Apple Watch Series 9': [
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
  ]
};

// Sản phẩm cần xóa ảnh
const productsToRemove = ['Dell Inspiron 15 3520', 'MacBook Pro 14 M3'];

async function updateProducts() {
  try {
    console.log('🖼️  Restore Pexels CDN và xóa ảnh 2 sản phẩm bị lỗi...\n');

    // 1. Restore Pexels CDN cho các sản phẩm khác
    for (const [productName, images] of Object.entries(pexelsImages)) {
      const result = await Product.findOneAndUpdate(
        { productName: productName },
        { images: images },
        { new: true }
      );

      if (result) {
        console.log(`✅ ${productName} - Restore Pexels`);
      }
    }

    console.log('\n');

    // 2. Xóa ảnh (set images = [])
    for (const productName of productsToRemove) {
      const result = await Product.findOneAndUpdate(
        { productName: productName },
        { images: [] },
        { new: true }
      );

      if (result) {
        console.log(`❌ ${productName} - Ảnh đã xóa`);
      }
    }

    console.log('\n✅ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

updateProducts();
