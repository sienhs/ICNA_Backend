//국가법령정보-최신법령정보-최근시행법령 (과학기술통신부 소관)
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const { MongoClient } = require('mongodb');

// MongoDB 연결 URI
const uri = 'mongodb://localhost:27017';
const dbName = 'law_db';
const collectionName = 'laws';

// MongoDB 클라이언트 생성
const client = new MongoClient(uri, {
  tls: false,
  tlsAllowInvalidCertificates: false,
  useUnifiedTopology: true
});

async function crawlLaws() {
  const baseUrl = 'https://www.law.go.kr/LSW/nwEfLsPop.do';  // 새로운 URL로 변경
  const detailBaseUrl = 'https://www.law.go.kr/LSW/';
  const params = {
    pg: 1,
    chrIdx: 0,
    lsKndCd: '',
    cptOfi: '1721000', // 과학기술정보통신부 소관
    searchType: 'lsNm',
    lsNm: '',
    p_spubdt: '',
    p_epubdt: '',
    p_spubno: '',
    p_epubno: '',
  };

  let page = 1;
  const laws = [];

  try {
    while (true) {
      params.pg = page;
      const response = await axios.get(baseUrl, { params });
      const $ = cheerio.load(response.data);

      const rows = $('table tr');
      let hasData = false;

      rows.each((index, row) => {
        const cells = $(row).find('td');
        if (cells.length > 1) {
          const 법령명 = $(cells[1]).text().trim();
          const 소관부처 = $(cells[2]).text().trim();
          const 제정개정구분 = $(cells[3]).text().trim();
          const 법령종류 = $(cells[4]).text().trim();
          const 공포번호 = $(cells[5]).text().trim();
          const 공포일자 = $(cells[6]).text().trim();
          const 시행일자 = $(cells[7]).text().trim();

          // 법령명 열의 <a> 태그에서 href 속성 추출 (상세링크)
          const relativeLink = $(cells[1]).find('a').attr('href');
          const 상세링크 = relativeLink ? detailBaseUrl + relativeLink.replace(/&amp;/g, '&') : null;

          laws.push({
            법령명,
            소관부처,
            제정개정구분,
            법령종류,
            공포번호,
            공포일자,
            시행일자,
            상세링크,
          });

          hasData = true;
        }
      });

      if (!hasData) break;
      page++;
    }

    console.log(`${laws.length}개의 법령이 크롤링되었습니다.`);

    if (laws.length > 0) {
      await saveToMongoDB(laws);
    } else {
      console.log('크롤링된 데이터가 없습니다. MongoDB 저장을 생략합니다.');
    }

  } catch (error) {
    console.error('데이터 크롤링 실패:', error);
  }
}

// MongoDB에 데이터 저장
async function saveToMongoDB(laws) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.deleteMany({});
    await collection.insertMany(laws);

    console.log('데이터가 MongoDB에 성공적으로 저장되었습니다.');
  } catch (error) {
    console.error('MongoDB 저장 실패:', error);
  } finally {
    await client.close();
  }
}

// MongoDB에서 데이터 꺼내오기
async function getLawsFromMongoDB() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const laws = await collection.find().toArray();
    console.log('저장된 법령 데이터:', laws);
  } catch (error) {
    console.error('MongoDB에서 데이터 불러오기 실패:', error);
  } finally {
    await client.close();
  }
}

// 24시간마다 크롤링을 실행 (자정에 실행)
cron.schedule('0 0 * * *', () => {  // 매일 자정(00:00)에 실행
  console.log('24시간마다 크롤링을 실행합니다...');
  crawlLaws().then(() => {
    getLawsFromMongoDB(); // 크롤링 후 MongoDB에서 데이터 확인
  });
});

// 실시간으로 데이터를 가져오려면 즉시 실행도 가능
crawlLaws().then(() => {
    getLawsFromMongoDB(); // 크롤링 후 MongoDB에서 데이터 확인
  });