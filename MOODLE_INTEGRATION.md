# Moodle 3.7 통합 가이드

## 개요

Triangle Mirror를 Moodle 3.7 LMS와 통합하는 방법을 설명합니다.

## 전제 조건

- **Moodle 3.7** 설치 및 실행
- **MySQL 5.7** 데이터베이스
- **PHP 7.1.9** 이상
- Moodle 관리자 권한

## 1. Moodle 웹 서비스 설정

### Step 1: 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 (Site Administration)** → **고급 기능 (Advanced features)**
3. "웹 서비스 활성화 (Enable web services)" 체크박스 선택
4. 저장

### Step 2: REST 프로토콜 활성화

1. **사이트 관리** → **플러그인 (Plugins)** → **웹 서비스 (Web services)** → **프로토콜 관리 (Manage protocols)**
2. **REST 프로토콜** 활성화 (눈 아이콘 클릭하여 표시)

### Step 3: 외부 서비스 생성

1. **사이트 관리** → **서버 (Server)** → **웹 서비스** → **외부 서비스 (External services)**
2. "추가 (Add)" 버튼 클릭
3. 다음 정보 입력:
   - **이름**: `Triangle Mirror Service`
   - **짧은 이름**: `triangle_mirror`
   - **활성화됨**: 체크
4. "외부 서비스 추가" 클릭

### Step 4: 기능 추가

생성한 서비스의 "기능 (Functions)" 링크 클릭 후 다음 기능 추가:

```
core_webservice_get_site_info
core_question_get_questions
core_user_get_users
core_user_get_users_by_field
mod_quiz_get_quizzes_by_courses
```

### Step 5: 사용자에게 서비스 할당

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. Triangle Mirror Service의 "승인된 사용자 (Authorised users)" 클릭
3. 사용자 추가

### Step 6: 토큰 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리 (Manage tokens)**
2. "추가" 클릭
3. 사용자와 서비스 선택:
   - **사용자**: 승인된 사용자 선택
   - **서비스**: Triangle Mirror Service
4. 저장
5. **생성된 토큰을 복사** (예: `a1b2c3d4e5f6g7h8i9j0`)

## 2. MySQL 데이터베이스 접근 설정

Triangle Mirror는 Moodle의 MySQL 데이터베이스에 **읽기 전용** 접근이 필요합니다.

### 읽기 전용 사용자 생성

MySQL에 로그인:

```bash
mysql -u root -p
```

읽기 전용 사용자 생성:

```sql
-- 사용자 생성
CREATE USER 'triangle_app'@'localhost' IDENTIFIED BY 'secure_password_here';

-- 읽기 권한만 부여
GRANT SELECT ON moodle.* TO 'triangle_app'@'localhost';

-- 특정 테이블만 접근하도록 제한 (더 안전)
GRANT SELECT ON moodle.mdl_question TO 'triangle_app'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'triangle_app'@'localhost';
GRANT SELECT ON moodle.mdl_user TO 'triangle_app'@'localhost';
GRANT SELECT ON moodle.mdl_course TO 'triangle_app'@'localhost';
GRANT SELECT ON moodle.mdl_context TO 'triangle_app'@'localhost';

-- 변경사항 적용
FLUSH PRIVILEGES;
```

### 연결 테스트

```bash
mysql -u triangle_app -p -h localhost moodle
```

## 3. Triangle Mirror 환경 변수 설정

`.env` 파일 수정:

```env
# Moodle Web Service
MOODLE_URL=http://your-moodle-domain.com
MOODLE_API_TOKEN=a1b2c3d4e5f6g7h8i9j0
MOODLE_SERVICE_NAME=triangle_mirror

# Moodle MySQL Database (읽기 전용)
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=triangle_app
MOODLE_DB_PASSWORD=secure_password_here
```

## 4. Moodle에 Triangle Mirror 임베드

### 방법 1: HTML 블록 사용

1. Moodle 코스 또는 페이지 편집
2. "블록 추가" → "HTML"
3. 다음 코드 입력:

```html
<div style="width: 100%; height: 800px;">
  <iframe
    src="http://localhost:3000?questionId=123"
    width="100%"
    height="800px"
    frameborder="0"
    style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  </iframe>
</div>
```

**파라미터**:
- `questionId`: Moodle 문제 ID

### 방법 2: 라벨(Label) 또는 페이지에 임베드

1. 활동 추가 → "라벨" 또는 "페이지"
2. 에디터에서 HTML 모드로 전환 (`<>` 아이콘)
3. 위 iframe 코드 붙여넣기
4. 저장

### 방법 3: Moodle 활동 모듈 (고급)

커스텀 Moodle 활동 모듈 생성 (선택사항):

```php
// mod/trianglemirror/view.php
<?php
require_once('../../config.php');

$id = required_param('id', PARAM_INT); // Course Module ID
$questionid = optional_param('questionid', 0, PARAM_INT);

$PAGE->set_url('/mod/trianglemirror/view.php', array('id' => $id));
$PAGE->set_title('Triangle Mirror');

echo $OUTPUT->header();

$triangle_mirror_url = "http://localhost:3000?questionId=" . $questionid;

echo "<iframe src='$triangle_mirror_url' width='100%' height='800px' frameborder='0'></iframe>";

echo $OUTPUT->footer();
?>
```

## 5. CORS 설정

Moodle 도메인에서 Triangle Mirror에 접근할 수 있도록 CORS 설정:

`.env` 파일:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://your-moodle-domain.com
```

## 6. 문제 데이터 구조

### Moodle 문제 형식

Triangle Mirror는 다음 형식의 문제를 지원합니다:

```json
{
  "questionid": 123,
  "name": "유사 삼각형 문제",
  "questiontext": "다음 삼각형 중 유사한 것을 찾으시오",
  "geometrydata": {
    "triangles": [
      {
        "label": "ABC",
        "vertices": [
          {"x": 100, "y": 100},
          {"x": 200, "y": 100},
          {"x": 150, "y": 50}
        ]
      }
    ]
  }
}
```

### 커스텀 문제 필드 추가 (선택사항)

Moodle에 기하학 데이터를 저장하기 위한 커스텀 필드:

1. **사이트 관리** → **플러그인** → **문제 유형 (Question types)**
2. 커스텀 필드 추가 또는 기존 Essay/Description 타입 사용
3. 문제 텍스트에 JSON 데이터 포함

## 7. 테스트

### API 연결 테스트

```bash
# Moodle 웹 서비스 테스트
curl "http://your-moodle-domain.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

### Triangle Mirror 연결 테스트

1. Triangle Mirror 서버 시작:
   ```bash
   npm run dev
   ```

2. 브라우저에서 테스트:
   ```
   http://localhost:3000?questionId=123
   ```

3. Moodle에서 임베드된 화면 확인

## 8. 프로덕션 배포

### HTTPS 설정

프로덕션 환경에서는 반드시 HTTPS 사용:

```env
MOODLE_URL=https://your-moodle-domain.com
```

### 서버 배포

```bash
# 빌드
npm run build

# PM2로 프로덕션 실행
pm2 start server/dist/index.js --name triangle-mirror

# Nginx 리버스 프록시 설정
server {
    listen 80;
    server_name triangle-mirror.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 9. 보안 고려사항

### 데이터베이스 보안

- ✅ **읽기 전용 권한만 부여**
- ✅ **특정 테이블만 접근 허용**
- ✅ **강력한 비밀번호 사용**
- ✅ **localhost에서만 접근 허용**

### API 보안

- ✅ **HTTPS 사용**
- ✅ **JWT 토큰 검증**
- ✅ **CORS 제한**
- ✅ **Rate limiting 설정**

### Moodle 토큰 보안

- ✅ **토큰을 환경 변수에 저장**
- ✅ **정기적으로 토큰 갱신**
- ✅ **IP 제한 설정 (Moodle 설정)**

## 10. 문제 해결

### 연결 실패

```bash
# Moodle 웹 서비스 활성화 확인
# 토큰 유효성 확인
# CORS 설정 확인
```

### 데이터베이스 연결 오류

```bash
# MySQL 사용자 권한 확인
SHOW GRANTS FOR 'triangle_app'@'localhost';

# 연결 테스트
mysql -u triangle_app -p -h localhost moodle
```

### iframe 표시 안 됨

Moodle의 `config.php`에서 X-Frame-Options 확인:

```php
// config.php
$CFG->allowframembedding = true; // 주의: 보안 위험 있음
```

더 안전한 방법: 특정 도메인만 허용

```php
header("Content-Security-Policy: frame-ancestors 'self' http://triangle-mirror.yourdomain.com");
```

## 지원

문제가 발생하면 GitHub Issues를 통해 문의해주세요.
