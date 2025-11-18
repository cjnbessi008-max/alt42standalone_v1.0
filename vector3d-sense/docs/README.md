# Vector 3D Sense

**3D 벡터 학습을 위한 인터랙티브 웹 애플리케이션**

Moodle LMS와 연동하여 벡터 문제를 3D 공간에서 시각화하고, 우측 하단 가상 스마트폰 화면에 표시되는 교육용 앱입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)

## ✨ 주요 기능

### 1. 3D 벡터 시각화
- **Three.js 기반** 실시간 3D 렌더링
- 벡터 덧셈, 뺄셈, 내적, 외적 시각화
- 인터랙티브 카메라 조작 (회전, 확대/축소, 이동)
- 벡터 라벨 및 좌표 표시

### 2. Moodle LMS 연동
- Moodle 3.7 호환
- 문제 정보 자동 로드
- 학생 답안 제출 및 채점
- 학습 진도 추적

### 3. 가상 스마트폰 디스플레이
- iPhone X 스타일 UI
- 우측 하단 고정 위치
- 반응형 디자인
- 터치 인터랙션 지원

### 4. 학습 분석
- 실시간 인터랙션 추적
- 카메라 움직임 분석
- 시도 횟수 및 정답률 통계
- 학습 시간 측정

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **Apache**: 2.4+

### Frontend
- **Three.js**: 0.150.0
- **Vanilla JavaScript** (ES6+)
- **HTML5** / **CSS3**

### Libraries
- Three.js - 3D 렌더링
- OrbitControls - 카메라 조작

## 💻 시스템 요구사항

### 서버
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4+ (mod_rewrite 활성화)
- 최소 2GB RAM
- 1GB 디스크 공간

### 클라이언트
- 모던 웹 브라우저
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- WebGL 지원
- 최소 해상도: 1280x720

## 📦 설치 방법

### 1. 파일 복사

```bash
# 웹 서버 디렉토리에 복사
sudo cp -r vector3d-sense /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/vector3d-sense
sudo chmod -R 755 /var/www/html/vector3d-sense
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 설정 스크립트 실행
source /var/www/html/vector3d-sense/config/database.sql
```

### 3. 설정 파일 수정

```bash
# Moodle 연동 설정
vi /var/www/html/vector3d-sense/moodle-integration/config.php
```

**주요 설정 항목:**
```php
$CFG->vector3d_dbhost = 'localhost';
$CFG->vector3d_dbname = 'vector3d_sense';
$CFG->vector3d_dbuser = 'vector3d_user';
$CFG->vector3d_dbpass = 'your_secure_password';
```

### 4. Apache 설정

```bash
# Apache 설정 파일 복사
sudo cp config/apache.conf /etc/apache2/sites-available/vector3d.conf

# 사이트 활성화
sudo a2ensite vector3d

# Apache 재시작
sudo systemctl restart apache2
```

### 5. Moodle 플러그인 설치

Moodle 관리자 페이지에서:

1. **Site administration** → **Plugins** → **Install plugins**
2. `moodle-integration` 폴더를 Moodle의 `local` 디렉토리에 복사
3. Moodle 업그레이드 실행

## 🚀 사용 방법

### 1. 문제 생성 (Moodle)

Moodle 질문 은행에서 벡터 문제 생성:

```json
{
  "question_type": "vector3d",
  "title": "3D 벡터 덧셈",
  "description": "두 벡터의 합을 구하세요",
  "vectors": [
    {"name": "A", "x": 3, "y": 2, "z": 1, "color": "#FF6B6B"},
    {"name": "B", "x": 1, "y": 3, "z": 2, "color": "#4ECDC4"}
  ],
  "expected_answer": {"x": 4, "y": 5, "z": 3},
  "difficulty": 2
}
```

### 2. 학생 접속

학생은 Moodle 시험에서 벡터 문제를 만나면 자동으로 Vector 3D Sense 앱이 표시됩니다.

**URL 형식:**
```
http://vector3d.example.com/?question_id=1001&user_id=123
```

### 3. 인터랙션

- **회전**: 마우스 왼쪽 버튼 드래그
- **확대/축소**: 마우스 휠
- **이동**: 마우스 오른쪽 버튼 드래그
- **초기화**: "시점 초기화" 버튼 클릭

### 4. 답안 제출

1. X, Y, Z 입력 필드에 답 입력
2. "답안 제출" 버튼 클릭
3. 즉시 채점 결과 확인

## 📚 API 문서

### 1. 문제 조회

**Endpoint:** `GET /api/problem`

**Parameters:**
- `question_id` (required): Moodle 질문 ID
- `user_id` (required): Moodle 사용자 ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "3D 벡터 덧셈",
    "description": "두 벡터의 합을 구하세요",
    "problem_type": "addition",
    "vectors_data": {
      "vectors": [...]
    },
    "session": {
      "session_token": "abc123...",
      "expires_at": "2025-11-18 12:00:00"
    }
  }
}
```

### 2. 답안 제출

**Endpoint:** `POST /api/submit`

**Request Body:**
```json
{
  "problem_id": 1,
  "user_id": 123,
  "answer": {
    "x": 4,
    "y": 5,
    "z": 3
  },
  "time_spent": 120
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "is_correct": true,
    "score": 100,
    "attempt_number": 1,
    "expected_answer": {"x": 4, "y": 5, "z": 3}
  }
}
```

### 3. 세션 업데이트

**Endpoint:** `POST /api/session`

**Request Body:**
```json
{
  "session_token": "abc123...",
  "current_state": {
    "interaction_count": 15,
    "camera_movements": 8
  },
  "camera_position": {"x": 10, "y": 10, "z": 10}
}
```

### 4. 분석 이벤트 추적

**Endpoint:** `POST /api/analytics`

**Request Body:**
```json
{
  "session_id": 1,
  "problem_id": 1,
  "user_id": 123,
  "event_type": "rotate",
  "event_data": {"angle": 45},
  "camera_position": {"x": 12, "y": 10, "z": 8}
}
```

## 🔧 문제 해결

### 문제 1: 3D 화면이 표시되지 않음

**원인**: WebGL 미지원 또는 Three.js 로드 실패

**해결:**
```bash
# 브라우저 콘솔에서 확인
console.log(THREE); // THREE 객체가 정의되어야 함

# Three.js CDN 확인
curl -I https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js
```

### 문제 2: API 연결 오류

**원인**: CORS 정책 또는 PHP 설정 문제

**해결:**
```php
// api/index.php 헤더 확인
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Apache에서 mod_headers 활성화
sudo a2enmod headers
sudo systemctl restart apache2
```

### 문제 3: 데이터베이스 연결 실패

**원인**: MySQL 권한 또는 비밀번호 오류

**해결:**
```sql
-- 사용자 권한 확인
SHOW GRANTS FOR 'vector3d_user'@'localhost';

-- 비밀번호 재설정
ALTER USER 'vector3d_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 문제 4: Moodle 연동 안됨

**원인**: 플러그인 설치 또는 설정 오류

**해결:**
```bash
# Moodle 로그 확인
tail -f /var/www/moodle/moodledata/error.log

# 캐시 삭제
cd /var/www/moodle
php admin/cli/purge_caches.php
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **vector_problems** - 벡터 문제 정보
2. **student_attempts** - 학생 답안 시도
3. **visualization_sessions** - 시각화 세션
4. **analytics_events** - 학습 분석 이벤트

자세한 스키마는 `database/schema.sql` 참조

## 🎨 커스터마이징

### 가상 스마트폰 위치 변경

```javascript
// webapp/css/styles.css
.virtual-phone.bottom-right {
    bottom: 20px;
    right: 20px;
}

// 다른 위치: bottom-left, top-right, top-left
```

### 벡터 색상 변경

```javascript
// webapp/js/app.js
const defaultColors = {
    vectorA: '#FF6B6B',  // 빨강
    vectorB: '#4ECDC4',  // 청록
    result: '#9B59B6'    // 보라
};
```

### 3D 카메라 초기 위치

```javascript
// webapp/js/vector3d-engine.js
this.options = {
    cameraPosition: { x: 10, y: 10, z: 10 },
    // 변경: { x: 15, y: 15, z: 15 }
};
```

## 📝 라이선스

Copyright 2025 KAIST Touch Math Academy

GNU GPL v3 or later

## 👥 지원

- **이메일**: support@kaist-touchmath.ac.kr
- **문서**: https://docs.vector3d.example.com
- **이슈 트래커**: https://github.com/kaist/vector3d-sense/issues

## 🔄 업데이트 내역

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 3D 벡터 시각화
- Moodle 3.7 연동
- 가상 스마트폰 디스플레이
- 학습 분석 기능
