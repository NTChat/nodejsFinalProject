const mongoose = require('mongoose');

async function getUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shop');
    
    const users = await mongoose.connection.collection('users').find({}).toArray();
    
    console.log('📋 Total users:', users.length);
    console.log('\n👥 Users list:');
    users.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.email} (${u.role})`);
      console.log(`     Name: ${u.name}`);
      console.log(`     Username: ${u.userName}`);
    });

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getUsers();
