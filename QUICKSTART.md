# 빠른 시작 가이드 (Quick Start Guide)

## 🚀 5분 만에 시작하기

### 방법 1: Docker를 사용한 빠른 배포 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/inequality-arrow.git
cd inequality-arrow

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 실제 값 입력

# 3. Docker Compose로 실행
docker-compose up -d

# 4. 데이터베이스 초기화 확인
docker-compose logs db

# 5. 브라우저에서 접속
# http://localhost/frontend/index.html
```

### 방법 2: 로컬 환경에서 실행

#### 사전 요구사항
- PHP 7.4+ 설치
- MySQL 5.7+ 설치
- Apache 또는 Nginx 설치

#### 설치 단계

```bash
# 1. MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE inequality_arrow_db;
exit;

# 2. 스키마 적용
mysql -u root -p inequality_arrow_db < database/schema.sql

# 3. 설정 파일 수정
nano backend/config.php
# DB_HOST, DB_NAME, DB_USER, DB_PASS 값 수정

# 4. 웹 서버 시작 (PHP 내장 서버 - 개발용)
cd frontend
php -S localhost:8000

# 5. 브라우저에서 접속
# http://localhost:8000/index.html
```

### 방법 3: 데모 모드 (백엔드 없이 실행)

프론트엔드만 테스트하고 싶다면:

```bash
# 1. 프론트엔드 폴더로 이동
cd frontend

# 2. 간단한 HTTP 서버 실행
# Python 3이 설치되어 있는 경우:
python3 -m http.server 8000

# Node.js가 설치되어 있는 경우:
npx http-server -p 8000

# 3. 브라우저에서 접속
# http://localhost:8000/index.html
```

**참고**: 데모 모드에서는 백엔드 API 호출이 실패하지만, 로컬 폴백 모드로 작동하여 기본 기능을 테스트할 수 있습니다.

---

## 🔧 Moodle 연동 설정 (선택사항)

Moodle LMS와 연동하려면 다음 단계를 따르세요:

### 1. Moodle 웹 서비스 활성화

1. Moodle 관리자 페이지 로그인
2. **사이트 관리 → 고급 기능**에서 "웹 서비스 활성화" 체크
3. **사이트 관리 → 서버 → 웹 서비스 → 프로토콜**에서 "REST protocol" 활성화

### 2. 외부 서비스 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
2. "사용자 정의 서비스 추가" 클릭
3. 서비스 이름: `inequality_arrow_service`
4. "활성화" 체크 후 저장

### 3. 웹 서비스 함수 추가

서비스 편집 페이지에서 다음 함수들을 추가:

- `core_user_get_users_by_field`
- `core_course_get_courses`
- `core_enrol_get_enrolled_users`
- `core_grades_update_grades`

### 4. 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 `inequality_arrow_service` 선택
4. 생성된 토큰 복사

### 5. 앱 설정에 토큰 입력

```php
// backend/config.php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'paste_your_token_here');
```

---

## 🧪 테스트

### 1. 데이터베이스 연결 테스트

```bash
# PHP 스크립트로 테스트
php -r "
\$pdo = new PDO('mysql:host=localhost;dbname=inequality_arrow_db', 'inequality_user', 'your_password');
echo 'Database connection successful!';
"
```

### 2. API 테스트

```bash
# 문제 가져오기 테스트
curl "http://localhost/backend/api.php?action=get_problem&difficulty=easy"

# 세션 생성 테스트
curl -X POST http://localhost/backend/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"create_session","user_id":1}'
```

### 3. Moodle 연동 테스트

```bash
# 사용자 동기화 테스트
curl -X POST http://localhost/backend/moodle_integration.php \
  -H "Content-Type: application/json" \
  -d '{"action":"sync_user","moodle_user_id":2}'
```

---

## 📝 샘플 데이터

데이터베이스 스키마 적용 시 자동으로 10개의 샘플 문제가 생성됩니다:

1. 5와 3을 비교하세요 (>)
2. 2와 7을 비교하세요 (<)
3. 4와 4를 비교하세요 (=)
4. 12와 8을 비교하세요 (>)
5. 15와 20을 비교하세요 (<)
6. 25 + 5와 30을 비교하세요 (=)
7. 10 - 3와 8을 비교하세요 (<)
8. 6 × 2와 13을 비교하세요 (<)
9. 18 ÷ 3와 5를 비교하세요 (>)
10. (4 + 6) × 2와 19를 비교하세요 (>)

---

## 🎮 사용 방법

1. **앱 열기**: 브라우저에서 앱 URL 접속
2. **문제 풀기**: 화면의 두 숫자를 비교하고 `<`, `=`, `>` 버튼 클릭
3. **화살표 확인**: 우측 하단 스마트폰에서 애니메이션 화살표 방향 확인
4. **결과 확인**: 정답/오답 피드백 받기
5. **반복 학습**: 자동으로 새 문제로 진행

### 키보드 단축키
- `,` 또는 `<`: "작다" 선택
- `=`: "같다" 선택
- `.` 또는 `>`: "크다" 선택
- `ESC`: 설정 열기

---

## ❓ 문제 해결

### "Database connection failed" 오류
```bash
# MySQL 실행 확인
sudo service mysql status
sudo service mysql start

# 데이터베이스 및 사용자 존재 확인
mysql -u root -p -e "SHOW DATABASES; SELECT user FROM mysql.user;"
```

### "API endpoint not found" 오류
```bash
# Apache mod_rewrite 활성화
sudo a2enmod rewrite
sudo service apache2 restart

# .htaccess 파일 권한 확인
sudo chmod 644 .htaccess
```

### 화살표 애니메이션이 보이지 않음
- 브라우저 콘솔(F12)에서 JavaScript 오류 확인
- 캐시 삭제 후 새로고침 (Ctrl + Shift + R)
- SVG를 지원하는 최신 브라우저 사용

---

## 📚 추가 문서

- [전체 README](README.md)
- [API 문서](README.md#-api-문서)
- [Moodle 연동 상세 가이드](README.md#-moodle-연동)

---

## 🆘 지원

문제가 발생하면:

1. 브라우저 콘솔 확인 (F12)
2. 서버 로그 확인: `tail -f /var/log/apache2/error.log`
3. [GitHub Issues](https://github.com/your-repo/inequality-arrow/issues)에 문제 보고

---

**행운을 빕니다! 🎉**
