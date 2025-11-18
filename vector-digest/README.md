# Vector Digest - 벡터 개념 3줄 요약 시스템

웹앱, LMS(Moodle)와 연동하여 문제 정보를 받아서 벡터 개념을 3줄로 요약하고, 우측 하단 가상 스마트폰 화면에 표시하는 애플리케이션입니다.

## 📱 주요 기능

- ✅ **Moodle 3.7 통합**: LMS에서 문제 정보를 자동으로 가져옴
- ✅ **벡터 개념 분석**: AI 기반 키워드 분석으로 벡터 관련 개념 추출
- ✅ **3줄 요약**: 벡터 개념을 3줄로 간결하게 요약
- ✅ **가상 스마트폰 UI**: 우측 하단에 iPhone X 스타일 가상 스마트폰 화면 표시
- ✅ **한국어/영어 지원**: 자동 언어 감지 및 요약 생성
- ✅ **사용자 인터랙션 로깅**: 학습 분석을 위한 사용 데이터 수집

## 🛠 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Design**: iPhone X 스타일 UI/UX

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 이상
- Apache/Nginx 웹서버
- PDO MySQL 확장 모듈

## 🚀 설치 방법

### 1. 파일 배치

```bash
# Moodle 디렉토리 구조
/var/www/html/moodle/
├── local/
│   └── vector-digest/              # 여기에 프로젝트 파일 배치
│       ├── api/
│       │   ├── VectorDigestAPI.php
│       │   └── VectorAnalyzer.php
│       ├── config/
│       │   └── config.php
│       ├── database/
│       │   └── schema.sql
│       ├── frontend/
│       │   ├── smartphone-display.html
│       │   ├── css/
│       │   │   └── smartphone-style.css
│       │   └── js/
│       │       └── vector-digest.js
│       ├── moodle-integration/
│       │   └── inject-display.php
│       └── README.md
```

### 2. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 선택 (Moodle DB)
USE moodle;

# 스키마 실행
source /path/to/vector-digest/database/schema.sql;
```

또는 phpMyAdmin을 사용하여 `schema.sql` 파일 import

### 3. 설정 파일 수정

`config/config.php` 파일을 열고 데이터베이스 정보를 수정하세요:

```php
<?php
// Database Configuration
define('VD_DB_HOST', 'localhost');           // MySQL 호스트
define('VD_DB_NAME', 'moodle');               // Moodle 데이터베이스 이름
define('VD_DB_USER', 'moodle_user');          // 데이터베이스 사용자
define('VD_DB_PASS', 'your_password_here');   // 데이터베이스 비밀번호
define('VD_DB_PREFIX', 'mdl_');               // Moodle 테이블 접두사
```

### 4. Moodle 테마 통합

#### 방법 A: 테마 footer에 추가 (권장)

테마의 footer 파일을 수정합니다:
`theme/yourtheme/layout/includes/footer.php` 또는 `theme/yourtheme/layout/columns2.php`

```php
<?php
// Vector Digest 통합
require_once($CFG->dirroot . '/local/vector-digest/moodle-integration/inject-display.php');
echo_vector_digest_footer();
?>
```

#### 방법 B: config.php에 추가

Moodle의 `config.php` 파일에 다음을 추가:

```php
// Vector Digest 자동 로드
$CFG->additionalhtmlfooter .= '
<link rel="stylesheet" href="'.$CFG->wwwroot.'/local/vector-digest/frontend/css/smartphone-style.css">
<script src="'.$CFG->wwwroot.'/local/vector-digest/frontend/js/vector-digest.js"></script>
<div id="vector-digest-container"></div>
';
```

### 5. 권한 설정

```bash
# 웹서버가 파일을 읽을 수 있도록 권한 설정
cd /var/www/html/moodle/local/vector-digest
chmod -R 755 .
chown -R www-data:www-data .
```

## 📖 사용 방법

### 1. 기본 사용

Moodle에서 퀴즈나 문제를 볼 때 자동으로 우측 하단에 가상 스마트폰이 표시됩니다.

벡터 관련 문제가 감지되면 자동으로 3줄 요약이 표시됩니다.

### 2. 수동 초기화

특정 페이지에서 직접 초기화하려면:

```html
<script>
const digest = new VectorDigest({
    apiUrl: '/local/vector-digest/api/VectorDigestAPI.php',
    questionId: 123,  // 문제 ID
    autoLoad: true
});
</script>
```

### 3. API 직접 호출

#### 요약 가져오기

```bash
curl "http://your-moodle-site.com/local/vector-digest/api/VectorDigestAPI.php?action=get_digest&questionid=123"
```

#### 새 요약 생성

```bash
curl "http://your-moodle-site.com/local/vector-digest/api/VectorDigestAPI.php?action=generate&questionid=123"
```

## 🎨 UI 커스터마이징

### 색상 변경

`frontend/css/smartphone-style.css` 파일에서 색상을 변경할 수 있습니다:

```css
/* 그라디언트 색상 변경 */
.phone-screen {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 원하는 색상으로 변경 */
.phone-screen {
    background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
}
```

### 위치 변경

config.php에서 위치 설정:

```php
define('VD_POSITION_RIGHT', 20);   // 우측에서 20px
define('VD_POSITION_BOTTOM', 20);  // 하단에서 20px
```

또는 CSS에서 직접:

```css
.smartphone-container {
    bottom: 20px;  /* 하단 여백 */
    right: 20px;   /* 우측 여백 */
}
```

### 크기 변경

```css
.phone-frame {
    width: 375px;   /* 너비 */
    height: 667px;  /* 높이 */
}
```

## 🧪 테스트

### 1. 데이터베이스 테스트

```sql
-- 샘플 데이터 확인
SELECT * FROM mdl_vector_digest LIMIT 5;

-- 특정 문제의 요약 확인
SELECT * FROM mdl_vector_digest WHERE questionid = 1;
```

### 2. API 테스트

브라우저에서 직접 접속:

```
http://your-moodle-site.com/local/vector-digest/api/VectorDigestAPI.php?action=get_digest&questionid=1
```

예상 응답:

```json
{
    "success": true,
    "digest_id": 1,
    "question_id": 1,
    "line1": "벡터는 크기와 방향을 모두 가진 물리량입니다.",
    "line2": "두 벡터의 합은 평행사변형 법칙 또는 삼각형 법칙으로 구합니다.",
    "line3": "내적은 스칼라, 외적은 벡터 결과를 생성합니다.",
    "concepts": ["basics", "addition", "products"],
    "confidence": 0.95,
    "language": "ko"
}
```

### 3. UI 테스트

테스트용 HTML 파일:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="frontend/css/smartphone-style.css">
</head>
<body>
    <div id="vector-digest-container"></div>
    <script src="frontend/js/vector-digest.js"></script>
    <script>
        // 테스트 데이터로 초기화
        const digest = new VectorDigest({
            apiUrl: '/local/vector-digest/api/VectorDigestAPI.php',
            questionId: 1,
            autoLoad: true
        });
    </script>
</body>
</html>
```

## 🔧 문제 해결

### 1. 스마트폰 화면이 표시되지 않음

- 브라우저 콘솔에서 JavaScript 오류 확인
- CSS/JS 파일 경로가 올바른지 확인
- 파일 권한 확인 (755)

```bash
# 권한 확인
ls -la /var/www/html/moodle/local/vector-digest/frontend/
```

### 2. 데이터베이스 연결 오류

- `config/config.php`에서 DB 정보 확인
- MySQL 사용자 권한 확인

```sql
-- 사용자 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 필요시 권한 부여
GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 요약이 생성되지 않음

- 문제 텍스트에 벡터 관련 키워드가 있는지 확인
- `VectorAnalyzer.php`의 키워드 목록 확인 및 추가

```php
// config/config.php에서 키워드 추가
$VECTOR_KEYWORDS = [
    'vector', 'magnitude', 'direction',
    // 새 키워드 추가
    'resultant', 'component'
];
```

### 4. 한국어/영어 감지 오류

- 문제 텍스트의 인코딩이 UTF-8인지 확인
- MySQL 테이블 collation이 `utf8mb4_unicode_ci`인지 확인

## 📊 분석 데이터

사용자 인터랙션 로그 조회:

```sql
-- 가장 많이 본 요약
SELECT digestid, COUNT(*) as views
FROM mdl_vector_digest_log
WHERE action = 'viewed'
GROUP BY digestid
ORDER BY views DESC
LIMIT 10;

-- 도움이 된 요약
SELECT digestid, COUNT(*) as helpful_count
FROM mdl_vector_digest_log
WHERE action = 'helpful'
GROUP BY digestid
ORDER BY helpful_count DESC;

-- 평균 열람 시간
SELECT AVG(duration) as avg_duration_seconds
FROM mdl_vector_digest_log
WHERE action = 'viewed' AND duration IS NOT NULL;
```

## 🔐 보안 고려사항

1. **SQL Injection 방지**: PDO prepared statements 사용
2. **XSS 방지**: 출력 시 htmlspecialchars() 사용
3. **인증**: Moodle 세션 기반 사용자 인증
4. **권한**: 데이터베이스 사용자는 필요한 최소 권한만 부여

## 📝 라이선스

MIT License

## 👨‍💻 개발자

KAIST Touch Math Academy

## 🤝 기여

이슈 및 PR은 언제나 환영합니다!

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
