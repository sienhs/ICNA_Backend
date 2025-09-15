const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const chatRoutes = require('./routes/chatRoutes')
const chatSessionRoutes = require('./routes/chatSessionRoutes')
// const casesRoutes = require('./routes/casesRoutes'); // 🔧 주석 처리
// const lawsRoutes = require('./routes/lawsRoutes');   // 🔧 주석 처리
// app.js 또는 index.js에서 등록
const hyperclovaRoutes = require('./routes/hyperclovaRoutes');
const chatSummaryRoutes = require('./routes/chatSummaryRoutes'); // + 쏘현이 추가!!!!!!!!!
const lawRoutes = require('./routes/lawRoutes')
const caseRoutes = require('./routes/caseRoutes');
const precRoutes = require('./routes/precRoutes');
const dotenv = require('dotenv');
const qaRoutes = require('./routes/qaRoutes') 

dotenv.config();

const PORT = process.env.PORT || 5050;
const app = express();
const cors = require('cors');
// 🔧 CORS 사전 요청(OPTIONS)에 대한 응답 처리
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST', 'PUT', 'DELETE'],credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Chatbot Backend API Running');
});

app.use('/prec', precRoutes)
app.use('/case', caseRoutes);
app.use('/law', lawRoutes) 
app.use('/api/hyperclova', hyperclovaRoutes);
app.use('/chat', chatRoutes)
app.use('/chat-sessions', chatSessionRoutes)
app.use('/auth', authRoutes);
app.use('/protected', protectedRoutes);
app.use('/summary', chatSummaryRoutes); // + 쏘현이 추가!!!!!!!!! 
app.use('/api/qa', qaRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error(err));
