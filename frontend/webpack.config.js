const path = require('path');

module.exports = {
    entry: './src/index.js', // Điểm vào của ứng dụng
    output: {
        filename: 'bundle.js', // Tên tệp đầu ra
        path: path.resolve(__dirname, 'dist'), // Thư mục đầu ra
    },
    module: {
        rules: [
            {
                test: /\.css$/, // Kiểm tra tệp CSS
                use: [
                    'style-loader', // Thêm CSS vào DOM
                    'css-loader',   // Chuyển đổi CSS thành CommonJS
                    'postcss-loader' // Xử lý CSS với PostCSS
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.css'], // Các phần mở rộng mà Webpack sẽ xử lý
    },
    ignoreWarnings: [
        {
            module: /lucide-react/,
            message: /Failed to parse source map/,
        },
    ],
};