const mongoose = require("mongoose");

/**
 * Middleware linh hoạt để tìm một document.
 * Nó sẽ tìm kiếm đồng thời bằng cả _id (nếu hợp lệ) và một trường tùy chỉnh (productId).
 */
const resolveId = (options) => {
  return async (req, res, next) => {
    try {
      // 1. Lấy tất cả các tùy chọn từ object cấu hình
      const idParamName = options.param;
      const Model = options.model;
      const reqKey = options.reqKey;
      const customField = options.customField || idParamName; // vd: 'productId'

      // 2. Lấy giá trị ID từ req.params, req.body, hoặc req.query
      const idValue = req.params[idParamName] || req.body[idParamName] || req.query[idParamName];
      
      if (!idValue) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required field: ${idParamName}` 
        });
      }
      
      // 3. Xây dựng một câu truy vấn $or duy nhất
      const query = {
          $or: [
              // Luôn luôn tìm bằng mã tùy chỉnh (vd: { productId: "monitor01" })
              { [customField]: idValue } 
          ]
      };
      
      // 4. Nếu idValue có định dạng của một ObjectId, thêm điều kiện tìm bằng _id
      if (mongoose.Types.ObjectId.isValid(idValue)) {
          query.$or.push({ _id: idValue });
      }

      // 5. Thực hiện MỘT câu truy vấn duy nhất để tìm kiếm
      const document = await Model.findOne(query);

      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: `${Model.modelName} with ID '${idValue}' not found` 
        });
      }

      // 6. Gán document tìm thấy vào request
      req[reqKey] = document;
      next();

    } catch (err) {
      console.error('Resolve ID error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while resolving document',
        error: err.message 
      });
    }
  };
};

module.exports = resolveId;