# Divisor Molecules - 프로젝트 요약

## 🎯 프로젝트 개요

**Divisor Molecules**는 약수의 개념을 분자의 움직임과 상호작용으로 시각화하여 학습하는 인터랙티브 웹 애플리케이션입니다.

### 핵심 기능

1. **분자 애니메이션 시스템**
   - Canvas 기반 물리 엔진
   - 약수 관계에 따른 분자 간 인력 시뮬레이션
   - 드래그 앤 드롭 인터랙션

2. **스마트폰 시뮬레이터**
   - 실제 모바일 기기를 모방한 UI
   - 반응형 디자인
   - 터치 친화적 인터페이스

3. **LMS 통합**
   - Moodle 3.7 연동
   - 학습 진행도 자동 동기화
   - 성적 자동 제출

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빠른 개발 서버)
- **Tailwind CSS** (유틸리티 CSS)
- **Canvas API** (애니메이션)

### Backend
- **Node.js** + Express + TypeScript
- **MySQL 5.7** (데이터베이스)
- **Winston** (로깅)
- **Axios** (HTTP 클라이언트)

### DevOps
- **Docker** + Docker Compose
- **Git** (버전 관리)
- **ESLint** + Prettier (코드 품질)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── PhoneSimulator/    # 스마트폰 UI
│   │   │   ├── MoleculeCanvas/    # 분자 애니메이션
│   │   │   └── DivisorGame/       # 게임 로직
│   │   ├── services/              # API 통신
│   │   ├── utils/                 # 유틸리티 (약수 계산)
│   │   └── types/                 # TypeScript 타입
│   └── package.json
│
├── backend/               # Node.js 백엔드
│   ├── src/
│   │   ├── config/               # 설정 (DB, Logger)
│   │   ├── controllers/          # 요청 핸들러
│   │   ├── models/               # 데이터 모델
│   │   ├── routes/               # API 라우트
│   │   └── services/             # 비즈니스 로직 (Moodle)
│   └── package.json
│
├── database/              # MySQL 스키마
│   └── schema.sql
│
├── docs/                  # 문서
│   ├── API.md                    # API 문서
│   └── SETUP.md                  # 설치 가이드
│
├── docker-compose.yml     # Docker 설정
├── QUICKSTART.md          # 빠른 시작 가이드
└── README.md              # 프로젝트 README
```

## 🔑 주요 컴포넌트

### 1. MoleculeCanvas (분자 애니메이션)

**위치**: `frontend/src/components/MoleculeCanvas/MoleculeCanvas.tsx`

**기능**:
- Canvas 기반 물리 엔진
- 분자 간 중력/인력 시뮬레이션
- 드래그 앤 드롭 상호작용
- 약수 검증 및 피드백

**주요 로직**:
```typescript
- 타겟 숫자와 약수 분자 생성
- 물리 법칙 적용 (속도, 가속도, 마찰)
- 약수일 경우 타겟으로 끌림
- 충돌 감지 및 검증
```

### 2. PhoneSimulator (스마트폰 UI)

**위치**: `frontend/src/components/PhoneSimulator/PhoneSimulator.tsx`

**기능**:
- 실제 iPhone 스타일 프레임
- 노치, 상태바, 홈 인디케이터
- 반응형 컨테이너

### 3. DivisorGame (게임 로직)

**위치**: `frontend/src/components/DivisorGame/DivisorGame.tsx`

**기능**:
- 게임 상태 관리
- 타이머 및 점수 계산
- 힌트 시스템
- 문제 생성 및 난이도 조정

### 4. Backend API

**위치**: `backend/src/`

**주요 엔드포인트**:
```
GET  /api/problems/random      # 랜덤 문제
POST /api/progress             # 진행도 제출
GET  /api/moodle/problems      # Moodle 문제 가져오기
POST /api/moodle/sync          # Moodle 동기화
```

### 5. Database Schema

**위치**: `database/schema.sql`

**테이블**:
- `students` - 학생 정보
- `problems` - 문제 데이터
- `student_progress` - 학습 진행도

## 🚀 실행 방법

### Docker (권장)

```bash
# 1. 환경 변수 설정
cp .env.example .env

# 2. 전체 앱 실행
docker-compose up -d

# 3. 브라우저에서 확인
# http://localhost:5173
```

### 수동 설치

```bash
# 1. 데이터베이스 설정
mysql -u root -p divisor_molecules < database/schema.sql

# 2. 백엔드 실행
cd backend
npm install
npm run dev

# 3. 프론트엔드 실행
cd frontend
npm install
npm run dev
```

## 📊 데이터베이스 스키마

### students 테이블
```sql
id, name, email, grade_level, moodle_user_id, created_at, updated_at
```

### problems 테이블
```sql
id, number, divisors (JSON), difficulty, time_limit, moodle_quiz_id, created_at
```

### student_progress 테이블
```sql
id, student_id, problem_id, score, time_spent, attempts, completed_at, synced_to_moodle
```

## 🔗 Moodle 통합

### 필요한 Moodle 설정

1. 웹 서비스 활성화
2. REST 프로토콜 활성화
3. 외부 서비스 생성
4. 토큰 생성

### 지원 기능

- 문제 가져오기
- 성적 자동 제출
- 학습 완료 상태 업데이트
- 코스 정보 조회

## 📈 성능 최적화

- Canvas 애니메이션 최적화 (requestAnimationFrame)
- 데이터베이스 인덱싱
- API 응답 캐싱 (Redis - 추후 추가 가능)
- 프론트엔드 코드 스플리팅

## 🔒 보안 고려사항

- CORS 설정
- 환경 변수로 민감 정보 관리
- SQL Injection 방지 (prepared statements)
- XSS 방지 (React의 자동 이스케이핑)

## 📝 개발 완료 항목

✅ 프로젝트 구조 설계
✅ 프론트엔드 React 앱 구조
✅ 스마트폰 시뮬레이터 UI
✅ 분자 애니메이션 엔진
✅ 약수 계산 로직
✅ 백엔드 API 서버
✅ MySQL 데이터베이스 스키마
✅ Moodle LMS 연동 API
✅ Docker 설정
✅ 문서화

## 🎓 교육적 가치

1. **시각적 학습**: 추상적인 약수 개념을 구체적으로 표현
2. **인터랙티브**: 직접 조작하며 학습
3. **즉각적 피드백**: 실시간 정답 확인
4. **게임화**: 점수, 타이머로 동기부여
5. **진행도 추적**: 학습 성과 측정

## 🔮 향후 개선 사항

- [ ] 사용자 인증 시스템
- [ ] 다양한 문제 유형 (최대공약수, 최소공배수)
- [ ] 리더보드
- [ ] 멀티플레이어 모드
- [ ] 음향 효과
- [ ] 다국어 지원 (영어)
- [ ] 모바일 앱 (React Native)
- [ ] AI 기반 난이도 조정

## 📞 지원

- 문서: `docs/` 디렉토리 참조
- 이슈: GitHub Issues
- 이메일: support@example.com

---

**개발 완료일**: 2025-11-18
**버전**: 1.0.0
**개발자**: Claude AI
**라이센스**: MIT
