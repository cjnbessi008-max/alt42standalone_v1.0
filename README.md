# Similarity Cards - 삼각형 닮음 조건 학습 시스템

Moodle LMS와 연동하여 삼각형 닮음 조건(AAA, SAS, SSS)을 빛나는 카드로 표시하는 인터랙티브 학습 앱입니다.

![Similarity Cards Preview](docs/preview.png)

## 🎯 주요 기능

- **빛나는 카드 UI**: AAA, SAS, SSS 닮음 조건을 시각적으로 아름답게 표현
- **스마트폰 디스플레이**: 우측 하단에 가상 스마트폰 화면으로 표시
- **Moodle LMS 연동**: MySQL 5.7, PHP 7.1.9, Moodle 3.7과 실시간 연동
- **애니메이션 효과**: Framer Motion을 활용한 부드러운 카드 애니메이션
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 화면 크기 지원
- **학습 진도 추적**: 학생별 문제 풀이 진행 상황 저장 및 분석

## 🏗️ 기술 스택

### Frontend
- **React 18+** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Framer Motion** - 애니메이션
- **Axios** - HTTP 클라이언트

### Backend
- **PHP 7.1.9** - Moodle API 서버
- **MySQL 5.7** - 데이터베이스
- **Moodle 3.7** - LMS 플랫폼

## 📋 필수 요구사항

- Node.js 16.0 이상
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7

## 🚀 시작하기

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Frontend 설정

```bash
cd frontend
npm install
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.

### 3. Backend 설정

#### MySQL 데이터베이스 설정

```bash
mysql -u root -p < backend/database/schema.sql
```

#### PHP API 설정

`backend/api/moodle_api.php` 파일에서 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
```

#### PHP 서버 실행

```bash
cd backend/api
php -S localhost:8080
```

Backend API는 `http://localhost:8080`에서 실행됩니다.

### 4. Moodle LMS 설정

Moodle 관리자 페이지에서:

1. **플러그인 설치**: 닮음 조건 문제 타입 설치
2. **코스 생성**: 삼각형 닮음 학습 코스 생성
3. **문제 추가**: AAA, SAS, SSS 유형의 문제 추가

## 📱 화면 구성

### 메인 화면
- 상단: 앱 제목과 설명
- 중앙: 현재 문제 표시
- 우측 하단: 스마트폰 디스플레이 (닮음 조건 카드)

### 스마트폰 디스플레이
- **펼침/접기**: 카드 목록을 펼치거나 접을 수 있음
- **최소화**: 플로팅 버튼으로 최소화
- **카드 선택**: 각 카드를 클릭하여 상세 정보 확인

## 🎨 카드 종류

### AAA (Angle-Angle-Angle)
- **색상**: 빨강 (#FF6B6B)
- **조건**: 세 각이 모두 같음
- **공식**: ∠A = ∠A', ∠B = ∠B', ∠C = ∠C'

### SAS (Side-Angle-Side)
- **색상**: 청록 (#4ECDC4)
- **조건**: 두 변의 비와 끼인각이 같음
- **공식**: AB/A'B' = AC/A'C', ∠A = ∠A'

### SSS (Side-Side-Side)
- **색상**: 민트 (#95E1D3)
- **조건**: 세 변의 비가 모두 같음
- **공식**: AB/A'B' = BC/B'C' = CA/C'A'

## 🔌 API 엔드포인트

### GET /problems
모든 문제 목록 조회

**Query Parameters:**
- `courseId` (optional): 특정 코스의 문제만 조회

**Response:**
```json
[
  {
    "id": 1,
    "questionId": 101,
    "title": "삼각형 닮음 - AAA 조건",
    "content": "문제 내용...",
    "similarityType": "AAA",
    "difficulty": "easy",
    "triangleData": {
      "triangle1": { "angles": [60, 70, 50] },
      "triangle2": { "angles": [60, 70, 50] }
    }
  }
]
```

### GET /problems/{id}
특정 문제 조회

### POST /progress
학습 진도 저장

**Request Body:**
```json
{
  "problemId": 1,
  "attempts": 3,
  "isCorrect": true,
  "timeSpent": 120
}
```

### GET /progress/{studentId}
학생 진도 조회

### POST /auth
사용자 인증

**Request Body:**
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "student1",
    "firstname": "홍",
    "lastname": "길동"
  }
}
```

## 🎯 사용 시나리오

1. **학생 로그인**: Moodle 계정으로 로그인
2. **문제 로드**: Moodle에서 할당된 문제 자동 로드
3. **카드 학습**: 우측 하단 스마트폰 화면에서 닮음 조건 카드 확인
4. **문제 풀이**: 현재 문제에 맞는 닮음 조건 선택
5. **진도 저장**: 자동으로 학습 진행 상황 저장
6. **다음 문제**: 이전/다음 버튼으로 문제 이동

## 🛠️ 개발 가이드

### 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 앱
│   ├── src/
│   │   ├── components/      # UI 컴포넌트
│   │   │   ├── SimilarityCard.tsx
│   │   │   ├── SimilarityCardList.tsx
│   │   │   └── SmartphoneDisplay.tsx
│   │   ├── services/        # API 서비스
│   │   │   └── moodleService.ts
│   │   ├── types/           # TypeScript 타입
│   │   │   └── similarity.ts
│   │   ├── styles/          # CSS 스타일
│   │   ├── data/            # 정적 데이터
│   │   ├── App.tsx          # 메인 앱
│   │   └── main.tsx         # 엔트리 포인트
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # PHP API
│   ├── api/
│   │   └── moodle_api.php   # RESTful API
│   └── database/
│       └── schema.sql        # DB 스키마
└── README.md
```

### 새로운 닮음 조건 추가

1. `frontend/src/data/similarityConditions.ts`에 조건 추가:

```typescript
{
  id: 'new_condition',
  type: 'NEW',
  name: 'New Condition',
  nameKo: '새로운 조건',
  description: 'Description...',
  descriptionKo: '설명...',
  formula: 'formula',
  example: 'example',
  color: '#COLOR',
  icon: '아이콘'
}
```

2. TypeScript 타입 업데이트:

```typescript
export type SimilarityType = 'AAA' | 'SAS' | 'SSS' | 'NEW';
```

### 스타일 커스터마이징

주요 CSS 변수는 각 컴포넌트의 CSS 파일에서 수정할 수 있습니다:

- `SimilarityCard.css` - 카드 디자인
- `SmartphoneDisplay.css` - 스마트폰 프레임
- `App.css` - 전체 레이아웃

## 🧪 테스트

```bash
# Frontend 테스트
cd frontend
npm run test

# Build 테스트
npm run build
npm run preview
```

## 📦 배포

### Frontend 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist/` 디렉토리에 생성됩니다.

### Production 설정

1. `vite.config.ts`에서 프록시 설정을 실제 API 서버로 변경
2. `moodleService.ts`에서 API_BASE_URL을 프로덕션 URL로 변경
3. PHP API를 Apache/Nginx에 배포
4. MySQL 데이터베이스 보안 설정

## 🔐 보안 고려사항

- ✅ CORS 설정 확인
- ✅ SQL Injection 방지 (PDO Prepared Statements)
- ✅ XSS 방지
- ✅ JWT 토큰 인증
- ⚠️ HTTPS 사용 권장
- ⚠️ 환경변수로 DB 인증정보 관리

## 📄 라이선스

This project is licensed under the MIT License.

## 👥 기여

Pull Request와 Issue는 언제나 환영합니다!

## 📞 문의

프로젝트 관련 문의사항은 Issue를 통해 남겨주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
