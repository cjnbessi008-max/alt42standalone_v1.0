# Magnitude Sound - Moodle 통합 가이드

## 📚 개요

Magnitude Sound는 Moodle LMS와 연동하여 벡터 문제를 음악으로 학습하는 웹 애플리케이션입니다.

---

## 🔧 설치 방법

### 1. 서버 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 또는 Nginx

### 2. 파일 배포

```bash
# Moodle 루트 디렉토리로 이동
cd /path/to/moodle

# magnitude-sound-app 디렉토리 복사
cp -r magnitude-sound-app /var/www/html/magnitude-sound-app
# 또는 Moodle 내부
cp -r magnitude-sound-app /path/to/moodle/local/magnitude-sound-app
```

### 3. 데이터베이스 설정

`api/config.php` 파일을 편집하여 Moodle 데이터베이스 정보 입력:

```php
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'your_db_user');
define('MOODLE_DB_PASS', 'your_db_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

### 4. 권한 설정

```bash
# 웹 서버가 파일을 읽을 수 있도록 권한 설정
chmod -R 755 magnitude-sound-app
chown -R www-data:www-data magnitude-sound-app
```

---

## 🎯 Moodle에 통합하는 방법

### 방법 1: iframe을 사용한 임베딩 (추천)

Moodle의 **HTML 블록** 또는 **레이블**에 다음 코드를 추가:

```html
<div style="position: relative; width: 100%; min-height: 800px;">
    <iframe
        src="https://your-domain.com/magnitude-sound-app/public/index.html?question_id=123&user_id=456"
        width="100%"
        height="800px"
        frameborder="0"
        allow="autoplay"
        style="border: none; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    </iframe>
</div>
```

**URL 파라미터:**
- `question_id`: Moodle 문제 ID
- `quiz_id`: Quiz ID (여러 문제 로드)
- `course_id`: 코스 ID (코스의 모든 벡터 문제 로드)
- `user_id`: 사용자 ID (답안 제출용)
- `attempt_id`: 시도 ID (선택)

**예시:**
```
https://your-domain.com/magnitude-sound-app/public/index.html?question_id=42&user_id=123
```

### 방법 2: Moodle 활동 모듈로 개발 (고급)

향후 개발 예정 - Moodle Activity Module 형태로 패키징

---

## 🔗 API 엔드포인트

### 1. 문제 정보 조회

**엔드포인트:** `GET /api/get_problems.php`

**파라미터:**
- `question_id`: 특정 문제 조회
- `quiz_id`: Quiz의 모든 문제 조회
- `course_id`: 코스의 벡터 문제 조회

**응답 예시:**
```json
{
    "success": true,
    "data": {
        "id": 42,
        "name": "벡터의 크기와 방향",
        "question_text": "<p>벡터 v = (3, 4)의 크기와 방향을 구하세요.</p>",
        "type": "calculated",
        "vector_info": {
            "has_vector": true,
            "coordinates": {"x": 3, "y": 4},
            "magnitude_range": {"min": 0, "max": 10}
        }
    },
    "timestamp": 1700000000
}
```

### 2. 답안 제출

**엔드포인트:** `POST /api/submit_answer.php`

**요청 본문:**
```json
{
    "question_id": 42,
    "user_id": 123,
    "vector_x": 3.0,
    "vector_y": 4.0,
    "attempt_id": 789
}
```

**응답 예시:**
```json
{
    "success": true,
    "data": {
        "answer_id": 1001,
        "vector": {"x": 3.0, "y": 4.0},
        "calculated": {
            "magnitude": 5.0,
            "direction_radians": 0.9273,
            "direction_degrees": 53.13
        },
        "sound_params": {
            "volume": 0.5,
            "frequency": 440.0,
            "pan": 0.8,
            "waveform": "triangle",
            "duration": 1.25
        }
    }
}
```

---

## 🎨 사용자 정의

### CSS 커스터마이징

`public/css/styles.css` 파일을 수정하여 디자인 변경:

```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
}
```

### 사운드 매핑 조정

`public/js/sound-engine.js`의 `vectorToSoundParams` 메서드 수정:

```javascript
// 주파수 범위 변경
const minFreq = 110; // A2
const maxFreq = 1760; // A6

// 파형 변경
const waveforms = ['sine', 'square', 'triangle', 'sawtooth'];
```

---

## 🧪 테스트

### 1. 독립 실행 모드 (데모)

브라우저에서 직접 열기:
```
http://localhost/magnitude-sound-app/public/index.html
```

### 2. Moodle 통합 테스트

실제 Moodle 문제 ID를 사용하여 테스트:
```
http://localhost/magnitude-sound-app/public/index.html?question_id=1&user_id=2
```

### 3. API 테스트

```bash
# 문제 조회 테스트
curl "http://localhost/magnitude-sound-app/api/get_problems.php?question_id=1"

# 답안 제출 테스트
curl -X POST "http://localhost/magnitude-sound-app/api/submit_answer.php" \
  -H "Content-Type: application/json" \
  -d '{"question_id":1,"user_id":2,"vector_x":3,"vector_y":4}'
```

---

## 🔐 보안 고려사항

### 1. CORS 설정

프로덕션 환경에서는 `api/config.php`의 CORS 설정을 제한:

```php
// 개발 환경
header('Access-Control-Allow-Origin: *');

// 프로덕션 환경
header('Access-Control-Allow-Origin: https://your-moodle-domain.com');
```

### 2. 인증 추가

현재는 기본 구현이며, 프로덕션에서는 다음을 추가:

```php
// Moodle 세션 확인
require_once('../../config.php'); // Moodle config
require_login();

$USER->id; // 현재 로그인한 사용자 ID 사용
```

### 3. SQL Injection 방지

Prepared Statements 사용 (이미 구현됨):
```php
$stmt = $conn->prepare("SELECT * FROM table WHERE id = ?");
$stmt->bind_param('i', $id);
```

---

## 📊 데이터베이스 스키마

앱이 자동으로 생성하는 테이블:

```sql
CREATE TABLE mdl_magnitude_sound_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    attempt_id INT NULL,
    vector_x DECIMAL(10, 4) NOT NULL,
    vector_y DECIMAL(10, 4) NOT NULL,
    magnitude DECIMAL(10, 4) NOT NULL,
    direction_rad DECIMAL(10, 6) NOT NULL,
    direction_deg DECIMAL(10, 4) NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    score DECIMAL(5, 2) NULL,
    time_submitted INT NOT NULL,
    INDEX idx_question (question_id),
    INDEX idx_user (user_id),
    INDEX idx_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🐛 문제 해결

### 소리가 재생되지 않음
- 브라우저 자동재생 정책: 사용자 제스처 필요 → "시작하기" 버튼 클릭
- HTTPS 필요: 일부 브라우저는 HTTP에서 Web Audio API 제한

### API 연결 오류
- 데이터베이스 접속 정보 확인: `api/config.php`
- CORS 에러: 개발자 도구 콘솔 확인 후 CORS 설정 조정
- PHP 에러 로그 확인: `/var/log/apache2/error.log`

### iframe이 표시되지 않음
- X-Frame-Options 헤더 확인
- 브라우저 개발자 도구에서 콘솔 에러 확인

---

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 (F12) 콘솔 확인
2. 서버 에러 로그 확인
3. GitHub Issues에 보고

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 🎓 교육적 사용

이 앱은 교육 목적으로 개발되었습니다:
- ✅ 학교, 대학 수업에서 자유롭게 사용
- ✅ 비상업적 용도
- ✅ 소스 코드 수정 및 개선

상업적 사용 시 별도 문의 바랍니다.
