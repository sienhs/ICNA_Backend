const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    //  ^^^^ HyperClova.js에서는 String으로 되어 있으나,
        //  호출 중 오류가 발생하는것이 아닌 이상 변환 X
        ref: 'User',
        required: true
    },
    chatId: { //세션 ID가 들어갈 곳
        type: String,
        required: true
    },
    sender: {
    // HyoerClova.js 에선 role과 구조가 같음 단, ai가 보내는 채팅이
        // ai가 아닌 bot으로 되어있음 수정 X, 나머진 동일
        type: String,
        enum: ['user', 'bot'], //enum: ['user', 'ai'] << 이렇게 생김.
        required: true
    },
    text: { // 이름만 다를뿐이지 hyperclova.js에선 message 구조와 동일 수정X
        type: String,
        required: true
    },
    timestamp: {
        // 이거 헷갈릴수있는데 createdAt과 기능 및 구조가 완전 동일 이름만 다른거임.
        // 이 부분은 자유롭게 수정해도 무방하나,
        // 기존 데이터와 호환이 안되어 데베를 초기화해야할수있으므로, 조심히 변경. 딱히 상관은없음.
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
