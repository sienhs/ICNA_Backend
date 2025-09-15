const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// mongoose 모델로 정의된 qa 컬렉션
const QAModel = mongoose.model('qa', new mongoose.Schema({
  category: String,
  question: String,
  answer: String
}, { collection: 'qa' }));

router.get('/', async (req, res) => {
  const category = req.query.category;
  if (!category) return res.status(400).json({ error: 'category query required' });

  try {
    const qas = await QAModel.find({ category }).select('-_id');
    res.json(qas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
