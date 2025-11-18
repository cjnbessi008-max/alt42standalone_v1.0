# Solid Spin Viewer

입체도형을 3D로 부드럽게 회전시켜 보여주는 웹 애플리케이션입니다. Moodle 3.7 LMS와 연동하여 문제 정보를 받아 동작하며, 우측 하단 가상 스마트폰 화면에 표시됩니다.

## 주요 기능

- ✨ **3D 입체도형 시각화**: Three.js 기반의 고품질 3D 렌더링
- 🔄 **부드러운 회전**: OrbitControls를 이용한 자연스러운 회전 및 줌
- 📱 **모바일 UI**: 우측 하단 스마트폰 프레임 형태로 표시
- 🔗 **Moodle 연동**: Moodle 3.7 문제 은행과 완벽한 통합
- 📊 **학습 추적**: 사용자 상호작용 기록 및 분석
- 🎨 **다양한 도형**: 정육면체, 구, 원뿔, 원기둥, 피라미드 등 10+ 종류

## 기술 스택

### Backend
- **PHP**: 7.1.9+
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **Three.js**: 3D 렌더링 엔진
- **Vanilla JavaScript**: ES6+
- **CSS3**: 애니메이션 및 반응형 디자인

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 설치 (선택사항)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 파일 복사

```bash
# 웹 서버 루트 디렉토리로 복사
cp -r solid-spin-viewer /var/www/html/
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE solid_spin_viewer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'solid_viewer'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON solid_spin_viewer.* TO 'solid_viewer'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
mysql -u solid_viewer -p solid_spin_viewer < sql/schema.sql
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (데이터베이스 정보 입력)
nano .env
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /solid-spin-viewer/

    # API 라우팅
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ public/api/$1 [L]
</IfModule>

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/solid-spin-viewer/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 사용 방법

### 독립 실행 모드

브라우저에서 직접 접속:

```
http://your-domain.com/solid-spin-viewer/public/
```

### Moodle 연동 모드

Moodle에서 iframe으로 임베드:

```html
<iframe
    src="http://your-domain.com/solid-spin-viewer/public/?question_id=123&user_id=456&session_token=abc123"
    width="100%"
    height="800px"
    frameborder="0">
</iframe>
```

### URL 파라미터

- `question_id`: Moodle 문제 ID (필수)
- `user_id`: Moodle 사용자 ID (선택)
- `session_token`: Moodle 세션 토큰 (선택)
- `debug`: 디버그 모드 (1=활성화)

### API 엔드포인트

#### 1. 문제 정보 가져오기

```http
GET /api/get_question.php?question_id=123&user_id=456&session_token=abc123
```

**응답:**
```json
{
  "success": true,
  "data": {
    "question": { ... },
    "solid_shape": { ... },
    "viewer_settings": { ... },
    "user_interactions": [ ... ]
  },
  "message": "Question and solid shape data retrieved successfully",
  "timestamp": 1637123456
}
```

#### 2. 상호작용 기록

```http
POST /api/track_interaction.php
Content-Type: application/json

{
  "moodle_user_id": 456,
  "question_id": 123,
  "interaction_type": "rotate",
  "rotation_x": 0.5,
  "rotation_y": 1.2,
  "rotation_z": 0.3,
  "zoom_level": 1.5,
  "time_spent_seconds": 120,
  "session_id": "session_abc123"
}
```

#### 3. 도형 목록 가져오기

```http
GET /api/get_shapes.php
GET /api/get_shapes.php?category=polyhedron
GET /api/get_shapes.php?shape_id=5
GET /api/get_shapes.php?group_by_category=true
```

## Moodle 플러그인 통합

### 1. 문제 유형 확장

Moodle에서 사용자 정의 문제 유형을 만들려면:

```php
// moodle/question/type/solid3d/question.php
class qtype_solid3d_question extends question_graded_automatically {
    public function get_solid_viewer_url() {
        $params = [
            'question_id' => $this->id,
            'user_id' => $USER->id,
            'session_token' => sesskey()
        ];
        return new moodle_url('/local/solid_spin_viewer/public/index.php', $params);
    }
}
```

### 2. 블록 플러그인

Moodle 블록으로 추가:

```bash
# moodle/blocks/solid_viewer/ 디렉토리 생성
mkdir -p /var/www/html/moodle/blocks/solid_viewer
```

## 데이터베이스 스키마

### solid_shapes
입체도형 정의 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| name | VARCHAR(100) | 영문 이름 |
| name_kr | VARCHAR(100) | 한글 이름 |
| vertices | TEXT | 꼭짓점 좌표 (JSON) |
| faces | TEXT | 면 정보 (JSON) |
| color | VARCHAR(7) | 색상 코드 |
| category | ENUM | 분류 |

### moodle_questions
Moodle 문제 매핑

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_question_id | INT | Moodle 문제 ID |
| solid_shape_id | INT | 도형 ID (FK) |
| rotation_enabled | TINYINT | 회전 가능 여부 |
| auto_rotate | TINYINT | 자동 회전 여부 |
| rotation_speed | DECIMAL | 회전 속도 |

### user_interactions
사용자 상호작용 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_user_id | INT | Moodle 사용자 ID |
| question_id | INT | 문제 ID (FK) |
| interaction_type | ENUM | 상호작용 유형 |
| rotation_x/y/z | DECIMAL | 회전 각도 |
| time_spent_seconds | INT | 소요 시간 |

## 커스터마이징

### 새로운 도형 추가

```sql
INSERT INTO solid_shapes (name, name_kr, vertices, faces, color, category)
VALUES (
    'Custom Shape',
    '사용자 정의 도형',
    '[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]',
    '[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]',
    '#ff5733',
    'polyhedron'
);
```

### UI 색상 변경

`public/css/style.css` 파일의 CSS 변수 수정:

```css
:root {
    --primary-color: #3498db;  /* 메인 색상 */
    --secondary-color: #2ecc71;  /* 보조 색상 */
    --phone-bg: linear-gradient(145deg, #1a1a1a, #2d2d2d);  /* 폰 프레임 배경 */
}
```

### 뷰어 설정 변경

JavaScript 설정 (`public/js/solid-viewer.js`):

```javascript
// 카메라 거리
this.camera.position.set(5, 5, 5);

// 줌 범위
this.controls.minDistance = 3;
this.controls.maxDistance = 15;

// 회전 감쇠
this.controls.dampingFactor = 0.05;
```

## 문제 해결

### 3D 뷰어가 표시되지 않음

1. 브라우저 콘솔에서 오류 확인
2. Three.js CDN 접속 확인
3. WebGL 지원 확인: `chrome://gpu`

### 데이터베이스 연결 오류

```bash
# .env 파일 권한 확인
chmod 600 .env

# PHP PDO MySQL 확장 설치 확인
php -m | grep pdo_mysql
```

### CORS 오류

`.env` 파일에서 `ALLOWED_ORIGINS` 설정:

```
ALLOWED_ORIGINS=https://your-moodle-domain.com
```

### Moodle 세션 인증 실패

Moodle의 `config.php`에서 세션 설정 확인:

```php
$CFG->sessioncookiedomain = '.your-domain.com';
$CFG->cookiesecure = false; // HTTPS에서는 true
```

## 성능 최적화

### 1. 정적 파일 캐싱

`.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
</IfModule>
```

### 2. PHP OpCache 활성화

`php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
```

### 3. MySQL 쿼리 최적화

```sql
-- 인덱스 추가
CREATE INDEX idx_moodle_user ON user_interactions(moodle_user_id);
CREATE INDEX idx_created_at ON user_interactions(created_at);
```

## 보안 권장사항

1. **입력 검증**: 모든 사용자 입력은 서버에서 검증
2. **SQL Injection 방지**: PDO prepared statements 사용
3. **XSS 방지**: 출력 시 `htmlspecialchars()` 사용
4. **세션 보안**: HTTPS 사용, `httponly` 쿠키 설정
5. **파일 권한**: `.env` 파일 권한 600으로 설정

## 라이센스

MIT License

## 지원

- **이슈 리포팅**: GitHub Issues
- **문서**: [Wiki](https://github.com/your-repo/wiki)
- **이메일**: support@your-domain.com

## 변경 이력

### v1.0.0 (2025-11-18)
- ✨ 초기 릴리스
- 🎨 10가지 기본 입체도형 지원
- 📱 모바일 폰 프레임 UI
- 🔗 Moodle 3.7 연동
- 📊 사용자 상호작용 추적

## 기여

Pull Request를 환영합니다! 주요 변경사항은 먼저 Issue를 열어 논의해 주세요.

## 크레딧

- **Three.js**: 3D 렌더링 라이브러리
- **Moodle**: 오픈소스 LMS
- **KAIST Touch Math Academy**: 기획 및 요구사항
