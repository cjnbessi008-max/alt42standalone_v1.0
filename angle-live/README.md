# Angle Live - 인터랙티브 각도 학습 앱

Angle Live는 손가락으로 각도를 조절하며 각의 종류와 특성을 학습할 수 있는 인터랙티브 웹 애플리케이션입니다. MySQL, PHP, Moodle LMS와 연동되어 학습 진행 상황을 추적하고 성적을 관리할 수 있습니다.

## 📋 주요 기능

- **인터랙티브 각도 조절**: 슬라이더를 이용한 0° ~ 360° 각도 조절
- **실시간 시각화**: Canvas를 활용한 각도의 실시간 시각적 표현
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 뷰 시뮬레이션
- **각도 분류 자동 표시**: 예각, 직각, 둔각, 평각, 우각 자동 분류
- **학습 진행 상황 추적**: MySQL 데이터베이스를 통한 세션 및 진행률 저장
- **Moodle LMS 연동**: 자동 성적 동기화 및 학습 데이터 통합

## 🎯 학습 목표

학생들이 다음을 학습할 수 있습니다:
- 각도의 개념과 측정 방법
- 각의 종류 (예각, 직각, 둔각, 평각, 우각)
- 각도 범위에 따른 분류
- 시각적 각도 인식 능력 향상

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Database Driver**: MySQLi

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: 반응형 디자인, Flexbox, Grid
- **JavaScript**: ES6+, Canvas API
- **Architecture**: Vanilla JS (프레임워크 없음)

### Integration
- **Moodle**: 3.7 LMS 연동

## 📁 프로젝트 구조

```
angle-live/
├── database/
│   └── schema.sql           # MySQL 데이터베이스 스키마
├── backend/
│   ├── config.php          # 데이터베이스 및 앱 설정
│   ├── database.php        # 데이터베이스 연결 클래스
│   └── api.php            # RESTful API 엔드포인트
├── frontend/
│   ├── index.html         # 메인 HTML 파일
│   ├── css/
│   │   └── style.css      # 스타일시트
│   └── js/
│       ├── config.js      # 프론트엔드 설정
│       ├── api.js         # API 클라이언트
│       ├── angle-visualizer.js  # Canvas 시각화
│       └── app.js         # 메인 애플리케이션 로직
├── moodle/
│   ├── mod_anglelive.php  # Moodle 모듈 메인 파일
│   └── locallib.php       # Moodle 로컬 라이브러리
└── docs/
    └── installation.md    # 설치 가이드
```

## 🚀 설치 방법

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source angle-live/database/schema.sql
```

### 3. 백엔드 설정

`angle-live/backend/config.php` 파일에서 데이터베이스 연결 정보 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'angle_live');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

Apache VirtualHost 예시:

```apache
<VirtualHost *:80>
    ServerName anglelive.local
    DocumentRoot /path/to/angle-live/frontend

    <Directory /path/to/angle-live/frontend>
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /path/to/angle-live/backend
</VirtualHost>
```

### 5. 프론트엔드 설정

`angle-live/frontend/js/config.js` 파일에서 API URL 확인:

```javascript
const CONFIG = {
    API_BASE_URL: 'http://your-domain.com/backend/api.php',
    // ...
};
```

### 6. Moodle 연동 (선택사항)

Moodle 설치 디렉토리에서:

```bash
# Moodle 모듈 디렉토리 생성
mkdir -p /path/to/moodle/mod/anglelive

# 모듈 파일 복사
cp angle-live/moodle/* /path/to/moodle/mod/anglelive/

# Moodle 관리자 페이지에서 플러그인 설치
```

## 📖 사용 방법

### 기본 사용

1. 웹 브라우저에서 `http://your-domain.com/angle-live/frontend/` 접속
2. 슬라이더를 움직여 각도 조절
3. 메인 화면과 우측 스마트폰 화면에서 실시간 시각화 확인
4. 각도에 따른 분류와 설명 확인

### Moodle에서 사용

1. Moodle 코스에 "Angle Live" 활동 추가
2. 학생들이 활동에 접근
3. 자동으로 Moodle 사용자 ID와 연동
4. 학습 진행 상황이 자동으로 Moodle 성적부에 동기화

### URL 파라미터

Moodle 연동 시 자동으로 전달되는 파라미터:

```
?course_id=123&user_id=456
```

## 🔌 API 엔드포인트

### GET `/api.php?action=get_status`
API 상태 확인

### GET `/api.php?action=get_thresholds`
모든 각도 임계값 조회

### GET `/api.php?action=get_progress&user_id={id}`
사용자 학습 진행 상황 조회

### POST `/api.php?action=update_angle`
각도 업데이트

**Request Body:**
```json
{
    "user_id": 1,
    "session_id": "angle-live-xyz",
    "angle_value": 45.5
}
```

**Response:**
```json
{
    "success": true,
    "angle": 45.5,
    "status": {
        "name": "Acute Angle - Moderate",
        "description": "중간 크기의 예각입니다.",
        "visual": "color-cyan",
        "audio": "sound-2.mp3"
    }
}
```

### POST `/api.php?action=sync_moodle`
Moodle과 성적 동기화

**Request Body:**
```json
{
    "user_id": 1,
    "moodle_user_id": 456,
    "moodle_course_id": 123
}
```

## 🎨 각도 분류

| 각도 범위 | 분류 | 색상 |
|----------|------|------|
| 0° - 30° | 매우 좁은 예각 | 파랑 |
| 30° - 60° | 중간 예각 | 청록 |
| 60° - 90° | 넓은 예각 | 초록 |
| 90° | 직각 | 노랑 |
| 90° - 120° | 좁은 둔각 | 주황 |
| 120° - 150° | 중간 둔각 | 빨강 |
| 150° - 180° | 넓은 둔각 | 보라 |
| 180° | 평각 | 분홍 |
| 180° - 270° | 좁은 우각 | 갈색 |
| 270° - 360° | 넓은 우각 | 회색 |

## 🔧 커스터마이징

### 각도 임계값 수정

`database/schema.sql` 파일의 `INSERT INTO angle_thresholds` 부분을 수정하거나, MySQL에서 직접 수정:

```sql
UPDATE angle_thresholds
SET angle_min = 0, angle_max = 45, status_name = 'Custom Angle'
WHERE id = 1;
```

### 색상 스킴 변경

`frontend/css/style.css` 파일의 `:root` 변수 수정:

```css
:root {
    --color-blue: #your-color;
    --color-green: #your-color;
    /* ... */
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **angle_sessions**: 사용자 세션 및 각도 기록
2. **angle_thresholds**: 각도 범위 및 분류 정의
3. **user_progress**: 사용자 학습 진행 상황
4. **moodle_integration**: Moodle LMS 연동 데이터

자세한 스키마는 `database/schema.sql` 참조

## 🐛 문제 해결

### API 연결 오류

1. `backend/config.php`에서 데이터베이스 연결 정보 확인
2. MySQL 서비스 실행 상태 확인: `systemctl status mysql`
3. 브라우저 콘솔에서 CORS 오류 확인

### Moodle 연동 오류

1. Moodle 모듈이 올바르게 설치되었는지 확인
2. `moodle/locallib.php`에서 데이터베이스 연결 정보 확인
3. Moodle 디버그 모드 활성화하여 오류 로그 확인

## 📝 라이선스

Copyright © 2025 KAIST Touch Math Academy
All rights reserved.

## 👥 기여

KAIST Touch Math Academy 팀

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해 주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
