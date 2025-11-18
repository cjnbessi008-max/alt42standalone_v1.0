# 📊 Stat Digest

**문제 속 데이터 정보를 자동 요약하는 통계 다이제스트 시스템**

Moodle LMS와 연동하여 문제 정보를 받아서 동작하며, 우측 하단 가상 스마트폰 화면에 통계를 표시하는 웹 애플리케이션입니다.

## 🎯 주요 기능

- **Moodle 3.7 연동**: Moodle LMS에서 퀴즈 및 문제 데이터 자동 동기화
- **자동 통계 계산**: 문제별 정확도, 난이도, 시도 횟수 등 자동 계산
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 스타일 통계 화면
- **실시간 인사이트**: 가장 어려운 주제, 학습 트렌드 자동 분석
- **카테고리별 분석**: 문제 카테고리별 성과 분석

## 🛠 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7 Web Services API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 (Web Services 활성화 필요)
- Apache/Nginx 웹 서버

## 🚀 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 및 Moodle 설정을 구성합니다:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=stat_digest_db
DB_USER=root
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### 3. 데이터베이스 설정

MySQL에 데이터베이스를 생성하고 스키마를 적용합니다:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE stat_digest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stat_digest_db;
SOURCE database/schema.sql;
```

### 4. Moodle Web Service 설정

Moodle 관리자 페널에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**로 이동
2. 웹 서비스 활성화
3. 새 서비스 생성 및 다음 함수 추가:
   - `mod_quiz_get_quiz_questions`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_quizzes_by_courses`
   - `core_question_get_questions`
4. 토큰 생성 및 `.env`에 추가

### 5. 웹 서버 설정

#### Apache

`public/` 디렉토리를 DocumentRoot로 설정:

```apache
<VirtualHost *:80>
    ServerName stat-digest.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name stat-digest.local;
    root /path/to/alt42standalone_v1.0/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 6. 접속

브라우저에서 `http://localhost` 또는 설정한 도메인으로 접속합니다.

## 📖 사용 방법

### 1. Moodle에서 데이터 동기화

제어 패널에서:
- 퀴즈 ID 입력
- "문제 동기화" 버튼 클릭

### 2. 통계 계산

- "전체 통계 재계산" 버튼 클릭
- 시스템이 자동으로 모든 문제의 통계를 계산합니다

### 3. 가상 스마트폰 화면 확인

우측 하단 스마트폰 화면에서 실시간 통계를 확인:
- 총 문제 수
- 총 시도 횟수
- 평균 정확도
- 평균 난이도
- 가장 어려운 주제
- 학습 트렌드
- 카테고리별 분석

## 🔌 API 엔드포인트

### Health Check
```
GET /api.php/health
```

### 데이터베이스 연결 테스트
```
GET /api.php/test-db
```

### Moodle 퀴즈 동기화
```
POST /api.php/sync/quiz
{
  "quiz_id": 1
}
```

### 통계 계산
```
POST /api.php/stats/compute
{
  "problem_id": 1  // Optional, omit to compute all
}
```

### 다이제스트 요약 조회
```
GET /api.php/digest/summary?session_id=xxx
```

### 어려운 문제 Top N
```
GET /api.php/digest/difficult?limit=10
```

### 성과 인사이트
```
GET /api.php/digest/insights
```

## 📊 데이터베이스 스키마

### problems
문제 정보 저장 (Moodle에서 동기화)

### student_attempts
학생 시도 기록

### stat_digests
문제별 통계 (정확도, 난이도 등)

### digest_summaries
세션별 요약 통계

### sync_config
Moodle 동기화 설정

## 🔧 개발

### 디렉토리 구조

```
alt42standalone_v1.0/
├── public/              # 웹 루트
│   ├── index.php       # 메인 페이지
│   ├── api.php         # REST API
│   ├── css/
│   │   └── style.css   # 스타일시트
│   └── js/
│       └── app.js      # 프론트엔드 로직
├── src/
│   ├── config/         # 설정 파일
│   ├── models/         # 데이터 모델
│   ├── controllers/    # 컨트롤러
│   ├── services/       # 비즈니스 로직
│   │   ├── MoodleService.php      # Moodle API 연동
│   │   └── StatDigestService.php  # 통계 계산
│   └── utils/
│       └── Database.php # DB 유틸리티
├── database/
│   └── schema.sql      # DB 스키마
└── composer.json       # 의존성 관리
```

## 🤝 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📄 라이선스

MIT License

## 👥 개발팀

KAIST Touch Math Academy

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
