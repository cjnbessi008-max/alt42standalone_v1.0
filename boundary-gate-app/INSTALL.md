# Boundary Gate 빠른 설치 가이드

이 문서는 Boundary Gate Learning System을 빠르게 설치하고 실행하는 방법을 안내합니다.

## 방법 1: 독립 실행 (Moodle 없이)

가장 간단한 방법입니다. 데이터베이스 없이도 샘플 데이터로 즉시 테스트할 수 있습니다.

### 단계 1: 파일 복사

```bash
# 웹 서버 루트로 이동
cd /var/www/html

# 또는 XAMPP/WAMP 사용 시
cd C:\xampp\htdocs  # Windows
```

`boundary-gate-app` 폴더를 웹 서버 루트에 복사하세요.

### 단계 2: 브라우저에서 열기

```
http://localhost/boundary-gate-app/
```

**완료!** 앱이 샘플 문제로 즉시 작동합니다.

---

## 방법 2: 데이터베이스 연동 (권장)

진행 상황을 저장하고 더 많은 기능을 사용하려면 MySQL 데이터베이스를 설정하세요.

### 단계 1: MySQL 데이터베이스 생성

#### 옵션 A: 명령줄 사용

```bash
mysql -u root -p
```

MySQL 프롬프트에서:

```sql
CREATE DATABASE boundary_gate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boundary_gate;
SOURCE /path/to/boundary-gate-app/sql/schema.sql;
EXIT;
```

#### 옵션 B: phpMyAdmin 사용

1. phpMyAdmin 접속 (`http://localhost/phpmyadmin`)
2. 왼쪽 메뉴에서 "새로 만들기" 클릭
3. 데이터베이스 이름: `boundary_gate`
4. 문자 집합: `utf8mb4_unicode_ci`
5. "만들기" 클릭
6. 상단 메뉴에서 "가져오기" 클릭
7. `sql/schema.sql` 파일 선택하여 업로드

### 단계 2: PHP 설정 수정

`php/config.php` 파일을 텍스트 에디터로 열고 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'boundary_gate');
define('DB_USER', 'root');           // MySQL 사용자명
define('DB_PASS', '');               // MySQL 비밀번호
```

### 단계 3: 로그 폴더 생성

```bash
cd boundary-gate-app
mkdir logs
chmod 755 logs
```

Windows에서는 수동으로 `logs` 폴더를 만들면 됩니다.

### 단계 4: 테스트

브라우저에서 앱을 열고 문제를 풀어보세요. 점수가 데이터베이스에 저장됩니다.

---

## 방법 3: Moodle 연동

Moodle LMS와 연동하여 학습 관리 시스템의 일부로 사용합니다.

### 단계 1: Moodle 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. 다음 단계를 순서대로 진행:
   - ✅ 웹 서비스 활성화
   - ✅ 프로토콜 활성화 (REST 프로토콜)
   - ✅ 역할 권한 설정
   - ✅ 웹 서비스 사용자 생성
   - ✅ 서비스 생성 (예: "boundary_gate_service")
   - ✅ 함수 추가:
     - `core_webservice_get_site_info`
     - `core_course_get_courses`
     - `core_user_get_users`
     - `mod_quiz_get_quizzes_by_courses`
   - ✅ 토큰 생성

### 단계 2: 토큰 복사

생성된 토큰을 복사하세요 (예: `a1b2c3d4e5f6g7h8i9j0`)

### 단계 3: PHP 설정 업데이트

`php/config.php` 파일 수정:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_token_here');  // 복사한 토큰 붙여넣기
```

### 단계 4: 연결 테스트

브라우저 콘솔(F12)에서 다음 JavaScript 실행:

```javascript
fetch('php/api.php?action=testConnection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log(data));
```

`"connected": true`가 표시되면 성공!

---

## 일반적인 문제 해결

### 1. "Database Connection Failed" 오류

**원인**: MySQL 연결 실패

**해결책**:
```bash
# MySQL 서비스 상태 확인
sudo service mysql status

# MySQL 시작
sudo service mysql start

# Windows (XAMPP)
# XAMPP Control Panel에서 MySQL "Start" 클릭
```

### 2. "Permission Denied" 오류

**원인**: logs 폴더 권한 문제

**해결책**:
```bash
chmod -R 755 boundary-gate-app/logs
chown -R www-data:www-data boundary-gate-app/logs  # Linux
```

### 3. 빈 화면 또는 PHP 오류

**원인**: PHP 버전 문제 또는 구문 오류

**해결책**:
```bash
# PHP 버전 확인 (7.1 이상 필요)
php -v

# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log  # Linux
# 또는 XAMPP logs/error.log
```

### 4. 애니메이션이 작동하지 않음

**원인**: JavaScript 로딩 실패

**해결책**:
1. 브라우저 콘솔(F12) 열기
2. 오류 메시지 확인
3. 브라우저 캐시 삭제 (Ctrl+Shift+Del)
4. 하드 리프레시 (Ctrl+F5)

### 5. API 요청 실패

**원인**: CORS 정책 또는 경로 문제

**해결책**:
- `.htaccess` 파일이 존재하는지 확인
- Apache `mod_rewrite` 모듈 활성화:
  ```bash
  sudo a2enmod rewrite
  sudo service apache2 restart
  ```

---

## 테스트 체크리스트

설치 후 다음 항목을 확인하세요:

- [ ] 메인 페이지가 로드됨
- [ ] 우측 하단에 스마트폰 화면이 표시됨
- [ ] 숫자와 부등호 게이트가 보임
- [ ] 버튼 클릭 시 게이트 애니메이션 작동
- [ ] 정답 시 게이트가 열림
- [ ] 점수가 증가함
- [ ] "다음 문제" 버튼으로 새 문제 로드
- [ ] 키보드 단축키 작동 (1, 2, H, Enter)

---

## 시스템 요구사항 요약

| 구성 요소 | 최소 요구사항 | 권장 사항 |
|----------|--------------|----------|
| PHP | 7.1.9 | 7.4+ |
| MySQL | 5.7 | 8.0+ |
| 웹 서버 | Apache 2.4 | Apache 2.4 + mod_rewrite |
| 브라우저 | Chrome 80+ | Chrome/Firefox 최신 버전 |
| Moodle | 3.7 | 3.9+ |

---

## 다음 단계

설치가 완료되었나요? 🎉

1. **사용자 매뉴얼**: `README.md` 파일 참고
2. **문제 추가**: SQL로 새 문제 추가 또는 Moodle에서 가져오기
3. **커스터마이징**: CSS 파일 수정하여 디자인 변경
4. **학생 등록**: `students` 테이블에 학생 정보 추가

---

## 빠른 시작 명령어 (Linux)

전체 설치를 한 번에 실행:

```bash
#!/bin/bash
# Boundary Gate 자동 설치 스크립트

# 1. 데이터베이스 생성
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS boundary_gate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boundary_gate;
SOURCE $(pwd)/sql/schema.sql;
EOF

# 2. 로그 폴더 생성
mkdir -p logs
chmod 755 logs

# 3. Apache 재시작
sudo service apache2 restart

echo "✅ 설치 완료!"
echo "🌐 브라우저에서 http://localhost/boundary-gate-app/ 접속하세요"
```

위 스크립트를 `install.sh`로 저장하고 실행:

```bash
chmod +x install.sh
./install.sh
```

---

## 지원

문제가 발생했나요?

1. **FAQ**: README.md의 "트러블슈팅" 섹션 참고
2. **로그 확인**: `logs/error.log` 파일 확인
3. **이슈 보고**: GitHub Issues에 등록

**즐거운 학습 되세요!** 📚✨
