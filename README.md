# Startup Code - Express.js + Supabase 메모앱

Express.js와 Supabase를 활용한 실시간 메모 저장/삭제 애플리케이션입니다.

## 🚀 주요 기능

- **메모 작성**: 텍스트 입력으로 메모 생성
- **메모 저장**: Supabase 데이터베이스에 실시간 저장
- **메모 조회**: 저장된 메모 목록 표시
- **메모 삭제**: 개별 메모 삭제 기능
- **API 엔드포인트**: RESTful API 제공

## 🛠️ 기술 스택

- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Vercel

## 📋 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. Supabase 설정

#### Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 가입
2. 새 프로젝트 생성
3. 프로젝트 URL과 API 키 확인

#### 데이터베이스 테이블 생성
SQL Editor에서 다음 쿼리 실행:

```sql
-- memos 테이블 생성
CREATE TABLE memos (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여
CREATE POLICY "Allow all operations for all users" ON memos
  FOR ALL USING (true)
  WITH CHECK (true);
```

### 3. 환경변수 설정

`.env` 파일 생성 (프로젝트 루트에):

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
PORT=3000
```

### 4. 로컬 실행
```bash
npm start
```

## 🌐 API 엔드포인트

### 메모 관련 API
- `POST /api/memos` - 새 메모 생성
- `GET /api/memos` - 메모 목록 조회
- `DELETE /api/memos/:id` - 메모 삭제

### 시스템 API
- `GET /` - 메인 API 정보
- `GET /api/status` - 서버 상태
- `GET /html` - HTML 페이지

## 📱 사용법

1. **메모 작성**: 텍스트 입력 후 "메모 저장" 버튼 클릭
2. **메모 조회**: "메모 새로고침" 버튼으로 최신 목록 확인
3. **메모 삭제**: 각 메모의 "삭제" 버튼 클릭

## 🚀 배포

### Vercel 배포
```bash
vercel --prod
```

## 🔧 문제 해결

### Supabase 연결 오류
- 환경변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트의 API 키가 유효한지 확인
- 데이터베이스 테이블이 생성되었는지 확인

### 로컬 실행 오류
- Node.js 버전이 18.0.0 이상인지 확인
- 모든 의존성이 설치되었는지 확인

## �� 라이선스

MIT License
