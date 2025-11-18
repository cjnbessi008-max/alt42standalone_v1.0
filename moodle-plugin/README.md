# Moodle Plugin for Unit Compass

Unit Compass를 Moodle 3.7과 연동하기 위한 플러그인입니다.

## 설치 방법

### 1. 플러그인 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성
mkdir -p mod/unitcompass

# 이 폴더의 파일들을 복사
cp -r /path/to/moodle-plugin/* mod/unitcompass/
```

### 2. 데이터베이스 테이블 설치

Moodle 관리자 페이지에 접속하면 자동으로 설치 프로세스가 시작됩니다.

또는 CLI로 실행:

```bash
php admin/cli/upgrade.php
```

### 3. Web Services 설정

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 사용" 활성화

2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: "Unit Compass Service"
   - 약칭: "unitcompass"
   - "승인된 사용자만" 활성화
   - 저장

3. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "Unit Compass Service" 클릭
   - "함수 추가" 클릭
   - 다음 함수들 추가:
     - `mod_unitcompass_get_problem`
     - `mod_unitcompass_submit_answer`
     - `mod_unitcompass_get_progress`

4. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - 사용자와 서비스를 선택하여 토큰 생성

### 4. CORS 설정 (개발 환경)

`config.php`에 추가:

```php
// CORS headers for development
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}
```

## 사용 방법

### 1. 활동 추가

1. 코스에 접속
2. "활동 또는 리소스 추가"
3. "Unit Compass" 선택
4. 설정 입력:
   - 활동 이름
   - 설명
   - 최대 시도 횟수
5. 저장

### 2. 문제 추가

활동 페이지에서 "문제 추가" 버튼을 클릭하여 문제를 추가합니다.

문제 유형:
- **방향 찾기**: 특정 각도 방향 찾기
- **벡터 정규화**: 벡터를 단위벡터로 변환
- **벡터 덧셈**: 두 벡터의 합 구하기
- **벡터 뺄셈**: 두 벡터의 차 구하기

### 3. 학생 접근

학생이 활동에 접속하면 다음 URL로 리디렉션됩니다:

```
http://your-app-url/?token=TOKEN&userid=USER_ID&courseid=COURSE_ID&activityid=ACTIVITY_ID
```

## 데이터베이스 스키마

### unitcompass (활동 테이블)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 활동 ID |
| course | BIGINT | 코스 ID |
| name | VARCHAR(255) | 활동 이름 |
| intro | TEXT | 설명 |
| maxattempts | INT | 최대 시도 횟수 |
| timemodified | BIGINT | 수정 시간 |

### unitcompass_problems (문제 테이블)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 문제 ID |
| activityid | BIGINT | 활동 ID |
| title | VARCHAR(255) | 문제 제목 |
| description | TEXT | 문제 설명 |
| type | VARCHAR(50) | 문제 유형 |
| targetangle | DECIMAL(10,6) | 목표 각도 |
| targetx | DECIMAL(10,6) | 목표 X |
| targety | DECIMAL(10,6) | 목표 Y |
| difficulty | VARCHAR(20) | 난이도 |
| hints | TEXT | 힌트 (JSON) |
| timecreated | BIGINT | 생성 시간 |

### unitcompass_attempts (시도 기록)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 시도 ID |
| userid | BIGINT | 사용자 ID |
| problemid | BIGINT | 문제 ID |
| answerx | DECIMAL(10,6) | 답변 X |
| answery | DECIMAL(10,6) | 답변 Y |
| iscorrect | TINYINT | 정답 여부 |
| attemptnum | INT | 시도 번호 |
| timecreated | BIGINT | 시도 시간 |

## API 엔드포인트

### 1. mod_unitcompass_get_problem

**설명:** 문제 정보 조회

**파라미터:**
```php
[
    'courseid' => PARAM_INT,
    'activityid' => PARAM_INT,
    'problemid' => PARAM_TEXT (optional)
]
```

**반환:**
```php
[
    'id' => PARAM_TEXT,
    'title' => PARAM_TEXT,
    'description' => PARAM_RAW,
    'type' => PARAM_TEXT,
    'targetangle' => PARAM_FLOAT,
    'targetvector' => [
        'x' => PARAM_FLOAT,
        'y' => PARAM_FLOAT
    ],
    'difficulty' => PARAM_TEXT,
    'hints' => PARAM_RAW,
    'maxattempts' => PARAM_INT
]
```

### 2. mod_unitcompass_submit_answer

**설명:** 답안 제출

**파라미터:**
```php
[
    'problemid' => PARAM_TEXT,
    'userid' => PARAM_TEXT,
    'answerx' => PARAM_FLOAT,
    'answery' => PARAM_FLOAT,
    'attempt' => PARAM_INT
]
```

**반환:**
```php
[
    'iscorrect' => PARAM_BOOL,
    'feedback' => PARAM_TEXT
]
```

### 3. mod_unitcompass_get_progress

**설명:** 학습 진행 상황 조회

**파라미터:**
```php
[
    'userid' => PARAM_TEXT,
    'courseid' => PARAM_INT
]
```

**반환:**
```php
[
    'userid' => PARAM_TEXT,
    'problemssolved' => PARAM_INT,
    'totalproblems' => PARAM_INT,
    'accuracy' => PARAM_FLOAT,
    'lastactivity' => PARAM_INT
]
```

## 문제 해결

### Web Services 오류

**증상:** "웹 서비스가 활성화되지 않음" 오류

**해결:**
1. 사이트 관리 > 고급 기능 > 웹 서비스 사용 활성화
2. 사이트 관리 > 보안 > HTTP 보안 > 웹 서비스 프로토콜 > REST 활성화

### 토큰 오류

**증상:** "유효하지 않은 토큰" 오류

**해결:**
1. 토큰이 올바른 서비스에 연결되어 있는지 확인
2. 토큰이 만료되지 않았는지 확인
3. 사용자가 서비스 사용 권한이 있는지 확인

### CORS 오류

**증상:** 브라우저 콘솔에 CORS 오류

**해결:**
1. `config.php`에 CORS 헤더 추가 (위 참조)
2. 또는 Nginx/Apache에서 CORS 설정

## 라이센스

GPL v3 - Moodle 호환
