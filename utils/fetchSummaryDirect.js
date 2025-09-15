const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function fetchSummaryDirect(messages) {
  const requestData = {
    messages,
    topP: 0.8,
    maxTokens: 30,
    temperature: 0.5,
    repetitionPenalty: 1.1,
    stop: [],
    includeAiFilters: true,
    seed: 0
  };

  const headers = {
    'Authorization': 'Bearer nv-295760a1ea26453189bcb60a5a8e7dd4V6NV',
    'X-NCP-CLOVASTUDIO-REQUEST-ID': uuidv4(),
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json'
  };

  try {
    const response = await axios.post(
      'https://clovastudio.stream.ntruss.com/testapp/v3/chat-completions/HCX-DASH-002',
      requestData,
      { headers }
    );

    let result = response.data.result?.message?.content?.trim() || '';
    return result.replace(/[^\w\s가-힣]/g, '').trim();
  } catch (error) {
    console.error("HyperClova 요청 실패:", error.message);
    return '요약 실패';
  }
}


module.exports = fetchSummaryDirect;
