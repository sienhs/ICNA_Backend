const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'chatbot';
const COLLECTION_NAME = 'qa';

async function cleanAnswers() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // 모든 Q&A 문서 불러오기
  const cursor = collection.find({});
  let updated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const answer = doc.answer;
    if (typeof answer === 'string') {
      const cutPos = answer.indexOf('새소식 상세 내용');
      if (cutPos !== -1) {
        const newAnswer = answer.slice(0, cutPos).trim();
        if (newAnswer !== answer) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { answer: newAnswer } }
          );
          updated++;
        }
      }
    }
  }

  await client.close();
  console.log(`정리 완료: ${updated}개 문서가 수정됨.`);
}

cleanAnswers();
