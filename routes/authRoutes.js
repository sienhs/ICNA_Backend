//authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const axios = require('axios');
const User = require('../models/User');  // 사용자 모델 (필요시 추가)
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');
router.post('/complete-profile', verifyToken, authController.completeProfile);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/kakao', (req, res) => {
    const redirectUri = 'http://localhost:5050/auth/kakao/callback'; // 본인의 Redirect URI로 수정
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}`;
  
    res.redirect(kakaoAuthUrl);  // 카카오 로그인 페이지로 리디렉션
});
  
  // 카카오 로그인 콜백
router.get('/kakao/callback', async (req, res) => {
    const { code } = req.query;  // 카카오 로그인 후 전달된 code
  
    try {
      // 카카오 API에서 Access Token 요청
      const tokenResponse = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: process.env.KAKAO_CLIENT_ID,
            redirect_uri: 'http://localhost:5050/auth/kakao/callback',
            code: code
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          }
        }
      );
  
      const access_token = tokenResponse.data.access_token;
  
      // Access Token으로 카카오 API에서 사용자 정보 요청
      const userResponse = await axios.get(
        'https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          "Content-Type":"application/x-www-form-urlencoded;charset=utf-8",
        },
      });
      console.log(userResponse.data)
      const { id, properties } = userResponse.data;
  
      // 사용자 정보 처리
      const user = await User.findOrCreate(id, properties.nickname);
      if (!user) {
        // 신규 사용자 등록
        const newUser = new User({
          kakaoId: String(id),
          name: properties.nickname
        });
        await newUser.save();
      }
  
      // JWT 토큰 발급
      const token = jwt.sign({ userId: id.toString() }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });
  
      console.log('kakao callback token:', token)
      ///token=${token}
      return res.redirect(`${process.env.FRONT_BASE}/auth/kakao/complete?token=${token}`);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '카카오 로그인 실패' });
    }
});
module.exports = router;
