# EquaMap - Equation Structure Visualizer

방정식 구조를 마인드맵처럼 시각화하는 독립형 웹앱

## 개요

EquaMap은 Moodle LMS와 연동하여 방정식 문제 정보를 받아서 구조를 마인드맵 형태로 시각화합니다.
우측 하단에 가상 스마트폰 화면으로 표시됩니다.

## 기술 스택

- **Frontend**: React 18 + Vite + React-Flow
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/          # React 웹앱
│   ├── src/
│   │   ├── components/      # UI 컴포넌트
│   │   ├── services/        # API 서비스
│   │   ├── utils/           # 유틸리티
│   │   └── assets/          # 정적 파일
│   └── package.json
├── backend/           # PHP API 서버
│   ├── api/                 # API 엔드포인트
│   ├── config/              # 설정 파일
│   └── lib/                 # 라이브러리
├── database/          # 데이터베이스 스키마
└── docs/              # 문서
```

## 기능

1. **Moodle 연동**: 문제 정보를 Moodle API로부터 가져오기
2. **방정식 파싱**: 방정식을 구조적으로 분석
3. **마인드맵 시각화**: 방정식 구조를 트리/그래프 형태로 표시
4. **가상 스마트폰 UI**: 우측 하단에 모바일 화면 시뮬레이션

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
php -S localhost:8000
```

## 개발 로드맵

- [x] 프로젝트 구조 설정
- [ ] Frontend React 앱 설정
- [ ] Backend PHP API 구현
- [ ] Moodle API 연동
- [ ] 방정식 파서 구현
- [ ] 마인드맵 시각화
- [ ] 가상 스마트폰 UI
- [ ] 통합 테스트

## 라이센스

MIT
