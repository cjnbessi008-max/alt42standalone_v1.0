# Combination Blocks - Moodle LMS Integration

블록을 조합하여 목표를 달성하는 인터랙티브 수학 학습 웹앱입니다. 우측 하단의 가상 스마트폰 UI에 표시되며, Moodle 3.7 LMS와 연동됩니다.

![Combination Blocks](docs/screenshot.png)

## 🎯 프로젝트 개요

**Combination Blocks**는 KAIST Touch Math Academy를 위한 교육용 웹 애플리케이션으로, 학생들이 블록을 드래그 앤 드롭으로 조합하여 수학 문제를 해결할 수 있도록 돕습니다.

### 주요 특징

- 🧩 **드래그 & 드롭 인터페이스**: 직관적인 블록 조합
- 📱 **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 스타일
- 🔗 **Moodle 연동**: Moodle 3.7 LMS와 완벽하게 통합
- 💡 **힌트 시스템**: 단계별 힌트 제공
- 📊 **진행 상황 추적**: 실시간 학생 진행도 모니터링
- 🎨 **반응형 디자인**: 모든 화면 크기 지원

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **PDO**: Database abstraction
- **Apache**: Web server

### Frontend
- **React**: 18.2
- **Vite**: Build tool
- **React DnD**: Drag and drop
- **Framer Motion**: Animations
- **Axios**: HTTP client

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## 📋 필수 요구사항

- Docker & Docker Compose
- Moodle 3.7+ (선택사항, 연동 시)
- Node.js 18+ (로컬 개발 시)
- PHP 7.1.9+ (로컬 개발 시)
- MySQL 5.7+ (로컬 개발 시)

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd combination-blocks
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력
```

### 3. Docker로 실행

```bash
docker-compose up -d
```

서비스가 시작되면:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **MySQL**: localhost:3306

### 4. 데이터베이스 초기화

데이터베이스는 자동으로 초기화됩니다 (`database/schema.sql` 사용).

샘플 데이터가 포함되어 있습니다:
- 블록 문제 2개
- 블록 요소들
- 힌트 및 솔루션

## 📁 프로젝트 구조

```
combination-blocks/
├── backend/                # PHP Backend API
│   ├── api/               # API endpoints
│   │   └── index.php      # Main API router
│   ├── config/            # Configuration files
│   │   ├── database.php   # Database config
│   │   └── moodle.php     # Moodle integration
│   ├── models/            # Data models
│   │   ├── CombinationBlock.php
│   │   ├── StudentAttempt.php
│   │   └── StudentProgress.php
│   └── Dockerfile         # PHP container
│
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VirtualPhone/       # Virtual smartphone UI
│   │   │   │   ├── VirtualPhone.jsx
│   │   │   │   └── VirtualPhone.css
│   │   │   └── CombinationBlocks/  # Main app logic
│   │   │       ├── CombinationBlocks.jsx
│   │   │       └── CombinationBlocks.css
│   │   ├── services/
│   │   │   └── api.js     # API client
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile         # Production build
│   └── Dockerfile.dev     # Development build
│
├── database/              # Database files
│   └── schema.sql         # MySQL schema & sample data
│
├── docs/                  # Documentation
│   └── README.md
│
├── docker-compose.yml     # Docker orchestration
├── .env.example           # Environment template
└── README.md              # This file
```

## 🔌 API 엔드포인트

### Blocks
- `GET /api/blocks` - 모든 활성 블록 목록
- `GET /api/blocks/{id}` - 특정 블록 상세 정보
- `POST /api/blocks` - 새 블록 생성 (관리자)

### Attempts
- `GET /api/attempts/{id}` - 특정 시도 조회
- `POST /api/attempts` - 새 시도 제출

### Progress
- `GET /api/progress/{userId}/{blockId}` - 사용자 진행 상황

### Hints
- `GET /api/hints/{blockId}` - 블록의 힌트 목록

### Health
- `GET /api/health` - API 상태 확인

## 💻 로컬 개발

### Backend (PHP)

```bash
cd backend

# Apache/PHP 7.1.9 설치 필요
# MySQL 서버 실행 필요

# Apache document root를 backend 폴더로 설정
# http://localhost/api 로 접근
```

### Frontend (React)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 🎮 사용 방법

### 학생 사용법

1. 웹 브라우저에서 애플리케이션 열기
2. URL 파라미터로 문제 ID 전달:
   ```
   http://localhost:3000?blockId=1&userId=123
   ```
3. 우측 하단 가상 스마트폰에서 블록 조합
4. 블록을 드래그하거나 클릭하여 조합 영역에 추가
5. 제출 버튼을 눌러 정답 확인

### Moodle 연동

Moodle에서 iframe으로 삽입:

```html
<iframe
  src="http://your-domain:3000?blockId=1&userId={$USER->id}&token={$SESSION->id}"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

## 🔧 설정

### 환경 변수

`.env` 파일에서 다음 설정을 변경할 수 있습니다:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=combination_blocks
DB_USER=root
DB_PASS=your_password

# Moodle
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodleuser
MOODLE_DB_PASS=moodle_password
MOODLE_URL=http://localhost/moodle

# API
API_PORT=8080
VITE_API_URL=http://localhost:8080/api
```

## 📊 데이터베이스 스키마

주요 테이블:

- **combination_blocks**: 블록 문제 정의
- **block_elements**: 블록 요소 (숫자, 연산자 등)
- **student_attempts**: 학생 시도 기록
- **student_progress**: 진행 상황 요약
- **block_hints**: 힌트
- **block_solutions**: 정답 솔루션

자세한 스키마는 `database/schema.sql` 참조.

## 🎨 커스터마이징

### 새 블록 문제 추가

1. MySQL에 직접 삽입:

```sql
INSERT INTO combination_blocks
  (moodle_question_id, title, description, target_combination, difficulty_level, max_blocks)
VALUES
  (1003, '곱셈 연습', '블록을 조합하여 12를 만드세요', '12', 2, 6);

-- 블록 요소 추가
INSERT INTO block_elements
  (combination_block_id, element_type, element_value, display_text, color_code, is_unlimited)
VALUES
  (2, 'number', '3', '3', '#e74c3c', 1),
  (2, 'number', '4', '4', '#3498db', 1),
  (2, 'operator', '*', '×', '#f39c12', 1);
```

2. 또는 API 사용:

```javascript
const newBlock = {
  title: '곱셈 연습',
  description: '블록을 조합하여 12를 만드세요',
  target_combination: '12',
  difficulty_level: 2,
  max_blocks: 6,
  elements: [
    { element_type: 'number', element_value: '3', display_text: '3', color_code: '#e74c3c', is_unlimited: 1 },
    { element_type: 'number', element_value: '4', display_text: '4', color_code: '#3498db', is_unlimited: 1 },
    { element_type: 'operator', element_value: '*', display_text: '×', color_code: '#f39c12', is_unlimited: 1 }
  ]
};

await combinationBlocksAPI.createBlock(newBlock);
```

### UI 테마 변경

`frontend/src/index.css`의 CSS 변수를 수정:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --error-color: #f56565;
}
```

## 🐛 문제 해결

### Docker 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs -f

# 컨테이너 재시작
docker-compose restart

# 완전히 재구축
docker-compose down -v
docker-compose up --build
```

### API 연결 오류

1. Backend 서버가 실행 중인지 확인
2. `.env` 파일의 `VITE_API_URL` 확인
3. CORS 설정 확인 (`backend/api/index.php`)

### 데이터베이스 연결 실패

1. MySQL 서버 상태 확인
2. 데이터베이스 credentials 확인
3. 방화벽 설정 확인

## 📝 라이선스

MIT License

## 👥 기여

KAIST Touch Math Academy

## 📞 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
