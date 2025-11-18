# 3D 도형 학습 앱 - Inner View Mode

Moodle LMS와 연동하여 3D 입체 도형의 내부 구조를 투명하게 보여주는 교육용 웹 애플리케이션입니다.

## 주요 기능

### Inner View Mode
- **투명도 조절**: 입체 도형을 투명하게 만들어 내부 구조 관찰
- **실시간 렌더링**: Three.js 기반 실시간 3D 렌더링
- **직관적 UI**: 슬라이더를 통한 투명도 조절 (0-100%)
- **부드러운 애니메이션**: 투명도 전환 시 자연스러운 애니메이션 효과

### 3D 도형 지원
- 정육면체 (Cube)
- 원기둥 (Cylinder)
- 구 (Sphere)
- 사각뿔 (Pyramid)
- 원뿔 (Cone)

### Moodle LMS 연동
- 문제 정보 자동 로드
- 학생 응답 제출 및 채점
- 학습 분석 데이터 수집
- Inner View Mode 사용 로그 기록

## 기술 스택

### 프론트엔드
- **HTML5/CSS3**: 반응형 웹 디자인
- **Three.js**: 3D 그래픽 렌더링
- **Vanilla JavaScript**: 모듈화된 ES6+ 코드

### 백엔드
- **PHP 7.1.9**: Moodle API 연동
- **MySQL 5.7**: 데이터베이스
- **Moodle 3.7**: LMS 플랫폼

## 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html                  # 메인 HTML 파일
├── src/
│   ├── css/
│   │   └── style.css           # 스타일시트
│   ├── js/
│   │   ├── app.js              # 메인 애플리케이션 로직
│   │   ├── moodle-connector.js # Moodle LMS 연동 모듈
│   │   ├── shape-renderer.js   # Three.js 3D 렌더링 모듈
│   │   └── inner-view-mode.js  # Inner View Mode 기능 모듈
│   └── php/
│       ├── moodle-api.php      # Moodle API 엔드포인트
│       └── database-setup.sql  # 데이터베이스 스키마
├── assets/
│   └── models/                 # 3D 모델 파일 (선택사항)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # 프로젝트 요구사항 문서
└── README.md                   # 이 파일
```

## 설치 방법

### 1. 환경 요구사항
- **웹 서버**: Apache 2.4+ 또는 Nginx
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 2. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 테이블 생성
USE moodle;
SOURCE src/php/database-setup.sql;
```

### 3. PHP 설정

`src/php/moodle-api.php` 파일에서 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^api/(.*)$ src/php/moodle-api.php?action=$1 [QSA,L]
</IfModule>
```

#### Nginx
```nginx
location /api/ {
    rewrite ^/api/(.*)$ /src/php/moodle-api.php?action=$1 last;
}
```

### 5. 애플리케이션 실행

```bash
# 웹 서버 문서 루트에 프로젝트 복사
sudo cp -r alt42standalone_v1.0 /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0
sudo chmod -R 755 /var/www/html/alt42standalone_v1.0

# 브라우저에서 접속
# http://localhost/alt42standalone_v1.0/
```

## 사용 방법

### 기본 사용법

1. **문제 로드**: 페이지 로드 시 Moodle에서 자동으로 문제를 가져옵니다
2. **3D 도형 관찰**: 마우스로 드래그하여 도형을 회전시킬 수 있습니다
3. **Inner View 활성화**: "Inner View" 버튼을 클릭하여 내부 구조 보기 모드를 활성화합니다
4. **투명도 조절**: 슬라이더를 조작하여 투명도를 조절합니다 (0% = 불투명, 100% = 완전 투명)
5. **시점 초기화**: "Reset" 버튼을 클릭하여 카메라 위치를 초기화합니다

### 키보드 단축키

- **스페이스바**: Inner View Mode 토글
- **R**: 시점 초기화
- **마우스 휠**: 줌 인/아웃
- **좌클릭 + 드래그**: 도형 회전
- **우클릭 + 드래그**: 카메라 팬

## API 엔드포인트

### 1. 연결 확인
```
GET /src/php/moodle-api.php?action=check_connection
```

응답:
```json
{
  "success": true,
  "moodle_version": "2019052000",
  "php_version": "7.1.9",
  "mysql_version": "5.7.44",
  "message": "Moodle 연결 성공",
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

### 2. 문제 가져오기
```
GET /src/php/moodle-api.php?action=get_problem&id=1
```

응답:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "정육면체의 부피 계산",
    "description": "한 변의 길이가 5cm인 정육면체의 부피를 계산하세요.",
    "shape": {
      "type": "cube",
      "dimensions": { "size": 5 },
      "color": 5025616
    },
    "answer_type": "numeric"
  },
  "message": "문제 로드 성공",
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

### 3. 응답 제출
```
POST /src/php/moodle-api.php?action=submit_answer
Content-Type: application/json

{
  "problem_id": 1,
  "answer": 125,
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

응답:
```json
{
  "success": true,
  "result": {
    "is_correct": true,
    "feedback": "정답입니다!",
    "submitted_at": "2025-11-18T10:00:00+00:00"
  },
  "message": "응답 제출 완료",
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

## 개발 가이드

### 새로운 도형 추가하기

1. `shape-renderer.js`의 `createShape()` 메서드에 새로운 도형 타입 추가:

```javascript
case 'tetrahedron':
    geometry = new THREE.TetrahedronGeometry(dimensions.size);
    break;
```

2. 데이터베이스에 샘플 데이터 추가:

```sql
INSERT INTO mdl_question_3dshape_metadata
(questionid, shape_type, shape_dimensions, shape_color, answer_type, correct_answer, difficulty_level)
VALUES
(6, 'tetrahedron', '{"size": 5}', '#00BCD4', 'numeric', '11.78', 3);
```

### 커스터마이징

#### 색상 테마 변경
`src/css/style.css`에서 CSS 변수 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #4CAF50;
}
```

#### 투명도 애니메이션 속도 조절
`src/js/inner-view-mode.js`에서 `animationDuration` 값 수정:

```javascript
this.animationDuration = 1000; // 1초로 변경
```

## 문제 해결

### 3D 도형이 표시되지 않을 때
- 브라우저 콘솔에서 에러 메시지 확인
- WebGL 지원 여부 확인: https://get.webgl.org/
- Three.js 라이브러리 로드 확인

### Moodle 연결이 안 될 때
- PHP 에러 로그 확인: `/var/log/apache2/error.log`
- 데이터베이스 연결 정보 확인
- CORS 설정 확인

### 투명도 조절이 작동하지 않을 때
- Inner View Mode가 활성화되어 있는지 확인
- 브라우저 콘솔에서 JavaScript 에러 확인

## 성능 최적화

### 프론트엔드
- Three.js 렌더러의 `pixelRatio` 조정
- 도형의 세그먼트 수 조절 (폴리곤 수 감소)
- 애니메이션 프레임 레이트 제한

### 백엔드
- MySQL 쿼리 최적화 (인덱스 활용)
- PHP OpCache 활성화
- 결과 캐싱 (Redis, Memcached)

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 변경 이력

### v1.0.0 (2025-11-18)
- ✨ Inner View Mode 기능 추가
- 🎨 스마트폰 화면 UI 구현
- 🔌 Moodle LMS 연동
- 📊 학습 분석 데이터 수집
- 🎯 5가지 3D 도형 지원

## 문의

프로젝트 관련 문의: KAIST Touch Math Academy

---

**Made with ❤️ for Education**
