# Truth Rhythm

명제의 참/거짓을 리듬 있는 사운드로 알려주는 교육용 웹앱

## 개요

Truth Rhythm은 Moodle LMS와 연동하여 학생들이 명제의 참/거짓을 학습할 수 있도록 돕는 독립형 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 표시되며, 리듬감 있는 사운드 피드백을 제공합니다.

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS Integration**: Moodle 3.7 API

## 주요 기능

1. **Moodle LMS 연동**: 문제 정보를 Moodle에서 가져오기
2. **리듬 사운드 피드백**: 참/거짓에 따른 다른 리듬 패턴
3. **스마트폰 UI**: 모바일 친화적인 인터페이스
4. **진도 추적**: 학생별 학습 진행 상황 저장

## 디렉토리 구조

```
truth-rhythm/
├── public/              # 프론트엔드 파일
│   ├── index.html      # 메인 HTML
│   ├── css/            # 스타일시트
│   ├── js/             # JavaScript 파일
│   └── sounds/         # 사운드 파일
├── api/                # PHP API
│   ├── config.php      # 설정 파일
│   ├── moodle-connector.php  # Moodle 연동
│   └── questions.php   # 문제 API
├── database/           # 데이터베이스
│   └── schema.sql      # DB 스키마
└── docs/               # 문서
```

## 설치 방법

### 1. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 2. API 설정

`api/config.php` 파일에서 다음 정보를 수정하세요:

- MySQL 연결 정보
- Moodle API URL 및 토큰

### 3. 웹 서버 설정

Apache 또는 Nginx에서 `public/` 디렉토리를 document root로 설정

### 4. 사운드 파일 준비

`public/sounds/` 디렉토리에 다음 파일을 추가:
- `true-rhythm.mp3` - 참일 때 재생되는 리듬
- `false-rhythm.mp3` - 거짓일 때 재생되는 리듬

## 사용 방법

1. 웹 브라우저에서 애플리케이션 접속
2. Moodle 계정으로 로그인
3. 문제 선택
4. 참/거짓 판단
5. 리듬 사운드로 즉각 피드백 받기

## API 엔드포인트

- `GET /api/questions.php` - 문제 목록 조회
- `GET /api/questions.php?id={id}` - 특정 문제 조회
- `POST /api/questions.php` - 답안 제출

## 개발자

KAIST Touch Math Academy

## 라이선스

MIT License
