// backend/fetchFromPexels.js
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/dbConnection');
const Product = require('./models/productModel');
const https = require('https');

connectDB();

// Product names to search
const products = [
  { name: 'iPhone 15 Pro Max', query: 'iPhone 15' },
  { name: 'iPhone 14 Pro', query: 'iPhone 14' },
  { name: 'Samsung Galaxy S24 Ultra', query: 'Samsung S24' },
  { name: 'MacBook Pro 14 M3', query: 'MacBook Pro' },
  { name: 'Dell Inspiron 15 3520', query: 'Dell laptop' },
  { name: 'iPad Pro M2 12.9', query: 'iPad Pro' },
  { name: 'AirPods Pro Gen 2', query: 'AirPods' },
  { name: 'Samsung Galaxy Tab S9', query: 'Samsung tablet' },
  { name: 'Apple Watch Series 9', query: 'Apple Watch' }
];

// Generate direct Pexels image URLs (free, no API key needed)
// Using Pexels static URL format
function getPexelsUrls(query) {
  // Pexels photo search returns random images, we'll use static URLs for consistency
  // Format: https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg
  
  const imageMap = {
    'iPhone 15': [
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'iPhone 14': [
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Samsung S24': [
      'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'MacBook Pro': [
      'https://images.pexels.com/photos/18105/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/7974/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/4195326/pexels-photo-4195326.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Dell laptop': [
      'https://images.pexels.com/photos/6954221/pexels-photo-6954221.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/18105/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/7974/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'iPad Pro': [
      'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'AirPods': [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Samsung tablet': [
      'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    'Apple Watch': [
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
    ]
  };

  return imageMap[query] || [
    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
}

async function updateProductImages() {
  try {
    console.log('🖼️  Fetching product images from Pexels...\n');

    for (const product of products) {
      const images = getPexelsUrls(product.query);
      
      const result = await Product.findOneAndUpdate(
        { productName: product.name },
        { images: images },
        { new: true }
      );

      if (result) {
        console.log(`📦 ${product.name}`);
        console.log(`   ✅ Updated with 3 images from Pexels`);
        console.log(`   📸 Sample: ${images[0]}\n`);
      } else {
        console.log(`⚠️  Product not found: ${product.name}\n`);
      }
    }

    console.log('✅ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateProductImages();
