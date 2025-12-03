const mongoose = require('mongoose');

// Connection strings
const LOCAL_MONGODB = 'mongodb://localhost:27017/shop';
const DOCKER_MONGODB = 'mongodb://localhost:27017/shop';

async function migrateData() {
  console.log('📊 === MIGRATE DATA FROM LOCAL TO DOCKER MONGODB ===\n');

  try {
    // Connect to local MongoDB
    console.log('🔗 Connecting to LOCAL MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_MONGODB).asPromise();
    console.log('✅ Connected to LOCAL MongoDB\n');

    // Connect to Docker MongoDB
    console.log('🔗 Connecting to DOCKER MongoDB...');
    const dockerConn = await mongoose.createConnection(DOCKER_MONGODB).asPromise();
    console.log('✅ Connected to DOCKER MongoDB\n');

    // Get collections from local MongoDB
    const localDb = localConn.db;
    const dockerDb = dockerConn.db;

    const collections = await localDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections to migrate:\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) continue;

      const localCollection = localDb.collection(collectionName);
      const dockerCollection = dockerDb.collection(collectionName);

      // Count documents
      const count = await localCollection.countDocuments();
      console.log(`📋 ${collectionName}: ${count} documents`);

      if (count === 0) {
        console.log(`   ⚠️  Empty, skipping\n`);
        continue;
      }

      // Get all documents
      const documents = await localCollection.find({}).toArray();

      // Delete existing documents in Docker first (to ensure clean migration)
      const dockerCount = await dockerCollection.countDocuments();
      if (dockerCount > 0) {
        await dockerCollection.deleteMany({});
        console.log(`   🗑️  Deleted ${dockerCount} existing documents`);
      }

      // Insert documents
      await dockerCollection.insertMany(documents);
      console.log(`   ✅ Migrated ${count} documents\n`);
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Close connections
    await localConn.close();
    await dockerConn.close();
    console.log('✅ Connections closed');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateData();
