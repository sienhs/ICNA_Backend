const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 로그인 API
exports.signup = async (req, res) => {
    const { email, password, name } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: '이미 가입된 이메일입니다.' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
      });
  
      res.status(201).json({ message: '회원가입 성공', userId: user._id });
    } catch (err) {
      res.status(500).json({ message: '서버 오류', error: err.message });
    }
};
  
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });

    // JWT 토큰 발급
    const accessToken = jwt.sign({ userId: user._id.toString()}, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(accessToken);
    res.json({ message: '로그인 성공', accessToken });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
exports.completeProfile = async (req, res) => {
  // authMiddleware에서 req.userId가 세팅됨
  const { email, name } = req.body;
  alert(req.body.toString())
  if (!email || !name) return res.status(400).json({ message: '이메일과 이름 모두 필요합니다.' });

  const exist = await User.findOne({ email });
  if (exist && exist.id.toString() !== req.user.userId) {
    return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }

  user.email = email;
  user.name = name;
  await user.save();
  return res.json({ message: '프로필 완료' });
};