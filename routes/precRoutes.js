//precRoutes.js
const express = require('express');
const router = express.Router();
const { summarizeCaseDetails } = require('../utils/openaiHelper');

router.post('/summarize', async (req, res) => {
  try {
    const { caseDetails } = req.body;

    if (!caseDetails || typeof caseDetails !== 'object') {
      return res.status(400).json({ error: '잘못된 입력입니다.' });
    }

    const summary = await summarizeCaseDetails(caseDetails);
    res.json({ summary });
  } catch (err) {
    console.error('❌ 요약 실패:', err);
    res.status(500).json({ error: '요약 처리 중 오류 발생' });
  }
});

module.exports = router;
