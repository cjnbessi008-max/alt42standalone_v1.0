# Relation Lines - 숫자 관계 연결 웹앱

Moodle LMS와 연동하여 숫자 간 관계를 색깔 선으로 연결하는 교육용 웹앱입니다.

## 주요 기능

- 🎨 **색깔 선 연결**: 6가지 색상으로 숫자를 연결
- 📱 **스마트폰 프레임 UI**: 우측 하단에 모바일 앱 형태로 표시
- 🔗 **Moodle 연동**: MySQL 데이터베이스에서 문제 정보 가져오기
- ✅ **자동 채점**: 답안 제출 시 즉시 채점 결과 표시
- 📊 **학습 분석**: 학생 응답 기록 저장 및 분석

## 시스템 요구사항

- **MySQL**: 5.7 이상
- **PHP**: 7.1.9 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 또는 Nginx

## 디렉토리 구조

```
relationlines/
├── index.html              # 메인 HTML 페이지
├── css/
│   └── style.css          # 스타일시트
├── js/
│   └── relationlines.js   # JavaScript 로직
├── api/
│   ├── config.php         # 데이터베이스 설정 (생성 필요)
│   ├── config.sample.php  # 설정 파일 샘플
│   ├── get_question.php   # 문제 가져오기 API
│   └── submit_answer.php  # 답안 제출 API
└── README.md              # 이 파일
```

## 설치 방법

### 1. 파일 배포

웹 서버의 document root에 파일을 업로드합니다.

```bash
# 예시: Apache의 경우
cp -r relationlines /var/www/html/

# 예시: Nginx의 경우
cp -r relationlines /usr/share/nginx/html/
```

### 2. 데이터베이스 설정

Moodle 데이터베이스 접속 정보를 설정합니다.

```bash
cd relationlines/api
cp config.sample.php config.php
vi config.php  # 또는 nano config.php
```

`config.php` 파일에서 다음 항목을 수정하세요:

```php
define('DB_HOST', 'localhost');        // 데이터베이스 호스트
define('DB_NAME', 'moodle');           // Moodle 데이터베이스 이름
define('DB_USER', 'your_username');    // 데이터베이스 사용자명
define('DB_PASS', 'your_password');    // 데이터베이스 비밀번호
define('MOODLE_PREFIX', 'mdl_');       // Moodle 테이블 접두사
```

### 3. 권한 설정

웹 서버가 파일을 읽을 수 있도록 권한을 설정합니다.

```bash
chmod -R 755 relationlines/
chown -R www-data:www-data relationlines/  # Ubuntu/Debian
# 또는
chown -R apache:apache relationlines/      # CentOS/RHEL
```

### 4. 데이터베이스 테이블 생성 (선택사항)

Moodle 데이터베이스에 문제 데이터를 저장할 테이블을 생성합니다.

```sql
-- Moodle 데이터베이스에 연결 후 실행
USE moodle;

-- Relation Lines 문제 데이터 테이블
CREATE TABLE IF NOT EXISTS mdl_question_relationlines (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    data LONGTEXT NOT NULL,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    UNIQUE KEY mdl_quesrela_que_uix (questionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 문제 데이터 삽입
INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    1,
    '{"leftNumbers":["1/2","1/4","3/4","1/5","2/5"],"rightNumbers":["0.5","0.25","0.75","0.2","0.4"],"correctAnswers":{"1/2":"0.5","1/4":"0.25","3/4":"0.75","1/5":"0.2","2/5":"0.4"}}',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- Moodle 질문 테이블에 문제 정보 삽입 (예시)
INSERT INTO mdl_question (name, questiontext, qtype, timecreated, timemodified)
VALUES (
    '분수와 소수 매칭하기',
    '같은 값을 가진 분수와 소수를 연결하세요.',
    'relationlines',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);
```

## 사용 방법

### 1. 웹앱 실행

브라우저에서 다음 URL로 접속합니다:

```
http://your-domain.com/relationlines/
```

또는 특정 문제를 로드하려면:

```
http://your-domain.com/relationlines/?qid=1
```

### 2. 문제 풀기

1. 좌측 숫자를 클릭하여 선택
2. 우측 관련 숫자를 클릭하여 연결
3. 색깔 팔레트에서 다른 색상 선택 가능
4. '실행취소' 버튼으로 마지막 선 삭제
5. '초기화' 버튼으로 모든 선 삭제
6. '제출하기' 버튼으로 답안 제출 및 채점

### 3. Moodle에 임베드하기

Moodle 페이지나 코스에 iframe으로 임베드할 수 있습니다:

```html
<iframe
    src="http://your-domain.com/relationlines/?qid=1"
    width="100%"
    height="800"
    frameborder="0">
</iframe>
```

## API 문서

### GET /api/get_question.php

문제 데이터를 가져옵니다.

**파라미터:**
- `qid` (필수): 문제 ID

**응답 예시:**
```json
{
  "success": true,
  "question": {
    "id": 1,
    "title": "분수와 소수 매칭하기",
    "description": "같은 값을 가진 분수와 소수를 연결하세요.",
    "leftNumbers": ["1/2", "1/4", "3/4", "1/5", "2/5"],
    "rightNumbers": ["0.5", "0.25", "0.75", "0.2", "0.4"],
    "correctAnswers": {
      "1/2": "0.5",
      "1/4": "0.25",
      "3/4": "0.75",
      "1/5": "0.2",
      "2/5": "0.4"
    }
  }
}
```

### POST /api/submit_answer.php

답안을 제출하고 채점 결과를 받습니다.

**요청 본문:**
```json
{
  "questionId": 1,
  "answers": {
    "1/2": "0.5",
    "1/4": "0.25",
    "3/4": "0.75",
    "1/5": "0.2",
    "2/5": "0.4"
  }
}
```

**응답 예시:**
```json
{
  "success": true,
  "score": 5,
  "total": 5,
  "percentage": 100,
  "details": [
    {
      "left": "1/2",
      "right": "0.5",
      "studentAnswer": "0.5",
      "correct": true
    }
  ]
}
```

## 샘플 문제

데이터베이스 연결이 실패하거나 테스트 목적으로 5개의 샘플 문제가 내장되어 있습니다:

1. **분수와 소수 매칭하기** (qid=1)
2. **곱셈구구 연결하기** (qid=2)
3. **영어 단어와 뜻 연결하기** (qid=3)
4. **도형과 면의 개수** (qid=4)
5. **국가와 수도 연결하기** (qid=5)

## 커스터마이징

### 색상 변경

`css/style.css` 파일에서 색상을 변경할 수 있습니다:

```css
.smartphone-frame {
    background: #1a1a1a;  /* 스마트폰 프레임 색상 */
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 색상 팔레트 추가

`index.html` 파일의 색상 팔레트 섹션에 추가:

```html
<div class="color-option" data-color="#YOUR_COLOR" style="background: #YOUR_COLOR;"></div>
```

### 스마트폰 프레임 위치 변경

`css/style.css`에서 `.smartphone-frame` 클래스의 위치를 변경:

```css
.smartphone-frame {
    position: fixed;
    right: 30px;   /* 우측 여백 */
    bottom: 30px;  /* 하단 여백 */
}
```

## 문제 해결

### 데이터베이스 연결 오류

**증상:** "문제를 불러오는데 실패했습니다" 메시지

**해결:**
1. `api/config.php` 파일의 DB 설정 확인
2. MySQL 서버가 실행 중인지 확인
3. PHP PDO MySQL 확장이 활성화되어 있는지 확인

```bash
php -m | grep pdo_mysql
```

### CORS 에러

**증상:** 브라우저 콘솔에 "Access-Control-Allow-Origin" 에러

**해결:**
`api/config.php`에서 CORS 설정 수정:

```php
header('Access-Control-Allow-Origin: http://your-domain.com');
```

### 파일 권한 에러

**증상:** 403 Forbidden 또는 파일을 읽을 수 없음

**해결:**
```bash
chmod -R 755 relationlines/
```

## 라이센스

MIT License

## 기여

이슈 리포트 및 풀 리퀘스트를 환영합니다.

## 문의

- 이메일: support@example.com
- 이슈 트래커: GitHub Issues

## 버전 이력

- **v1.0.0** (2025-11-18)
  - 초기 릴리스
  - 기본 선 그리기 기능
  - Moodle 연동 API
  - 샘플 문제 5개 포함
