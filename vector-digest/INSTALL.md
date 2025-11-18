# Vector Digest - 빠른 설치 가이드

## 🚀 5분 안에 설치하기

### Step 1: 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/html/moodle

# local 디렉토리가 없다면 생성
mkdir -p local

# vector-digest 파일 복사
cp -r /path/to/vector-digest ./local/
```

### Step 2: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# Moodle DB 선택
use moodle;

# 스키마 실행
source /var/www/html/moodle/local/vector-digest/database/schema.sql;

# 성공 확인
show tables like '%vector_digest%';
# 3개의 테이블이 나와야 함:
# - mdl_vector_digest
# - mdl_vector_digest_cache
# - mdl_vector_digest_log
```

### Step 3: 설정 파일 수정

```bash
# config.php 편집
nano /var/www/html/moodle/local/vector-digest/config/config.php
```

다음 항목 수정:

```php
define('VD_DB_HOST', 'localhost');
define('VD_DB_NAME', 'moodle');
define('VD_DB_USER', 'your_moodle_user');
define('VD_DB_PASS', 'your_password');
define('VD_DB_PREFIX', 'mdl_');
```

### Step 4: 권한 설정

```bash
# 소유자 및 권한 설정
cd /var/www/html/moodle/local
chown -R www-data:www-data vector-digest
chmod -R 755 vector-digest
```

### Step 5: Moodle 통합

#### 옵션 A: 테마 footer에 추가 (권장)

테마 파일 편집:

```bash
# 테마의 footer 파일 찾기
find /var/www/html/moodle/theme -name "*footer*"

# 예: theme/boost/layout/columns2.php 편집
nano /var/www/html/moodle/theme/boost/layout/columns2.php
```

`</body>` 태그 바로 위에 추가:

```php
<?php
// Vector Digest Integration
if (file_exists($CFG->dirroot . '/local/vector-digest/moodle-integration/inject-display.php')) {
    require_once($CFG->dirroot . '/local/vector-digest/moodle-integration/inject-display.php');
    echo_vector_digest_footer();
}
?>
```

#### 옵션 B: config.php에 추가 (더 간단)

```bash
nano /var/www/html/moodle/config.php
```

파일 끝부분에 추가:

```php
// Vector Digest - Auto Load
$CFG->additionalhtmlfooter = '
<link rel="stylesheet" href="'.$CFG->wwwroot.'/local/vector-digest/frontend/css/smartphone-style.css">
<script src="'.$CFG->wwwroot.'/local/vector-digest/frontend/js/vector-digest.js"></script>
<div id="vector-digest-container"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
    fetch("'.$CFG->wwwroot.'/local/vector-digest/frontend/smartphone-display.html")
        .then(r => r.text())
        .then(html => {
            document.getElementById("vector-digest-container").innerHTML = html;
            var qid = new URLSearchParams(window.location.search).get("q");
            if (qid) {
                new VectorDigest({
                    apiUrl: "'.$CFG->wwwroot.'/local/vector-digest/api/VectorDigestAPI.php",
                    questionId: qid,
                    autoLoad: true
                });
            }
        });
});
</script>
';
```

### Step 6: 테스트

#### 6.1 API 테스트

브라우저에서 접속:

```
http://your-moodle-site.com/local/vector-digest/api/VectorDigestAPI.php?action=get_digest&questionid=1
```

정상 응답 예시:

```json
{
    "success": true,
    "line1": "벡터는 크기와 방향을 모두 가진 물리량입니다.",
    "line2": "...",
    "line3": "..."
}
```

#### 6.2 UI 테스트

1. Moodle에 로그인
2. 퀴즈 또는 문제 페이지로 이동
3. 우측 하단에 스마트폰 화면이 표시되는지 확인

#### 6.3 데이터베이스 테스트

```sql
-- 샘플 데이터 확인
SELECT * FROM mdl_vector_digest LIMIT 1;

-- 결과가 없다면 수동으로 삽입
INSERT INTO mdl_vector_digest (questionid, courseid, digest_line1, digest_line2, digest_line3, confidence_score, language, timecreated, timemodified)
VALUES (1, 1, '벡터는 크기와 방향을 가집니다.', '덧셈은 평행사변형 법칙으로 수행됩니다.', '내적과 외적 연산이 가능합니다.', 0.95, 'ko', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

## ✅ 설치 확인 체크리스트

- [ ] 3개의 데이터베이스 테이블이 생성됨
- [ ] config.php의 DB 설정이 올바름
- [ ] 파일 권한이 755 (www-data 소유)
- [ ] API 엔드포인트가 응답함
- [ ] 퀴즈 페이지에서 스마트폰 화면이 보임
- [ ] 벡터 문제에서 요약이 표시됨

## 🔧 문제 해결

### 문제: 스마트폰 화면이 안 보임

```bash
# 1. 브라우저 콘솔 확인 (F12)
# 2. 파일 경로 확인
ls -la /var/www/html/moodle/local/vector-digest/frontend/

# 3. Apache 에러 로그 확인
tail -f /var/log/apache2/error.log
```

### 문제: DB 연결 오류

```bash
# PHP PDO 확장 모듈 확인
php -m | grep pdo

# 없다면 설치
sudo apt-get install php7.1-mysql
sudo service apache2 restart
```

### 문제: 권한 오류

```bash
# 전체 권한 재설정
cd /var/www/html/moodle/local
sudo chown -R www-data:www-data vector-digest
sudo chmod -R 755 vector-digest

# Apache 재시작
sudo service apache2 restart
```

### 문제: 요약이 안 나옴

벡터 관련 키워드를 포함한 문제를 만들어 테스트:

```
제목: 벡터의 덧셈
문제: 두 벡터 A(3,4)와 B(1,2)의 합 벡터를 구하시오.
이때 벡터의 크기와 방향을 모두 표시하시오.
```

## 📞 추가 지원

더 자세한 정보는 `README.md`를 참조하세요.

문제가 계속되면:
1. Apache/PHP 에러 로그 확인
2. 브라우저 개발자 도구 (F12) 콘솔 확인
3. MySQL 쿼리 로그 확인

---

설치 완료! 🎉
