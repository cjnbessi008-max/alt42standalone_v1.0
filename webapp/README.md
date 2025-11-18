# 답안 제출 검증 시스템

LMS 연동을 위한 독립형 웹앱 - 답 제출 전 부호·괄호 자동 검증

## 📋 개요

학생들이 수학 답안을 제출하기 전에 **부호**와 **괄호**의 올바른 사용을 실시간으로 검증하는 웹 애플리케이션입니다.

### 주요 기능

✅ **실시간 검증**
- 입력과 동시에 오류 감지
- 구체적인 오류 위치 및 설명 제공

✅ **포괄적인 검증 규칙**
- 괄호 균형 체크: `()`, `[]`, `{}`
- 부호 위치 검증: `+`, `-`, `×`, `÷`
- 연속 연산자 감지
- 허용되지 않은 문자 감지

✅ **사용자 친화적 UI**
- 수식 입력 도우미 버튼
- 실시간 오류 피드백
- 검증 규칙 안내

✅ **이중 검증**
- 클라이언트 사이드 검증 (빠른 피드백)
- 서버 사이드 검증 (보안)

## 🏗 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 개발 환경
- **Vitest** - 단위 테스트

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **Pydantic** - 데이터 검증
- **Pytest** - 테스트 프레임워크

## 📁 프로젝트 구조

```
webapp/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── SubmissionForm.tsx
│   │   │   └── SubmissionForm.css
│   │   ├── utils/           # 유틸리티 함수
│   │   │   ├── validation.ts
│   │   │   └── validation.test.ts
│   │   ├── types/           # TypeScript 타입 정의
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
└── backend/                  # FastAPI 백엔드
    ├── app/
    │   ├── __init__.py
    │   ├── models.py        # Pydantic 모델
    │   ├── validators.py    # 검증 로직
    │   └── api.py          # API 라우트
    ├── main.py             # FastAPI 앱
    ├── requirements.txt
    └── test_validators.py  # 테스트
```

## 🚀 시작하기

### 필요 사항

- **Node.js** 18+ (프론트엔드)
- **Python** 3.11+ (백엔드)
- **npm** 또는 **yarn** (프론트엔드 패키지 관리)
- **pip** (Python 패키지 관리)

### 1. 저장소 클론

```bash
cd webapp
```

### 2. 백엔드 설정 및 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상 환경 생성 (선택사항이지만 권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.

- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. 프론트엔드 설정 및 실행

새 터미널을 열고:

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:3000` (또는 Vite 기본 포트)에서 실행됩니다.

브라우저에서 자동으로 열립니다!

## 🧪 테스트 실행

### 백엔드 테스트

```bash
cd backend
pytest test_validators.py -v
```

### 프론트엔드 테스트

```bash
cd frontend
npm test
```

## 📖 사용 방법

1. **답안 입력**
   - 텍스트 입력 필드에 수식 입력
   - 또는 제공된 기호 버튼 사용

2. **실시간 검증**
   - 입력과 동시에 오류가 있으면 표시됨
   - 오류 유형과 위치를 구체적으로 안내

3. **답안 제출**
   - 검증을 통과한 답안만 제출 가능
   - 제출 버튼이 오류가 있으면 비활성화됨

## 🎯 검증 규칙

### 괄호 검증
- ✅ 모든 여는 괄호는 대응하는 닫는 괄호가 있어야 함
- ✅ 괄호 짝이 올바르게 매칭되어야 함
- ✅ 지원 괄호: `()`, `[]`, `{}`

예시:
- ✓ `(2+3)×5`
- ✓ `[(2+3)+(4-1)]`
- ✗ `(2+3`
- ✗ `(2+3]`

### 부호 검증
- ✅ 연산자가 연속으로 나올 수 없음 (음수 표현 제외)
- ✅ 수식이 연산자로 끝날 수 없음
- ✅ 지원 연산자: `+`, `-`, `×`, `÷`, `*`, `/`

예시:
- ✓ `2+3-4`
- ✓ `(-5)+3` (음수)
- ✗ `2++3`
- ✗ `2+3+`

### 포맷 검증
- ✅ 빈 입력 불가
- ✅ 허용된 문자만 사용 가능: 숫자, 연산자, 괄호, 소수점, 공백

예시:
- ✓ `2.5+3.7`
- ✓ `1/2+3/4`
- ✗ `2+3abc`
- ✗ `2+3!`

## 🔌 API 엔드포인트

### POST `/api/submit`

답안 제출 및 검증

**요청 본문:**
```json
{
  "answer": "(2+3)×5",
  "problem_id": "optional",
  "student_id": "optional"
}
```

**응답:**
```json
{
  "success": true,
  "validation_result": {
    "is_valid": true,
    "errors": []
  },
  "message": "✓ 답안이 성공적으로 검증되고 제출되었습니다!"
}
```

### GET `/api/health`

헬스 체크

**응답:**
```json
{
  "status": "healthy",
  "service": "answer-submission-validator",
  "version": "1.0.0"
}
```

## 🔧 개발

### 개발 모드

프론트엔드와 백엔드를 동시에 실행하여 개발:

```bash
# 터미널 1: 백엔드
cd backend && python main.py

# 터미널 2: 프론트엔드
cd frontend && npm run dev
```

### 빌드

프로덕션 빌드:

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist/`에 생성됩니다.

## 🚀 배포

### 프론트엔드
- **Vercel**, **Netlify**, 또는 **GitHub Pages**에 배포 가능
- `dist/` 폴더의 정적 파일을 배포

### 백엔드
- **Docker** 컨테이너로 배포 권장
- **AWS**, **Google Cloud**, **Heroku** 등에 배포 가능

### Docker 배포 (예정)

```dockerfile
# Dockerfile 예시 (추후 추가 예정)
```

## 📝 향후 계획

- [ ] LMS 연동 (Canvas, Moodle, Blackboard)
- [ ] 사용자 인증 및 권한 관리
- [ ] 데이터베이스 연동 (제출 내역 저장)
- [ ] 자동 채점 기능
- [ ] 통계 및 분석 대시보드
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인

## 🤝 기여

기여를 환영합니다! 이슈나 Pull Request를 자유롭게 제출해주세요.

## 📄 라이선스

KAIST Touch Math Academy - AI Education System

---

**문의**: KAIST Touch Math Academy
