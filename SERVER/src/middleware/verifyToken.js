const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err)
        return res.status(403).json("Token không hợp lệ hoặc đã hết hạn!");
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json("Bạn chưa được xác thực!");
  }
};
const verifyPartner = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "Partner" || req.user.role === "Admin") {
      next();
    } else {
      return res
        .status(403)
        .json("Chỉ Nhà cung cấp (Partner) mới có quyền này!");
    }
  });
};
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "Admin") {
      next();
    } else {
      return res.status(403).json("Hành động bị từ chối! Yêu cầu quyền Admin.");
    }
  });
};
module.exports = { verifyToken, verifyPartner, verifyAdmin };
