const express = require('express')
const mongoose = require('mongoose');
const router = express.Router()
const verifyToken = require('../middleware/authMiddleware')
const ChatSession = require('../models/ChatSession')
const ChatMessage = require('../models/ChatMessage');
const Summary = require('../models/Summary');

// 새 세션 생성
router.post('/session', verifyToken, async (req, res) => {
    const { title } = req.body
    try {
        const session = new ChatSession({
            userId: req.user.userId,
            title
        })
        await session.save()
        res.status(201).json({ session })
    } catch (err) {
        res.status(500).json({ message: '세션 생성 실패', error: err.message })
    }
})

// 사용자별 세션 조회
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    const filtered = [];

    for (const session of sessions) {
      const hasMessages = await ChatMessage.exists({ chatId: session._id.toString() });
      if (hasMessages) {
        filtered.push(session);
      }
    }

    res.json({ sessions: filtered });
  } catch (err) {
    console.error('세션 목록 불러오기 실패:', err);
    res.status(500).json({ error: '세션 목록 불러오기 실패' });
  }
});

// 특정 세션 삭제

router.delete('/session/:id', verifyToken, async (req, res) => {
  try {
    const sessionId = new mongoose.Types.ObjectId(req.params.id);

    await ChatSession.findByIdAndDelete(sessionId);
    await ChatMessage.deleteMany({ chatId: sessionId });
    await Summary.deleteOne({ chatId: sessionId });

    res.json({ message: '세션 및 관련 데이터 삭제 완료' });
  } catch (err) {
    console.error('세션 삭제 오류:', err);
    res.status(500).json({ error: '세션 삭제 실패', detail: err.message });
  }
});

// 제목 수정 (세션 업데이트)
router.put('/session/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: '유효한 제목이 필요합니다.' });
  }

  try {
    const updated = await ChatSession.findByIdAndUpdate(id, { title }, { new: true });
    if (!updated) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });

    res.json({ message: '업데이트 성공', session: updated });
  } catch (err) {
    console.error('[세션 제목 수정 실패]', err.message);
    res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

//세션 내용 요약 (사이드바) 
router.post('/getChatSummary', verifyToken, async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ error: 'chatId가 없습니다.' });
  }

  try {
    const existingSummary = await Summary.findOne({ chatId });
    if (existingSummary) {
      return res.json({ summary: existingSummary.summary });
    }

    const chatHistory = await Chat.find({ chatId }).sort({ createdAt: 1 });
    if (!chatHistory || chatHistory.length === 0) {
      throw new Error("대화 내역이 없습니다.");
    }

    const userMessages = chatHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.message);

    if (userMessages.length === 0) {
      throw new Error("유저 질문이 없습니다.");
    }

    const extractInitialKeywords = (text) => {
      return text
        .replace(/[^\w\s가-힣]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 1 && word.length <= 10);
    };

    let rawKeywords = [];
    userMessages.forEach(msg => {
      rawKeywords.push(...extractInitialKeywords(msg));
    });

    const uniqueKeywords = [...new Set(rawKeywords)].slice(0, 15);

    const messages = [
      {
        role: "user",
        content: `다음 키워드들 중 문맥에 맞는 핵심 키워드 3~5개만 추려서 공백으로 나열해 주세요.
조건:
- 설명 없이 키워드만 나열.
- 쉼표나 마침표 없이.
- 공백으로만 구분.
- 한국어 키워드만.
- 각 키워드는 10자 이내로 제한.

예시: 사이버범죄 명예훼손 판례`
      },
      {
        role: "user",
        content: uniqueKeywords.join(' ')
      }
    ];

    const summary = await fetchSummaryDirect(messages);

    const newSummary = new Summary({
      chatId,
      summary,
      userId: chatHistory[0].userId
    });

    await newSummary.save();

    // 여기에서 세션 title도 업데이트
    await ChatSession.findByIdAndUpdate(chatId, { title: summary });

    res.json({ summary });

  } catch (error) {
    console.error("요약 생성 오류:", error.message);
    res.status(500).json({ error: '서버 오류', details: error.message });
  }
});

module.exports = router
