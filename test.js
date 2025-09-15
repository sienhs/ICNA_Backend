let REST_API_KEY = process.env.KAKAO_CLIENT_ID;
let REDIRECT_URI = "http://localhost:5050/auth/kakao/callback";

const kakaoToken = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;


