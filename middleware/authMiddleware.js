// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId }; // 이후 req.user.userId로 사용 가능
    next();
  } catch (err) {
    console.error('[verifyToken] JWT 검증 실패:', err.message);
    return res.status(401).json({
      message: '유효하지 않은 토큰입니다.',
      error: err.message, // 문자열 형태만 반환
    });
  }
};

module.exports = verifyToken;
