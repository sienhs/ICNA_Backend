// routes/lawRoutes.js
const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/craw';
const dbName = 'law_db';

const categoryMap = {
  upcoming: 'upcoming_laws',
  enforced: 'recent_enforced_laws',
  announced: 'recent_announced_laws',
};

router.get('/:category', async (req, res) => {
  const { category } = req.params;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('law_db');
    const collection = db.collection('laws');

    // 카테고리에 따른 필터링 (예: 시행일자 기준)
    let query = {};

    if (category === 'upcoming') {
      query = { 시행일자: { $gte: new Date().toISOString().slice(0, 10) } };
    } else if (category === 'enforced') {
      query = { 시행일자: { $lt: new Date().toISOString().slice(0, 10) } };
    } else if (category === 'announced') {
      // 공포일자 최신순으로
      query = {}; // 필요 시 수정
    } else {
      return res.status(400).json({ error: '잘못된 카테고리입니다.' });
    }

    const data = await collection.find(query).limit(100).toArray();
    res.json(data);
  } catch (err) {
    console.error('❌ DB 오류:', err);
    res.status(500).json({ error: 'DB 오류 발생' });
  } finally {
    await client.close();
  }
});
module.exports = router;
