// src/pages/Admin/DashboardAdvanced.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { DashboardController } from "../controllers/DashboardController";
import Calendar from "../components/common/Calendar";

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtNumber = (n) => new Intl.NumberFormat('vi-VN').format(n);

const FILTERS = [
  { id: 'year', label: 'Năm nay' },
  { id: 'quarter', label: 'Quý này' },
  { id: 'month', label: 'Tháng này' },
  { id: 'week', label: 'Tuần này' },
  { id: 'custom', label: 'Tùy chọn' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function DashboardAdvanced() {
  const [period, setPeriod] = useState('year');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  // Mặc định lấy TẤT CẢ đơn hàng (không lọc status)
  const [status, setStatus] = useState('Delivered,Pending,Processing,Shipped,Confirmed,Cancelled');

  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalOrders: 0, 
    totalProfit: 0,
    avgOrderValue: 0, 
    chartData: [],
    categoryData: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const options = { period, status };
      
      if (period === 'custom') {
        if (!customRange.start || !customRange.end) { setLoading(false); return; }
        options.from = customRange.start;
        options.to = customRange.end;
      }

      const res = await DashboardController.getStats(options);

      if (res?.success && res?.data) {
        // Đảm bảo tất cả field tồn tại với default value
        console.log('📊 Stats received:', {
          categoryData: res.data.categoryData,
          topProducts: res.data.topProducts,
          isFallback: res.isFallback
        });
        setStats({
          totalRevenue: Number(res.data.totalRevenue) || 0,
          totalOrders: Number(res.data.totalOrders) || 0,
          totalProfit: Number(res.data.totalProfit) || 0,
          avgOrderValue: Number(res.data.avgOrderValue) || 0,
          chartData: Array.isArray(res.data.chartData) ? res.data.chartData : [],
          categoryData: Array.isArray(res.data.categoryData) ? res.data.categoryData : [],
          topProducts: Array.isArray(res.data.topProducts) ? res.data.topProducts : []
        });
      } else {
        // Fallback: set default values
        console.warn('⚠️ No data received:', res);
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          totalProfit: 0,
          avgOrderValue: 0,
          chartData: [],
          categoryData: [],
          topProducts: []
        });
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [period, status, customRange]);

  // --- 3. GỌI LẠI FETCHSTATS KHI PERIOD HOẶC STATUS THAY ĐỔI ---
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, [period, status]);

  const handleCustomFilter = () => {
    if (period === 'custom' && customRange.start && customRange.end) fetchStats();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Advanced Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Dữ liệu: <span className="font-semibold text-blue-600">{FILTERS.find(f => f.id === period)?.label}</span>
            {status && <span className="ml-2 font-semibold text-orange-600 hidden sm:inline">({status})</span>}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* --- 4. DROPDOWN CHỌN TRẠNG THÁI --- */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
             <span className="text-sm font-semibold text-gray-600">Trạng thái:</span>
             <select 
               value={status} 
               onChange={(e) => setStatus(e.target.value)}
               className="border rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500 shadow-sm w-full sm:w-auto"
             >
               <option value="Delivered,Pending,Processing,Shipped,Confirmed,Cancelled">Tất cả đơn hàng</option>
               <option value="Delivered">Đã giao hàng (Đơn bán)</option>
               <option value="Confirmed">Đã xác nhận</option>
               <option value="Shipping">Đang giao</option>
               <option value="Pending">Chờ xử lý</option>
               <option value="Cancelled">Đã hủy</option>
             </select>
          </div>

          <div className="bg-white p-1 rounded-lg border shadow-sm flex flex-wrap gap-1">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setPeriod(f.id)}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex-1 sm:flex-none ${
                  period === f.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white p-2 rounded border shadow-sm animate-fade-in">
              <div className="flex-1 min-w-0">
                <Calendar
                  value={customRange.start}
                  onChange={(val) => setCustomRange({...customRange, start: val ? val.split('T')[0] : ""})}
                  placeholder="Từ ngày..."
                />
              </div>
              <span className="self-center hidden sm:block">-</span>
              <div className="flex-1 min-w-0">
                <Calendar
                  value={customRange.end}
                  onChange={(val) => setCustomRange({...customRange, end: val ? val.split('T')[0] : ""})}
                  placeholder="Đến ngày..."
                />
              </div>
              <button onClick={fetchStats} className="bg-blue-600 text-white px-4 py-2 text-sm rounded w-full sm:w-auto">Lọc</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Số đơn hàng</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">{fmtNumber(stats.totalOrders)}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Doanh thu</p>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-1 sm:mt-2 truncate">{fmtVND(stats.totalRevenue)}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Lợi nhuận</p>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-1 sm:mt-2 truncate">{fmtVND(stats.totalProfit)}</h2>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">TB / Đơn</p>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-1 sm:mt-2 truncate">{fmtVND(stats.avgOrderValue)}</h2>
        </div>
      </div>

      {/* Empty State - Nếu không có dữ liệu */}
      {stats.totalOrders === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8 text-center">
          <p className="text-blue-900 font-semibold text-base sm:text-lg">📊 Không có dữ liệu</p>
          <p className="text-blue-700 text-xs sm:text-sm mt-2">
            Không tìm thấy đơn hàng {status === 'Delivered' ? 'đã giao' : status.toLowerCase()} trong khoảng thời gian này.
          </p>
          <p className="text-blue-600 text-xs mt-3">
            💡 Gợi ý: Thử thay đổi khoảng thời gian hoặc trạng thái đơn hàng
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Doanh thu */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">💰 Biểu đồ Doanh thu</h3>
          <div className="h-60 sm:h-72 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(val)=> val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} />
                <Tooltip formatter={(value) => fmtVND(value)} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}} />
                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}} />
                <Line type="monotone" dataKey="DoanhThu" name="Doanh thu" stroke="#3b82f6" strokeWidth={2} dot={{r:3, strokeWidth:2, fill:'#fff'}} activeDot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lợi nhuận */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">📈 Biểu đồ Lợi nhuận</h3>
          <div className="h-60 sm:h-72 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(val)=> val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} />
                <Tooltip formatter={(value) => fmtVND(value)} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}} />
                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}} />
                <Line type="monotone" dataKey="LoiNhuan" name="Lợi nhuận" stroke="#10b981" strokeWidth={2} dot={{r:3, strokeWidth:2, fill:'#fff'}} activeDot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Số lượng đơn hàng */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">📊 Số lượng đơn hàng</h3>
          <div className="h-60 sm:h-72 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}} />
                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}} />
                <Bar dataKey="DonHang" name="Số đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Số lượng sản phẩm bán */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">🛍️ Số lượng sản phẩm bán</h3>
          <div className="h-60 sm:h-72 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}} />
                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px'}} />
                <Bar dataKey="SoLuong" name="Số lượng SP" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Phân tích loại sản phẩm bán */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">📂 Loại sản phẩm bán (theo danh mục)</h3>
          {stats.categoryData && stats.categoryData.length > 0 ? (
            <div className="h-60 sm:h-72 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" labelLine={false}
                    label={({ name, value }) => `${name}: ${fmtNumber(value)}`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmtNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 sm:h-72 md:h-80 flex items-center justify-center text-gray-500 text-sm">Không có dữ liệu</div>
          )}
        </div>

        {/* Top sản phẩm bán */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 md:mb-6 text-gray-700 text-sm md:text-base">🏆 Top 10 sản phẩm bán chạy</h3>
          <div className="space-y-2 sm:space-y-3 max-h-72 md:max-h-96 overflow-y-auto">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-600 w-5 sm:w-6 text-sm">{index + 1}</span>
                      <span className="font-medium text-gray-800 truncate text-xs sm:text-sm">{product.name}</span>
                    </div>
                    <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 ml-5 sm:ml-8">
                      <span>SL: {fmtNumber(product.qty)}</span>
                      <span className="hidden sm:inline">DT: {fmtVND(product.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8 text-sm">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}