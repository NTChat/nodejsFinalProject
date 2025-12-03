// backend/controllers/paymentController.js
const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const Order = require('../models/orderModel');

// Cấu hình VNPAY (Nên để trong file .env, ở đây để mẫu)
const tmnCode = process.env.VNP_TMNCODE || "CGXXGHZC"; // Mã website tại VNPAY
const secretKey = process.env.VNP_HASHSECRET || "GPCHCZKZNTPZQUEVCXWVYVBIAZMZWTBG"; // Chuỗi bí mật
const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
// URL mà VNPay sẽ redirect về sau khi thanh toán
// Với sandbox, dùng URL của họ. Frontend sẽ polling để check trạng thái đơn hàng
const returnUrl = process.env.VNP_RETURN_URL || "https://sandbox.vnpayment.vn/tryitnow/Home/VnPayReturn"; 

exports.createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, bankCode, language = 'vn' } = req.body;
        
        console.log('💳 VNPay createPaymentUrl request:', { orderId, amount, bankCode, language });
        
        if (!orderId || !amount) {
            console.log('❌ Missing orderId or amount');
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin orderId hoặc amount' 
            });
        }
        
        console.log('🔧 VNPay Config:');
        console.log('  - returnUrl:', returnUrl);
        console.log('  - tmnCode:', tmnCode);
        console.log('  - vnpUrl:', vnpUrl);
        
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

        // VNPAY yêu cầu số tiền * 100
        const vnpAmount = amount * 100;

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = language;
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId; // Mã đơn hàng
        vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang ${orderId}`;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = vnpAmount;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Sắp xếp tham số theo alphabet (Bắt buộc)
        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
        
        vnp_Params['vnp_SecureHash'] = signed;
        
        const paymentUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

        console.log('✅ VNPay payment URL created successfully');
        res.status(200).json({ success: true, paymentUrl });
    } catch (error) {
        console.error("❌ Lỗi tạo URL VNPAY:", error);
        res.status(500).json({ success: false, message: "Lỗi tạo thanh toán: " + error.message });
    }
};

// API để Frontend verify kết quả thanh toán VNPay
exports.verifyPayment = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            // Check mã phản hồi: 00 là thành công
            const rspCode = vnp_Params['vnp_ResponseCode'];
            const orderId = vnp_Params['vnp_TxnRef'];

            if (rspCode === '00') {
                // Cập nhật trạng thái đơn hàng thành ĐÃ THANH TOÁN
                const order = await Order.findOneAndUpdate(
                    { orderId: orderId }, 
                    { status: 'Confirmed', isPaid: true, paidAt: new Date() },
                    { new: true }
                );
                
                return res.status(200).json({ 
                    success: true, 
                    code: '00',
                    message: 'Thanh toán thành công',
                    orderId: orderId,
                    order: order
                });
            } else {
                return res.status(200).json({ 
                    success: false, 
                    code: rspCode,
                    message: 'Thanh toán thất bại',
                    orderId: orderId
                });
            }
        } else {
            return res.status(400).json({ 
                success: false, 
                code: '97',
                message: 'Chữ ký không hợp lệ'
            });
        }
    } catch (error) {
        console.error('Lỗi verify payment:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Hàm xử lý khi VNPAY redirect về
exports.vnpayReturn = async (req, res) => {
    try {
        console.log('🔙 VNPay Return callback received:', req.query);
        
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        console.log('🔐 Signature verification:');
        console.log('  - Received hash:', secureHash);
        console.log('  - Computed hash:', signed);
        console.log('  - Match:', secureHash === signed);

        const rspCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const amount = vnp_Params['vnp_Amount'] / 100; // Chia 100 vì VNPay nhân 100

        if (secureHash === signed) {
            // Chữ ký hợp lệ
            if (rspCode === '00') {
                // Thanh toán thành công - Cập nhật DB
                const order = await Order.findOneAndUpdate(
                    { orderId: orderId },
                    { 
                        status: 'Confirmed', 
                        isPaid: true, 
                        paidAt: new Date(),
                        paymentMethod: 'vnpay'
                    },
                    { new: true }
                );

                console.log(`✅ VNPay payment success for order ${orderId}`);
                
                // Redirect về frontend success page
                return res.redirect(`https://localhost:3000/order-success?code=00&orderId=${orderId}&amount=${amount}&method=vnpay`);
            } else {
                // Thanh toán thất bại
                console.log(`❌ VNPay payment failed for order ${orderId} with code ${rspCode}`);
                return res.redirect(`https://localhost:3000/order-success?code=${rspCode}&orderId=${orderId}`);
            }
        } else {
            // Chữ ký không hợp lệ
            console.log('❌ Invalid signature from VNPay');
            return res.redirect(`https://localhost:3000/order-success?code=97&orderId=${orderId}`);
        }
    } catch (error) {
        console.error('❌ VNPay Return Error:', error);
        return res.redirect('https://localhost:3000/order-success?code=99');
    }
};

// IPN - Instant Payment Notification từ VNPay (webhook để cập nhật DB)
// VNPay sẽ gọi API này để thông báo kết quả thanh toán
exports.vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];

            // Tìm đơn hàng
            const order = await Order.findOne({ orderId: orderId });
            if (!order) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            // Kiểm tra nếu đơn đã được xử lý rồi
            if (order.isPaid) {
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            if (rspCode === '00') {
                // Thanh toán thành công
                order.status = 'Confirmed';
                order.isPaid = true;
                order.paidAt = new Date();
                await order.save();
                
                console.log(`✅ VNPay IPN: Order ${orderId} paid successfully`);
                return res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
                console.log(`❌ VNPay IPN: Order ${orderId} payment failed with code ${rspCode}`);
                return res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }
    } catch (error) {
        console.error('❌ VNPay IPN Error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// Helper sắp xếp tham số (Bắt buộc của VNPAY)
function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(key);
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = obj[str[key]];
    }
    return sorted;
}