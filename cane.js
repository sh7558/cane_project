// 서버 코드 (예: server.js)
const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

const server = https.createServer(httpsOptions, app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 접근 기록을 저장할 배열
let accessHistory = [];

// 클라이언트로부터 위치 데이터 수신 및 기록 저장
io.on('connection', (socket) => {
    console.log('클라이언트가 접속했습니다.');

    // 새 클라이언트에 기존 접근 기록 전송
    socket.emit('updateHistory', accessHistory);

    // 위치 정보 전송 시 기록 추가
    socket.on('sendLocation', (data) => {
        const { name, latitude, longitude } = data;
        const time = new Date().toLocaleString();

        // 접근 기록에 새로운 항목 추가
        const record = { id: Date.now(), name, time, latitude, longitude }; // 고유 ID 추가
        accessHistory.push(record);

        // 모든 클라이언트에 접근 기록 업데이트
        io.emit('updateHistory', accessHistory);
    });

    // 기록 삭제 요청 처리
    socket.on('deleteRecord', (recordId) => {
        // 기록을 ID로 필터링하여 삭제
        accessHistory = accessHistory.filter(record => record.id !== recordId);

        // 모든 클라이언트에 업데이트된 기록 전송
        io.emit('updateHistory', accessHistory);
    });

    socket.on('disconnect', () => {
        console.log('클라이언트가 접속을 종료했습니다.');
    });
});

// HTTPS 서버 시작
server.listen(PORT, HOST, () => {
    console.log(`HTTPS 서버가 https://${HOST}:${PORT}에서 실행 중입니다.`);
});
