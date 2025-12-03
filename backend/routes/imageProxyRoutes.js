// backend/routes/imageProxyRoutes.js
const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

/**
 * Proxy endpoint: GET /api/image-proxy?url=ENCODED_URL
 * Lấy ảnh từ URL bên ngoài và trả về từ backend
 * Giải quyết vấn đề CORS/blocking từ frontend
 */
router.get('/', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Xác định protocol
    const protocol = decodedUrl.startsWith('https') ? https : http;

    // Fetch ảnh
    protocol.get(decodedUrl, (imageResponse) => {
      // Copy headers từ remote response
      res.setHeader('Content-Type', imageResponse.headers['content-type']);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h

      // Stream ảnh về client
      imageResponse.pipe(res);
    }).on('error', (err) => {
      console.error('❌ Image proxy error:', err.message);
      res.status(500).json({ error: 'Failed to fetch image' });
    });
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(400).json({ error: 'Invalid URL' });
  }
});

module.exports = router;
