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

// 요청 토큰에서 사용자 컨텍스트 생성
function getAccessTokenFromRequest(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return null;
  const parts = String(authHeader).split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

function createClientWithAuth(token) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  });
}

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

// 클라이언트에서 Supabase 초기화를 위한 공개 설정 제공
app.get('/api/public-config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// 메모 생성 API
app.post('/api/memos', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authed = createClientWithAuth(token);

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const { data: userResp, error: userErr } = await authed.auth.getUser();
    if (userErr || !userResp?.user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const { data, error } = await authed
      .from('memos')
      .insert([{ content, created_at: new Date().toISOString(), user_id: userResp.user.id, author_email: userResp.user.email }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, memo: data[0] });
  } catch (error) {
    console.error('Error creating memo:', error);
    res.status(500).json({ error: 'Failed to create memo' });
  }
});

// 댓글 생성 API
app.post('/api/memos/:memoId/comments', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authed = createClientWithAuth(token);

    const { memoId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // 메모 존재 여부 체크 (선택적이지만 안전)
    const { data: memo, error: memoError } = await authed
      .from('memos')
      .select('id')
      .eq('id', memoId)
      .single();

    if (memoError) {
      return res.status(400).json({ error: 'Invalid memo id' });
    }

    const { data: userResp, error: userErr } = await authed.auth.getUser();
    if (userErr || !userResp?.user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const { data, error } = await authed
      .from('comments')
      .insert([{ memo_id: memo.id, content, created_at: new Date().toISOString(), user_id: userResp.user.id, author_email: userResp.user.email }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, comment: data[0] });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// 특정 메모의 댓글 목록 조회 API
app.get('/api/memos/:memoId/comments', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const token = getAccessTokenFromRequest(req);
    const client = createClientWithAuth(token) || supabase;

    const { memoId } = req.params;
    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('memo_id', memoId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ comments: data || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 댓글 삭제 API
app.delete('/api/comments/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authed = createClientWithAuth(token);

    const { id } = req.params;
    const { error } = await authed
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
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

    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authed = createClientWithAuth(token);

    const { id } = req.params;
    const { error } = await authed
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
