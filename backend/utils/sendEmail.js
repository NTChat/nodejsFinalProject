// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    console.log("--- GỬI EMAIL ---");
    console.log("📧 To:", options.email || options.to);
    console.log("📧 Subject:", options.subject);

    try {
        // Tạo Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Cấu hình email - hỗ trợ cả text và html
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"PhoneWorld Support" <support@phoneworld.com>',
            to: options.email || options.to, // Hỗ trợ cả 2 cách gọi
            subject: options.subject,
        };

        // Hỗ trợ cả text và html content
        if (options.html) {
            mailOptions.html = options.html;
        }
        if (options.message || options.text) {
            mailOptions.text = options.message || options.text;
        }

        // Gửi mail
        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Đã gửi email thành công!");
        console.log("📬 Message ID:", info.messageId);
        
        // Nếu dùng Ethereal test account, hiển thị preview URL
        if (info.messageId && process.env.EMAIL_HOST?.includes('ethereal')) {
            console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));
        }
        
        console.log("---------------------------------------");
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error("❌ Lỗi gửi email:", error.message);
        console.log("---------------------------------------");
        throw error; // Re-throw để caller có thể handle
    }
};

module.exports = sendEmail;