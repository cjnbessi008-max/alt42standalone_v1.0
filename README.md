# Logical Linker - 논리연결사 학습 시스템

**논리연결사(그리고/또는/이면)를 애니메이션 링크로 표현하는 인터랙티브 학습 웹앱**

Moodle LMS와 연동되어 문제 정보를 받아 동작하며, 우측 하단 가상 스마트폰 화면에 학습 콘텐츠를 표시합니다.

## 🎯 주요 기능

- **논리연결사 시각화**: AND(그리고), OR(또는), IF-THEN(이면) 연산을 애니메이션으로 표현
- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰과 같은 인터페이스 제공
- **Moodle 연동**: Moodle 3.7 LMS와 Web Service API로 연동
- **진행상황 추적**: 학생의 학습 진도와 정답률을 실시간 추적
- **인터랙티브 학습**: 클릭과 애니메이션을 통한 직관적인 학습 경험

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Framer Motion** - 부드러운 애니메이션
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Zustand** - 상태 관리
- **Vite** - 빠른 개발 환경

### Backend
- **PHP 7.1.9** (Moodle 환경 호환)
- **MySQL 5.7**
- RESTful API

### 연동
- **Moodle 3.7** Web Services API

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── SmartphoneScreen.tsx      # 가상 스마트폰 UI
│   │   │   ├── LogicalLinkAnimation.tsx  # 논리연결사 애니메이션
│   │   │   ├── OperandNode.tsx          # 명제 노드
│   │   │   └── QuestionDisplay.tsx      # 문제 표시
│   │   ├── services/        # API 서비스
│   │   ├── stores/          # Zustand 스토어
│   │   ├── types/           # TypeScript 타입
│   │   └── styles/          # CSS 스타일
│   ├── public/
│   └── package.json
│
├── backend/                  # PHP 백엔드
│   ├── api/                 # API 엔드포인트
│   │   ├── questions.php
│   │   └── moodle_service.php
│   ├── config/              # 설정 파일
│   │   ├── config.php
│   │   └── database.php
│   └── models/              # 데이터 모델
│       ├── Question.php
│       └── StudentProgress.php
│
├── database/                 # 데이터베이스
│   └── schema.sql           # MySQL 스키마
│
└── docs/                     # 문서
```

## 🚀 설치 및 실행

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 2. 백엔드 설정

```bash
# 환경 변수 설정
cd backend
cp .env.example .env

# .env 파일 편집
DB_HOST=localhost
DB_NAME=logical_linker
DB_USER=root
DB_PASS=your_password

MOODLE_URL=http://your-moodle-url
MOODLE_TOKEN=your_moodle_token
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# .env 파일 편집
VITE_API_URL=http://localhost:8000/api
```

### 4. 실행

```bash
# 백엔드 실행 (PHP 내장 서버)
cd backend
php -S localhost:8000

# 프론트엔드 실행 (새 터미널)
cd frontend
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 🎨 애니메이션 타입

### 1. Flow (흐름)
- 파티클이 노드 사이를 이동
- IF-THEN(이면) 연산에 사용
- 조건 → 결과의 흐름을 시각화

### 2. Connect (연결)
- 두 노드를 선으로 연결
- AND(그리고) 연산에 사용
- 두 조건의 결합을 표현

### 3. Branch (분기)
- 한 노드에서 여러 노드로 분기
- OR(또는) 연산에 사용
- 선택적 조건을 시각화

### 4. Pulse (펄스)
- 노드가 박동하는 애니메이션
- 강조 및 피드백에 사용

## 📊 데이터베이스 스키마

### 주요 테이블

- **questions**: 문제 정보
- **logical_operators**: 논리연결사 정의
- **question_operators**: 문제-연산자 관계
- **students**: 학생 정보
- **student_progress**: 학습 진행상황
- **animation_settings**: 애니메이션 설정
- **moodle_sync_logs**: Moodle 동기화 로그

## 🔗 Moodle 연동

### Web Service 설정

1. Moodle 관리자 페이지 → 플러그인 → 웹 서비스 → 개요
2. "웹 서비스 활성화" 체크
3. 프로토콜 활성화 (REST)
4. 서비스 생성 및 함수 추가:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_questions`
   - `core_question_get_questions`

5. 토큰 생성 및 `.env`에 설정

### API 사용 예시

```php
// 문제 동기화
$moodleService = new MoodleService();
$moodleService->syncQuestion($moodle_question_id, $db);

// 사용자 정보 가져오기
$userInfo = $moodleService->getUserInfo($user_id);

// 성적 제출
$moodleService->submitGrade($user_id, $quiz_id, $grade);
```

## 🎮 사용 방법

### 학생 관점

1. **시작하기**: 메인 화면에서 "시작하기" 버튼 클릭
2. **문제 확인**: 우측 하단 스마트폰 화면에 문제가 표시됨
3. **애니메이션 관찰**: 논리연결사가 애니메이션으로 표현됨
4. **답변 선택**: 각 논리연결사의 결과(참/거짓) 선택
5. **제출**: "제출하기" 버튼으로 답안 제출
6. **결과 확인**: 정답 여부와 해설 확인

### 선생님 관점 (Moodle)

1. Moodle에서 퀴즈 문제 작성
2. 문제 내용에 논리연결사 포함 (그리고, 또는, 이면)
3. Logical Linker가 자동으로 문제를 감지하고 시각화
4. 학생 학습 진행상황을 Moodle에서 확인

## 🔧 개발

### 프론트엔드 개발

```bash
cd frontend

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint
```

### 백엔드 개발

```bash
cd backend

# PHP 내장 서버
php -S localhost:8000

# 로그 확인
tail -f logs/app.log
tail -f logs/error.log
```

## 📝 API 엔드포인트

### Questions

- `GET /api/questions` - 모든 문제 조회
- `GET /api/questions/{id}` - 특정 문제 조회
- `GET /api/questions/random` - 랜덤 문제 조회
- `POST /api/questions` - 문제 생성
- `PUT /api/questions/{id}` - 문제 수정
- `DELETE /api/questions/{id}` - 문제 삭제

### Progress

- `POST /api/progress` - 진행상황 생성
- `PUT /api/progress/{id}` - 진행상황 업데이트
- `GET /api/progress/student/{id}/stats` - 학생 통계

### Moodle

- `POST /api/moodle/sync/question` - Moodle 문제 동기화
- `GET /api/moodle/test` - Moodle 연결 테스트

## 🧪 테스트 데이터

기본 논리연결사 데이터가 자동으로 삽입됩니다:

- **AND (그리고)**: 녹색(#4CAF50), Connect 애니메이션
- **OR (또는)**: 파란색(#2196F3), Branch 애니메이션
- **IF-THEN (이면)**: 주황색(#FF9800), Flow 애니메이션

## 🎯 향후 개발 계획

- [ ] 더 다양한 애니메이션 효과
- [ ] 음성 지원
- [ ] 다국어 지원 (영어)
- [ ] 난이도 자동 조절
- [ ] 학습 분석 대시보드
- [ ] 모바일 네이티브 앱

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

KAIST Touch Math Academy

## 📧 문의

문제가 있거나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Powered by Moodle LMS • KAIST Touch Math Academy**
