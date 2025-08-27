require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다. 메모 기능이 제한됩니다.');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
    framework: 'Express.js',
    features: ['Supabase Integration', 'Memo CRUD API']
  });
});

// API 라우트 예시
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    supabase: supabase ? 'Connected' : 'Not configured'
  });
});

// 메모 생성 API
app.post('/api/memos', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const { data, error } = await supabase
      .from('memos')
      .insert([{ content, created_at: new Date().toISOString() }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, memo: data[0] });
  } catch (error) {
    console.error('Error creating memo:', error);
    res.status(500).json({ error: 'Failed to create memo' });
  }
});

// 메모 목록 조회 API
app.get('/api/memos', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ memos: data || [] });
  } catch (error) {
    console.error('Error fetching memos:', error);
    res.status(500).json({ error: 'Failed to fetch memos' });
  }
});

// 메모 삭제 API
app.delete('/api/memos/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;
    const { error } = await supabase
      .from('memos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('Error deleting memo:', error);
    res.status(500).json({ error: 'Failed to delete memo' });
  }
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
  console.log(`Supabase: ${supabase ? 'Connected' : 'Not configured'}`);
});
