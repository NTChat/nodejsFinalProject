const mongoose = require('mongoose');

const LOCAL_MONGODB = 'mongodb://localhost:27017/shop';
const DOCKER_MONGODB = 'mongodb://localhost:27017/shop';

async function exportUsers() {
  try {
    console.log('📤 === EXPORT ALL USERS FROM LOCAL TO DOCKER ===\n');

    // Connect to local MongoDB
    console.log('🔗 Connecting to LOCAL MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_MONGODB).asPromise();
    console.log('✅ Connected to LOCAL MongoDB\n');

    // Connect to Docker MongoDB
    console.log('🔗 Connecting to DOCKER MongoDB...');
    const dockerConn = await mongoose.createConnection(DOCKER_MONGODB).asPromise();
    console.log('✅ Connected to DOCKER MongoDB\n');

    // Get users collection
    const localUsersCollection = localConn.db.collection('users');
    const dockerUsersCollection = dockerConn.db.collection('users');

    // Count users in local
    const localUserCount = await localUsersCollection.countDocuments();
    console.log(`📊 LOCAL users count: ${localUserCount}\n`);

    if (localUserCount === 0) {
      console.log('⚠️  No users in local MongoDB');
      await localConn.close();
      await dockerConn.close();
      process.exit(0);
    }

    // Get all users from local
    const allUsers = await localUsersCollection.find({}).toArray();
    console.log(`📋 Fetched ${allUsers.length} users from LOCAL:\n`);

    // List all users
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role || 'user'})`);
    });

    // Delete existing users in Docker
    const dockerUserCount = await dockerUsersCollection.countDocuments();
    if (dockerUserCount > 0) {
      await dockerUsersCollection.deleteMany({});
      console.log(`\n🗑️  Deleted ${dockerUserCount} existing users in DOCKER\n`);
    }

    // Insert all users into Docker
    await dockerUsersCollection.insertMany(allUsers);
    console.log(`\n✅ Successfully migrated ${allUsers.length} users to DOCKER MongoDB!\n`);

    // Verify
    const newDockerCount = await dockerUsersCollection.countDocuments();
    console.log(`✅ DOCKER now has ${newDockerCount} users`);

    // Close connections
    await localConn.close();
    await dockerConn.close();
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportUsers();
