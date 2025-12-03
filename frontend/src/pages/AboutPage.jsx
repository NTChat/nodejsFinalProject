// frontend/src/pages/AboutPage.jsx
import React from 'react';
import { 
    Store, Users, Award, TrendingUp, ShoppingBag, 
    Clock, Shield, Heart, Target, Zap, Phone, Mail, MapPin 
} from 'lucide-react';

const AboutPage = () => {
    const stats = [
        { icon: Users, label: "Khách hàng tin tưởng", value: "50,000+", color: "blue" },
        { icon: ShoppingBag, label: "Đơn hàng thành công", value: "100,000+", color: "green" },
        { icon: Award, label: "Năm kinh nghiệm", value: "10+", color: "yellow" },
        { icon: TrendingUp, label: "Tăng trưởng hàng năm", value: "150%", color: "purple" }
    ];

    const values = [
        {
            icon: Shield,
            title: "Uy tín hàng đầu",
            desc: "Cam kết sản phẩm chính hãng 100%, bảo hành đầy đủ và chính sách đổi trả linh hoạt",
            color: "blue"
        },
        {
            icon: Zap,
            title: "Giao hàng nhanh chóng",
            desc: "Giao hàng toàn quốc trong 24-48h, hỗ trợ đặt hàng và thanh toán online tiện lợi",
            color: "orange"
        },
        {
            icon: Heart,
            title: "Chăm sóc tận tâm",
            desc: "Đội ngũ tư vấn chuyên nghiệp, hỗ trợ khách hàng 24/7 qua nhiều kênh liên lạc",
            color: "red"
        },
        {
            icon: Target,
            title: "Giá cả cạnh tranh",
            desc: "Giá tốt nhất thị trường, nhiều ưu đãi hấp dẫn và chương trình khuyến mãi thường xuyên",
            color: "green"
        }
    ];

    const milestones = [
        { year: "2015", title: "Khởi đầu", desc: "Ra mắt cửa hàng đầu tiên tại Hà Nội" },
        { year: "2017", title: "Mở rộng", desc: "Khai trương 5 chi nhánh trên toàn quốc" },
        { year: "2020", title: "Chuyển đổi số", desc: "Ra mắt nền tảng thương mại điện tử" },
        { year: "2025", title: "Dẫn đầu", desc: "Top 3 cửa hàng công nghệ uy tín tại Việt Nam" }
    ];

    const colorClasses = {
        blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
        green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-200" },
        yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-200" },
        purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
        orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200" },
        red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-200" }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Store size={16} />
                            <span>Về PhoneWorld</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Đồng Hành Cùng <span className="text-yellow-300">Công Nghệ</span>
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
                            PhoneWorld - Hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ, mang đến cho khách hàng những sản phẩm chất lượng cao với dịch vụ tốt nhất
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <a href="/products" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                                Khám phá sản phẩm
                            </a>
                            <a href="/contact" className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-all border-2 border-white/30">
                                Liên hệ ngay
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 -mt-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            const colors = colorClasses[stat.color];
                            return (
                                <div key={index} className="bg-white rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all border-t-4 border-blue-500">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colors.bg} mb-4`}>
                                        <Icon className={`${colors.icon}`} size={32} />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</div>
                                    <div className="text-gray-600 text-sm">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Câu Chuyện Của Chúng Tôi</h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Hành trình từ một cửa hàng nhỏ đến chuỗi bán lẻ công nghệ hàng đầu Việt Nam
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">Sứ mệnh</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Mang đến cho mọi người những sản phẩm công nghệ chất lượng cao với giá cả hợp lý, 
                                        cùng dịch vụ chăm sóc khách hàng tận tâm. Chúng tôi tin rằng công nghệ phải phục vụ con người,
                                        không phải ngược lại.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">Tầm nhìn</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Trở thành chuỗi cửa hàng công nghệ số 1 Việt Nam về mặt uy tín và chất lượng dịch vụ.
                                        Chúng tôi hướng đến việc xây dựng một cộng đồng người dùng công nghệ văn minh và hiện đại.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {milestones.map((milestone, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                                        <div className="font-semibold text-gray-800 mb-1">{milestone.title}</div>
                                        <div className="text-sm text-gray-600">{milestone.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Giá Trị Cốt Lõi</h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Những nguyên tắc và giá trị mà chúng tôi luôn kiên định theo đuổi
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {values.map((value, index) => {
                                const Icon = value.icon;
                                const colors = colorClasses[value.color];
                                return (
                                    <div key={index} className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-t-4 ${colors.border} group`}>
                                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${colors.bg} mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className={`${colors.icon}`} size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 md:p-12 text-center text-white">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng trải nghiệm?</h2>
                            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                                Hãy đến với PhoneWorld để khám phá những sản phẩm công nghệ tốt nhất và trải nghiệm dịch vụ đẳng cấp
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <a href="/products" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg">
                                    Mua sắm ngay
                                </a>
                                <a href="/contact" className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-all border-2 border-white/30 flex items-center gap-2">
                                    <Phone size={18} />
                                    Liên hệ tư vấn
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
