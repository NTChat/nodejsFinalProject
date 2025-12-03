// Quick script to unban user
const https = require('https');
const axios = require('axios');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const API_URL = 'https://localhost:3001/api';
const axiosInstance = axios.create({ httpsAgent, baseURL: API_URL });

async function unbanUser() {
    console.log('🔓 Unbanning user...');
    
    // Admin login
    const adminLogin = await axiosInstance.post('/auth/login', {
        identifier: 'admin@test.com',
        password: 'admin123'
    });
    
    // Get user
    const userLogin = await axiosInstance.get('/auth/profile', {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
    });
    
    // Find user@test.com
    const users = await axiosInstance.get('/users', {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
    });
    
    const targetUser = users.data.users.find(u => u.email === 'user@test.com');
    if (!targetUser) {
        console.log('❌ User not found');
        return;
    }
    
    console.log(`Found user: ${targetUser.name} (ID: ${targetUser._id})`);
    console.log(`Current ban status: ${targetUser.isBanned}`);
    
    if (targetUser.isBanned) {
        // Unban
        await axiosInstance.put(
            `/users/${targetUser._id}/ban`,
            {},
            { headers: { Authorization: `Bearer ${adminLogin.data.token}` } }
        );
        console.log('✅ User unbanned!');
    } else {
        console.log('✅ User is already unbanned');
    }
}

unbanUser().catch(err => {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
});
