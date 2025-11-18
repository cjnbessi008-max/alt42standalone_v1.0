# Ratio Spring 웹앱

## 개요
Moodle LMS와 연동되는 독립형 웹앱으로, 항 간 비율을 스프링 애니메이션으로 시각화합니다.

## 기술 스택
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Canvas API)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 주요 기능
- 📱 우측 하단 가상 스마트폰 화면
- 🎨 비율을 스프링 물리 애니메이션으로 시각화
- 🔗 Moodle LMS 연동 (문제 정보 수신)
- 📊 실시간 인터랙티브 시각화

## 프로젝트 구조
```
/ratio-spring-app
  /public             # 프론트엔드 파일
    index.html        # 메인 HTML
    /css              # 스타일시트
    /js               # JavaScript 모듈
  /api                # PHP 백엔드 API
  /database           # MySQL 스키마
  /docs               # 문서
```

## 설치 및 실행

### 1. 데이터베이스 설정
```bash
mysql -u root -p < database/schema.sql
```

### 2. API 설정
`api/config.php` 파일에서 데이터베이스 연결 정보 수정

### 3. 웹서버 실행
```bash
# PHP 내장 서버 사용
cd public
php -S localhost:8080
```

### 4. 접속
브라우저에서 `http://localhost:8080` 접속

## Moodle 연동
- Moodle에서 비율 문제 데이터를 JSON 형식으로 전송
- API 엔드포인트: `/api/connector.php`

## 라이선스
MIT License
