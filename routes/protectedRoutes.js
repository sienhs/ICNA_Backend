// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');

// routes/protectedRoutes.js 또는 authRoutes.js
router.get('/profile', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.userId);
  console.log('🔐 userId from token:', req.user.userId);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  res.json({ user: { name: user.name, email: user.email } });
});


module.exports = router;
