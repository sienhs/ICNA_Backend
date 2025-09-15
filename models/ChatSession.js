const mongoose = require('mongoose')
const Schema = mongoose.Schema

// 요약 저장 모델

// 요약 저장 모델 여기는 정말 자유롭게 수정해도 상관없음
const chatSessionSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('ChatSession', chatSessionSchema)