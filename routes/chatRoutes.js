const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/authMiddleware')
const ChatMessage = require('../models/ChatMessage')
const ChatSession = require('../models/ChatSession');
const Summary = require('../models/Summary');
const axios = require('axios'); // HyperClova 요청용

// 채팅 저장
router.post('/save', verifyToken, async (req, res) => {
  const { sessionId, text, sender, timestamp } = req.body;
  const userId = req.user.userId;

  try {
    const newChatMessage = new ChatMessage({
      chatId: sessionId,
      userId,
      text,
      sender,
      createdAt: timestamp,
    });
    await newChatMessage.save();

    // 사용자 메시지일 때만 요약 조건 확인
    if (sender === 'user') {
      const userMessages = await ChatMessage.find({
        chatId: sessionId,
        userId,
        sender: 'user',
      });

      const alreadyHasSummary = await Summary.exists({ chatId: sessionId });

      if (!alreadyHasSummary && userMessages.length >= 1) {
        // 첫 질문이거나 2개 이상일 때 요약 생성 시도
        await axios.post(`http://localhost:5050/summary/generate`, {
          chatId: sessionId
        });
        console.log('[요약 요청] 조건 만족 -> 요약 생성 시도');
      }
    }

    res.status(200).json({ message: '저장 완료' });
  } catch (err) {
    console.error('/chat/save 실패:', err);
    res.status(500).json({ error: '서버 오류', details: err.message });
  }
});

// 사용자 채팅 기록 조회
router.post('/history', async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: 'chatId가 없습니다.' });

    try {
        const chatHistory = await ChatMessage.find({ chatId }).sort({ createdAt: 1 });
        res.json({ chatHistory });
    } catch (err) {
        console.error('대화 기록 불러오기 실패:', err);
        res.status(500).json({ error: '대화 기록 불러오기 실패' });
    }
});

// 검색 기능
router.post('/search-global', verifyToken, async (req, res) => {
  const { keyword } = req.body;
  const userId = req.user.userId;

  try {
    const results = await ChatMessage.find({
      userId,
      text: { $regex: keyword, $options: 'i' }
    })
    .sort({ timestamp: -1 })
    .limit(30);

    res.json({ results });
  } catch (err) {
    console.error('글로벌 검색 실패:', err);
    res.status(500).json({ error: '검색 실패' });
  }
});


module.exports = router
