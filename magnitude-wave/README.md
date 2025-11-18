# Magnitude Wave Visualizer

벡터의 크기를 파동으로 시각화하는 웹 기반 교육용 애플리케이션입니다.

## 주요 기능

- **벡터 크기 계산**: 2D/3D 벡터의 크기를 실시간으로 계산
- **파동 시각화**: 벡터 크기를 진폭으로 하는 파동을 스마트폰 화면에 시각화
- **Moodle LMS 연동**: Moodle 3.7과 연동하여 문제 정보를 가져오고 답안 제출
- **반응형 디자인**: 다양한 화면 크기에 최적화
- **실시간 애니메이션**: Canvas를 사용한 부드러운 파동 애니메이션

## 시스템 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (선택사항)
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 방법

### 1. 파일 배포

웹 서버의 문서 루트에 파일을 복사합니다:

```bash
# Apache 예시
sudo cp -r magnitude-wave /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/magnitude-wave
sudo chmod -R 755 /var/www/html/magnitude-wave
```

### 2. 데이터베이스 설정

#### 독립 실행 모드 (Moodle 없이)

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
source /var/www/html/magnitude-wave/database/schema.sql

# 샘플 데이터 삽입 (선택사항)
source /var/www/html/magnitude-wave/database/sample_data.sql
```

### 3. 설정 파일 수정

`config.php` 파일을 수정합니다:

```php
// Moodle 연동 시
define('MOODLE_PATH', '/var/www/html/moodle');

// 독립 실행 모드 시
define('DB_HOST', 'localhost');
define('DB_NAME', 'magnitude_wave_db');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 로그 디렉토리 생성

```bash
mkdir -p /var/www/html/magnitude-wave/logs
chmod 755 /var/www/html/magnitude-wave/logs
```

## 사용 방법

### 독립 실행 모드

브라우저에서 다음 URL로 접속:

```
http://your-domain/magnitude-wave/
```

또는 문제 ID와 함께:

```
http://your-domain/magnitude-wave/?problem_id=1
```

### Moodle 통합

#### 방법 1: iframe 임베드

Moodle의 HTML 블록이나 레이블에 다음 코드 추가:

```html
<iframe
    src="http://your-domain/magnitude-wave/?problem_id=123"
    width="100%"
    height="800px"
    frameborder="0">
</iframe>
```

#### 방법 2: External Tool (LTI)

1. Moodle 관리자 → 플러그인 → Activity modules → External tool
2. 새 도구 추가
3. Tool URL: `http://your-domain/magnitude-wave/`
4. Consumer key와 Shared secret 설정

#### 방법 3: Moodle 플러그인 (향후)

별도의 Activity Module로 개발 가능

## 프로젝트 구조

```
magnitude-wave/
├── index.html              # 메인 HTML 파일
├── config.php             # 설정 파일
├── README.md              # 문서 (이 파일)
├── css/
│   └── style.css          # 스타일시트
├── js/
│   ├── magnitude-wave.js      # 파동 시각화 로직
│   └── moodle-integration.js  # Moodle 연동 로직
├── api/
│   ├── get_problem.php        # 문제 조회 API
│   └── submit_answer.php      # 답안 제출 API
├── database/
│   ├── schema.sql            # 데이터베이스 스키마
│   └── sample_data.sql       # 샘플 데이터
└── logs/
    └── app.log               # 애플리케이션 로그
```

## API 문서

### GET /api/get_problem.php

문제 정보를 조회합니다.

**Parameters:**
- `problem_id` (required): 문제 ID

**Response:**
```json
{
    "success": true,
    "problem": {
        "id": 1,
        "title": "기본 2차원 벡터",
        "description": "...",
        "vectors": [
            {"x": 3, "y": 4, "z": 0}
        ],
        "hints": "..."
    }
}
```

### POST /api/submit_answer.php

답안을 제출합니다.

**Request Body:**
```json
{
    "problem_id": 1,
    "magnitude": 5.0,
    "vector": {"x": 3, "y": 4, "z": 0},
    "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response:**
```json
{
    "success": true,
    "message": "답안이 성공적으로 제출되었습니다.",
    "submission_id": 123
}
```

## 커스터마이징

### 파동 색상 변경

`css/style.css`에서 색상 변경:

```css
.status-dot {
    background: #4ade80; /* 연결 상태 색상 */
}

.app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 파동 알고리즘 수정

`js/magnitude-wave.js`의 `drawWave()` 메서드를 수정:

```javascript
drawWave() {
    // 커스텀 파동 알고리즘 구현
}
```

## 문제 해결

### 문제가 로드되지 않음

1. 브라우저 콘솔에서 에러 확인
2. `logs/app.log` 파일 확인
3. PHP 에러 로그 확인: `/var/log/apache2/error.log`
4. 데이터베이스 연결 확인

### 파동이 표시되지 않음

1. 브라우저가 Canvas를 지원하는지 확인
2. JavaScript 에러 확인 (F12 개발자 도구)
3. 벡터 값이 올바르게 입력되었는지 확인

### Moodle 연동 실패

1. `config.php`의 `MOODLE_PATH` 확인
2. Moodle의 `config.php`가 존재하는지 확인
3. 파일 권한 확인
4. CORS 설정 확인 (cross-origin 요청 시)

## 개발 정보

- **버전**: 1.0.0
- **호환성**: Moodle 3.7, PHP 7.1.9, MySQL 5.7
- **라이선스**: MIT

## 기여

버그 리포트나 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 지원

기술 지원이 필요하신 경우:
- 이슈 트래커: [GitHub Issues]
- 이메일: support@example.com
- 문서: [Wiki]

## 업데이트 로그

### v1.0.0 (2025-01-15)
- 초기 릴리스
- 기본 벡터 크기 계산 기능
- 파동 시각화
- Moodle LMS 연동
- 스마트폰 시뮬레이터 UI
