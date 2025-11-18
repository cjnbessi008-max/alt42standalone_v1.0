# 🫁 호흡 템포 학습 도우미 (Breathing Pace Learning Assistant)

Moodle LMS와 연동하여 문제 난이도에 따라 맞춤형 호흡 가이드를 제공하는 독립형 웹 애플리케이션

## 📋 개요

이 애플리케이션은 학생들이 학습 중 스트레스를 관리하고 집중력을 향상시킬 수 있도록 문제 난이도에 따른 호흡 템포 가이드를 제공합니다.

### 주요 기능

- ✅ Moodle 3.7 LMS와 REST API 연동
- ✅ 문제 난이도 자동 분석 (쉬움/보통/어려움/매우 어려움)
- ✅ 난이도별 맞춤형 호흡 템포 제공
- ✅ 시각적 호흡 애니메이션 가이드
- ✅ 세션 통계 및 진행상황 추적
- ✅ MySQL 데이터베이스 기반 사용자 데이터 관리

## 🎯 호흡 템포 규칙

| 난이도 | 들숨 | 날숨 | 총 사이클 시간 | 설명 |
|--------|------|------|---------------|------|
| 쉬움 (Easy) | 4초 | 4초 | 8초 | 빠른 템포, 가벼운 긴장 완화 |
| 보통 (Medium) | 4초 | 7초 | 11초 | 중간 템포, 균형잡힌 호흡 |
| 어려움 (Hard) | 4초 | 8초 | 12초 | 느린 템포, 깊은 이완 |
| 매우 어려움 (Very Hard) | 5초 | 10초 | 15초 | 매우 느린 템포, 최대 이완 |

기본적으로 각 세션은 3사이클로 구성됩니다.

## 🛠️ 기술 스택

### Frontend
- HTML5 + CSS3
- Vanilla JavaScript (ES6+)
- 반응형 웹 디자인

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle Web Services API

### 데이터베이스
- MySQL 5.7
- InnoDB 엔진
- UTF-8MB4 인코딩

## 📦 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (Web Services 활성화 필요)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 🚀 설치 가이드

### 1. 파일 복사

```bash
# 웹 서버 루트 디렉토리로 복사
cp -r breathing-pace-app /var/www/html/
cd /var/www/html/breathing-pace-app
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql

# 사용자 권한 설정 (선택사항)
GRANT ALL PRIVILEGES ON breathing_pace_db.* TO 'breathing_user'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

### 3. 설정 파일 수정

`src/config/config.php` 파일을 편집하여 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'breathing_pace_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /breathing-pace-app/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

#### Nginx

```nginx
location /breathing-pace-app {
    alias /var/www/html/breathing-pace-app/public;
    try_files $uri $uri/ =404;

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
    }
}
```

### 5. 권한 설정

```bash
# 디렉토리 권한 설정
chmod -R 755 /var/www/html/breathing-pace-app
chown -R www-data:www-data /var/www/html/breathing-pace-app
```

## 🔧 Moodle 설정

### 1. Web Services 활성화

Moodle 관리자 계정으로 로그인:

1. **사이트 관리** → **고급 기능** → **Web services 활성화** 체크
2. **사이트 관리** → **플러그인** → **Web services** → **관리**
3. **REST 프로토콜** 활성화

### 2. API 토큰 생성

1. **사이트 관리** → **플러그인** → **Web services** → **토큰 관리**
2. **토큰 추가** 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰을 복사하여 저장

### 3. 필요한 Web Service 함수 활성화

다음 함수들이 활성화되어 있어야 합니다:
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_attempt_data`
- `mod_quiz_get_quiz_feedback_for_grade`
- `core_course_get_courses`

## 💻 사용 방법

### 1. 애플리케이션 접속

웹 브라우저로 `http://your-server/breathing-pace-app/public/` 접속

### 2. Moodle 연결 설정

- **Moodle URL**: Moodle 사이트 URL (예: https://your-moodle.com)
- **API Token**: 생성한 Web Service 토큰
- **퀴즈 ID**: 연동할 Moodle 퀴즈 ID

### 3. 호흡 가이드 시작

1. 연결 후 문제 정보와 권장 호흡 템포 확인
2. "호흡 가이드 시작" 버튼 클릭
3. 화면의 시각적 가이드를 따라 호흡
4. 3사이클 완료 후 문제 시작

### 4. 세션 관리

- **일시정지**: 호흡 가이드를 일시 중단
- **중지**: 세션 종료
- **완료**: 호흡 운동 완료 및 문제 시작

## 📊 데이터베이스 구조

### 주요 테이블

- `users` - 사용자 정보
- `moodle_connections` - Moodle 연결 설정
- `questions` - 문제 정보 캐시
- `breathing_sessions` - 호흡 세션 기록
- `breathing_cycles` - 호흡 사이클 상세 기록
- `user_statistics` - 사용자 통계 (집계)
- `system_logs` - 시스템 로그

### 주요 뷰

- `v_user_session_summary` - 사용자별 세션 요약
- `v_difficulty_stats` - 난이도별 통계

## 🔒 보안 고려사항

1. **API 토큰 보안**: Moodle API 토큰은 안전하게 저장 (암호화 권장)
2. **HTTPS 사용**: 프로덕션 환경에서는 HTTPS 필수
3. **SQL Injection 방지**: PDO Prepared Statements 사용
4. **XSS 방지**: 사용자 입력 sanitization
5. **CORS 설정**: 필요한 도메인만 허용

## 🐛 문제 해결

### Moodle 연결 실패

- Web Services가 활성화되어 있는지 확인
- API 토큰이 유효한지 확인
- Moodle URL이 올바른지 확인 (https:// 포함)
- 방화벽 설정 확인

### 데이터베이스 연결 오류

- MySQL 서비스가 실행 중인지 확인
- 데이터베이스 사용자 권한 확인
- `config.php` 설정 확인

### 호흡 애니메이션이 작동하지 않음

- 브라우저 콘솔에서 JavaScript 오류 확인
- 최신 브라우저 사용 권장
- 캐시 삭제 후 새로고침

## 📈 향후 개발 계획

- [ ] 사용자 인증 시스템
- [ ] 다국어 지원 (영어, 한국어)
- [ ] 모바일 앱 버전
- [ ] 오디오 가이드 추가
- [ ] 개인 맞춤형 호흡 템포 설정
- [ ] 통계 대시보드 고도화
- [ ] LTI (Learning Tools Interoperability) 통합

## 📄 라이선스

MIT License

## 👥 기여

버그 리포트 및 기능 제안은 Issue를 통해 제출해주세요.

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
- 이메일: support@example.com
- 문서: [Wiki](https://github.com/your-repo/wiki)

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline 프로젝트의 일부로 개발되었습니다.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Moodle Compatibility**: 3.7+
**PHP Version**: 7.1.9+
**MySQL Version**: 5.7+
