# Change Wave - 함수 변화 시각화 웹앱

Moodle LMS와 연동하여 함수의 변화 패턴을 파동처럼 재생하는 교육용 웹 애플리케이션

## 시스템 요구사항

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7

## 주요 기능

### Change Wave 시각화
- 함수의 변화를 파동 애니메이션으로 표현
- 실시간 함수값 변화 추적
- 미분/적분 시각화 지원

### Moodle 연동
- Moodle에서 문제 정보 자동 수신
- 학생 진도 및 성취도 동기화
- 실시간 피드백 전송

### 가상 스마트폰 UI
- 우측 하단에 스마트폰 화면 표시
- 반응형 디자인
- 터치 인터랙션 시뮬레이션

## 프로젝트 구조

```
├── public/           # 웹 루트
│   ├── index.html   # 메인 페이지
│   ├── css/         # 스타일시트
│   └── js/          # JavaScript 파일
├── api/             # PHP 백엔드 API
│   ├── config.php   # Moodle 연동 설정
│   └── db/          # 데이터베이스 스키마
├── moodle/          # Moodle 플러그인
└── docs/            # 문서
```

## 설치 방법

### 1. 데이터베이스 설정

```bash
mysql -u root -p < api/db/schema.sql
```

### 2. Moodle 연동 설정

`api/config.php` 파일을 편집하여 Moodle 연결 정보를 입력합니다:

```php
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

Apache 또는 Nginx에서 `public/` 디렉토리를 웹 루트로 설정합니다.

## 사용 방법

1. 브라우저에서 `index.html` 접속
2. 우측 하단의 가상 스마트폰 화면 확인
3. Moodle에서 받은 함수 문제가 자동으로 표시됨
4. Change Wave 애니메이션으로 함수 변화 학습

## 개발자 문서

- [Change Wave 기능 명세](docs/CHANGEWAVE.md)
- [API 문서](docs/API.md)

## 라이선스

MIT License
