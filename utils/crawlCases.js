const axios = require('axios');
const { MongoClient } = require('mongodb');

// 설정
const OPEN_API_KEY = 'pshyun312';
const query = '정보통신망법';
const target = 'prec';
const type = 'JSON';

const uri = 'mongodb://127.0.0.1:27017/crawl';
const dbName = 'case_db';
const collectionName = 'case';

const client = new MongoClient(uri, {
  tls: false,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000
});

async function crawlCases() {
  console.log(`[${new Date().toISOString()}] 🟡 판례 크롤링 시작`);
  const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${OPEN_API_KEY}&target=${target}&type=${type}&query=${query}`;

  try {
    const response = await axios.get(listUrl, { timeout: 5000 });
    const items = response.data?.PrecSearch?.prec ?? [];

    if (items.length === 0) {
      console.log('⛔ 판례 없음. 저장 생략');
      return;
    }

    const formattedCases = [];

    for (const item of items) {
      try {
        const id = item.판례상세링크.match(/ID=(\d+)/)?.[1];
        if (!id) continue;

        const detailUrl = `https://www.law.go.kr/DRF/lawService.do?OC=${OPEN_API_KEY}&target=prec&ID=${id}&type=JSON`;
        const detailRes = await axios.get(detailUrl, { timeout: 5000 });

        const 판례상세링크 = item.판례상세링크; // 예: /DRF/lawService.do?OC=pshyun312&target=prec&ID=240901&type=HTML

        // HTML → JSON으로 링크 타입 강제 교체
        const jsonLink = `https://www.law.go.kr${판례상세링크}`.replace(/type=HTML/i, 'type=JSON');

        // 최종 저장
        formattedCases.push({
        사건명: item.사건명,
        사건번호: item.사건번호,
        법원명: item.법원명,
        선고일자: item.선고일자,
        판결유형: item.판결유형,
        상세링크: jsonLink,
        caseDetails: detailRes.data?.PrecService ?? null
        });

        console.log(`✅ 상세 정보 저장: ${item.사건번호}`);
      } catch (innerErr) {
        console.error(`❌ 상세 정보 실패: ${item.사건번호} - ${innerErr.message}`);
      }
    }

    await saveToMongoDB(formattedCases);
    console.log(`[${new Date().toISOString()}] ✅ 총 ${formattedCases.length}건 저장 완료`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ 크롤링 실패:`, err.message);
  }
}

async function saveToMongoDB(cases) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.deleteMany({});
    await collection.insertMany(cases);

    console.log(`[${new Date().toISOString()}] 💾 MongoDB 저장 완료`);
  } catch (err) {
    console.error('❌ MongoDB 저장 실패:', err);
  } finally {
    await client.close();
  }
}

crawlCases();
