require('dotenv').config();

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function summarizeCaseDetails(caseDetails) {
  const prompt = `
다음은 법률 판례 정보입니다. 이 내용을 일반인이 이해할 수 있도록 요약하고 쉬운 말로 설명해 주세요.

내용:
${JSON.stringify(caseDetails)}

형식:
- 사건 개요
- 쟁점 요약
- 쉬운 설명
- 결과 혹은 처벌 수위
  `;

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return res.choices[0].message.content.trim();
}

module.exports = { summarizeCaseDetails };
