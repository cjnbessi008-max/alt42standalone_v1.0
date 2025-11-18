# Boundary Gate Learning System

부등호(≥, ≤) 개념을 학습하는 인터랙티브 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면이 표시되며, 부등호가 물리적으로 열리고 닫히는 "Boundary Gate" 애니메이션을 통해 학습합니다.

## 주요 기능

- **인터랙티브 Boundary Gate 애니메이션**: 부등호(≥, ≤)가 게이트처럼 열리고 닫히는 시각적 효과
- **가상 스마트폰 UI**: 우측 하단에 고정된 모바일 화면
- **Moodle LMS 연동**: Moodle 3.7과 통합하여 문제 및 진행 상황 관리
- **실시간 점수 시스템**: 정답 시 점수 획득 및 진행 상황 추적
- **난이도 자동 조정**: 학생의 정답률에 따라 문제 난이도 조정
- **키보드 단축키 지원**: 빠른 학습을 위한 키보드 조작

## 기술 스택

### Frontend
- HTML5
- CSS3 (Animations & Flexbox)
- Vanilla JavaScript (ES6+)
- SVG Graphics

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7 Web Services API

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)
- 모던 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 저장소 클론 또는 다운로드

```bash
cd /var/www/html  # 또는 웹 서버 루트 디렉토리
# 파일을 boundary-gate-app 폴더에 복사
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 스키마 실행
source /path/to/boundary-gate-app/sql/schema.sql
```

또는 phpMyAdmin을 통해 `sql/schema.sql` 파일을 임포트하세요.

### 3. PHP 설정 파일 수정

`php/config.php` 파일을 열어 데이터베이스 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'boundary_gate');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. Moodle 연동 설정 (선택사항)

Moodle과 연동하려면 `php/config.php`에서 Moodle 정보를 설정하세요:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

#### Moodle 웹서비스 토큰 생성 방법:
1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
3. 웹 서비스 활성화
4. 사용자에게 웹 서비스 권한 부여
5. 토큰 생성

### 5. 권한 설정

```bash
# logs 디렉토리 생성 및 권한 부여
mkdir -p boundary-gate-app/logs
chmod 755 boundary-gate-app/logs
chown www-data:www-data boundary-gate-app/logs  # Apache 사용자
```

### 6. 웹 서버 설정

#### Apache (.htaccess)

`boundary-gate-app` 폴더에 `.htaccess` 파일 생성:

```apache
RewriteEngine On
Options -Indexes

# PHP 설정
php_flag display_errors On
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

#### Nginx

```nginx
location /boundary-gate-app {
    index index.html;
    try_files $uri $uri/ /boundary-gate-app/index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

## 사용 방법

### 1. 앱 실행

브라우저에서 다음 주소로 접속하세요:

```
http://localhost/boundary-gate-app/
```

### 2. 문제 풀이

1. 화면에 두 개의 숫자가 표시됩니다
2. 중앙에 Boundary Gate(부등호 게이트)가 있습니다
3. 올바른 부등호를 선택하세요:
   - **≥ (크거나 같다)**
   - **≤ (작거나 같다)**
4. 정답이면 게이트가 열리며 점수를 획득합니다
5. "다음 문제" 버튼을 클릭하여 계속 진행하세요

### 3. 키보드 단축키

- `1` 키: ≥ (크거나 같다) 선택
- `2` 키: ≤ (작거나 같다) 선택
- `H` 키: 힌트 표시
- `Enter` 키: 다음 문제

## API 엔드포인트

### 문제 목록 가져오기

```javascript
POST /boundary-gate-app/php/api.php?action=getProblems
Content-Type: application/json

{
    "course_id": 1  // 선택사항
}
```

### 답안 제출

```javascript
POST /boundary-gate-app/php/api.php?action=submitAnswer
Content-Type: application/json

{
    "problem_id": 1,
    "answer": "ge",
    "student_id": 1
}
```

### 진행 상황 조회

```javascript
POST /boundary-gate-app/php/api.php?action=getProgress
Content-Type: application/json

{
    "student_id": 1
}
```

### Moodle 연결 테스트

```javascript
POST /boundary-gate-app/php/api.php?action=testConnection
```

## 프로젝트 구조

```
boundary-gate-app/
├── index.html              # 메인 HTML 파일
├── css/
│   ├── style.css          # 전체 스타일
│   ├── smartphone.css     # 가상 스마트폰 프레임
│   └── animation.css      # Boundary Gate 애니메이션
├── js/
│   ├── app.js             # 메인 앱 로직
│   ├── boundaryGate.js    # 애니메이션 컨트롤러
│   └── moodleAPI.js       # Moodle API 연동
├── php/
│   ├── config.php         # 데이터베이스 설정
│   ├── moodle_connector.php  # Moodle 커넥터
│   └── api.php            # REST API 엔드포인트
├── sql/
│   └── schema.sql         # 데이터베이스 스키마
├── logs/                  # 로그 파일 (자동 생성)
└── README.md              # 이 파일
```

## Boundary Gate 애니메이션 설명

### 게이트 타입

1. **≥ (Greater than or Equal)**: 파란색 게이트
   - 상단: `>` 모양 (위로 열림)
   - 하단: `=` 모양 (아래로 열림)

2. **≤ (Less than or Equal)**: 빨간색 게이트
   - 상단: `<` 모양 (위로 열림)
   - 하단: `=` 모양 (아래로 열림)

### 애니메이션 효과

- **정답**: 게이트가 빛나며 크게 열림
- **오답**: 게이트가 좌우로 흔들림
- **힌트**: 게이트가 가볍게 튕김
- **전환**: 게이트 타입 변경 시 회전 효과

## 문제 유형

### 난이도별 분류

1. **Easy**: 1-10 범위의 숫자
2. **Medium**: 1-20 범위의 숫자
3. **Hard**: 1-50 범위의 숫자

### 자동 난이도 조정

- 정답률 80% 이상: Hard 문제 제공
- 정답률 50-80%: Medium 문제 제공
- 정답률 50% 미만: Easy 문제 제공

## 데이터베이스 스키마

### 주요 테이블

1. **problems**: 부등호 문제 저장
2. **students**: 학생 정보
3. **student_answers**: 학생 답안 기록
4. **student_progress**: 진행 상황 요약
5. **session_logs**: 학습 세션 로그
6. **moodle_sync_logs**: Moodle 동기화 로그

## 트러블슈팅

### 데이터베이스 연결 오류

```
Error: Database Connection Failed
```

**해결방법**:
1. `php/config.php`에서 DB 정보 확인
2. MySQL 서비스 실행 상태 확인: `service mysql status`
3. 데이터베이스가 생성되었는지 확인

### Moodle 연동 실패

```
Error: Moodle connection failed
```

**해결방법**:
1. Moodle URL이 올바른지 확인
2. 웹 서비스가 활성화되었는지 확인
3. 토큰이 유효한지 확인
4. 앱은 Moodle 없이도 독립적으로 작동 (샘플 문제 사용)

### 애니메이션이 작동하지 않음

**해결방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인 (F12)
2. CSS 파일이 제대로 로드되었는지 확인
3. 브라우저 캐시 삭제 후 새로고침

### 권한 오류

```
Warning: file_put_contents(): failed to open stream
```

**해결방법**:
```bash
chmod -R 755 boundary-gate-app/logs
chown -R www-data:www-data boundary-gate-app/logs
```

## 개발 및 커스터마이징

### 새로운 문제 추가

SQL로 직접 추가:

```sql
INSERT INTO problems (left_number, right_number, correct_answer, description, difficulty)
VALUES (15, 10, 'ge', '15는 10보다 크거나 같습니까?', 'medium');
```

### 애니메이션 커스터마이징

`css/animation.css` 파일에서 애니메이션 속성을 수정하세요:

```css
.gate-open .gate-door-top {
    animation-duration: 1s;  /* 애니메이션 속도 조정 */
}
```

### 색상 테마 변경

`css/style.css`와 `css/smartphone.css`에서 색상 변수를 수정하세요.

## 성능 최적화

- **캐싱**: 자주 사용되는 문제는 브라우저 로컬 스토리지에 캐시
- **이미지 최적화**: SVG 사용으로 빠른 로딩
- **데이터베이스 인덱스**: 자주 조회되는 컬럼에 인덱스 설정 완료
- **AJAX 비동기 처리**: 답안 제출 시 페이지 리로드 없음

## 보안 고려사항

- SQL Injection 방지: PDO prepared statements 사용
- XSS 방지: 사용자 입력 검증 및 이스케이핑
- CSRF 방지: 토큰 기반 인증 (Moodle 연동 시)
- 접근 제어: 학생은 자신의 데이터만 접근 가능

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 지원 및 문의

문제가 발생하거나 질문이 있으시면:
- 이슈 트래커에 등록
- 로그 파일 확인: `logs/error.log`
- 브라우저 개발자 도구 콘솔 확인

## 버전 히스토리

- **v1.0.0** (2025-11-18)
  - 초기 릴리스
  - Boundary Gate 애니메이션 구현
  - Moodle 3.7 연동
  - 가상 스마트폰 UI
  - 진행 상황 추적 시스템

## 향후 개발 계획

- [ ] 모바일 앱 버전 (React Native)
- [ ] 멀티플레이어 모드
- [ ] 성취도 배지 시스템
- [ ] 음성 피드백
- [ ] 다국어 지원 (영어, 한국어)
- [ ] AI 기반 맞춤형 학습 경로
- [ ] 학부모/교사 대시보드
