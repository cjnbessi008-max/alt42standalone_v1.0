# Inverse Mirror - 역함수 미분 교육 앱

Moodle LMS와 연동되는 역함수 미분 교육용 웹 애플리케이션입니다.

## 주요 기능

- **거울 효과 시각화**: 함수와 역함수의 y=x 대칭 관계 표시
- **미분 관계 시각화**: 접선과 미분계수의 역수 관계 표시
- **Moodle 연동**: 문제 정보 수신 및 학습 진행도 전송
- **모바일 시뮬레이터**: 우측 하단 가상 스마트폰 화면

## 기술 스택

### Frontend
- React 18 + TypeScript
- Plotly.js (인터랙티브 그래프)
- Vite (빌드 도구)

### Backend
- Node.js + Express
- MySQL 5.7
- Moodle Web Services API

## 시스템 요구사항

- Node.js 18+
- MySQL 5.7
- PHP 7.1.9
- Moodle 3.7

## 프로젝트 구조

```
inverse-mirror/
├── frontend/          # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 서비스
│   │   └── types/        # TypeScript 타입
│   └── package.json
├── backend/           # Node.js 백엔드
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   └── config/       # 설정
│   └── package.json
└── docs/             # 문서
```

## 설치 및 실행

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## Moodle 연동 설정

1. Moodle 관리자 페이지에서 Web Services 활성화
2. API 토큰 생성
3. backend/.env 파일에 설정 추가

## 라이선스

MIT
