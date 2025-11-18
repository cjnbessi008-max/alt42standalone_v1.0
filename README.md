# 🎨 Color Pattern Classifier

독립형 웹앱으로 Moodle 3.7 LMS와 연동하여 수열 패턴을 색으로 분류하는 교육용 애플리케이션입니다.

## ✨ 주요 기능

- 🔢 **다양한 수열 패턴**: 등차수열, 등비수열, 피보나치, 제곱수, 소수, 지수 패턴 지원
- 🎨 **색상 기반 분류**: 각 패턴을 고유한 색상으로 분류
- 📱 **가상 스마트폰 UI**: 우측 하단에 모바일 최적화된 인터페이스 제공
- 🔗 **Moodle 3.7 연동**: LMS에서 문제 정보를 받아와 자동 동기화
- 📊 **진행 상황 추적**: 학생별 학습 진행도 및 통계 제공
- 🏆 **리더보드**: 학생들의 성적을 비교하고 동기부여 제공

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **LMS Integration**: Moodle 3.7 Web Services

## 📋 시스템 요구사항

- PHP >= 7.1.9
- MySQL >= 5.7
- Apache 2.4+ (mod_rewrite 활성화)
- Composer (의존성 관리)
- Moodle 3.7 (선택사항, LMS 연동 시)

## 🚀 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치

```bash
composer install
```

### 3. 환경 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 데이터베이스 및 Moodle 설정을 입력하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=color_pattern_db
DB_USER=your_username
DB_PASS=your_password

# Moodle 연동 설정
MOODLE_URL=http://your-moodle-site.com
MOODLE_WS_TOKEN=your_web_service_token
```

### 4. 데이터베이스 생성

MySQL에 접속하여 데이터베이스를 생성하세요:

```sql
CREATE DATABASE color_pattern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 스키마 적용

```bash
mysql -u your_username -p color_pattern_db < database/schema.sql
```

### 6. 웹 서버 설정

**Apache VirtualHost 예제:**

```apache
<VirtualHost *:80>
    ServerName colorpattern.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/colorpattern-error.log
    CustomLog ${APACHE_LOG_DIR}/colorpattern-access.log combined
</VirtualHost>
```

Apache 재시작:

```bash
sudo systemctl restart apache2
```

### 7. 로그 디렉토리 권한 설정

```bash
mkdir -p logs
chmod 755 logs
```

## 🔧 Moodle 3.7 연동 설정

### 1. Moodle Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 웹 서비스 관리**로 이동
3. "웹 서비스 활성화" 체크

### 2. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**로 이동
2. "서비스 추가" 클릭
3. 다음 정보 입력:
   - 이름: `Color Pattern Classifier`
   - 약칭: `colorpattern`
   - 활성화: 체크

### 3. 필수 함수 추가

외부 서비스에 다음 함수들을 추가하세요:

- `core_user_get_users_by_field`
- `core_course_get_contents`
- `mod_quiz_get_quizzes_by_courses`
- `core_grades_update_grades`

### 4. 웹 서비스 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**로 이동
2. "토큰 생성" 클릭
3. 사용자와 서비스(`colorpattern`) 선택
4. 생성된 토큰을 `.env` 파일의 `MOODLE_WS_TOKEN`에 입력

### 5. CORS 설정 (필요 시)

Moodle `config.php`에 다음 추가:

```php
$CFG->webserviceprotocols = 'rest';
$CFG->allowcors = true;
```

## 📖 사용 방법

### 학생용

1. 브라우저에서 `http://colorpattern.local` 접속
2. 난이도 선택 후 "게임 시작" 클릭
3. 제시된 수열을 분석하고 알맞은 패턴(색상) 선택
4. "제출하기"를 눌러 답안 제출
5. 결과 확인 및 다음 문제 도전

### 교사용 (Moodle)

1. Moodle에서 퀴즈 생성
2. 사용자 정의 질문 유형으로 수열 패턴 문제 추가
3. 학생들은 Color Pattern 앱에서 문제 풀이
4. 성적은 자동으로 Moodle 성적부에 동기화

## 🗂️ 프로젝트 구조

```
alt42standalone_v1.0/
├── config/                 # 설정 파일
│   ├── app.php            # 앱 설정
│   ├── database.php       # DB 설정
│   └── moodle.php         # Moodle 연동 설정
├── database/              # 데이터베이스
│   └── schema.sql         # 스키마 정의
├── public/                # 공개 웹 루트
│   ├── index.php          # 메인 페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   ├── js/
│   │   └── app.js         # 프론트엔드 로직
│   └── .htaccess          # Apache 설정
├── src/                   # PHP 소스 코드
│   ├── Controllers/       # 컨트롤러
│   ├── Models/            # 모델 (Pattern, StudentProgress)
│   ├── Services/          # 서비스 (MoodleService, PatternClassifier)
│   └── Utils/             # 유틸리티 (Database, Validator)
├── api/                   # REST API 엔드포인트
│   ├── get_problem.php    # 문제 조회
│   ├── start_attempt.php  # 시도 시작
│   ├── submit_answer.php  # 답안 제출
│   └── get_progress.php   # 진행 상황 조회
├── logs/                  # 로그 파일
├── .env.example           # 환경 변수 예제
├── composer.json          # Composer 설정
└── README.md              # 이 파일
```

## 🎯 API 엔드포인트

### 1. 문제 조회

```http
GET /api/get_problem.php?random=1&difficulty_level=2
```

**응답 예제:**

```json
{
  "success": true,
  "problem": {
    "id": 1,
    "pattern_type": "arithmetic",
    "sequence_data": [2, 4, 6, 8, 10],
    "difficulty_level": 2
  },
  "templates": [...]
}
```

### 2. 시도 시작

```http
POST /api/start_attempt.php
Content-Type: application/json

{
  "user_id": 1,
  "problem_id": 1
}
```

### 3. 답안 제출

```http
POST /api/submit_answer.php
Content-Type: application/json

{
  "attempt_id": 123,
  "problem_id": 1,
  "student_answer": ["arithmetic"],
  "time_spent": 45
}
```

### 4. 진행 상황 조회

```http
GET /api/get_progress.php?user_id=1&type=statistics
```

## 🎨 지원하는 패턴 유형

| 패턴 | 색상 | 설명 | 예시 |
|------|------|------|------|
| **등차수열** (Arithmetic) | 🔴 빨강 | 일정한 차이 | 2, 4, 6, 8, 10 |
| **등비수열** (Geometric) | 🔵 청록색 | 일정한 비율 | 2, 4, 8, 16, 32 |
| **피보나치** (Fibonacci) | 🟡 노랑 | 앞 두 항의 합 | 1, 1, 2, 3, 5, 8 |
| **제곱수** (Quadratic) | 🟢 초록 | 완전제곱수 | 1, 4, 9, 16, 25 |
| **소수** (Prime) | 🟣 분홍 | 소수 수열 | 2, 3, 5, 7, 11 |
| **지수** (Exponential) | 🟠 보라 | 거듭제곱 | 2, 4, 8, 16, 32 |

## 🔒 보안 고려사항

- ✅ SQL Injection 방지: PDO Prepared Statements 사용
- ✅ XSS 방지: 입력값 HTML 이스케이프 처리
- ✅ CSRF 방지: API 요청 시 토큰 검증 (구현 필요)
- ✅ 입력 검증: Validator 클래스로 모든 입력 검증
- ✅ 민감 정보 보호: .htaccess로 설정 파일 접근 차단

## 🐛 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결책:**
1. `.env` 파일의 DB 설정 확인
2. MySQL 서비스 실행 상태 확인: `systemctl status mysql`
3. 데이터베이스 및 사용자 권한 확인

### Moodle 연동 오류

```
Moodle API Error: Invalid token
```

**해결책:**
1. Moodle 웹 서비스 활성화 확인
2. 토큰이 올바른지 확인
3. 필수 함수들이 서비스에 추가되었는지 확인

### 권한 오류

```
Permission denied: logs/
```

**해결책:**

```bash
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs  # Apache 사용자에 맞게 조정
```

## 📝 TODO

- [ ] 세션 관리 및 사용자 인증 강화
- [ ] CSRF 토큰 구현
- [ ] 관리자 대시보드 추가
- [ ] 다국어 지원 (i18n)
- [ ] 문제 생성 도구
- [ ] 실시간 리더보드 업데이트 (WebSocket)
- [ ] 모바일 네이티브 앱 (React Native)

## 📄 라이선스

MIT License

## 👥 기여

버그 리포트 및 기능 제안은 이슈 트래커를 이용해주세요.

## 📧 문의

프로젝트 관련 문의: [your-email@example.com]

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
