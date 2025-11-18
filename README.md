# ALT42 Standalone v1.0 - Asymptote Reveal Animation

점근선이 천천히 나타나는 교육용 수학 시각화 웹앱

## 📱 주요 기능

- **Asymptote Reveal**: 점근선이 선을 그리듯 천천히 나타나는 애니메이션
- **Moodle 연동**: Moodle 3.7 LMS와 통합하여 문제 정보 자동 수신
- **모바일 최적화**: 우측 하단 가상 스마트폰 화면에 최적화된 UI
- **터치 제스처**: 핀치, 스와이프, 탭 지원

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Canvas API (고성능 그래프 렌더링)
- CSS3 Animations
- Responsive Design (모바일 우선)

### Backend
- PHP 7.1.9 (Moodle 호환)
- MySQL 5.7
- RESTful API

### 연동
- Moodle 3.7
- JSON 기반 데이터 통신

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/              # Moodle 연동 PHP 백엔드
│   ├── api/              # REST API 엔드포인트
│   ├── config/           # 데이터베이스 및 Moodle 설정
│   └── moodle/           # Moodle 연동 모듈
├── frontend/             # React 웹앱
│   ├── public/           # 정적 파일
│   └── src/
│       ├── components/   # React 컴포넌트
│       ├── animations/   # 애니메이션 로직
│       ├── hooks/        # Custom React Hooks
│       └── styles/       # CSS 스타일
└── docs/                 # 문서
```

## 🚀 빠른 시작

### Backend 설정
```bash
cd backend
cp config/config.example.php config/config.php
# config.php에서 Moodle DB 정보 입력
```

### Frontend 설정
```bash
cd frontend
npm install
npm start
```

## 🎨 Asymptote Reveal 애니메이션

점근선이 나타나는 3가지 방식:
1. **선 그리기 효과**: SVG stroke-dashoffset 애니메이션
2. **점진적 페이드인**: opacity 트랜지션
3. **동적 길이 증가**: 점근선이 양 끝에서 중앙으로 그려짐

## 📱 모바일 지원

- 반응형 디자인 (360px ~ 1920px)
- 터치 이벤트 최적화
- 가상 스마트폰 화면 (우측 하단 고정)
- Pinch-to-zoom, 드래그 팬 지원

## 🔗 Moodle 연동 API

### 문제 정보 가져오기
```
GET /api/get-problem.php?quiz_id={id}
```

응답:
```json
{
  "function": "1/x",
  "asymptotes": {
    "vertical": [0],
    "horizontal": [0]
  },
  "domain": [-10, 10],
  "range": [-10, 10]
}
```

## 📄 라이선스

MIT License
