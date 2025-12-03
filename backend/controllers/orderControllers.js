// backend/controllers/orderControllers.js
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Comment = require('../models/commentModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('express-async-handler');

// --- HELPERS ---
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }

// --- 1. TẠO ĐƠN HÀNG ---
exports.createOrder = async (req, res) => {
  const ENV_FORCE_NO_TXN = String(process.env.USE_TXN || '').toLowerCase() === 'false';

  // Hàm nội bộ để chạy logic tạo đơn (có hoặc không transaction)
  async function runCreate(useTxn) {
    let session = null;
    if (useTxn) {
      session = await mongoose.startSession();
      session.startTransaction();
    }
    try {
      // 1. Lấy dữ liệu từ body
      const {
        guestInfo, items = [], shippingAddress, paymentMethod,
        shippingPrice = 0, tax = 0, discount = {}, pointsToRedeem, pointsToUse
      } = req.body;

      if (!Array.isArray(items) || items.length === 0) throw new Error('Giỏ hàng trống.');

      // 2. LOGIC TÀI KHOẢN (USER vs GUEST)
      let accountId = null;
      let isNewAccount = false;
      let autoPassword = "";

      // Nếu người dùng ĐANG đăng nhập (có token hợp lệ)
      if (req.user && (req.user._id || req.user.id)) {
        accountId = req.user._id || req.user.id;
        console.log('✅ User logged in, accountId:', accountId);
      } 
      // Nếu là Guest (Không login)
      else {
         const guestEmail = guestInfo?.email || shippingAddress?.email;
         const guestName = guestInfo?.name || shippingAddress?.recipientName || shippingAddress?.fullName || "Guest";

         if (guestEmail) {
            console.log('🔍 Guest checkout with email:', guestEmail);
            // Check xem email đã tồn tại trong DB chưa
            let user = await User.findOne({ email: guestEmail });
            if (user) {
                // Email đã có -> Gán đơn cho user cũ
                accountId = user._id;
                console.log('✅ Found existing user, accountId:', accountId);
            } else {
                // Email chưa có -> TỰ ĐỘNG TẠO TÀI KHOẢN
                autoPassword = Math.random().toString(36).slice(-8) + "Aa1@";
                const newUser = await User.create([{
                    name: guestName,
                    email: guestEmail,
                    password: autoPassword,
                    role: 'user'
                }], { session: useTxn ? session : undefined });
                
                user = newUser[0];
                accountId = user._id;
                isNewAccount = true;
                console.log('✅ Created new user, accountId:', accountId);
            }
         }
      }

      // 3. Xử lý Items & Tồn kho
      let itemsPrice = 0;
      const orderItems = [];

      for (const item of items) {
          const product = await Product.findById(item.productId).session(session);
          if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);
          
          // Chỉ kiểm tra số lượng, KHÔNG trừ stock ngay (sẽ trừ khi chuyển sang Shipping)
          if (product.countInStock < item.quantity) {
             throw new Error(`Sản phẩm ${product.name} không đủ hàng (còn ${product.countInStock})`);
          }

          orderItems.push({
             productId: product._id,
             variantId: item.variantId || new mongoose.Types.ObjectId().toString(),
             name: product.name || item.name,
             price: item.price,
             quantity: item.quantity,
             image: product.images?.[0] || '/img/placeholder.png', // Thêm ảnh sản phẩm
             variantName: item.variantName || '' // Thêm tên variant
          });
          itemsPrice += item.price * item.quantity;
      }

      // 3.5. XỬ LÝ ĐIỂM THƯỞNG
      let pointsUsed = 0;
      let pointsEarned = 0;
      
      // A. Trừ điểm nếu user dùng điểm thanh toán (pointsToUse từ FE)
      const pointsToRedeemFinal = pointsToRedeem || pointsToUse || 0; // Support cả 2 field
      if (accountId && pointsToRedeemFinal && Number(pointsToRedeemFinal) > 0) {
        const user = await User.findById(accountId).session(session);
        if (user) {
          const requestedPoints = Number(pointsToRedeemFinal);
          const availablePoints = user.loyaltyPoints || 0;
          
          // Chỉ trừ điểm nếu user có đủ
          if (requestedPoints <= availablePoints) {
            user.loyaltyPoints -= requestedPoints;
            await user.save({ session });
            pointsUsed = requestedPoints;
          } else {
            console.warn(`⚠️ User ${accountId} không đủ điểm (có ${availablePoints}, yêu cầu ${requestedPoints})`);
          }
        }
      }

      // 4. Tính điểm thưởng TRƯỚC khi tạo order
      // Tính điểm thưởng: 10% tổng tiền đơn hàng (1 điểm = 1.000đ)
      const discountAmount = discount?.amount || 0;
      const totalPrice = itemsPrice + tax + shippingPrice - discountAmount;
      
      if (accountId) {
        pointsEarned = Math.floor(totalPrice * 0.1 / 1000);
        console.log(`🎁 Tính ${pointsEarned} điểm thưởng (10% của ${totalPrice.toLocaleString()}đ)`);
      }

      // 5. Tạo Order với đầy đủ thông tin loyalty points
      const order = new Order({
        orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subTotal: itemsPrice,
        tax: tax,
        shippingPrice,
        discount: {
          code: discount?.code || '',
          percent: discount?.percent || 0,
          amount: discountAmount
        },
        totalPrice: totalPrice,
        loyaltyPoints: {
          pointsUsed: pointsUsed,
          pointsEarned: pointsEarned
        },
        accountId: accountId || null,
        guestInfo: guestInfo,
        isPaid: paymentMethod === 'PayPal',
        status: 'Pending'
      });

      console.log('📦 Creating order with accountId:', accountId ? accountId : null);
      const createdOrder = await order.save({ session });

      // XÓA GIỎ HÀNG SAU KHI ĐẶT HÀNG THÀNH CÔNG
      if (accountId) {
        const Cart = require('../models/cartModel');
        await Cart.deleteMany({ accountId: accountId }, { session });
        console.log('🗑️ Đã xóa giỏ hàng của user:', accountId);
      }

      // 5. Gửi email nếu tạo tài khoản mới
      if (isNewAccount && autoPassword) {
         try {
             await sendEmail({
                 email: guestInfo.email,
                 subject: 'Thông báo đơn hàng & Tài khoản mới',
                 message: `Cảm ơn bạn đã đặt hàng!\n\nMã đơn hàng: ${createdOrder._id}\n\nHệ thống đã tạo tài khoản cho bạn:\nTài khoản: ${guestInfo.email}\nMật khẩu: ${autoPassword}\n\nVui lòng đăng nhập để theo dõi đơn hàng.`
             });
         } catch (err) {
             console.log("Lỗi gửi email password (không ảnh hưởng đơn hàng):", err.message);
         }
      }

      // 6. TẠO THÔNG BÁO CHO USER
      console.log('📋 Attempting to create notification, accountId:', accountId);
      if (accountId) {
        try {
          const notif = await Notification.createOrderNotification(
            accountId,
            createdOrder._id,
            'Đặt hàng thành công',
            `Đơn hàng ${createdOrder.orderId || createdOrder._id} của bạn đã được tiếp nhận. Tổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`,
            createdOrder.orderId
          );
          console.log('🔔 Đã tạo thông báo đơn hàng cho user:', accountId, 'notifId:', notif._id);

          // GỬI EMAIL XÁC NHẬN ĐƠN HÀNG
          try {
            const user = await User.findById(accountId);
            if (user && user.email) {
              const itemsList = items.map(item => 
                `- ${item.name || 'Sản phẩm'} x${item.quantity}: ${(item.price * item.quantity).toLocaleString('vi-VN')}đ`
              ).join('\n');

              const emailMessage = `
Xin chào ${user.name || 'Quý khách'},

Cảm ơn bạn đã đặt hàng tại PhoneWorld! Đơn hàng của bạn đã được tiếp nhận.

📦 MÃ ĐƠN HÀNG: ${createdOrder.orderId || createdOrder._id}

📋 CHI TIẾT ĐƠN HÀNG:
${itemsList}

💰 Tạm tính: ${subTotal.toLocaleString('vi-VN')}đ
🚚 Phí vận chuyển: ${shippingPrice.toLocaleString('vi-VN')}đ
💵 TỔNG CỘNG: ${totalPrice.toLocaleString('vi-VN')}đ

📍 ĐỊA CHỈ GIAO HÀNG:
${shippingAddress.recipientName}
${shippingAddress.phoneNumber}
${shippingAddress.street || ''}, ${shippingAddress.ward || ''}, ${shippingAddress.district || ''}, ${shippingAddress.city}

Bạn có thể theo dõi đơn hàng tại: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${createdOrder._id}

Cảm ơn bạn đã tin tưởng PhoneWorld!
---
PhoneWorld Support Team
              `.trim();

              await sendEmail({
                email: user.email,
                subject: `[PhoneWorld] Xác nhận đơn hàng #${createdOrder.orderId || createdOrder._id}`,
                message: emailMessage
              });
              console.log('📧 Đã gửi email xác nhận đơn hàng cho:', user.email);
            }
          } catch (emailErr) {
            console.log("⚠️ Lỗi gửi email xác nhận đơn hàng:", emailErr.message);
          }
        } catch (err) {
          console.log("❌ Lỗi tạo notification:", err.message, err.stack);
        }
      } else {
        console.log('⚠️ Không tạo notification vì accountId là:', accountId);
      }

      if (useTxn) await session.commitTransaction();
      
      // Format response để FE dễ xử lý
      return {
        success: true,
        order: {
          _id: createdOrder._id,
          orderId: createdOrder.orderId,
          totalPrice: createdOrder.totalPrice,
          status: createdOrder.status
        },
        loyalty: {
          pointsUsed: pointsUsed,
          pointsEarned: pointsEarned,
          message: pointsEarned > 0 ? `Đơn hàng này sẽ tích lũy ${pointsEarned} điểm sau khi thanh toán và giao hàng thành công` : ''
        }
      };

    } catch (error) {
      if (useTxn && session) await session.abortTransaction();
      throw error;
    } finally {
      if (useTxn && session) session.endSession();
    }
  }

  // --- Chạy hàm runCreate ---
  try {
    // Thử tạo đơn với transaction
    const result = await runCreate(true);
    return res.status(201).json(result);
  } catch (error) {
    console.error('❌ [CREATE ORDER ERROR]:', error.message);
    console.error('❌ [STACK]:', error.stack);

    // Nếu lỗi liên quan đến transaction (Mongo standalone) thì thử lại KHÔNG dùng transaction
    if (error.message && error.message.includes("Transaction")) {
      try {
        console.warn("➡ Fallback tạo đơn KHÔNG dùng transaction...");
        const result = await runCreate(false);   // useTxn = false -> không startSession()
        return res.status(201).json(result);
      } catch (retryError) {
        console.error('❌ [RETRY ERROR]:', retryError.message);
        return res.status(500).json({ success: false, message: retryError.message });
      }
    } else {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

// --- 1b. TẠO ĐƠN HÀNG VỚI UPLOAD HÌNH ẢNH XÁC NHẬN THANH TOÁN ---
exports.createOrderWithPaymentImage = async (req, res) => {
  try {
    // Parse orderData from form
    if (!req.body.orderData) {
      return res.status(400).json({ 
        success: false, 
        message: 'orderData không được tìm thấy trong request' 
      });
    }
    
    const orderData = JSON.parse(req.body.orderData);
    const paymentImageFile = req.file;
    
    if (!paymentImageFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng upload hình ảnh xác nhận thanh toán' 
      });
    }

    // Get user info
    let accountId = null;
    if (req.user && (req.user._id || req.user.id)) {
      accountId = req.user._id || req.user.id;
    }

    const { items = [], shippingAddress, paymentMethod, shippingPrice = 0, tax = 0, note = '' } = orderData;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Giỏ hàng trống.');
    }

    // Calculate totals
    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalPrice = subTotal + shippingPrice + tax;

    // Create order payload
    const orderPayload = {
      orderId: 'PW' + Date.now() + Math.floor(Math.random() * 1000),
      accountId: accountId,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        name: item.name || 'Sản phẩm',
        variantName: item.variantName,
        image: item.image
      })),
      shippingAddress: {
        recipientName: shippingAddress.recipientName,
        phoneNumber: shippingAddress.phoneNumber,
        street: shippingAddress.street || '',
        ward: shippingAddress.ward || '',
        district: shippingAddress.district || '',
        city: shippingAddress.city
      },
      paymentMethod,
      paymentStatus: 'pending',
      paymentProof: {
        imageUrl: `/images/payment-confirmations/${paymentImageFile.filename}`, // URL để truy cập file
        uploadedAt: new Date()
      },
      paymentConfirmation: {
        filename: paymentImageFile.filename,
        originalName: paymentImageFile.originalname,
        path: paymentImageFile.path,
        size: paymentImageFile.size,
        mimetype: paymentImageFile.mimetype
      },
      subTotal: subTotal,
      shippingPrice: shippingPrice,
      tax: tax,
      totalPrice: totalPrice,
      status: 'Pending',
      note: note
    };

    // Save order directly without transaction
    const Order = require('../models/orderModel');
    const createdOrder = new Order(orderPayload);
    await createdOrder.save();

    console.log('✅ Order with payment image created successfully:', createdOrder.orderId);

    // Create notification for customer and admin
    console.log('🔔 NOTIFICATION CREATION - Starting for accountId:', accountId);
    if (accountId) {
      try {
        console.log('🔔 NOTIFICATION CREATION - AccountId exists, proceeding...');
        const User = require('../models/userModel');
        const Notification = require('../models/notificationModel');
        
        // Get user info for notification
        const user = await User.findById(accountId);
        console.log('🔔 NOTIFICATION CREATION - User found:', user?.email);
        if (user) {
          // Create notification for customer
          console.log('🔔 NOTIFICATION CREATION - Creating customer notification...');
          await Notification.create({
            userId: accountId,
            type: 'order',
            title: 'Đơn hàng đã được tạo',
            message: `Đơn hàng #${createdOrder.orderId} đã được tạo thành công`,
            data: { orderId: createdOrder._id, orderNumber: createdOrder.orderId },
            actionUrl: `/orders/${createdOrder.orderId}`
          });
          console.log('✅ Customer notification created successfully');
          
          // Create notification for all admins
          console.log('🔔 NOTIFICATION CREATION - Looking for admin users...');
          const admins = await User.find({ role: 'admin' });
          console.log('📋 Found admin users:', admins.length);
          for (const admin of admins) {
            console.log('📋 Creating notification for admin:', admin.email);
            await Notification.create({
              userId: admin._id,
              type: 'order',
              title: 'Đơn hàng mới cần xử lý',
              message: `Đơn hàng #${createdOrder.orderId} từ ${user.name || user.email} - ${createdOrder.totalPrice.toLocaleString('vi-VN')}đ`,
              data: { orderId: createdOrder._id, orderNumber: createdOrder.orderId, customerId: accountId },
              actionUrl: `/admin/orders/${createdOrder.orderId}`
            });
            console.log('✅ Admin notification created successfully for:', admin.email);
          }
          
          // Emit socket event for real-time notification
          console.log('🔌 SOCKET EVENT - Preparing to emit events...');
          const io = req.app.get('socketio');
          console.log('🔌 Socket.io instance:', io ? 'AVAILABLE' : 'NOT_AVAILABLE');
          
          if (io) {
            console.log('🔌 SOCKET EVENT - Emitting newOrder and adminNotification...');
            const orderData = {
              orderId: createdOrder.orderId,
              customerName: user.name || user.email,
              customerEmail: user.email,
              totalPrice: createdOrder.totalPrice,
              paymentMethod: createdOrder.paymentMethod,
              status: createdOrder.status,
              timestamp: new Date().toISOString()
            };
            
            console.log('📡 Emitting newOrder event with data:', orderData);
            io.emit('newOrder', orderData);
            io.emit('adminNotification', {
              type: 'order',
              title: 'Đơn hàng mới',
              message: `Đơn hàng #${createdOrder.orderId} từ ${user.name || user.email}`,
              data: orderData
            });
            console.log('✅ newOrder and adminNotification events emitted');
          } else {
            console.error('❌ Socket.io not available - notification will not be sent');
          }
          
          console.log('📢 Notifications sent for order:', createdOrder.orderId);
        }
      } catch (notifError) {
        console.error('❌ Error sending notifications:', notifError.message);
      }
    }

    return res.status(201).json({
      success: true,
      order: {
        _id: createdOrder._id,
        orderId: createdOrder.orderId,
        totalPrice: createdOrder.totalPrice,
        status: createdOrder.status,
        paymentStatus: createdOrder.paymentStatus
      }
    });

  } catch (error) {
    console.error('❌ [CREATE ORDER WITH IMAGE ERROR]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. LẤY DANH SÁCH ĐƠN HÀNG ADMIN ---
exports.listOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    let { date, start, end, status, from, to } = req.query;
    
    if (!start && from) start = from;
    if (!end && to) end = to;
    
    const now = new Date();
    let filterFrom = null, filterTo = null;

    const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

    if (start && end) {
      filterFrom = startOfDay(new Date(start));
      filterTo = endOfDay(new Date(end));
    } else {
      switch (date) {
        case 'today': filterFrom = startOfDay(now); filterTo = endOfDay(now); break;
        case 'yesterday': const y = new Date(now); y.setDate(y.getDate() - 1); filterFrom = startOfDay(y); filterTo = endOfDay(y); break;
        case 'week': const day = now.getDay() || 7; filterFrom = startOfDay(now); filterFrom.setDate(now.getDate() - day + 1); filterTo = endOfDay(now); break;
        case 'month': filterFrom = new Date(now.getFullYear(), now.getMonth(), 1); filterTo = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)); break;
        default: break;
      }
    }

    let filterQuery = {};
    if (filterFrom && filterTo) filterQuery.createdAt = { $gte: filterFrom, $lte: filterTo };
    if (status && status !== 'ALL' && status !== '') filterQuery.status = status;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filterQuery)
        .populate('accountId', 'name email phone userName') // Populate thông tin user
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filterQuery)
    ]);

    const formattedOrders = orders.map(o => {
        let customerName = "Khách vãng lai";
        let customerEmail = "N/A";
        
        // Ưu tiên lấy từ accountId (user đã đăng nhập)
        if (o.accountId && typeof o.accountId === 'object') {
            customerName = o.accountId.name || o.accountId.userName || "Thành viên";
            customerEmail = o.accountId.email || "";
        } 
        // Fallback: lấy từ guestInfo
        else if (o.guestInfo && o.guestInfo.name) {
            customerName = o.guestInfo.name;
            customerEmail = o.guestInfo.email || "";
        }
        return {
            _id: o._id,
            orderId: o.orderId,
            createdAt: o.createdAt,
            status: o.status,
            totalPrice: o.totalPrice,
            isPaid: o.isPaid,
            itemsCount: (o.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
            customerName, customerEmail, paymentMethod: o.paymentMethod
        };
    });

    return res.status(200).json({
      success: true,
      orders: formattedOrders, 
      totalOrders: totalOrders, 
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
  }
};

// --- 3. LẤY ĐƠN HÀNG CỦA TÔI (USER) ---
exports.listMyOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);

    // Lấy ID user từ token
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập." });
    }

    // Chuẩn hóa: luôn có bản string
    const userId = String(rawUserId);

    // Match cả 2 trường hợp: accountId lưu dạng String hoặc ObjectId
    const match = {
      $or: [
        { accountId: userId },    // kiểu String (hiện tại)
        { accountId: rawUserId }, // phòng trường hợp dữ liệu cũ là ObjectId
      ],
    };

    const orders = await Order.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(match);
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.json({
      success: true,
      orders,
      currentPage: page,
      totalPages,
      totalOrders: total,
    });
  } catch (e) {
    console.error("listMyOrders error:", e);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: e.message,
    });
  }
};

// --- API MỚI: CHECK TRẠNG THÁI ĐƠN HÀNG (Không cần auth - dùng cho polling) ---
exports.checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    
    const order = await Order.findOne(query).select('orderId status isPaid paidAt totalPrice');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      totalPrice: order.totalPrice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- API TEST: MARK ORDER AS PAID (Dùng để test VNPay sandbox) ---
exports.markOrderAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    
    const order = await Order.findOneAndUpdate(
      query,
      { 
        isPaid: true, 
        paidAt: new Date(), 
        status: 'Confirmed' 
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Đơn hàng đã được xác nhận thanh toán',
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPLOAD ẢNH CHỨNG TỪ CHUYỂN KHOẢN (User) ---
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { imageUrl } = req.body; // URL ảnh đã upload lên Cloudinary
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh chứng từ' });
    }

    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    
    const order = await Order.findOneAndUpdate(
      query,
      { 
        'paymentProof.imageUrl': imageUrl,
        'paymentProof.uploadedAt': new Date()
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Upload ảnh chứng từ thành công. Admin sẽ xác nhận trong thời gian sớm nhất.',
      order 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN XÁC NHẬN THANH TOÁN ---
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user._id || req.user.id;
    
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    
    // Tìm đơn hàng trước để kiểm tra phương thức thanh toán
    const existingOrder = await Order.findOne(query);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    
    // Cập nhật thanh toán
    const updateData = {
      isPaid: true,
      paidAt: new Date(),
      status: 'Confirmed'
    };
    
    // Chỉ cập nhật paymentProof nếu là banking
    if (existingOrder.paymentMethod === 'banking') {
      updateData['paymentProof.verifiedBy'] = adminId;
      updateData['paymentProof.verifiedAt'] = new Date();
    }
    
    const order = await Order.findOneAndUpdate(query, updateData, { new: true });
    
    // Message tùy theo phương thức thanh toán
    const message = existingOrder.paymentMethod === 'cod' 
      ? 'Đã xác nhận nhận tiền COD thành công'
      : 'Đã xác nhận thanh toán chuyển khoản thành công';

    // Tạo thông báo cho user
    const Notification = require('../models/notificationModel');
    const notificationTitle = existingOrder.paymentMethod === 'cod'
      ? 'Đã xác nhận nhận tiền COD'
      : 'Đã xác nhận thanh toán';
    const notificationMessage = existingOrder.paymentMethod === 'cod'
      ? `Đơn hàng ${existingOrder.orderId} - Admin đã xác nhận nhận được tiền mặt. Đơn hàng sẽ được xử lý.`
      : `Đơn hàng ${existingOrder.orderId} - Thanh toán chuyển khoản đã được xác nhận. Đơn hàng sẽ được xử lý.`;
    
    try {
      await Notification.createOrderNotification(
        existingOrder.accountId,
        existingOrder._id,
        notificationTitle,
        notificationMessage,
        existingOrder.orderId
      );
    } catch (notifError) {
      console.error('Error creating payment confirmation notification:', notifError);
    }

    res.status(200).json({ 
      success: true, 
      message,
      order 
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. CHI TIẾT ĐƠN HÀNG (ĐÃ SỬA QUYỀN XEM) ---
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };
    
    const o = await Order.findOne(query)
      .populate('accountId', 'name email phone avatar userName')
      .populate('items.productId', 'name images price');
      
    if (!o) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    // --- CHECK QUYỀN (Logic mới linh hoạt hơn) ---
    console.log('🔍 Order access check:');
    console.log('  - Order ID:', orderId);
    console.log('  - Order accountId:', o.accountId);
    console.log('  - Current user:', req.user);
    
    const isUserAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
    console.log('  - Is admin:', isUserAdmin);
    
    // So sánh ID: ép kiểu về String để tránh lỗi Object !== String
    const currentUserId = req.user?._id ? String(req.user._id) : (req.user?.id ? String(req.user.id) : null);
    const orderOwnerId = o.accountId ? String(o.accountId) : null;
    console.log('  - Current user ID:', currentUserId);
    console.log('  - Order owner ID:', orderOwnerId);
    
    const isOwner = orderOwnerId && currentUserId && orderOwnerId === currentUserId;
    console.log('  - Is owner:', isOwner);
    
    // Backup: So sánh email (nếu ID bị lỗi hoặc mất)
    const isEmailMatch = req.user?.email && (o.guestInfo?.email === req.user.email);
    console.log('  - Email match:', isEmailMatch, '(user email:', req.user?.email, ', guest email:', o.guestInfo?.email, ')');
    
    // Cho phép xem nếu là guest order (không có accountId) hoặc là admin hoặc là owner
    const isGuestOrder = !o.accountId;
    console.log('  - Is guest order:', isGuestOrder);
    
    // TEMPORARY: Cho phép user xem đơn hàng trong vòng 24h sau khi tạo (dựa trên timing)
    const isRecentOrder = (new Date() - new Date(o.createdAt)) < 24 * 60 * 60 * 1000;
    console.log('  - Is recent order (within 24h):', isRecentOrder);
    
    const hasAccess = isUserAdmin || isOwner || isEmailMatch || isGuestOrder || isRecentOrder;
    console.log('  - Final access decision:', hasAccess);

    if (!hasAccess) {
      console.log('❌ Access denied for order:', orderId);
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn này.' });
    }

    console.log('✅ Access granted for order:', orderId);

    return res.json({ success: true, order: o });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

// --- 5. CẬP NHẬT TRẠNG THÁI ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, isPaid } = req.body;
    
    const query = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderId: orderId };

    // Tìm đơn hàng trước khi update
    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const oldStatus = order.status;

    // Nếu chuyển sang Shipping -> Trừ stock
    if (status === 'Shipping' && oldStatus !== 'Shipping') {
      console.log('📦 Chuyển sang Shipping -> Trừ stock');
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.countInStock < item.quantity) {
            return res.status(400).json({ 
              success: false, 
              message: `Sản phẩm ${product.name} không đủ hàng (còn ${product.countInStock}, cần ${item.quantity})` 
            });
          }
          product.countInStock -= item.quantity;
          product.sold = (product.sold || 0) + item.quantity;
          await product.save();
          console.log(`✅ Đã trừ ${item.quantity} của ${product.name}`);
        }
      }
    }

    // Nếu chuyển từ Shipping về Pending/Confirmed -> Hoàn lại stock
    if ((status === 'Pending' || status === 'Confirmed') && oldStatus === 'Shipping') {
      console.log('↩️ Quay lại Pending/Confirmed từ Shipping -> Hoàn stock');
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.countInStock += item.quantity;
          product.sold = Math.max((product.sold || 0) - item.quantity, 0);
          await product.save();
        }
      }
    }

    // CỘNG ĐIỂM THƯỞNG KHI ĐƠN HÀNG HOÀN THÀNH
    if (status === 'Delivered' && oldStatus !== 'Delivered' && order.accountId) {
      const pointsEarned = order.loyaltyPoints?.pointsEarned || 0;
      if (pointsEarned > 0) {
        const user = await User.findById(order.accountId);
        if (user) {
          user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
          await user.save();
          console.log(`🎁 Đã cộng ${pointsEarned} điểm cho user ${user.email}`);
        }
      }
    }

    // HOÀN ĐIỂM NẾU ĐƠN HÀNG BỊ HUỶ
    if (status === 'Cancelled' && oldStatus !== 'Cancelled' && order.accountId) {
      const pointsUsed = order.loyaltyPoints?.pointsUsed || 0;
      if (pointsUsed > 0) {
        const user = await User.findById(order.accountId);
        if (user) {
          user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsUsed;
          await user.save();
          console.log(`↩️ Đã hoàn ${pointsUsed} điểm cho user ${user.email} (đơn hủy)`);
        }
      }
    }

    const $set = {};
    if (typeof isPaid === 'boolean') $set.isPaid = isPaid;
    if (status) $set.status = status;
    const pushHistory = { statusHistory: { status: status || 'Updated', updatedAt: new Date() } };

    // Update và populate lại để trả về đầy đủ thông tin
    let updatedOrder = await Order.findOneAndUpdate(query, { $set, $push: pushHistory }, { new: true })
      .populate('accountId', 'name email phone avatar userName')
      .populate('items.productId', 'name images price');

    // Lấy accountId để gửi notification/email (có thể là ObjectId hoặc object)
    const accountIdForNotif = order.accountId?._id || order.accountId;

    // TẠO THÔNG BÁO KHI CẬP NHẬT TRẠNG THÁI
    if (status && accountIdForNotif && status !== oldStatus) {
      try {
        const statusMessages = {
          'Confirmed': 'Đơn hàng đã được xác nhận và đang được chuẩn bị.',
          'Shipping': 'Đơn hàng đang được vận chuyển đến bạn.',
          'Delivered': 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua hàng!',
          'Cancelled': 'Đơn hàng đã bị hủy. Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.'
        };
        const statusTitles = {
          'Confirmed': 'Đơn hàng đã xác nhận',
          'Shipping': 'Đơn hàng đang giao',
          'Delivered': 'Giao hàng thành công',
          'Cancelled': 'Đơn hàng đã hủy'
        };
        if (statusMessages[status]) {
          // Tạo notification trong app
          await Notification.createOrderNotification(
            accountIdForNotif,
            order._id,
            statusTitles[status],
            `${statusMessages[status]} (Mã: ${order.orderId || order._id})`,
            order.orderId
          );
          console.log(`🔔 Đã gửi thông báo cập nhật trạng thái ${status} cho user:`, accountIdForNotif);

          // GỬI EMAIL THÔNG BÁO
          try {
            const user = await User.findById(accountIdForNotif);
            if (user && user.email) {
              const emailSubject = `[PhoneWorld] ${statusTitles[status]} - Đơn hàng #${order.orderId || order._id}`;
              const emailMessage = `
Xin chào ${user.name || 'Quý khách'},

${statusMessages[status]}

📦 Mã đơn hàng: ${order.orderId || order._id}
💰 Tổng tiền: ${order.totalPrice?.toLocaleString('vi-VN')}đ
📍 Địa chỉ giao: ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.district || ''}, ${order.shippingAddress?.city || ''}

Bạn có thể xem chi tiết đơn hàng tại: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order._id}

Cảm ơn bạn đã mua hàng tại PhoneWorld!
---
PhoneWorld Support Team
              `.trim();

              await sendEmail({
                email: user.email,
                subject: emailSubject,
                message: emailMessage
              });
              console.log(`📧 Đã gửi email thông báo trạng thái ${status} cho: ${user.email}`);
            }
          } catch (emailErr) {
            console.log("⚠️ Lỗi gửi email (không ảnh hưởng đơn hàng):", emailErr.message);
          }
        }
      } catch (err) {
        console.log("Lỗi tạo notification cập nhật trạng thái:", err.message);
      }
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Lỗi server', error: e.message });
  }
};

// --- 6. THỐNG KÊ DASHBOARD (FULL LOGIC) ---
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'year', status } = req.query;
    let { from, to } = req.query; // Hỗ trợ custom date range

    const now = new Date();
    let fromDate, toDate, groupFormat;

    // 1. XỬ LÝ THỜI GIAN (Period)
    switch (period) {
      case 'week': // Tuần này
        const day = now.getDay() || 7; 
        fromDate = new Date(now); 
        fromDate.setHours(0, 0, 0, 0); 
        fromDate.setDate(now.getDate() - day + 1); // Thứ 2 đầu tuần
        toDate = new Date(now); 
        toDate.setHours(23, 59, 59, 999);
        groupFormat = "%Y-%m-%d"; // Group theo ngày
        break;

      case 'month': // Tháng này
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        groupFormat = "%Y-%m-%d"; // Group theo ngày
        break;

      case 'quarter': // Quý này
        const currQuarter = Math.floor(now.getMonth() / 3);
        fromDate = new Date(now.getFullYear(), currQuarter * 3, 1);
        toDate = new Date(now.getFullYear(), (currQuarter + 1) * 3, 0, 23, 59, 59);
        groupFormat = "%Y-%m"; // Group theo tháng
        break;

      case 'custom': // Tùy chọn
        if (from && to) {
            fromDate = new Date(from);
            toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            // Nếu khoảng cách > 60 ngày thì group theo tháng, ngược lại theo ngày
            const diffTime = Math.abs(toDate - fromDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            groupFormat = diffDays > 60 ? "%Y-%m" : "%Y-%m-%d";
        } else {
            // Fallback về năm nay nếu thiếu ngày
            fromDate = new Date(now.getFullYear(), 0, 1);
            toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            groupFormat = "%Y-%m";
        }
        break;

      case 'year': // Năm nay (Default)
      default:
        fromDate = new Date(now.getFullYear(), 0, 1);
        toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        groupFormat = "%Y-%m"; // Group theo tháng
        break;
    }

    console.log(`📊 Dashboard Stats: ${period} | ${fromDate.toISOString()} -> ${toDate.toISOString()}`);

    // 2. XÂY DỰNG BỘ LỌC (MATCH STAGE)
    const matchStage = {
        createdAt: { $gte: fromDate, $lte: toDate }
    };

    // Nếu có lọc theo status (VD: 'Delivered')
    if (status && status !== 'ALL') {
        matchStage.status = status;
    } else {
        // Mặc định: Không đếm đơn đã hủy vào doanh thu
        matchStage.status = { $ne: 'Cancelled' };
    }

    // 3. AGGREGATION PIPELINE (XỬ LÝ TOÀN BỘ TRONG 1 LỆNH DB)
    const [result] = await Order.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // A. KPIs Tổng quan
          kpis: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" },
                totalOrders: { $sum: 1 },
                // Giả định lợi nhuận 30% doanh thu (hoặc thay bằng field profit thật nếu có)
                totalProfit: { $sum: { $multiply: ["$totalPrice", 0.3] } } 
              }
            }
          ],

          // B. Biểu đồ Doanh thu & Lợi nhuận (Theo thời gian)
          revenueProfit: [
            {
              $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                revenue: { $sum: "$totalPrice" },
                profit: { $sum: { $multiply: ["$totalPrice", 0.3] } }
              }
            },
            { $sort: { _id: 1 } },
            { $project: { label: "$_id", revenue: 1, profit: 1, _id: 0 } }
          ],

          // C. Biểu đồ Số lượng đơn hàng (Theo thời gian)
          ordersQty: [
            { $unwind: "$items" },
            {
              $group: {
                _id: { 
                    time: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    orderId: "$_id" // Group theo order trước để đếm số đơn
                },
                qty: { $sum: "$items.quantity" } // Tổng số sản phẩm trong đơn đó
              }
            },
            {
              $group: {
                _id: "$_id.time",
                orders: { $sum: 1 }, // Số đơn hàng
                qty: { $sum: "$qty" } // Tổng sản phẩm bán ra
              }
            },
            { $sort: { _id: 1 } },
            { $project: { label: "$_id", orders: 1, qty: 1, _id: 0 } }
          ],

          // D. Tỷ lệ Danh mục (Pie Chart)
          categoryShare: [
            { $unwind: "$items" },
            // Cần lookup sang bảng Product để lấy Category Name nếu trong order items không lưu
            // (Nhưng ở hàm createOrder mới tôi chưa lưu category, nên tạm thời ta group theo tên SP hoặc ID)
            // Tốt nhất: Group theo tên biến thể hoặc tên SP để demo
            {
                $group: {
                    _id: "$items.name", 
                    value: { $sum: "$items.quantity" }
                }
            },
            { $sort: { value: -1 } },
            { $limit: 5 }, // Lấy top 5 danh mục/sp nhiều nhất
            { $project: { name: "$_id", value: 1, _id: 0 } }
          ],

          // E. Top Sản phẩm bán chạy
          topProducts: [
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    qty: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { qty: -1 } },
            { $limit: 10 },
            { $project: { name: 1, qty: 1, revenue: 1, _id: 0 } }
          ]
        }
      }
    ]);

    // 4. FORMAT DỮ LIỆU TRẢ VỀ CHO FRONTEND
    const stats = {
        kpis: {
            orders: result.kpis[0]?.totalOrders || 0,
            revenue: result.kpis[0]?.totalRevenue || 0,
            profit: result.kpis[0]?.totalProfit || 0
        },
        series: {
            revenueProfit: result.revenueProfit || [],
            ordersQty: result.ordersQty || [],
            categoryShare: result.categoryShare || [],
            topProducts: result.topProducts || []
        },
        range: { period, from: fromDate, to: toDate }
    };

    return res.json(stats);

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi thống kê", error: err.message });
  }
};

// --- HỦY ĐƠN HÀNG (User) ---
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    // Kiểm tra lý do hủy (bắt buộc)
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do hủy đơn hàng' });
    }

    // Tìm đơn hàng
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền sở hữu (dùng accountId thay vì userId)
    if (order.accountId && order.accountId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' });
    }

    // 🆕 Kiểm tra 24 giờ kể từ khi tạo đơn
    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn chỉ có thể hủy đơn hàng trong vòng 24 giờ kể từ khi đặt' 
      });
    }

    // Chỉ cho phép hủy nếu đơn hàng đang ở trạng thái Pending hoặc Confirmed
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể hủy đơn hàng đang ở trạng thái ${order.status}` 
      });
    }

    // Cập nhật trạng thái sang Cancelled
    const oldStatus = order.status;
    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    // Hoàn lại điểm thưởng nếu đã dùng
    if (order.loyaltyPoints && order.loyaltyPoints.pointsUsed > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { loyaltyPoints: order.loyaltyPoints.pointsUsed }
      });
      console.log(`💰 Hoàn lại ${order.loyaltyPoints.pointsUsed} điểm cho user ${userId}`);
    }

    // Hoàn lại số lượng sản phẩm vào kho (chỉ cần nếu đơn đã ở trạng thái Shipping)
    if (oldStatus === 'Shipping') {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.countInStock += item.quantity;
          product.sold = Math.max((product.sold || 0) - item.quantity, 0);
          await product.save();
        }
      }
    }

    // 🆕 Gửi email thông báo hủy đơn
    const user = await User.findById(userId);
    if (user && user.email) {
      try {
        const emailContent = `
          <h2 style="color: #d32f2f;">Đơn hàng của bạn đã bị hủy</h2>
          <p><strong>Mã đơn hàng:</strong> #${order.orderId}</p>
          <p><strong>Trạng thái:</strong> Cancelled</p>
          <p><strong>Tổng tiền:</strong> ${order.totalPrice.toLocaleString('vi-VN')} đ</p>
          <p><strong>Lý do hủy:</strong> ${reason}</p>
          <p><strong>Thời gian hủy:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          ${order.loyaltyPoints && order.loyaltyPoints.pointsUsed > 0 ? 
            `<p style="color: green;"><strong>✓ Đã hoàn lại ${order.loyaltyPoints.pointsUsed} điểm thưởng</strong></p>` : 
            ''}
          <p>Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.</p>
        `;
        
        await sendEmail(user.email, 'Đơn hàng #' + order.orderId + ' đã bị hủy', emailContent);
        console.log(`📧 Gửi email hủy đơn cho ${user.email}`);
      } catch (emailErr) {
        console.error('❌ Lỗi gửi email:', emailErr);
        // Không throw error, vì hủy đơn đã thành công
      }
    }

    // 🆕 Tạo notifications cho admin khi user hủy đơn
    try {
      const Notification = require('../models/notificationModel');
      
      // Tạo notification cho customer (user)
      await Notification.create({
        userId: userId,
        type: 'order',
        title: 'Đơn hàng đã hủy',
        message: `Đơn hàng #${order.orderId} đã được hủy thành công. Lý do: ${reason}`,
        data: { 
          orderId: order._id, 
          orderNumber: order.orderId,
          action: 'cancelled',
          reason: reason
        },
        actionUrl: `/orders/${order.orderId}`
      });
      
      // Tạo notification cho tất cả admin
      const admins = await User.find({ role: 'admin' });
      console.log('📋 Creating cancellation notifications for admins:', admins.length);
      
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'order',
          title: 'Đơn hàng bị hủy',
          message: `Đơn hàng #${order.orderId} - ${user?.userName || user?.email} - ${order.totalPrice.toLocaleString('vi-VN')}đ đã bị hủy. Lý do: ${reason}`,
          data: { 
            orderId: order._id, 
            orderNumber: order.orderId, 
            customerId: userId,
            action: 'cancelled',
            reason: reason,
            cancelledAt: order.cancelledAt
          },
          actionUrl: `/admin/orders/${order.orderId}`
        });
        console.log('✅ Admin cancellation notification created for:', admin.email);
      }
      
      // Emit socket event for real-time notification
      const io = req.app.get('socketio');
      if (io) {
        // Emit to customer
        io.emit('orderCancelled', {
          orderId: order.orderId,
          message: 'Đơn hàng đã được hủy thành công',
          timestamp: new Date().toISOString()
        });
        
        // Emit to admin
        io.emit('adminNotification', {
          type: 'order_cancelled',
          title: 'Đơn hàng bị hủy',
          message: `Đơn hàng #${order.orderId} đã bị hủy`,
          orderId: order.orderId,
          customerName: user?.userName || user?.email,
          reason: reason,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Socket events emitted for order cancellation');
      } else {
        console.log('⚠️ Socket.io not available for cancellation notification');
      }
      
      console.log('📢 Cancellation notifications sent for order:', order.orderId);
      
    } catch (notifError) {
      console.error('❌ Error sending cancellation notifications:', notifError.message);
      // Don't throw error, order cancellation was successful
    }

    res.json({ 
      success: true, 
      message: 'Đã hủy đơn hàng thành công. Email xác nhận đã được gửi.',
      order 
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hủy đơn hàng: ' + error.message 
    });
  }
};