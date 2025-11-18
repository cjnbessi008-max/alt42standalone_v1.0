# Composition Puzzle - 합성함수 퍼즐 앱

Moodle LMS와 연동되는 인터랙티브 합성함수 학습 웹 애플리케이션

## 📱 프로젝트 개요

학생들이 함수를 퍼즐처럼 조립하여 합성함수(f∘g)의 개념을 학습하는 교육용 웹앱입니다.
우측 하단 가상 스마트폰 화면에서 직관적인 드래그 앤 드롭 인터페이스를 제공합니다.

## 🏗️ 아키텍처

```
┌─────────────────┐
│  Moodle 3.7     │
│  (LTI Provider) │
└────────┬────────┘
         │ LTI 1.1
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Node.js        │◄────►│  MySQL 5.7       │
│  Express Backend│      │  Database        │
└────────┬────────┘      └──────────────────┘
         │ REST API
         ▼
┌─────────────────┐
│  React          │
│  TypeScript     │
│  Frontend       │
└─────────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **React DnD** (드래그 앤 드롭)
- **TailwindCSS** (스타일링)
- **Zustand** (상태 관리)

### Backend
- **Node.js 18+** + Express
- **LTI 1.1** (Moodle 연동)
- **MySQL 5.7** (데이터베이스)
- **JWT** (인증)

### DevOps
- **Docker** + Docker Compose
- **nginx** (리버스 프록시)

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose
- MySQL 5.7

### 1. 의존성 설치

```bash
# 프론트엔드
cd frontend
npm install

# 백엔드
cd ../backend
npm install
```

### 2. 환경 변수 설정

```bash
# backend/.env
cp .env.example .env
# 필요한 값 수정 (MySQL 연결 정보, LTI 시크릿 등)
```

### 3. 데이터베이스 설정

```bash
# MySQL 시작
docker-compose up -d mysql

# 스키마 생성
mysql -h localhost -u root -p < database/schema.sql
```

### 4. 개발 서버 실행

```bash
# 백엔드 (포트 3000)
cd backend
npm run dev

# 프론트엔드 (포트 5173)
cd frontend
npm run dev
```

### 5. Docker로 전체 실행

```bash
docker-compose up -d
```

## 🎮 주요 기능

### 1. 함수 블록 시스템
- 기본 함수 블록 (f(x) = x+2, g(x) = 2x 등)
- 드래그 앤 드롭으로 조립
- 실시간 결과 계산

### 2. 합성함수 시각화
- 함수 체인 표시
- 단계별 계산 과정 보기
- 그래프 시각화

### 3. Moodle 연동
- LTI 1.1 통합
- 문제 정보 자동 수신
- 성적 자동 보고

### 4. 스마트폰 시뮬레이터
- 우측 하단 고정 위치
- 실제 모바일 화면 비율
- 반응형 디자인

## 📱 Moodle 설정

### LTI 외부 도구 등록

1. Moodle 관리자 로그인
2. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리**
3. **외부 도구 구성** 추가:
   - **도구 이름**: Composition Puzzle
   - **도구 URL**: `https://your-domain.com/lti/launch`
   - **소비자 키**: `composition_puzzle_key`
   - **공유 비밀**: (생성된 시크릿)
   - **개인정보 보호**: 이름, 이메일, 성적 공유 활성화

4. 과정에 **외부 도구** 활동 추가

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **problems**: 문제 정보
- **functions**: 사용 가능한 함수 목록
- **student_attempts**: 학생 시도 기록
- **lti_sessions**: LTI 세션 관리

자세한 스키마: `database/schema.sql` 참조

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 📖 API 문서

### 주요 엔드포인트

- `POST /lti/launch` - LTI 론치 처리
- `GET /api/problems/:id` - 문제 조회
- `POST /api/attempts` - 답안 제출
- `GET /api/functions` - 사용 가능한 함수 목록

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 제작

KAIST Touch Math Academy - AI Education System

## 📧 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.
