# 조건 스캐너 (Condition Scanner)

Moodle LMS의 조건부 활동을 시각화하고 분석하는 독립형 웹 애플리케이션입니다.

## 📋 주요 기능

- **🔍 조건 스캐너**: Moodle 활동의 접근 조건을 자동으로 파싱하고 분석
- **📱 가상 스마트폰 화면**: 우측 하단에 스마트폰 UI로 실시간 시각화
- **✨ 순차적 하이라이트**: 조건들을 차례대로 하이라이트하며 스캔
- **💾 데이터 저장**: MySQL에 조건 및 스캔 기록 저장
- **🔗 Moodle 연동**: Moodle Web Services API를 통한 실시간 데이터 연동

## 🛠️ 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 부드러운 애니메이션

### 백엔드
- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **MySQL 5.7** - 관계형 데이터베이스
- **Axios** - HTTP 클라이언트

### Moodle 연동
- **Moodle 3.7** 이상
- **PHP 7.1.9** 이상
- **Moodle Web Services API**

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── VirtualPhone.tsx       # 가상 스마트폰 UI
│   │   │   ├── ConditionScanner.tsx   # 조건 스캐너
│   │   │   └── ControlPanel.tsx       # 제어판
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── App.tsx        # 메인 앱
│   └── package.json
├── backend/               # Node.js 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   │   ├── database.js   # MySQL 연결
│   │   │   └── moodle.js     # Moodle API 연동
│   │   └── server.js      # Express 서버
│   └── package.json
├── database/              # 데이터베이스 스키마
│   ├── schema.sql         # MySQL 스키마
│   └── init.js            # DB 초기화 스크립트
└── README.md
```

## 🚀 시작하기

### 1. 사전 요구사항

- **Node.js** 18+
- **MySQL** 5.7+
- **Moodle** 3.7+ (Web Services 활성화 필요)

### 2. 설치

```bash
# 저장소 클론
cd alt42standalone_v1.0

# 모든 의존성 설치
npm run install:all
```

### 3. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 초기화 (자동)
cd database
npm install
npm run init
```

또는 수동으로:

```bash
mysql -u root -p < database/schema.sql
```

### 4. 환경 변수 설정

#### 백엔드 설정 (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

`.env` 파일 편집:

```env
# 서버 설정
PORT=5000
NODE_ENV=development

# MySQL 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=condition_scanner

# Moodle 설정
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 5. Moodle Web Services 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** → "웹 서비스 활성화" 체크
3. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스** → 새 서비스 생성
4. 필요한 함수 추가:
   - `core_course_get_contents`
   - `core_webservice_get_site_info`
5. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리** → 토큰 생성
6. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 6. 실행

#### 개발 모드 (프론트엔드 + 백엔드 동시 실행)

```bash
# 루트 디렉토리에서
npm run dev
```

#### 개별 실행

```bash
# 프론트엔드만
npm run dev:frontend

# 백엔드만
npm run dev:backend
```

### 7. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 📖 사용 방법

1. **Moodle 연결 확인**: 제어판에서 연결 상태 확인 (초록불)

2. **코스 로드**:
   - 코스 ID 입력
   - "로드" 버튼 클릭

3. **활동 선택**:
   - 드롭다운에서 분석할 활동 선택

4. **조건 스캔 시작**:
   - 스캔 속도 선택 (1~5초)
   - "스캔 시작" 버튼 클릭
   - 우측 스마트폰 화면에서 실시간 하이라이트 확인

5. **스캔 제어**:
   - 일시정지/재개
   - 중지

## 🔌 API 엔드포인트

### Moodle API

```
GET  /api/moodle/test
     → Moodle 연결 테스트

GET  /api/moodle/activities/:courseId
     → 코스의 활동 목록 가져오기
```

### 조건 API

```
GET  /api/conditions/:activityId
     → 활동의 조건 가져오기

POST /api/conditions/:activityId
     → 조건 저장/업데이트

DELETE /api/conditions/:activityId
       → 조건 삭제
```

### 스캔 기록 API

```
POST /api/scan-history
     → 스캔 기록 저장

GET  /api/scan-history/activity/:activityId
     → 특정 활동의 스캔 기록 조회

GET  /api/scan-history
     → 모든 스캔 기록 조회
```

## 📊 데이터베이스 스키마

### activities
```sql
- id (INT, PK)
- name (VARCHAR)
- modulename (VARCHAR)
- course_id (INT)
- availability (TEXT)
- created_at, updated_at
```

### conditions
```sql
- id (VARCHAR, PK)
- activity_id (INT, FK)
- type (VARCHAR) - completion, grade, date, group, user, custom
- description (TEXT)
- operator (VARCHAR) - AND, OR
- value (TEXT)
- parent_id (VARCHAR) - 중첩 조건용
```

### scan_history
```sql
- id (INT, PK, AUTO_INCREMENT)
- activity_id (INT, FK)
- scan_data (JSON)
- timestamp (TIMESTAMP)
```

## 🎨 조건 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| **completion** | 활동 완료 조건 | "과제 1 완료 필요" |
| **grade** | 성적 조건 | "70% 이상 획득" |
| **date** | 날짜 조건 | "2024-01-01 이후" |
| **group** | 그룹 조건 | "그룹 A 멤버" |
| **user** | 사용자 프로필 조건 | "학년이 3학년" |
| **custom** | 커스텀 조건 | 기타 조건 |

## 🛠️ 개발

### 코드 구조

```typescript
// 타입 정의 (frontend/src/types/index.ts)
interface Condition {
  id: string;
  type: 'completion' | 'grade' | 'date' | 'group' | 'user' | 'custom';
  description: string;
  operator?: 'AND' | 'OR';
  value?: string | number;
  nested?: Condition[];
}

interface ScanState {
  currentIndex: number;
  isScanning: boolean;
  isPaused: boolean;
  speed: number;
}
```

### 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 빌드 결과는 frontend/dist/ 에 생성됨
```

## 🐛 문제 해결

### Moodle 연결 실패

- Web Services가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- CORS 설정 확인 (Moodle 사이트 관리)

### 데이터베이스 연결 오류

- MySQL이 실행 중인지 확인
- `.env` 파일의 DB 설정 확인
- 데이터베이스와 사용자 권한 확인

### 포트 충돌

- 3000번(프론트엔드) 또는 5000번(백엔드) 포트가 사용 중인 경우
- `.env`에서 `PORT` 변경 또는 실행 중인 프로세스 종료

## 📝 라이선스

MIT License

## 👥 기여

기여는 언제나 환영합니다!

1. Fork
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**Made with ❤️ for Moodle educators and learners**
