// routes/chatSummaryRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Summary = require('../models/Summary');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const fetchSummaryDirect = require('../utils/fetchSummaryDirect'); // HyperClova 요청 함수

// 키워드 기반 세션 요약 생성 및 세션 title 업데이트
router.post('/generate', async (req, res) => {
  const { chatId } = req.body;
  console.log('[요약 요청 도착]', chatId);

  if (!chatId) return res.status(400).json({ error: 'chatId가 필요합니다.' });

  try {
    // 전체 메시지 조회
    const chatHistory = await ChatMessage.find({ chatId }).sort({ createdAt: 1 });
    if (!chatHistory || chatHistory.length === 0) {
      return res.status(400).json({ error: '대화 내역 없음' });
    }

    const userMessages = chatHistory
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text);

    if (userMessages.length === 0) {
      return res.status(400).json({ error: '유저 메시지 없음' });
    }

    // 키워드 추출
    const extractInitialKeywords = (text) => {
      return text
        .replace(/[^가-힣\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && w.length <= 10);
    };

    let rawKeywords = [];
    userMessages.forEach(msg => {
      rawKeywords.push(...extractInitialKeywords(msg));
    });
    const uniqueKeywords = [...new Set(rawKeywords)].slice(0, 15);

    // HyperClova 요청
    const messages = [
      {
        role: "user",
        content: `다음 키워드들 중 문맥에 맞는 핵심 키워드 2~4개만 추려서 문맥에 맞는 순서로 공백으로 나열해 주세요.\n조건:\n- 설명 없이 키워드만 나열.\n- 쉼표나 마침표 없이.\n- 공백으로만 구분.\n- 한국어 키워드만.\n- 각 키워드는 10자 이내로 제한.`
      },
      {
        role: "user",
        content: uniqueKeywords.join(' ')
      }
    ];

    const summary = await fetchSummaryDirect(messages);

    // 기존 요약 있으면 업데이트, 없으면 생성 (upsert)
    await Summary.findOneAndUpdate(
      { chatId },
      {
        summary,
        userId: chatHistory[0].userId
      },
      { upsert: true, new: true }
    );

    // ChatSession title도 같이 업데이트
    await ChatSession.findByIdAndUpdate(chatId, { title: summary });

    res.json({ summary });
  } catch (err) {
    console.error('요약 생성 오류:', err);
    res.status(500).json({ error: '요약 생성 중 오류', detail: err.message });
  }
});


module.exports = router;
