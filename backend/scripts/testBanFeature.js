// Test Ban Account Feature
const https = require('https');
const axios = require('axios');

// Ignore self-signed certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const API_URL = 'https://localhost:3001/api';

const axiosInstance = axios.create({
    httpsAgent,
    baseURL: API_URL
});

let adminToken;
let userId;

async function testBanFeature() {
    console.log('\n🧪 === BAN ACCOUNT FEATURE TEST ===\n');

    try {
        // Step 1: Admin Login
        console.log('1️⃣ Đăng nhập admin...');
        const adminLogin = await axiosInstance.post('/auth/login', {
            identifier: 'admin@test.com',
            password: 'admin123'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in:', adminLogin.data.user.name);

        // Step 2: User Login (before ban)
        console.log('\n2️⃣ Đăng nhập user bình thường...');
        const userLogin = await axiosInstance.post('/auth/login', {
            identifier: 'user@test.com',
            password: 'user123'
        });
        userId = userLogin.data.user._id;
        console.log('✅ User logged in:', userLogin.data.user.name);
        console.log('   User ID:', userId);

        // Step 3: Ban the user
        console.log('\n3️⃣ Admin ban user...');
        const banResponse = await axiosInstance.put(
            `/users/${userId}/ban`,
            { banned: true },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ User banned:', banResponse.data.message);
        console.log('   Banned status:', banResponse.data.isBanned);

        // Step 4: Try to login as banned user
        console.log('\n4️⃣ Thử đăng nhập với tài khoản bị ban...');
        try {
            await axiosInstance.post('/auth/login', {
                identifier: 'user@test.com',
                password: 'user123'
            });
            console.log('❌ ERROR: Banned user should NOT be able to login!');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Login blocked correctly!');
                console.log('   Error message:', error.response.data.message);
                
                // Check if Vietnamese message is correct
                const expectedMessage = 'tài khoản của bạn đã bị cấm do có hành vi bất thường. Vui lòng liên hệ hotline để được hỗ trợ';
                if (error.response.data.message === expectedMessage) {
                    console.log('✅ Vietnamese error message is CORRECT!');
                } else {
                    console.log('❌ Vietnamese error message is WRONG!');
                    console.log('   Expected:', expectedMessage);
                    console.log('   Got:', error.response.data.message);
                }
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Step 5: Unban the user
        console.log('\n5️⃣ Admin unban user...');
        const unbanResponse = await axiosInstance.put(
            `/users/${userId}/ban`,
            { banned: false },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ User unbanned:', unbanResponse.data.message);

        // Step 6: Try to login after unban
        console.log('\n6️⃣ Thử đăng nhập sau khi unban...');
        const loginAfterUnban = await axiosInstance.post('/auth/login', {
            identifier: 'user@test.com',
            password: 'user123'
        });
        console.log('✅ Login successful after unban!');
        console.log('   User:', loginAfterUnban.data.user.name);

        console.log('\n✅ === ALL BAN FEATURE TESTS PASSED ===\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the test
testBanFeature();
