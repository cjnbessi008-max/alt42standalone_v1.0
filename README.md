# Term Motion - 단항 움직임 학습 시스템

수학 수식의 단항별 움직임을 애니메이션으로 표현하는 교육용 웹 애플리케이션입니다.

## 🎯 주요 기능

- **수학 수식 파싱**: 대수식을 항(term)별로 분석
- **애니메이션 시각화**: 항의 이동, 결합, 변환 과정을 부드러운 애니메이션으로 표현
- **가상 스마트폰 UI**: 실제 스마트폰처럼 보이는 프레임에서 앱 체험
- **Moodle LMS 연동**: Moodle 3.7과 연동하여 문제 정보 및 진행 상황 관리
- **진행 상황 추적**: 학생별 학습 진도 및 통계 관리

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 개발 서버
- **Framer Motion** - 부드러운 애니메이션
- **KaTeX** - 수학 수식 렌더링
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리

### Backend
- **PHP 7.1.9** - Moodle 호환
- **MySQL 5.7** - 데이터베이스
- **PDO** - 데이터베이스 접근

### DevOps
- **Docker** + **Docker Compose**
- **Git**

## 📋 사전 요구사항

- Docker Desktop 또는 Docker Engine + Docker Compose
- Git
- 최소 4GB RAM
- 포트 3000, 8080, 3306이 사용 가능해야 함

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Docker로 전체 시스템 실행

```bash
docker-compose up -d
```

이 명령어로 다음이 자동으로 실행됩니다:
- MySQL 5.7 데이터베이스 (포트 3306)
- PHP 7.1.9 백엔드 API (포트 8080)
- React 프론트엔드 (포트 3000)

### 3. 데이터베이스 초기화

데이터베이스는 자동으로 초기화되며, 샘플 문제가 포함됩니다.

### 4. 애플리케이션 접속

브라우저에서 http://localhost:3000 접속

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── SmartphoneFrame/    # 스마트폰 프레임
│   │   │   ├── TermMotion/         # 애니메이션 플레이어
│   │   │   └── MathExpression/     # 수식 표시
│   │   ├── services/         # API 서비스
│   │   ├── types/            # TypeScript 타입
│   │   ├── utils/            # 유틸리티 (수식 파싱)
│   │   └── App.tsx           # 메인 앱
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # PHP 백엔드
│   ├── api/                  # API 엔드포인트
│   │   ├── problems.php      # 문제 관리
│   │   └── progress.php      # 진행 상황
│   ├── config/               # 설정
│   │   ├── database.php      # DB 연결
│   │   └── config.php        # 전역 설정
│   └── models/               # 데이터 모델
│
├── database/                 # 데이터베이스
│   └── schema.sql            # DB 스키마
│
├── docs/                     # 문서
├── docker-compose.yml        # Docker 설정
└── README.md                 # 이 파일
```

## 🔌 API 엔드포인트

### 문제 관리

```
GET    /api/problems          # 문제 목록 조회
GET    /api/problems/:id      # 특정 문제 조회
POST   /api/problems          # 새 문제 생성
PUT    /api/problems/:id      # 문제 수정
DELETE /api/problems/:id      # 문제 삭제
```

### 진행 상황

```
GET  /api/progress?problem_id=1&student_id=1  # 진행 상황 조회
POST /api/progress                            # 진행 상황 업데이트
```

## 💡 사용 예시

### 수식 파싱

```typescript
import { MathParser } from '@/utils/mathParser';

const expression = MathParser.parseExpression('2x + 3x + 5');
console.log(expression.terms);
// [{ coefficient: 2, variable: 'x', ... }, ...]
```

### 애니메이션 재생

```tsx
<TermMotionPlayer
  steps={animationSteps}
  autoPlay={false}
  onComplete={() => console.log('완료!')}
  onStepChange={(step) => console.log('현재 단계:', step)}
/>
```

## 🧪 개발 모드 실행

### Frontend만 실행

```bash
cd frontend
npm install
npm run dev
```

### Backend만 실행

```bash
cd backend
php -S localhost:8080 -t .
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **problems**: 문제 정보
  - id, title, description
  - initial_expression, target_expression
  - steps (JSON), difficulty, category

- **student_progress**: 학생 진행 상황
  - problem_id, student_id
  - current_step, completed
  - time_spent, attempts

- **students**: 학생 정보 (Moodle 캐시)

- **categories**: 문제 카테고리

## 🔧 환경 변수

`frontend/.env` 파일 생성:

```env
VITE_API_URL=http://localhost:8080/api
VITE_MOODLE_URL=http://localhost/moodle
```

## 🎨 주요 컴포넌트

### SmartphoneFrame
실제 스마트폰 모양의 프레임을 제공합니다.

```tsx
<SmartphoneFrame position="bottom-right">
  <YourApp />
</SmartphoneFrame>
```

### TermMotionPlayer
단계별 수식 변환 애니메이션을 재생합니다.

### MathExpression
수학 수식을 시각적으로 표시합니다.

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 제작

KAIST Touch Math Academy

## 📧 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.

---

**Term Motion** - Making Math Visual and Interactive! 🎓✨
