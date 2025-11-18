# Explosion Count - 경우의 수 학습 앱

경우의 수 증가를 불꽃 애니메이션으로 시각화하는 교육용 웹 애플리케이션입니다.

## 주요 기능

- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 보이는 인터페이스
- **불꽃 애니메이션**: 경우의 수 증가 속도에 따라 다양한 불꽃 효과
- **Moodle LMS 연동**: Moodle 3.7과 연동하여 문제 정보 수신
- **실시간 카운터**: 경우의 수를 실시간으로 시각화
- **단계별 진행**: 문제 해결 과정을 단계별로 추적

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7 (선택사항)

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- 웹 서버 (Apache, Nginx 등)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE explosion_count CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 import
mysql -u root -p explosion_count < database/schema.sql
```

### 2. 설정 파일 수정

`config/config.php` 파일을 열어 데이터베이스 정보를 수정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'explosion_count');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Moodle 연동 (선택사항)

Moodle과 연동하려면 `config/config.php`에서:

```php
define('MOODLE_DIR', '/path/to/your/moodle');
define('MOODLE_INTEGRATION_ENABLED', true);
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName explosion-count.local
    DocumentRoot /path/to/alt42standalone_v1.0/src

    <Directory /path/to/alt42standalone_v1.0/src>
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
    server_name explosion-count.local;
    root /path/to/alt42standalone_v1.0/src;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0
sudo chmod -R 755 /path/to/alt42standalone_v1.0
```

## 사용 방법

### 1. 앱 접속

브라우저에서 `http://localhost/index.html` 또는 설정한 도메인으로 접속합니다.

### 2. 문제 선택

왼쪽 패널에서 학습할 문제를 선택합니다.

### 3. 학습 시작

1. "시작" 버튼을 클릭하여 세션을 시작합니다
2. "다음 단계" 버튼을 클릭하여 각 단계를 진행합니다
3. 우측 하단 스마트폰 화면에서 불꽃 애니메이션과 함께 경우의 수가 증가합니다

### 4. 진행 상황 확인

- 현재 경우의 수
- 최대 경우의 수
- 현재 단계
- 단계별 증가 배수

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   └── config.php              # 설정 파일
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── src/
│   ├── index.html              # 메인 페이지
│   ├── css/
│   │   ├── smartphone.css      # 스마트폰 UI 스타일
│   │   └── explosion.css       # 애니메이션 스타일
│   ├── js/
│   │   ├── explosionCount.js   # 메인 로직
│   │   ├── animation.js        # 애니메이션 엔진
│   │   └── moodleAPI.js        # API 클라이언트
│   └── php/
│       ├── api.php             # REST API
│       ├── db.php              # 데이터베이스 연결
│       └── moodle_integration.php  # Moodle 연동
└── README.md
```

## API 엔드포인트

### 문제 관련

- `GET /php/api.php?action=get_problems` - 모든 문제 목록
- `GET /php/api.php?action=get_problem&id={id}` - 특정 문제 정보
- `GET /php/api.php?action=get_steps&problem_id={id}` - 문제의 단계 정보

### 세션 관련

- `POST /php/api.php?action=create_session` - 새 세션 생성
- `POST /php/api.php?action=update_session` - 세션 업데이트
- `GET /php/api.php?action=get_session&session_id={id}` - 세션 정보

### 애니메이션 관련

- `GET /php/api.php?action=get_animation_config&problem_id={id}` - 애니메이션 설정

## 데이터베이스 스키마

### explosion_problems
문제 정보를 저장하는 테이블

- `id`: 문제 ID (Primary Key)
- `moodle_question_id`: Moodle 문제 ID (연동 시)
- `title`: 문제 제목
- `description`: 문제 설명
- `initial_count`: 초기 경우의 수
- `max_count`: 최대 경우의 수

### explosion_steps
단계별 증가 정보를 저장하는 테이블

- `id`: 단계 ID (Primary Key)
- `problem_id`: 문제 ID (Foreign Key)
- `step_number`: 단계 번호
- `step_name`: 단계 이름
- `multiplier`: 배수
- `count_increase`: 증가된 경우의 수

### explosion_sessions
사용자 세션을 저장하는 테이블

- `id`: 세션 ID (Primary Key)
- `moodle_user_id`: Moodle 사용자 ID (연동 시)
- `problem_id`: 문제 ID (Foreign Key)
- `current_step`: 현재 단계
- `current_count`: 현재 경우의 수
- `completed_at`: 완료 시간

### explosion_animations
애니메이션 설정을 저장하는 테이블

- `id`: 설정 ID (Primary Key)
- `problem_id`: 문제 ID (Foreign Key)
- `animation_type`: 애니메이션 타입 (fire, spark, burst, wave)
- `color_scheme`: 색상 스킴
- `speed`: 속도
- `intensity`: 강도

## 애니메이션 효과

### 1. Fire (화염)
작은 증가에 사용되는 지속적인 화염 효과

### 2. Spark (불꽃)
중간 증가에 사용되는 방사형 불꽃 효과

### 3. Explosion (폭발)
큰 증가에 사용되는 폭발 효과

### 4. Shockwave (충격파)
폭발과 함께 나타나는 충격파 효과

## 커스터마이징

### 새 문제 추가

```sql
INSERT INTO explosion_problems (title, description, initial_count, max_count)
VALUES ('새 문제', '문제 설명', 1, 100);

-- 단계 추가
INSERT INTO explosion_steps (problem_id, step_number, step_name, multiplier, count_increase)
VALUES (4, 1, '첫 번째 단계', 2.0, 2);
```

### 애니메이션 설정 변경

```sql
UPDATE explosion_animations
SET animation_type = 'burst',
    color_scheme = 'blue-purple',
    speed = 1.5,
    intensity = 2.0
WHERE problem_id = 1;
```

## 트러블슈팅

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결**: `config/config.php`의 데이터베이스 정보를 확인하세요.

### API 호출 실패

```
API call failed
```

**해결**:
1. PHP 에러 로그 확인
2. 브라우저 콘솔에서 네트워크 요청 확인
3. `DEBUG_MODE`를 `true`로 설정하여 상세 에러 메시지 확인

### 애니메이션이 표시되지 않음

**해결**:
1. 브라우저가 Canvas를 지원하는지 확인
2. JavaScript 콘솔에서 에러 확인
3. 캐시 삭제 후 새로고침

## 개발자 정보

- **프로젝트**: Explosion Count
- **버전**: 1.0.0
- **라이선스**: MIT
- **목적**: 수학 교육용 시각화 도구

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 기여

버그 리포트나 기능 제안은 이슈 트래커를 이용해주세요.

## 지원

문의사항이 있으시면 개발팀에 연락해주세요.
