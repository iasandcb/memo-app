const express = require('express');
const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (public 폴더)
app.use(express.static('public'));

// 메인 라우트
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hi Jeju from Alex',
    timestamp: new Date().toISOString(),
    framework: 'Express.js'
  });
});

// API 라우트 예시
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// HTML 페이지를 직접 제공하는 라우트
app.get('/html', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`HTML page available at: http://localhost:${PORT}/html`);
});
