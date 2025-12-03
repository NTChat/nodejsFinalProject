const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/productModel');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const items = await Product.aggregate([
      { 
        $match: { 
          $or: [
            { status: { $exists: false } }, 
            { status: 'available' }
          ]
        } 
      },
      {
        $match: {
          $or: [
            { isNewProduct: true },
            { createdAt: { $gte: thirtyDaysAgo } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          minPrice: { $min: '$variants.price' },
          totalStock: { $sum: '$variants.stock' }
        }
      },
      {
        $project: {
          productId: 1,
          productName: 1,
          brand: 1,
          images: '$images',
          lowestPrice: '$minPrice',
          totalStock: 1
        }
      },
      { $limit: 5 }
    ]);
    
    console.log('📦 New Products Result:');
    console.log(JSON.stringify(items, null, 2));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
})();
