# Hidden Length - 도형의 숨은 길이 찾기

독립형 웹 애플리케이션으로, 학생들이 도형의 숨은 길이를 찾는 학습을 돕는 인터랙티브 교육 도구입니다. 빛줄기 시각화를 통해 숨은 길이를 직관적으로 이해할 수 있습니다.

## 주요 기능

- 🔦 **빛줄기 시각화**: 숨은 길이를 빛줄기로 표현하여 직관적 이해 지원
- 📱 **가상 스마트폰 UI**: 우측 하단에 스마트폰 화면 시뮬레이션
- 📐 **다양한 도형**: 삼각형, 사각형, 원 등 다양한 도형 문제
- 📊 **진도 추적**: 학생의 학습 진행 상황과 숙련도 추적
- 🔗 **Moodle 연동**: Moodle 3.7 LMS와 성적 동기화
- 💡 **힌트 시스템**: 단계별 힌트 제공

## 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Canvas API (도형 및 빛줄기 애니메이션)
- Responsive Design

### Backend
- PHP 7.1.9+
- MySQL 5.7
- RESTful API

### 연동
- Moodle 3.7 Web Services API

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE hidden_length CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 임포트
mysql -u root -p hidden_length < database/schema.sql
```

### 2. 환경 변수 설정

`.env` 파일을 생성하거나 `api/config.php`를 수정하세요:

```php
DB_HOST=localhost
DB_NAME=hidden_length
DB_USER=your_username
DB_PASS=your_password

# Moodle 연동 (선택사항)
MOODLE_ENABLED=false
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### 3. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName hidden-length.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 경로 설정
    Alias /api /path/to/alt42standalone_v1.0/api
    <Directory /path/to/alt42standalone_v1.0/api>
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
    server_name hidden-length.local;
    root /path/to/alt42standalone_v1.0/public;

    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /path/to/alt42standalone_v1.0/api;
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 4. 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0
sudo chmod -R 755 /path/to/alt42standalone_v1.0
```

## 사용 방법

### 학생 사용

1. 브라우저에서 애플리케이션 접속
2. 왼쪽 패널에서 문제 선택
3. 우측 하단 스마트폰 화면에서 도형 확인
4. 빛줄기를 활성화하여 힌트 확인
5. 숨은 길이를 계산하여 입력
6. 제출 후 피드백 확인

### 교사/관리자

문제를 추가하려면 API를 통해 새로운 도형 데이터를 생성하거나, 데이터베이스에 직접 삽입할 수 있습니다:

```sql
INSERT INTO shapes (
    category_id, title, description, shape_type,
    shape_data, hidden_length_data,
    difficulty_level, correct_answer, hint_text, explanation
) VALUES (
    1,
    'New Triangle Problem',
    'Description here',
    'triangle',
    '{"vertices": [...], "sides": {...}}',
    '{"hiddenSide": "c", "lightBeam": {...}}',
    1,
    5.00,
    'Hint text',
    'Explanation text'
);
```

## API 엔드포인트

### Shapes API (`/api/shapes.php`)

- `GET /api/shapes.php` - 모든 도형 문제 조회
- `GET /api/shapes.php/{id}` - 특정 도형 조회
- `POST /api/shapes.php` - 새 도형 생성
- `PUT /api/shapes.php/{id}` - 도형 수정
- `DELETE /api/shapes.php/{id}` - 도형 삭제 (soft delete)

### Progress API (`/api/progress.php`)

- `GET /api/progress.php?user_id={id}` - 학생 진도 조회
- `POST /api/progress.php` - 답안 제출 및 진도 업데이트

### Moodle Integration (`/moodle/integration.php`)

- `POST /moodle/integration.php?action=sync_user` - 사용자 동기화
- `POST /moodle/integration.php?action=send_grade` - 성적 전송
- `POST /moodle/integration.php?action=sync_progress` - 진도 동기화

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자 패널에서:
1. `Site administration` → `Advanced features`
2. `Enable web services` 체크
3. 저장

### 2. Web Service 토큰 생성

1. `Site administration` → `Server` → `Web services` → `Manage tokens`
2. 새 토큰 생성
3. 토큰을 `api/config.php`의 `MOODLE_TOKEN`에 설정

### 3. Web Service 함수 활성화

다음 함수들을 활성화:
- `core_user_get_users_by_field`
- `core_grades_update_grades`
- `core_completion_update_activity_completion_status_manually`

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                 # 웹 루트
│   ├── index.html         # 메인 HTML 파일
│   ├── css/
│   │   └── style.css      # 스타일시트
│   ├── js/
│   │   ├── app.js         # 메인 애플리케이션 로직
│   │   └── shapes.js      # 도형 렌더링 및 애니메이션
│   └── assets/            # 이미지, 아이콘 등
├── api/                   # PHP 백엔드
│   ├── config.php         # 설정 파일
│   ├── database.php       # DB 연결 클래스
│   ├── shapes.php         # 도형 API
│   └── progress.php       # 진도 API
├── database/
│   └── schema.sql         # 데이터베이스 스키마
├── moodle/
│   └── integration.php    # Moodle 연동 코드
└── README.md
```

## 개발 로드맵

### Phase 1: 기본 기능 (완료)
- ✅ 프로젝트 구조 설정
- ✅ 데이터베이스 스키마
- ✅ PHP 백엔드 API
- ✅ 프론트엔드 UI (가상 스마트폰)
- ✅ 도형 시각화 및 빛줄기 애니메이션
- ✅ Moodle 연동 레이어

### Phase 2: 기능 향상
- ⬜ 사용자 인증 시스템
- ⬜ 더 많은 도형 유형 추가
- ⬜ 관리자 대시보드
- ⬜ 실시간 통계 및 분석
- ⬜ 모바일 반응형 최적화

### Phase 3: 고급 기능
- ⬜ AI 기반 힌트 생성
- ⬜ 적응형 학습 경로
- ⬜ 게임화 요소 (배지, 리더보드)
- ⬜ 다국어 지원

## 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결방법**: `api/config.php`에서 DB 설정을 확인하세요.

### 빛줄기가 표시되지 않음

**해결방법**: 브라우저가 Canvas API를 지원하는지 확인하세요. 최신 브라우저를 사용하세요.

### Moodle 동기화 실패

**해결방법**:
1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. `moodle_sync_log` 테이블에서 오류 메시지 확인

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 Issues 섹션을 이용해주세요.

## 연락처

프로젝트 관련 문의: KAIST Touch Math Academy

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
