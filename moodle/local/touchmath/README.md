# Touch Math Moodle Plugin

Moodle 3.7+ 플러그인으로 접선 학습 앱과 연동합니다.

## 설치 방법

### 1. 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/moodle/local/touchmath ./local/

# 권한 설정
chmod -R 755 ./local/touchmath
```

### 2. Moodle 업그레이드

1. Moodle 관리자로 로그인
2. 사이트 관리 → 알림
3. "Upgrade Moodle database now" 클릭
4. 테이블이 자동으로 생성됩니다

### 3. 웹 서비스 활성화

1. **웹 서비스 활성화**
   - 사이트 관리 → 고급 기능
   - "웹 서비스 활성화" 체크
   - 저장

2. **프로토콜 활성화**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 프로토콜 관리
   - REST 프로토콜 활성화

3. **외부 서비스 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스
   - "서비스 추가" 클릭
   - 이름: "Touch Math Service"
   - 약식 이름: "touchmath"
   - 활성화: 체크
   - 저장

4. **함수 추가**
   - 생성한 서비스 → 함수
   - 다음 함수들을 추가:
     - `local_touchmath_get_problem`
     - `local_touchmath_submit_answer`
     - `local_touchmath_save_progress`
     - `local_touchmath_log_event`

5. **토큰 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리
   - "토큰 추가" 클릭
   - 사용자 선택
   - 서비스: "Touch Math Service"
   - 저장
   - **토큰 복사해두기** (나중에 사용)

### 4. 권한 설정

capabilities.php 내용:

```php
<?php
$capabilities = array(
    'local/touchmath:view' => array(
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => array(
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        )
    ),
    'local/touchmath:submit' => array(
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => array(
            'student' => CAP_ALLOW
        )
    ),
);
```

## 사용 방법

### 샘플 문제 추가

MySQL 또는 phpMyAdmin을 통해 샘플 문제를 추가:

```sql
INSERT INTO mdl_touchmath_problems
(courseid, activityid, title, description, functiontype, functiondata, timemodified)
VALUES
(
    2,  -- 코스 ID
    1,  -- 활동 ID
    '이차함수의 접선',
    '주어진 곡선 위의 점에서 접선을 그려보세요',
    'polynomial',
    '{
        "coefficients": {"a": 0.5, "b": 0, "c": -2},
        "display": "f(x) = 0.5x² - 2",
        "targetPoint": {"x": 2, "y": 0},
        "tolerance": 0.5,
        "hints": [
            "접선은 곡선과 한 점에서만 만납니다",
            "접선의 기울기는 그 점에서의 미분값과 같습니다"
        ]
    }',
    UNIX_TIMESTAMP()
);
```

### 웹앱에서 접속

웹앱 URL에 파라미터 추가:

```
http://your-domain/src/index.html?token=YOUR_TOKEN&student_id=123&course_id=2&activity_id=1
```

### Moodle 활동으로 추가

코스에 "Label" 또는 "Page" 활동을 추가하고 iframe으로 임베드:

```html
<iframe
    src="http://your-domain/src/index.html?token=YOUR_TOKEN&student_id={$USER->id}&course_id={$COURSE->id}&activity_id=1"
    width="375"
    height="667"
    style="border:none; border-radius:40px; box-shadow:0 20px 60px rgba(0,0,0,0.3);"
></iframe>
```

## API 엔드포인트

### 1. Get Problem

**함수**: `local_touchmath_get_problem`

**파라미터**:
- `courseid`: 코스 ID
- `activityid`: 활동 ID
- `studentid`: 학생 ID
- `problemid`: 문제 ID (선택)

**반환**:
```json
{
    "id": 1,
    "title": "이차함수의 접선",
    "description": "주어진 곡선 위의 점에서 접선을 그려보세요",
    "function": {
        "type": "polynomial",
        "coefficients": {"a": 0.5, "b": 0, "c": -2},
        "display": "f(x) = 0.5x² - 2"
    },
    "targetPoint": {"x": 2, "y": 0},
    "tolerance": 0.5,
    "hints": [...]
}
```

### 2. Submit Answer

**함수**: `local_touchmath_submit_answer`

**파라미터**:
- `courseid`: 코스 ID
- `activityid`: 활동 ID
- `studentid`: 학생 ID
- `problemid`: 문제 ID
- `answer`: 답안 데이터 (JSON)
- `timestamp`: 타임스탬프

**반환**:
```json
{
    "success": true,
    "correct": true,
    "score": 100,
    "feedback": "정확합니다!",
    "solution": {
        "point": {"x": 2, "y": 0},
        "slope": 2,
        "equation": "y = 2x - 4"
    }
}
```

## 데이터베이스 구조

### touchmath_problems

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| courseid | BIGINT(10) | 코스 ID |
| activityid | BIGINT(10) | 활동 ID |
| title | VARCHAR(255) | 문제 제목 |
| description | TEXT | 문제 설명 |
| functiontype | VARCHAR(50) | 함수 타입 |
| functiondata | TEXT | 함수 데이터 (JSON) |
| timemodified | BIGINT(10) | 수정 시간 |

### touchmath_submissions

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| problemid | BIGINT(10) | 문제 ID (외래키) |
| studentid | BIGINT(10) | 학생 ID |
| answer | TEXT | 답안 (JSON) |
| score | DECIMAL(10,5) | 점수 |
| timecreated | BIGINT(10) | 생성 시간 |

### touchmath_events

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT(10) | 기본 키 |
| studentid | BIGINT(10) | 학생 ID |
| eventtype | VARCHAR(100) | 이벤트 타입 |
| eventdata | TEXT | 이벤트 데이터 (JSON) |
| timecreated | BIGINT(10) | 생성 시간 |

## 문제 해결

### CORS 오류

웹앱이 다른 도메인에 있는 경우 CORS 설정 필요:

```php
// config.php에 추가
$CFG->webservicecorsallowedorigins = array(
    'http://your-webapp-domain',
    'https://your-webapp-domain'
);
```

### 디버깅

Moodle 디버깅 활성화:

1. 사이트 관리 → 개발 → 디버깅
2. 디버그 메시지: 개발자
3. 디버그 표시: 예

## 라이선스

GNU GPL v3 or later

## 지원

- 이슈: GitHub Issues
- 이메일: support@kaist-touchmath.edu
