const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017/crawl';
const dbName = 'case_db';
const collectionName = 'case';

// 전체 판례 목록 반환
router.get('/list', async (req, res) => {
  const client = new MongoClient(uri, {
    tls: false,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 5000
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const data = await collection.find().toArray();
    res.status(200).json(data);
  } catch (err) {
    console.error('판례 조회 실패:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

module.exports = router;
