// backend/controllers/dashboardController.js
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

const PROFIT_RATE = Number(process.env.DASHBOARD_PROFIT_RATE || 0.15); // 15%

// ---- Period helpers: nhận cả year/yearly, quarter/quarterly, month/monthly, week/weekly ----
function normalizeParams(query) {
  const raw = (query.period || query.bucket || 'year').toLowerCase();
  const map = { year:'year', yearly:'year', quarter:'quarter', quarterly:'quarter', month:'month', monthly:'month', week:'week', weekly:'week', custom:'custom' };
  const period = map[raw] || 'year';

  const startDate = query.startDate || query.from || '';
  const endDate   = query.endDate   || query.to   || '';

  const now = new Date();
  const y = now.getFullYear();

  // Nếu có custom range → group theo ngày
  if (period === 'custom' && startDate && endDate) {
    const fromDate = new Date(startDate);
    const toDate   = new Date(new Date(endDate).setHours(23,59,59,999));
    const groupKey = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
    return { period, fromDate, toDate, groupKey };
  }

  let fromDate, toDate, groupKey;
  switch (period) {
    case 'quarter': {
      fromDate = new Date(Date.UTC(y, 0, 1, 0,0,0,0));
      toDate   = new Date(Date.UTC(y,11,31,23,59,59,999));
      groupKey = {
        $concat: [
          { $dateToString: { format: '%Y', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
          '-Q',
          { $toString: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } }
        ]
      };
      break;
    }
    case 'month': {
      // 12 tháng gần nhất
      const first = new Date(y, now.getMonth() - 11, 1);
      fromDate = new Date(Date.UTC(first.getFullYear(), first.getMonth(), 1, 0,0,0,0));
      toDate   = new Date(Date.UTC(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999));
      groupKey = { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
      break;
    }
    case 'week': {
      // 12 tuần gần nhất
      const d = new Date();
      d.setDate(d.getDate() - (7 * 11));
      fromDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0));
      toDate   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999));
      groupKey = {
        $concat: [
          { $toString: { $isoWeekYear: '$createdAt' } }, '-W',
          { $cond: [
            { $lt: [{ $isoWeek: '$createdAt' }, 10] },
            { $concat: ['0', { $toString: { $isoWeek: '$createdAt' } }] },
            { $toString: { $isoWeek: '$createdAt' } }
          ]}
        ]
      };
      break;
    }
    case 'year':
    default: {
      fromDate = new Date(Date.UTC(y, 0, 1, 0,0,0,0));
      toDate   = new Date(Date.UTC(y,11,31,23,59,59,999));
      groupKey = { $dateToString: { format: '%Y', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } };
      break;
    }
  }
  return { period, fromDate, toDate, groupKey };
}

const N = v => Number.isFinite(Number(v)) ? Number(v) : 0;

// ==== Simple stats (giữ tương thích nếu FE đang dùng) ====
exports.getSimpleStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const revAgg = await Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }]);
    const totalRevenue = revAgg.length ? revAgg[0].totalRevenue : 0;
    const bestSellingProducts = await Product.find({ isBestSeller: true }).limit(5);
    res.json({ success:true, stats: { totalUsers, totalOrders, totalRevenue, bestSellingProducts } });
  } catch (e) {
    res.status(500).json({ success:false, message:'Lỗi server', error:e.message });
  }
};

// ==== Advanced (đúng RUBIK) ====
// GET /api/admin/stats/advanced?period=year|quarter|month|week|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=Delivered,Confirmed
// MẶC ĐỊNH: period=year, status=Delivered (đúng nghĩa "đơn hàng bán")
exports.getAdvancedStats = async (req, res) => {
  try {
    const { period, fromDate, toDate, groupKey } = normalizeParams(req.query);

    // Default status = Delivered (đúng “số đơn hàng bán”)
    let statusIn = ['Delivered'];
    if (req.query.status) {
      const parts = String(req.query.status).split(',').map(s=>s.trim()).filter(Boolean);
      if (parts.length) statusIn = parts;
    }

    const [agg] = await Order.aggregate([
      { $match: { createdAt: { $gte: fromDate, $lte: toDate }, status: { $in: statusIn } } },
      {
        $facet: {
          kpi: [
            { $group: {
              _id: null,
              orders:  { $sum: 1 }, // chỉ đơn "bán" theo status filter
              revenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
            } }
          ],
          revenueByBucket: [
            { $group: { _id: groupKey, revenue: { $sum: { $ifNull: ['$totalPrice', 0] } } } },
            { $project: { _id: 0, label: '$_id', revenue: 1 } },
            { $sort: { label: 1 } }
          ],
          ordersQtyByBucket: [
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
            { $group: {
              _id: { k: groupKey, orderId: '$orderId' },
              qty: { $sum: { $ifNull: ['$items.quantity', 0] } }
            } },
            { $group: {
              _id: '$_id.k',
              ordersSet: { $addToSet: '$_id.orderId' },
              qty: { $sum: '$qty' }
            } },
            { $project: { _id: 0, label: '$_id', orders: { $size: '$ordersSet' }, qty: 1 } },
            { $sort: { label: 1 } }
          ],
          categoryShare: [
            { $unwind: '$items' },
            { $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'prod'
            } },
            { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
            { $group: {
              _id: { $ifNull: ['$prod.category.categoryName', 'Unknown'] },
              qty: { $sum: { $ifNull: ['$items.quantity', 0] } },
              revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }] } }
            } },
            { $project: { _id: 0, name: '$_id', qty: 1, revenue: 1 } },
            { $sort: { qty: -1 } }
          ],
          topProducts: [
            { $unwind: '$items' },
            { $group: {
              _id: { name: { $ifNull: ['$items.name', '$items.productId'] } },
              qty: { $sum: { $ifNull: ['$items.quantity', 0] } },
              revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 0] }] } }
            } },
            { $project: { _id: 0, name: '$_id.name', qty: 1, revenue: 1 } },
            { $sort: { qty: -1, revenue: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const kpi = agg?.kpi?.[0] || { orders: 0, revenue: 0 };
    const revenueProfit = (agg?.revenueByBucket || []).map(r => ({
      label: r.label,
      revenue: N(r.revenue),
      profit: Math.round(N(r.revenue) * PROFIT_RATE)
    }));

    const ordersQty     = agg?.ordersQtyByBucket || [];
    const categoryShare = (agg?.categoryShare || []).map(r => ({ name: r.name, value: N(r.qty) }));
    const topProducts   = agg?.topProducts || [];

    res.json({
      range: { period, from: fromDate.toISOString(), to: toDate.toISOString(), status: statusIn },
      kpis: {
        orders: N(kpi.orders),
        revenue: N(kpi.revenue),
        profit: Math.round(N(kpi.revenue) * PROFIT_RATE)
      },
      series: { revenueProfit, ordersQty, categoryShare, topProducts }
    });
  } catch (e) {
    console.error('[getAdvancedStats] error:', e);
    res.status(500).json({ success:false, message:'Lỗi server', error:e.message });
  }
};

