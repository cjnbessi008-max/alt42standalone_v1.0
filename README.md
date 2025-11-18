# 부분합 흐름 시각화 시스템 (Partial Sum Flow Visualization)

LMS(Moodle 3.7)와 연동되는 부분합 그래프 시각화 웹 애플리케이션으로, 우측 하단 가상 스마트폰 화면에 부드러운 곡선으로 표현됩니다.

## 🎯 주요 기능

- **부드러운 곡선 시각화**: D3.js와 Bézier 곡선을 사용한 부분합 흐름 그래프
- **가상 스마트폰 디스플레이**: 우측 하단에 표시되는 모바일 친화적 인터페이스
- **Moodle LMS 연동**: MySQL 5.7 데이터베이스를 통한 실시간 문제 데이터 수신
- **실시간 애니메이션**: 부분합 계산 과정을 단계별로 시각화
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 모든 기기 지원

## 🛠 기술 스택

### Frontend
- **React 18+** with TypeScript
- **D3.js 7.8+** - 데이터 시각화
- **Material-UI 5** - UI 컴포넌트
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

### Backend
- **PHP 7.1.9** - Moodle 호환성
- **MySQL 5.7** - 데이터베이스
- **Moodle 3.7** - LMS 플랫폼

### Visualization
- **Catmull-Rom Splines** - 부드러운 곡선 생성
- **SVG/Canvas** - 그래프 렌더링
- **CSS3 Animations** - UI 애니메이션

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력
```

### 3. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 선택 (Moodle 데이터베이스)
USE moodle;

# 스키마 실행
source src/database/schemas/partial_sum_schema.sql
```

### 4. Frontend 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.

### 5. Backend (PHP API) 설정

```bash
# PHP 내장 서버로 실행
cd src/backend
php -S localhost:8080

# 또는 Apache/Nginx 설정
```

Backend API는 `http://localhost:8080/api`에서 접근 가능합니다.

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── frontend/              # React 프론트엔드
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── PartialSumFlowCurve.tsx    # 메인 시각화 컴포넌트
│   │   │   └── VirtualSmartphone.tsx      # 가상 스마트폰 디스플레이
│   │   ├── services/          # API 서비스
│   │   │   └── MoodleService.ts           # Moodle LMS 연동
│   │   ├── styles/            # CSS 스타일
│   │   ├── App.tsx            # 메인 앱 컴포넌트
│   │   └── main.tsx           # 엔트리 포인트
│   ├── backend/               # PHP 백엔드
│   │   ├── api/               # REST API 엔드포인트
│   │   │   └── index.php      # API 라우터
│   │   ├── moodle/            # Moodle 연동 레이어
│   │   │   └── MoodleIntegration.php
│   │   └── config/            # 설정 파일
│   │       └── database.php   # DB 연결 설정
│   └── database/              # 데이터베이스
│       ├── schemas/           # DB 스키마
│       │   └── partial_sum_schema.sql
│       └── migrations/        # 마이그레이션
├── public/                    # 정적 파일
├── docs/                      # 문서
├── package.json               # Node.js 의존성
├── tsconfig.json              # TypeScript 설정
├── vite.config.ts             # Vite 설정
├── .env.example               # 환경 변수 예시
└── README.md                  # 이 파일
```

## 🎨 주요 컴포넌트

### 1. PartialSumFlowCurve

부분합을 부드러운 곡선으로 시각화하는 메인 컴포넌트입니다.

```typescript
<PartialSumFlowCurve
  data={[1, 2, 3, 4, 5]}
  title="부분합 흐름 곡선"
  width={700}
  height={500}
  curveType="smooth"  // 'smooth' | 'linear' | 'step'
  animationSpeed={2000}
  showControls={true}
/>
```

**주요 기능:**
- Catmull-Rom Spline을 사용한 부드러운 곡선
- 단계별 애니메이션 재생/일시정지
- 그라디언트 색상 효과
- 반응형 SVG 렌더링
- 데이터 포인트 레이블 표시

### 2. VirtualSmartphone

가상 스마트폰 프레임 내에 콘텐츠를 표시합니다.

```typescript
<VirtualSmartphone position="bottom-right" scale={0.85}>
  <YourContent />
</VirtualSmartphone>
```

**특징:**
- 실제 스마트폰 UI 디자인 (노치, 홈 인디케이터 포함)
- 위치 조정 가능 (bottom-right, bottom-left, center)
- 스케일 조정
- 스크롤 가능한 콘텐츠 영역

### 3. MoodleService

Moodle LMS와의 API 통신을 담당합니다.

```typescript
import { moodleService } from './services/MoodleService';

// 문제 가져오기
const problems = await moodleService.getAllProblems();

// 답안 제출
const result = await moodleService.submitAnswer(problemId, answer);

// 시도 기록 조회
const history = await moodleService.getAttemptHistory(problemId);
```

## 🔌 API 엔드포인트

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "student1",
    "firstname": "학생",
    "lastname": "일"
  }
}
```

### Problems

```http
GET /api/problems
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "questionId": 101,
    "title": "부분합 문제 1",
    "description": "다음 배열의 부분합을 계산하세요",
    "dataArray": [1, 2, 3, 4, 5],
    "expectedAnswer": 15,
    "createdAt": "2025-11-18T...",
    "updatedAt": "2025-11-18T..."
  }
]
```

```http
GET /api/problems/{id}
Authorization: Bearer {token}

Response: Single problem object
```

### Attempts

```http
POST /api/attempts
Authorization: Bearer {token}
Content-Type: application/json

{
  "problemId": 1,
  "answer": 15
}

Response:
{
  "attemptId": 123,
  "studentId": 1,
  "problemId": 1,
  "answer": 15,
  "isCorrect": true,
  "submittedAt": "2025-11-18T..."
}
```

```http
GET /api/attempts/{problemId}
Authorization: Bearer {token}

Response: Array of attempt objects
```

### Progress

```http
GET /api/progress
Authorization: Bearer {token}

Response:
{
  "total_problems_attempted": 5,
  "total_problems_correct": 4,
  "total_attempts": 8
}
```

## 📊 데이터베이스 스키마

### mdl_partialsum_problems

문제 데이터를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| question_id | BIGINT(10) | Moodle 질문 ID (선택) |
| title | VARCHAR(255) | 문제 제목 |
| description | TEXT | 문제 설명 |
| data_array | TEXT | JSON 형식의 숫자 배열 |
| expected_answer | BIGINT(20) | 정답 |
| difficulty_level | ENUM | 난이도 (easy/medium/hard) |
| created_by | BIGINT(10) | 생성자 ID |

### mdl_partialsum_attempts

학생 시도 기록을 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| student_id | BIGINT(10) | 학생 ID |
| problem_id | BIGINT(10) | 문제 ID |
| answer | BIGINT(20) | 제출한 답 |
| is_correct | TINYINT(1) | 정답 여부 |
| time_spent | INT(11) | 소요 시간 (초) |
| submitted_at | TIMESTAMP | 제출 시간 |

### mdl_partialsum_progress

학생 진도를 추적합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| student_id | BIGINT(10) | 학생 ID |
| total_problems_attempted | INT(11) | 시도한 문제 수 |
| total_problems_correct | INT(11) | 맞춘 문제 수 |
| total_attempts | INT(11) | 총 시도 횟수 |
| last_activity | TIMESTAMP | 마지막 활동 시간 |

## 🎮 사용 방법

### 학생용

1. Moodle 계정으로 로그인
2. 문제 선택 드롭다운에서 원하는 문제 선택
3. 부분합 흐름 곡선 애니메이션 시청
4. 최종 부분합 값을 계산하여 답안 입력
5. 제출 버튼 클릭
6. 즉시 피드백 확인

### 교사용

1. MySQL 데이터베이스에 직접 문제 추가:

```sql
INSERT INTO mdl_partialsum_problems
  (title, description, data_array, expected_answer, difficulty_level, created_by)
VALUES
  ('새 문제', '설명', '[1,2,3]', 6, 'easy', 2);
```

2. 또는 Moodle 관리 페이지에서 문제 관리 (향후 구현 예정)

## 🎯 곡선 타입

### 1. Smooth (부드러운 곡선) - 기본값

Catmull-Rom Spline을 사용하여 데이터 포인트를 부드럽게 연결합니다.

```typescript
curveType="smooth"  // d3.curveCatmullRom
```

### 2. Linear (직선)

데이터 포인트를 직선으로 연결합니다.

```typescript
curveType="linear"  // d3.curveLinear
```

### 3. Step (계단형)

계단 형태로 연결합니다.

```typescript
curveType="step"  // d3.curveStep
```

## 🔧 커스터마이징

### 색상 변경

`src/frontend/components/PartialSumFlowCurve.tsx`에서 그라디언트 색상 수정:

```typescript
gradient.append('stop')
  .attr('offset', '0%')
  .attr('stop-color', '#667eea')  // 시작 색상
  .attr('stop-opacity', 0.8);

gradient.append('stop')
  .attr('offset', '100%')
  .attr('stop-color', '#764ba2')  // 끝 색상
  .attr('stop-opacity', 0.8);
```

### 애니메이션 속도

```typescript
<PartialSumFlowCurve
  animationSpeed={1000}  // 1초 (기본값: 2000ms)
/>
```

### 스마트폰 위치

```typescript
<VirtualSmartphone
  position="bottom-left"  // 'bottom-right' | 'bottom-left' | 'center'
  scale={1.0}  // 0.1 ~ 2.0
/>
```

## 🚀 배포

### Production 빌드

```bash
# Frontend 빌드
npm run build

# 빌드된 파일은 dist/ 디렉토리에 생성됨
```

### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName partialsum.example.com
    DocumentRoot /var/www/alt42standalone_v1.0/dist

    # Frontend (static files)
    <Directory /var/www/alt42standalone_v1.0/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Backend API
    Alias /api /var/www/alt42standalone_v1.0/src/backend/api
    <Directory /var/www/alt42standalone_v1.0/src/backend/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name partialsum.example.com;
    root /var/www/alt42standalone_v1.0/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        alias /var/www/alt42standalone_v1.0/src/backend/api;
        index index.php;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

## 🐛 트러블슈팅

### MySQL 연결 오류

```
Error: Database connection failed
```

**해결 방법:**
1. `.env` 파일의 데이터베이스 정보 확인
2. MySQL 서비스 실행 확인: `sudo service mysql status`
3. 사용자 권한 확인

### CORS 오류

```
Access to fetch at 'http://localhost:8080/api' blocked by CORS policy
```

**해결 방법:**
Backend API (`src/backend/api/index.php`)의 CORS 헤더가 올바른지 확인:

```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
```

### JWT 토큰 오류

```
Error: Unauthorized (401)
```

**해결 방법:**
1. 로그인이 성공적으로 완료되었는지 확인
2. 로컬스토리지에 토큰이 저장되었는지 확인
3. 토큰 만료 시간 확인 (기본 1시간)

## 📝 라이센스

MIT License

## 👥 기여자

- KAIST Touch Math Academy

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

## 🔮 향후 계획

- [ ] 교사용 관리 대시보드
- [ ] 실시간 협업 기능
- [ ] 다국어 지원 (한국어, 영어)
- [ ] 모바일 네이티브 앱 (React Native)
- [ ] AI 기반 난이도 자동 조정
- [ ] 게임화 요소 추가 (배지, 리더보드)
- [ ] 더 많은 시각화 옵션 (3D, VR)
- [ ] 오프라인 모드 지원

---

**Made with ❤️ for KAIST Touch Math Academy**
