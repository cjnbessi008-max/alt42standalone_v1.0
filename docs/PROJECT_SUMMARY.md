# Term Motion 프로젝트 요약

## 📌 프로젝트 개요

**Term Motion**은 수학 수식의 단항(term)별 움직임을 애니메이션으로 시각화하여 학생들이 수학 개념을 직관적으로 이해할 수 있도록 돕는 교육용 웹 애플리케이션입니다.

## 🎯 핵심 기능

### 1. **수식 파싱 및 분석**
- 대수식을 항(term) 단위로 파싱
- 계수, 변수, 지수 자동 추출
- 동류항 자동 인식 및 결합

### 2. **애니메이션 시각화**
- Framer Motion 기반 부드러운 애니메이션
- 항의 이동, 결합, 변환 과정 시각화
- 단계별 설명 제공 (한국어/영어)

### 3. **가상 스마트폰 UI**
- 실제 스마트폰 모양의 프레임
- 반응형 디자인
- 상태 바, 홈 인디케이터 등 실감나는 UI

### 4. **Moodle LMS 연동**
- Moodle 3.7과 데이터베이스 연동
- 문제 정보 동기화
- 학생 진행 상황 추적

### 5. **진행 상황 관리**
- 학생별 학습 진도 추적
- 시간 소요, 시도 횟수 기록
- 통계 및 분석 기능

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│         Frontend (React + TS)            │
│  - Vite, Framer Motion, Tailwind        │
└─────────────┬───────────────────────────┘
              │ REST API
┌─────────────▼───────────────────────────┐
│         Backend (PHP 7.1.9)             │
│  - RESTful API, PDO                     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Database (MySQL 5.7)            │
│  - Problems, Progress, Students         │
└─────────────────────────────────────────┘
```

## 📦 주요 컴포넌트

### Frontend

1. **MathParser** (`utils/mathParser.ts`)
   - 수식 문자열 파싱
   - LaTeX 변환
   - 동류항 결합

2. **TermMotionPlayer** (`components/TermMotion/TermMotionPlayer.tsx`)
   - 애니메이션 플레이어
   - 재생 컨트롤 (재생/일시정지/단계 이동)
   - 진행률 표시

3. **ExpressionDisplay** (`components/MathExpression/ExpressionDisplay.tsx`)
   - 수식 시각화
   - 항 강조 표시
   - 애니메이션 적용

4. **SmartphoneFrame** (`components/SmartphoneFrame/SmartphoneFrame.tsx`)
   - 가상 스마트폰 프레임
   - 위치 조정 가능 (우측 하단, 중앙, 좌측 하단)

5. **MoodleApiService** (`services/moodleApi.ts`)
   - Moodle API 통신
   - 인증 관리
   - 문제/진행 상황 CRUD

### Backend

1. **Problems API** (`api/problems.php`)
   - GET /api/problems - 문제 목록
   - GET /api/problems/:id - 특정 문제
   - POST /api/problems - 문제 생성
   - PUT /api/problems/:id - 문제 수정
   - DELETE /api/problems/:id - 문제 삭제

2. **Progress API** (`api/progress.php`)
   - GET /api/progress - 진행 상황 조회
   - POST /api/progress - 진행 상황 업데이트

3. **Database Config** (`config/database.php`)
   - MySQL 연결 관리
   - Moodle DB 연결

### Database

1. **problems** 테이블
   - 문제 정보, 초기/목표 수식, 애니메이션 단계

2. **student_progress** 테이블
   - 학생별 진행 상황, 시간, 시도 횟수

3. **students** 테이블
   - Moodle 사용자 정보 캐시

4. **categories** 테이블
   - 문제 카테고리 관리

## 🚀 실행 방법

### Docker 사용 (권장)

```bash
# 1. 전체 시스템 실행
docker-compose up -d

# 2. 브라우저에서 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# MySQL: localhost:3306
```

### 로컬 개발

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
php -S localhost:8080

# MySQL
mysql -u root -p < database/schema.sql
```

## 📊 데이터 흐름

```
1. 학생이 문제 선택
   ↓
2. Frontend → Backend API (GET /api/problems/:id)
   ↓
3. Backend → MySQL (문제 정보 조회)
   ↓
4. MySQL → Backend (문제 데이터 반환)
   ↓
5. Backend → Frontend (JSON 응답)
   ↓
6. Frontend: 수식 파싱 + 애니메이션 생성
   ↓
7. 학생이 애니메이션 시청
   ↓
8. Frontend → Backend API (POST /api/progress)
   ↓
9. Backend → MySQL (진행 상황 저장)
```

## 🔧 기술 스택 선택 이유

### Frontend: React + TypeScript
- **React**: 컴포넌트 재사용성, 강력한 생태계
- **TypeScript**: 타입 안정성, IDE 지원
- **Vite**: 빠른 HMR, 현대적인 번들러
- **Framer Motion**: 부드러운 애니메이션, React 통합
- **Tailwind CSS**: 빠른 스타일링, 일관성

### Backend: PHP 7.1.9
- **Moodle 3.7 호환성**: 동일한 PHP 버전 사용
- **간단한 연동**: Moodle DB 직접 접근 가능
- **낮은 학습 곡선**: 많은 개발자가 익숙

### Database: MySQL 5.7
- **Moodle 표준**: Moodle이 MySQL 사용
- **JSON 지원**: 애니메이션 단계 저장
- **안정성**: 검증된 기술

## 📈 향후 개선 사항

### Phase 1 (단기)
- [ ] 더 복잡한 수식 지원 (분수, 제곱근)
- [ ] 다양한 애니메이션 효과
- [ ] 음성 설명 추가
- [ ] 모바일 앱 버전

### Phase 2 (중기)
- [ ] AI 기반 문제 자동 생성
- [ ] 학생 맞춤형 학습 경로
- [ ] 실시간 협업 기능
- [ ] 게임화 요소 (점수, 배지)

### Phase 3 (장기)
- [ ] VR/AR 지원
- [ ] 다국어 지원 확대
- [ ] 다른 과목 확장 (물리, 화학)
- [ ] 교사 대시보드 고도화

## 🧪 테스트

### 단위 테스트
```bash
# Frontend
cd frontend
npm run test

# Backend (PHPUnit 필요)
cd backend
./vendor/bin/phpunit
```

### E2E 테스트
```bash
# Cypress 또는 Playwright 사용 예정
```

## 📝 문서

- [README.md](../README.md) - 프로젝트 소개 및 시작 가이드
- [SETUP.md](./SETUP.md) - 상세 설치 및 설정 가이드
- [API.md](./API.md) - API 문서
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 이 문서

## 🤝 기여 가이드

1. 이슈 생성 또는 기존 이슈 선택
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📜 라이선스

MIT License

## 👥 팀

**KAIST Touch Math Academy**

## 📧 연락처

문의사항은 GitHub Issues를 통해 남겨주세요.

---

**Built with ❤️ for Education**
