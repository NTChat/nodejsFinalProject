// frontend/src/pages/ContactPage.jsx
import React, { useState } from 'react';
import { 
    Mail, Phone, MapPin, Clock, Send, MessageCircle, 
    Facebook, Instagram, Youtube, Twitter, CheckCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const contactInfo = [
        {
            icon: Phone,
            title: "Hotline",
            content: "1900-1234",
            subContent: "Miễn phí (8:00 - 22:00)",
            color: "blue",
            link: "tel:19001234"
        },
        {
            icon: Mail,
            title: "Email",
            content: "support@phoneworld.vn",
            subContent: "Phản hồi trong 24h",
            color: "red",
            link: "mailto:support@phoneworld.vn"
        },
        {
            icon: MapPin,
            title: "Địa chỉ",
            content: "123 Đường ABC, Quận 1",
            subContent: "TP. Hồ Chí Minh",
            color: "green",
            link: "https://maps.google.com"
        },
        {
            icon: Clock,
            title: "Giờ làm việc",
            content: "8:00 - 22:00",
            subContent: "Tất cả các ngày",
            color: "purple"
        }
    ];

    const stores = [
        {
            name: "Chi nhánh Hà Nội",
            address: "456 Đường XYZ, Hoàn Kiếm, Hà Nội",
            phone: "024-1234-5678",
            hours: "8:00 - 22:00"
        },
        {
            name: "Chi nhánh TP.HCM",
            address: "123 Đường ABC, Quận 1, TP.HCM",
            phone: "028-1234-5678",
            hours: "8:00 - 22:00"
        },
        {
            name: "Chi nhánh Đà Nẵng",
            address: "789 Đường DEF, Hải Châu, Đà Nẵng",
            phone: "023-1234-5678",
            hours: "8:00 - 22:00"
        }
    ];

    const socialLinks = [
        { icon: Facebook, name: "Facebook", link: "#", color: "blue" },
        { icon: Instagram, name: "Instagram", link: "#", color: "pink" },
        { icon: Youtube, name: "Youtube", link: "#", color: "red" },
        { icon: Twitter, name: "Twitter", link: "#", color: "sky" }
    ];

    const faqs = [
        {
            question: "Chính sách bảo hành như thế nào?",
            answer: "Sản phẩm được bảo hành 12-24 tháng tùy theo nhà sản xuất. Bảo hành 1 đổi 1 trong 30 ngày đầu nếu có lỗi từ nhà sản xuất."
        },
        {
            question: "Giao hàng mất bao lâu?",
            answer: "Đơn hàng nội thành: 2-4 giờ. Đơn hàng ngoại thành: 1-3 ngày làm việc. Miễn phí giao hàng cho đơn từ 500.000đ."
        },
        {
            question: "Có thể trả góp không?",
            answer: "Có, chúng tôi hỗ trợ trả góp 0% qua thẻ tín dụng và các công ty tài chính. Thủ tục đơn giản, duyệt nhanh trong 30 phút."
        }
    ];

    const colorClasses = {
        blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-500", hover: "hover:bg-blue-600" },
        red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-500", hover: "hover:bg-red-600" },
        green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-500", hover: "hover:bg-green-600" },
        purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-500", hover: "hover:bg-purple-600" },
        pink: { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-500", hover: "hover:bg-pink-600" },
        sky: { bg: "bg-sky-50", icon: "text-sky-600", border: "border-sky-500", hover: "hover:bg-sky-600" }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            toast.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong 24h.');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <MessageCircle size={16} />
                            <span>Liên hệ với chúng tôi</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Chúng Tôi Luôn Sẵn Sàng Hỗ Trợ</h1>
                        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                            Gửi câu hỏi, góp ý hoặc yêu cầu hỗ trợ. Đội ngũ của chúng tôi sẽ phản hồi trong thời gian sớm nhất
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 -mt-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {contactInfo.map((info, index) => {
                            const Icon = info.icon;
                            const colors = colorClasses[info.color];
                            return (
                                <a
                                    key={index}
                                    href={info.link || '#'}
                                    className={`bg-white rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all border-t-4 ${colors.border} group`}
                                >
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colors.bg} mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`${colors.icon}`} size={28} />
                                    </div>
                                    <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
                                    <p className="text-gray-900 font-medium mb-1">{info.content}</p>
                                    <p className="text-sm text-gray-500">{info.subContent}</p>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Form & Map */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Send className="text-blue-600" size={28} />
                                Gửi tin nhắn
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="0123456789"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ đề *</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    >
                                        <option value="">-- Chọn chủ đề --</option>
                                        <option value="product">Hỏi về sản phẩm</option>
                                        <option value="order">Hỏi về đơn hàng</option>
                                        <option value="warranty">Bảo hành - Đổi trả</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="5"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                        placeholder="Nhập nội dung tin nhắn của bạn..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Gửi tin nhắn
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-6">
                            {/* Stores */}
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <MapPin className="text-green-600" size={24} />
                                    Hệ thống cửa hàng
                                </h3>
                                <div className="space-y-4">
                                    {stores.map((store, index) => (
                                        <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                                            <h4 className="font-semibold text-gray-800 mb-1">{store.name}</h4>
                                            <p className="text-sm text-gray-600 mb-1 flex items-start gap-2">
                                                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                                {store.address}
                                            </p>
                                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                                                <Phone size={14} />
                                                {store.phone}
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Clock size={14} />
                                                {store.hours}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Kết nối với chúng tôi</h3>
                                <p className="text-gray-600 mb-6 text-sm">Theo dõi để cập nhật tin tức và ưu đãi mới nhất</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {socialLinks.map((social, index) => {
                                        const Icon = social.icon;
                                        const colors = colorClasses[social.color];
                                        return (
                                            <a
                                                key={index}
                                                href={social.link}
                                                className={`flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all border-2 border-transparent ${colors.hover} hover:text-white group`}
                                            >
                                                <div className={`${colors.icon} group-hover:text-white transition-colors`}>
                                                    <Icon size={20} />
                                                </div>
                                                <span className="font-medium text-sm text-gray-700 group-hover:text-white">
                                                    {social.name}
                                                </span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Câu Hỏi Thường Gặp</h2>
                            <p className="text-gray-600">Những câu hỏi khách hàng quan tâm nhất</p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <CheckCircle className="text-blue-600" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="aspect-video bg-gray-200 relative">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3193500045456!2d106.69746931533464!3d10.786844461969084!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc1%3A0xb5c5b1b2a1e5b1b2!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBLaG9hIGjhu41jIFThu7Egbmhpw6puIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1234567890"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    className="absolute inset-0"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
