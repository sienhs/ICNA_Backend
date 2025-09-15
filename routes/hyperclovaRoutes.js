// routes/hyperclovaRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// 대화 저장용 임시 메모리
let conversationHistory = [
    { role: "system", content: "당신은 사이버 범죄 법률 상담 AI입니다." }
];

const Chat = require('../models/ChatMessage') // ChatMessage 모델 연결

//질문하기
router.post('/ask', async (req, res) => {
  const { question, sessionId } = req.body
  console.log('요청 들어온 sessionId:', sessionId)
  if (!sessionId || !question) {
    return res.status(400).json({ error: 'sessionId 또는 question 누락' })
  }

  try {
    const chatHistory = await Chat.find({ chatId: sessionId }).sort({ timestamp: 1 })

    const conversationHistory = [
      { role: 'system',
        content: `
당신은 사이버 범죄 및 개인정보 피해에 대한 법률 상담을 제공하는 AI입니다.

- 답변은 사용자 질문에 대해 자연스럽게 시작하는 간단한 문장 1~2줄로 시작하세요.
  - 이 문장에는 절대 번호를 붙이지 마세요.

- 그 다음으로, 대응 방법을 최대 5개까지만 작성하세요.
  - 각 항목은 번호(1. 2. 3. 4. 5.)를 붙이고, 줄바꿈(\n)을 넣어서 개별 항목으로 작성하세요.
  - 절대 6번 이상 항목을 추가하지 마세요.
  - 대응 항목은 간결하고 구체적으로 작성하세요.

- 판례는 numbered list 안에 포함하지 말고, 대응방안이 끝난 후에 일반 문장처럼 자연스럽게 이어서 구체적이고 자세하게 작성하세요.
  - 판례 번호는 반드시 '2021다12345', '2022고단8721' 같은 실제 형식으로 명확하게 표기하세요.
  - '2022고단XXXX', '5XXX' 같이 모호하게 쓰지 마세요.

- 답변을 '요약:', '대응방안:', '판례:' 같은 형식으로 구분하지 마세요. 자연스러운 말투로 하나의 흐름처럼 작성하세요.

- 웹사이트 주소(URL), 링크, "자세한 내용은 클릭" 같은 표현은 절대 사용하지 마세요.

- 마지막에는 사용자가 계속 질문할 수 있도록 부드럽게 유도하는 문장으로 마무리하세요.
  - 예: "혹시 더 궁금한 부분이 있다면 언제든지 질문해주세요."
` },
      ...chatHistory.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: question }
    ]

    const response = await axios.post(
      'https://clovastudio.stream.ntruss.com/testapp/v2/tasks/czftcrfr/chat-completions',
      {
        messages: conversationHistory,
        topP: 0.8,
        maxTokens: 1000,
        temperature: 0.5
      },
      {
        headers: {
          Authorization: 'Bearer nv-edb9e1e89beb4cac8020b0c74715ad35WmxY',
          'Content-Type': 'application/json'
        }
      }
    )

    const aiResponse = response.data.result.message.content

    res.json({
      result: {
        message: {
          content: aiResponse
        }
      }
    })
  } catch (err) {
    console.error('Clova 호출 실패:', err.message)
    res.status(500).json({ error: 'HyperClova 호출 실패' })
  }
})

//후속질문
router.post('/generateFollowUpQuestions', async (req, res) => {
    const { chatId } = req.body;

    if (!chatId) {
        return res.status(400).json({ error: 'chatId가 없습니다.' });
    }

    try {
        // MongoDB에서 chatId에 해당하는 대화 내용 조회
        const chatHistory = await Chat.find({ chatId }).sort({ createdAt: 1 });

        if (!chatHistory || chatHistory.length === 0) {
            throw new Error("대화 내역을 찾을 수 없습니다.");
        }

        const conversationHistory = chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        conversationHistory.push({
            role: "user",
            content: `너는 사이버 범죄 피해자를 돕는 법률 AI야.

다음 대화 내용을 바탕으로 후속 질문을 2개 생성해.

조건:
1. 질문은 반드시 법률적인 주제로 2개 작성.
2. 질문만 출력. 설명이나 사례 없이.
3. 질문은 '?'로 끝나야 함.
4. 단, 이전 질문 중 판례 관련 질문이 없었던 경우에만 처음에 할려는 질문 중 한 질문은 반드시 판례나 판결 사례에 대해 물어야 함. 

예시:
이 사건과 관련된 판례에는 어떤 것이 있나요?
이 행위는 형법상 어떤 처벌을 받게 되나요?

질문 2개만 출력해:`
        });

        // 클로바 API 호출
        const clovaResponse = await axios.post(
            'https://clovastudio.stream.ntruss.com/testapp/v2/tasks/hayiwuwj/chat-completions',
            {
                messages: conversationHistory,
                topP: 0.8,
                maxTokens: 440,
                temperature: 0.5,
                repeatPenalty: 5.0,
                seed: 0
            },
            {
                headers: {
                    'Authorization': `Bearer nv-295760a1ea26453189bcb60a5a8e7dd4V6NV`,
                    'X-NCP-CLOVASTUDIO-REQUEST-ID': require('uuid').v4(),
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json'
                }
            }
        );

        const responseText = clovaResponse.data.result?.message?.content || '';
        console.log("Clova 응답 전체:", clovaResponse.data);
        console.log("응답 내용:", responseText);

        // 질문 내용 필터링
        let followUpQuestions = responseText
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.endsWith('?')) // 질문 형태 필터
            .slice(0, 2);

        // 질문이 2개 미만일 경우 기본 질문 추가
        const fallbackQuestions = [
            "경찰에 신고할 때 어떤 자료를 제출해야 하나요?",
            "이와 관련된 판례나 판결 사례를 알려줄 수 있나요?"
        ];
        while (followUpQuestions.length < 2) {
            followUpQuestions.push(fallbackQuestions[followUpQuestions.length]);
        }

        // 후속 질문 응답 반환
        res.json({
            chatId,
            followUpQuestions
        });

    } catch (error) {
        console.error("후속 질문 생성 오류:", error.message);
        res.status(500).json({
            error: '서버 오류',
            details: error.message
        });
    }
});

module.exports = router;
