# Quick Start Guide - Reflection Pair

10분 안에 Reflection Pair를 설치하고 실행하세요!

## 🚀 빠른 설치 (자동)

```bash
# 1. 프로젝트 디렉토리로 이동
cd reflection_pair

# 2. 설치 스크립트 실행
chmod +x INSTALL.sh
sudo ./INSTALL.sh

# 3. 브라우저에서 열기
# http://localhost/reflection_pair/views/index.html
```

## 🔧 수동 설치 (3단계)

### 1단계: 데이터베이스 설정 (2분)

```sql
-- MySQL 접속
mysql -u root -p

-- 데이터베이스 생성
CREATE DATABASE moodle_reflection_pair CHARACTER SET utf8mb4;

-- 사용자 생성
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle_reflection_pair.* TO 'moodle_user'@'localhost';

-- 테이블 생성
USE moodle_reflection_pair;
SOURCE database/schema.sql;
```

### 2단계: 설정 파일 (1분)

```bash
# config 디렉토리로 이동
cd config

# 예제 파일 복사
cp db_config.ini.example db_config.ini

# 설정 편집
nano db_config.ini
```

**db_config.ini 내용:**
```ini
[database]
host = localhost
db_name = moodle_reflection_pair
username = moodle_user
password = your_password
```

### 3단계: 웹 서버 설정 (2분)

#### Apache

```bash
# 심볼릭 링크 생성
sudo ln -s /path/to/reflection_pair /var/www/html/reflection_pair

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/reflection_pair
```

#### Nginx

```nginx
# /etc/nginx/sites-available/reflection_pair
server {
    listen 80;
    server_name localhost;

    root /path/to/reflection_pair;
    index views/index.html;

    location /api/ {
        try_files $uri $uri/ /api/problems.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/reflection_pair /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📱 테스트 실행

### 1. 브라우저에서 열기
```
http://localhost/reflection_pair/views/index.html
```

### 2. API 테스트
```bash
# 문제 조회
curl http://localhost/reflection_pair/api/problems.php?id=1

# 응답 예시:
# {
#   "success": true,
#   "data": {
#     "id": "1",
#     "base_number": "2.71828",
#     "problem_type": "both"
#   }
# }
```

### 3. 기능 확인
- ✅ 우측 하단에 가상 스마트폰 표시
- ✅ 빨간색 지수 함수 (y = e^x)
- ✅ 청록색 로그 함수 (y = ln x)
- ✅ 노란색 반사선 (y = x)
- ✅ 드래그로 이동
- ✅ 휠로 확대/축소

## 🎓 Moodle 통합 (추가 5분)

### 방법 1: 페이지에 삽입

```php
// Moodle 페이지 (예: course/view.php)
echo '<div style="height: 100vh;">';
echo '<iframe src="/local/reflection_pair/views/index.html?course_id='.$COURSE->id.'&user_id='.$USER->id.'"
      width="100%" height="100%" frameborder="0"></iframe>';
echo '</div>';
```

### 방법 2: 블록으로 추가

1. **파일 복사**
```bash
cp -r reflection_pair /var/www/html/moodle/blocks/
```

2. **Moodle 관리자 페이지 접속**
   - 사이트 관리 → 알림
   - "Reflection Pair" 블록 설치 확인

3. **코스에 블록 추가**
   - 코스 페이지 → 블록 추가 → Reflection Pair

## 🐛 문제 해결

### 스마트폰 화면이 안 보여요
```bash
# 브라우저 콘솔 확인 (F12)
# CSS 파일 경로 확인
ls -la assets/css/smartphone.css
```

### API 에러가 나요
```bash
# PHP 에러 로그 확인
tail -f /var/log/apache2/error.log

# 데이터베이스 연결 테스트
php -r "
require_once 'config/database.php';
\$db = new Database();
\$db->loadConfig();
var_dump(\$db->getConnection());
"
```

### 그래프가 안 그려져요
```javascript
// 브라우저 콘솔에서 실행
console.log(window.reflectionPairIntegration);
console.log(window.reflectionPairIntegration.visualizer);
```

## 📞 도움말

- **상세 문서**: README.md
- **데이터베이스 스키마**: database/schema.sql
- **API 명세**: README.md의 "API 사용" 섹션

## ✨ 다음 단계

1. **색상 커스터마이징**
   - `assets/css/smartphone.css` 수정

2. **새 문제 추가**
```sql
INSERT INTO rp_problems (moodle_course_id, moodle_user_id, base_number)
VALUES (1, 1, 10.0);  -- 상용 로그
```

3. **분석 데이터 확인**
```sql
-- 사용자 상호작용 통계
SELECT interaction_type, COUNT(*) as count
FROM rp_interactions
WHERE moodle_user_id = 1
GROUP BY interaction_type;
```

---

**설치 완료! 🎉**

문제가 있으시면 README.md의 "문제 해결" 섹션을 참고하세요.
