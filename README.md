# Property Shake - 그래프 성질 변화 감지 시스템

## 개요
Moodle LMS와 연동하여 수학 문제 정보를 받아 그래프를 시각화하고, 그래프의 성질이 바뀔 때 화면 진동으로 알려주는 교육용 웹 애플리케이션입니다.

## 주요 기능
- **Moodle LMS 연동**: MySQL 5.7, PHP 7.1.9, Moodle 3.7과 연동
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 시뮬레이터
- **그래프 시각화**: 수학 함수 그래프 실시간 렌더링
- **Property Shake**: 그래프 성질 변화 시 진동 알림
  - 증가/감소 변화 감지
  - 극값 (극대/극소) 감지
  - 변곡점 감지
  - 기울기 부호 변화 감지

## 기술 스택
- **Frontend**: React 18, Canvas API, Vibration API
- **Backend**: PHP 7.1.9 (Moodle 연동)
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 설치 및 실행

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
# PHP 7.1.9 및 MySQL 5.7 설정 필요
# Moodle 3.7 설치 및 구성
```

## 프로젝트 구조
```
alt42standalone_v1.0/
├── frontend/              # React 웹 애플리케이션
│   ├── public/
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── services/      # API 서비스
│   │   └── utils/         # 유틸리티 함수
│   └── package.json
├── backend/               # PHP API
│   └── api/
│       └── moodle-connector.php
└── README.md
```

## 개발 정보
- **개발 브랜치**: claude/add-property-shake-017JuWxywsQ2amQr5An7eqDj
- **라이선스**: MIT
