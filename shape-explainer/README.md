# Shape Explainer

도형을 애니메이션으로 분해하며 성질을 설명하는 교육용 웹앱

## 개요

Shape Explainer는 Moodle 3.7 LMS와 연동되어 학생들에게 도형의 성질을 시각적으로 설명하는 인터랙티브 웹 애플리케이션입니다.

### 주요 기능

- ✅ Moodle LMS와 연동하여 문제 정보 수신
- ✅ 가상 스마트폰 화면 형태의 반응형 UI
- ✅ 도형 애니메이션 분해 및 성질 설명
- ✅ 학생 학습 진행 상황 추적

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Animation**: Canvas API / SVG
- **LMS Integration**: Moodle 3.7 Web Services API

## 시스템 요구사항

- PHP >= 7.1.9
- MySQL >= 5.7
- Moodle >= 3.7
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 프로젝트 구조

```
shape-explainer/
├── backend/
│   ├── config/           # 설정 파일
│   ├── api/             # API 엔드포인트
│   ├── models/          # 데이터 모델
│   └── services/        # 비즈니스 로직
├── frontend/
│   ├── css/            # 스타일시트
│   ├── js/             # JavaScript 모듈
│   ├── assets/         # 이미지, 아이콘
│   └── index.html      # 메인 페이지
├── database/
│   └── schema.sql      # 데이터베이스 스키마
└── docs/
    └── api.md          # API 문서
```

## 설치 방법

1. 데이터베이스 스키마 적용
```sql
mysql -u root -p < database/schema.sql
```

2. 설정 파일 수정
```bash
cp backend/config/config.example.php backend/config/config.php
# config.php 파일에서 DB 및 Moodle 설정 수정
```

3. 웹 서버 설정
- Apache/Nginx에서 프로젝트 루트를 document root로 설정
- PHP 모듈 활성화

## 라이선스

MIT License
