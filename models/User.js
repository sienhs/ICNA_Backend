const mongoose = require('mongoose');
//http://localhost:5000/auth/kakao/callback?code=5a6qUASgde0W7tF-3Xa_Tyl0JlTt6o5TgK6ZroAOCO2ZVJBpvdZTHgAAAAQKDR-XAAABlp9eIxUtjdRiIM79qQ
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: { type: String },  // 사용자 이름
  kakaoId: { type: String },  // 카카오 로그인 사용자 식별용
  password: { 
    type: String, 
    required: function() { 
      // 카카오 로그인한 사용자는 비밀번호 필수 아님
      return !this.kakaoId; 
    }
  },
}, {
  timestamps: true,  // 생성일, 수정일 자동 추가
});

// 카카오 로그인 후 사용자 정보 업데이트 또는 신규 등록을 위한 static method 추가
userSchema.statics.findOrCreate = async function( kakaoId, name ) {
  kakaoId = String(kakaoId);
  // 기존에 카카오 로그인으로 가입한 사용자가 있는지 확인
  let user = await this.findOne({ kakaoId });

  if (!user) {
    // 신규 등록
    user = new this({
      kakaoId,
      name,
      email: null, // 카카오는 메일이 없음 siBBBBBBBAAAAAAAAAAAAAAALLLLLLLLL
      password: null,  // 카카오는 비밀번호가 없음
    });
    await user.save();
  } else {
    // 정보 업데이트
    user.name = name;
    await user.save();
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
