# 📚 AI 학습 요약 시스템 (Learning Summary System)

Moodle LMS와 연동하여 AI 기반 학습 분석 및 맞춤형 학습 요약을 제공하는 독립형 웹 애플리케이션입니다.

## 🎯 주요 기능

- **🤖 AI 기반 학습 분석**: Anthropic Claude AI를 활용하여 학생의 퀴즈 답변 패턴을 분석하고 인사이트 제공
- **📊 자동 학습 요약 생성**: "이번 문제에서 무엇을 배웠는가"를 AI가 자동으로 요약
- **💭 성찰 노트**: 학생이 직접 배운 내용과 느낀 점을 기록
- **🔗 Moodle 연동**: Moodle 3.7 Web Services API를 통한 실시간 데이터 동기화
- **📈 학습 진도 추적**: 개념별 숙달도와 학습 진행 상황 시각화
- **🏷️ 개념 태깅**: 학습한 핵심 개념 자동 분류 및 관리

## 📋 시스템 요구사항

### 필수 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (Web Services 활성화 필요)
- **Web Server**: Apache 또는 Nginx

### 필수 PHP 확장
- PDO
- PDO_MySQL
- cURL
- JSON
- mbstring

## 🚀 설치 가이드

### 1. 프로젝트 다운로드

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

MySQL 데이터베이스 생성:

```sql
CREATE DATABASE learning_summary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'learning_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON learning_summary.* TO 'learning_user'@'localhost';
FLUSH PRIVILEGES;
```

데이터베이스 스키마 import:

```bash
mysql -u learning_user -p learning_summary < database/schema.sql
```

### 3. 환경 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=learning_summary
DB_USER=learning_user
DB_PASSWORD=your_password

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com
MOODLE_WS_TOKEN=your_moodle_webservice_token

# Claude API Configuration
CLAUDE_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-sonnet-20240229

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_LANGUAGE=ko
```

### 4. Moodle Web Services 설정

Moodle 관리자 계정으로 로그인 후:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
   - "웹 서비스 활성화" 체크

2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 서비스 이름: "Learning Summary Service"
   - 필요한 함수 추가:
     - `core_user_get_users_by_field`
     - `mod_quiz_get_quizzes_by_courses`
     - `mod_quiz_get_attempt_data`
     - `mod_quiz_get_attempt_review`
     - `mod_quiz_get_user_attempts`

3. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 생성" 클릭
   - 사용자 선택 및 서비스 선택
   - 생성된 토큰을 `.env` 파일의 `MOODLE_WS_TOKEN`에 설정

### 5. Claude API 키 발급

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. API Keys 메뉴에서 새 키 생성
3. 생성된 키를 `.env` 파일의 `CLAUDE_API_KEY`에 설정

### 6. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName learning-summary.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/learning-summary-error.log
    CustomLog ${APACHE_LOG_DIR}/learning-summary-access.log combined
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name learning-summary.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.php;

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

### 7. 권한 설정

```bash
chmod -R 755 /path/to/alt42standalone_v1.0
chmod -R 775 /path/to/alt42standalone_v1.0/logs
chown -R www-data:www-data /path/to/alt42standalone_v1.0
```

## 📖 사용 방법

### 1. 연결 테스트

웹 브라우저로 `http://learning-summary.local` 접속 후 "연결 테스트" 버튼 클릭

- Moodle 연결 확인
- Claude AI 연결 확인

### 2. 학습 요약 생성

1. 학생이 Moodle에서 퀴즈 완료
2. 퀴즈 Attempt ID 확인 (Moodle URL에서 확인 가능)
3. 학습 요약 시스템에 Attempt ID 입력
4. "학습 요약 생성" 버튼 클릭
5. AI가 자동으로 학습 분석 및 요약 생성

### 3. 학습 요약 확인

생성된 Session ID로 학습 요약 확인:
- 학습한 핵심 개념
- 강점 및 개선 필요 부분
- AI 추천 학습 방향

### 4. 성찰 노트 작성

학생이 직접:
- 배운 내용 정리
- 어려웠던 부분 기록
- 다음에 배우고 싶은 내용 작성

## 🔌 API 사용법

### Process Quiz Attempt

```bash
POST /public/index.php?api=1&action=process_attempt
Content-Type: application/x-www-form-urlencoded

attempt_id=12345
```

**응답:**
```json
{
  "success": true,
  "message": "Learning summary generated successfully",
  "session_id": 1
}
```

### Get Summary

```bash
GET /public/index.php?api=1&action=get_summary&session_id=1
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_name": "홍길동",
    "quiz_name": "분수 학습 퀴즈",
    "score": 85.5,
    "summary": {
      "concepts_learned": "분수의 덧셈과 뺄셈...",
      "strengths": "기본 분수 연산 숙달...",
      "weaknesses": "분모가 다른 분수 계산...",
      "recommendations": "통분 연습 추천..."
    }
  }
}
```

### Save Reflection

```bash
POST /public/index.php?api=1&action=save_reflection
Content-Type: application/x-www-form-urlencoded

session_id=1
&what_i_learned=분수의 덧셈 방법을 배웠습니다
&what_was_difficult=분모가 다를 때 계산이 어려웠습니다
&confidence_rating=4
```

### Get User Progress

```bash
GET /public/index.php?api=1&action=get_progress&user_id=123
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── public/
│   ├── index.php               # 메인 엔트리 포인트
│   ├── css/
│   └── js/
├── src/
│   ├── api/
│   │   ├── claude_api.php      # Claude AI 연동
│   │   └── moodle_connector.php # Moodle API 연동
│   ├── config/
│   │   ├── config.php          # 설정 로더
│   │   └── database.php        # 데이터베이스 관리
│   ├── controllers/
│   │   └── SummaryController.php # 메인 컨트롤러
│   ├── models/
│   │   ├── LearningSession.php  # 학습 세션 모델
│   │   └── LearningSummary.php  # 학습 요약 모델
│   └── views/
├── .env.example                # 환경 설정 예시
├── README.md                   # 이 파일
└── tasks/
    └── 0001-prd-ai-education-pipeline.md
```

## 🛠️ 개발 가이드

### 로컬 개발 환경 설정

```bash
# PHP 내장 서버 사용
cd public
php -S localhost:8000
```

### 디버그 모드 활성화

`.env` 파일에서:
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

### 로그 확인

```bash
tail -f logs/app.log
```

## 🔒 보안 고려사항

- ✅ API 키를 `.env` 파일에 저장하고 버전 관리에서 제외
- ✅ 데이터베이스 접속 정보 암호화
- ✅ SQL Injection 방지 (PDO Prepared Statements 사용)
- ✅ XSS 방지 (출력 시 이스케이핑)
- ✅ CSRF 토큰 구현 권장
- ✅ HTTPS 사용 권장

## 📊 데이터베이스 스키마

주요 테이블:
- `learning_sessions`: 학습 세션 정보
- `question_responses`: 문제별 답변 기록
- `learning_summaries`: AI 생성 학습 요약
- `student_reflections`: 학생 성찰 노트
- `concept_tags`: 학습 개념 태그
- `summary_concepts`: 요약-개념 연결

자세한 스키마는 `database/schema.sql` 참조

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 🐛 문제 해결

### Moodle 연결 실패

1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 필요한 Web Service 함수가 추가되었는지 확인

### Claude API 오류

1. API 키가 올바른지 확인
2. API 사용량 제한 확인
3. 네트워크 연결 확인

### 데이터베이스 연결 오류

1. MySQL 서비스 실행 확인
2. 데이터베이스 사용자 권한 확인
3. `.env` 파일의 데이터베이스 정보 확인

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요.

## 🎓 관련 문서

- [Moodle Web Services API Documentation](https://docs.moodle.org/dev/Web_services)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [PRD: AI Education System Pipeline](./tasks/0001-prd-ai-education-pipeline.md)

---

**개발자**: AI Education Team
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
