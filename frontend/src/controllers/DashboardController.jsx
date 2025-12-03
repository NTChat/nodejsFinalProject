// frontend/src/controllers/DashboardController.jsx
import api from "../services/api";

export const DashboardController = {
    getStats: async (options = {}) => {
        const { period = "year", from, to, status = "Delivered" } = options;
        
        console.log('🔍 DashboardController.getStats called with:', { period, from, to, status });
        
        // 1. Logic lấy Advanced Stats (API Chính)
        try {
            const params = { period };
            if (from) params.from = from;
            if (to) params.to = to;
            params.status = status || "Delivered";
            
            console.log('📡 Calling /api/admin/stats/advanced with params:', params);

            // Gọi API
            const response = await api.get('admin/stats/advanced', { params });
            
            // Backend trả về JSON dạng { range, kpis, series }
            const beData = response.data; 
            
            // Kiểm tra xem dữ liệu có hợp lệ không
            if (!beData || !beData.kpis) {
                throw new Error("Empty data from backend");
            }

            console.log('✅ Backend response:', beData);
            
            // --- TRANSFORM DỮ LIỆU (Backend -> Frontend) ---

            // 1. KPIs
            const totalOrders = beData.kpis.orders || 0;
            const totalRevenue = beData.kpis.revenue || 0;
            const totalProfit = beData.kpis.profit || 0;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            
            // 2. Lấy các chuỗi dữ liệu (Series)
            const revenueProfitList = beData.series?.revenueProfit || [];
            const ordersQtyList = beData.series?.ordersQty || [];
            const categoryShareList = beData.series?.categoryShare || [];
            const topProductsList = beData.series?.topProducts || [];
            
            // 3. Merge Chart Data (Gộp Doanh thu và Số đơn hàng vào chung 1 biểu đồ)
            // Backend trả về label (ví dụ "2025-10"), ta dùng label này để tìm dữ liệu tương ứng
            const chartData = revenueProfitList.map((item) => {
                // Tìm item tương ứng trong mảng ordersQty dựa vào label để đảm bảo không bị lệch
                const orderItem = ordersQtyList.find(o => o.label === item.label);
                
                return {
                    name: item.label, // Tên hiển thị trên trục X (Tháng/Ngày)
                    DoanhThu: item.revenue || 0,
                    LoiNhuan: item.profit || 0,
                    DonHang: orderItem?.orders || 0,
                    SoLuong: orderItem?.qty || 0
                };
            });
            
            // 4. Pie Chart Data (Category)
            // Backend trả về: { name: 'Laptop', value: 10 }
            // Frontend cần: { name, value } -> Đã khớp, chỉ cần map lại cho chắc chắn
            const categoryData = categoryShareList.map(cat => ({
                name: cat.name,
                value: cat.value // Sử dụng 'value' từ Backend (trước đây bạn dùng cat.qty bị lỗi)
            }));

            // 5. Top Products Data
            const topProducts = topProductsList.map(prod => ({
                name: prod.name,
                qty: prod.qty,
                revenue: prod.revenue
            }));
            
            console.log('📊 Stats processed:', { totalOrders, totalRevenue, chartDataLength: chartData.length });

            // Trả về đúng cấu trúc Frontend mong đợi
            return { 
                success: true, 
                data: {
                    totalOrders,
                    totalRevenue,
                    totalProfit,
                    avgOrderValue,
                    chartData,
                    categoryData,
                    topProducts
                }
            };

        } catch (error) {
            console.warn("❌ Advanced stats API failed, trying fallback...", error.message);
            
            // ============================================================
            // 2. Logic Fallback - Lấy từ /orders/admin/all (Giữ nguyên logic cũ của bạn)
            // ============================================================
            try {
                console.log('📡 Calling fallback /orders/admin/all');
                const resOrder = await api.get('/orders/admin/all');
                let orders = Array.isArray(resOrder.data?.orders) ? resOrder.data.orders : [];
                
                // Lọc theo thời gian (giản lược logic fallback để code gọn hơn, nhưng vẫn đủ chạy)
                const now = new Date();
                let startDate = new Date(now.getFullYear(), 0, 1); // Mặc định đầu năm
                
                if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                else if (period === 'quarter') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
                
                // Lọc orders
                const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
                
                // Tính toán sơ bộ
                const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
                
                return { 
                    success: false, // Đánh dấu là fallback thành công (nhưng không phải từ main API)
                    message: "Dùng dữ liệu fallback (Backend advanced API lỗi)",
                    data: {
                        totalOrders: filteredOrders.length,
                        totalRevenue: totalRevenue,
                        totalProfit: totalRevenue * 0.3, // Giả định 30%
                        avgOrderValue: filteredOrders.length ? totalRevenue / filteredOrders.length : 0,
                        chartData: [],
                        categoryData: [],
                        topProducts: []
                    },
                    isFallback: true
                };

            } catch (fallbackError) {
                console.error('❌ Fallback error:', fallbackError);
                return { 
                    success: false, 
                    data: {
                        totalOrders: 0,
                        totalRevenue: 0,
                        totalProfit: 0,
                        avgOrderValue: 0,
                        chartData: [],
                        categoryData: [],
                        topProducts: []
                    },
                    message: "Không thể tải dữ liệu thống kê." 
                };
            }
        }
    }
};