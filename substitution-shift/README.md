# Substitution Shift - 치환적분 시각화 앱

## 📖 개요

**Substitution Shift**는 치환적분(u-substitution)의 과정을 색상 전환 효과로 시각화하여 학생들의 이해를 돕는 교육용 웹 애플리케이션입니다.

### 주요 기능

- 🎨 **색상 전환 효과**: 치환되는 부분을 단계별로 색상으로 구분하여 표시
- 📱 **가상 스마트폰 UI**: 우측 하단에 모바일 화면 시뮬레이터
- 🔗 **Moodle 연동**: LMS에서 문제 정보를 받아 동작
- 📊 **단계별 애니메이션**: 치환 과정을 순차적으로 시각화
- ✏️ **인터랙티브 학습**: 학생이 직접 치환 변수를 선택하고 확인

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- KaTeX (수학 표현식 렌더링)
- CSS3 Animations
- Axios (API 통신)

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7 Integration

## 📁 프로젝트 구조

```
substitution-shift/
├── frontend/           # React 프론트엔드
│   ├── src/
│   │   ├── components/ # React 컴포넌트
│   │   ├── styles/     # CSS 파일
│   │   ├── utils/      # 유틸리티 함수
│   │   └── types/      # TypeScript 타입 정의
│   └── public/         # 정적 파일
├── backend/            # PHP 백엔드
│   ├── api/           # REST API 엔드포인트
│   ├── config/        # 설정 파일
│   └── models/        # 데이터 모델
├── database/          # MySQL 스키마
└── docs/             # 문서

```

## 🎓 치환적분 예시

### 예제: ∫ 2x·cos(x²) dx

**Step 1**: 원본 식
```
∫ 2x·cos(x²) dx
```

**Step 2**: u 치환 선택 (빨강)
```
u = x²  →  du = 2x dx
```

**Step 3**: 치환 적용 (파랑)
```
∫ cos(u) du
```

**Step 4**: 적분 (초록)
```
sin(u) + C
```

**Step 5**: 역치환 (보라)
```
sin(x²) + C
```

## 🚀 설치 및 실행

### Frontend 개발 서버

```bash
cd frontend
npm install
npm start
```

### Backend 설정

```bash
cd backend
cp config/config.example.php config/config.php
# MySQL 정보 수정
```

## 🔌 Moodle 연동

### API 엔드포인트

- `GET /api/problems.php?id={problem_id}` - 문제 정보 가져오기
- `POST /api/submit.php` - 학생 답안 제출
- `GET /api/progress.php?student_id={id}` - 학습 진행도 조회

### Moodle 임베드 방법

```html
<iframe
  src="https://your-domain/substitution-shift/"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

## 📊 데이터베이스 스키마

### `substitution_problems` 테이블
- 치환적분 문제 저장

### `student_attempts` 테이블
- 학생의 시도 기록 및 진행도

## 📝 License

MIT License - Educational Use

## 👥 Contact

KAIST Touch Math Academy
