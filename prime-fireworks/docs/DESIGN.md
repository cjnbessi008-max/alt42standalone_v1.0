# Prime Fireworks - 소수 분해 학습 앱 설계 문서

## 1. 개요

**Prime Fireworks**는 소수 분해를 폭죽처럼 터지는 시각적 효과로 표현하여 학생들이 수학 개념을 재미있게 학습할 수 있는 인터랙티브 웹 애플리케이션입니다.

### 핵심 기능
- Moodle LMS와 연동하여 문제 정보 수신
- 우측 하단에 가상 스마트폰 화면으로 표시
- 소수 분해 과정을 폭죽 애니메이션으로 시각화
- 학생 진도 추적 및 결과 저장

## 2. 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **JSON API**: RESTful endpoints

### Frontend
- **HTML5/CSS3**: 스마트폰 UI 구현
- **JavaScript (ES6)**: 인터랙션 및 애니메이션
- **Canvas API**: 폭죽 효과 렌더링
- **Responsive Design**: 다양한 화면 크기 대응

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Moodle LMS 3.7                          │
│  (문제 관리, 학생 정보, 진도 추적)                            │
└────────────────────┬────────────────────────────────────────┘
                     │ Moodle Web Services API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Prime Fireworks Backend (PHP 7.1.9)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Controller                                       │  │
│  │  - getProblem()    : 문제 조회                        │  │
│  │  - submitAnswer()  : 답안 제출                        │  │
│  │  - getProgress()   : 진도 조회                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prime Decomposition Engine                           │  │
│  │  - factorize()     : 소수 분해 계산                    │  │
│  │  - validate()      : 답안 검증                        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────┐
│   MySQL 5.7         │
│  - problems         │
│  - student_progress │
│  - fireworks_log    │
└─────────────────────┘

       ↑ JSON API
       │
┌──────┴──────────────────────────────────────────────────────┐
│           Frontend (가상 스마트폰 UI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SmartphoneFrame (우측 하단)                          │  │
│  │  ├─ ProblemDisplay    : 문제 표시                    │  │
│  │  ├─ AnswerInput       : 답안 입력                    │  │
│  │  └─ FireworksCanvas   : 폭죽 애니메이션              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 4. 데이터베이스 스키마

### problems 테이블
```sql
CREATE TABLE prime_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    number_to_factor INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL,
    prime_factors JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
);
```

### student_progress 테이블
```sql
CREATE TABLE student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    submitted_answer JSON,
    is_correct BOOLEAN NOT NULL,
    attempts INT DEFAULT 1,
    time_spent_seconds INT,
    fireworks_triggered BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES prime_problems(id),
    INDEX idx_user_progress (moodle_user_id, problem_id)
);
```

### fireworks_log 테이블
```sql
CREATE TABLE fireworks_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    progress_id INT NOT NULL,
    number INT NOT NULL,
    prime_factors JSON NOT NULL,
    animation_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_id) REFERENCES student_progress(id)
);
```

## 5. API 엔드포인트

### GET /api/problem.php
문제 조회 API
```json
Request:
GET /api/problem.php?user_id=123&level=medium

Response:
{
  "status": "success",
  "data": {
    "problem_id": 45,
    "number": 60,
    "difficulty": "medium",
    "instruction": "60을 소수의 곱으로 나타내세요",
    "hint": "작은 소수부터 차례대로 나누어보세요"
  }
}
```

### POST /api/submit.php
답안 제출 API
```json
Request:
POST /api/submit.php
{
  "user_id": 123,
  "problem_id": 45,
  "answer": [2, 2, 3, 5],
  "time_spent": 120
}

Response:
{
  "status": "success",
  "data": {
    "is_correct": true,
    "correct_answer": [2, 2, 3, 5],
    "fireworks_data": {
      "stages": [
        {"number": 60, "factors": [2, 30], "position": {"x": 200, "y": 300}},
        {"number": 30, "factors": [2, 15], "position": {"x": 180, "y": 250}},
        {"number": 15, "factors": [3, 5], "position": {"x": 220, "y": 250}}
      ],
      "primes": [2, 2, 3, 5]
    }
  }
}
```

### GET /api/progress.php
진도 조회 API
```json
Request:
GET /api/progress.php?user_id=123

Response:
{
  "status": "success",
  "data": {
    "total_problems": 20,
    "completed": 12,
    "correct_rate": 75.0,
    "fireworks_count": 9
  }
}
```

## 6. 소수 분해 알고리즘

### 기본 알고리즘
```php
function primeFactorize($n) {
    $factors = [];

    // 2로 나누기
    while ($n % 2 == 0) {
        $factors[] = 2;
        $n = $n / 2;
    }

    // 홀수로 나누기
    for ($i = 3; $i <= sqrt($n); $i += 2) {
        while ($n % $i == 0) {
            $factors[] = $i;
            $n = $n / $i;
        }
    }

    // n이 소수인 경우
    if ($n > 2) {
        $factors[] = $n;
    }

    return $factors;
}
```

## 7. 폭죽 애니메이션 로직

### 시각화 개념
1. **초기 숫자**: 큰 원으로 표시
2. **분해 과정**:
   - 숫자를 두 인수로 나눌 때 폭죽이 터짐
   - 소수는 빛나는 별 모양으로 표시
   - 합성수는 계속 분해됨
3. **최종 결과**: 모든 소수가 반짝이며 정렬됨

### 애니메이션 단계
```javascript
Stage 1: 60 → [2, 30] (폭죽 효과)
Stage 2: 30 → [2, 15] (폭죽 효과)
Stage 3: 15 → [3, 5]  (폭죽 효과)
Final: [2, 2, 3, 5] 모두 반짝임
```

## 8. 가상 스마트폰 UI 설계

### 레이아웃
```
┌─────────────────────────────────┐
│  📱 Prime Fireworks             │ <- 헤더
├─────────────────────────────────┤
│                                 │
│     문제: 60을 소수 분해         │
│                                 │
│   ┌─────────────────────────┐  │
│   │                         │  │
│   │   [폭죽 애니메이션]      │  │ <- Canvas
│   │                         │  │
│   └─────────────────────────┘  │
│                                 │
│   답안 입력:                    │
│   [2] [2] [3] [5]               │ <- 입력 필드
│                                 │
│   [제출하기] [다시하기]          │ <- 버튼
│                                 │
├─────────────────────────────────┤
│  진도: ████████░░ 80%           │ <- 진도 바
└─────────────────────────────────┘
```

### 스타일 특징
- 둥근 모서리 (border-radius: 20px)
- 스마트폰 느낌의 섀도우
- 우측 하단 고정 위치 (fixed position)
- 반응형 크기 (375px x 667px, iPhone 기준)

## 9. Moodle 연동

### Moodle Web Services 설정
1. Moodle 관리자 페이지에서 Web Services 활성화
2. 토큰 생성 및 권한 설정
3. 허용할 함수 목록:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_attempt_data`
   - `mod_quiz_save_attempt`

### PHP 연동 코드
```php
function getMoodleUser($userId, $token) {
    $serverurl = MOODLE_URL . '/webservice/rest/server.php';
    $params = [
        'wstoken' => $token,
        'wsfunction' => 'core_user_get_users_by_field',
        'field' => 'id',
        'values[0]' => $userId,
        'moodlewsrestformat' => 'json'
    ];

    $url = $serverurl . '?' . http_build_query($params);
    $response = file_get_contents($url);

    return json_decode($response, true);
}
```

## 10. 보안 고려사항

### 인증 및 권한
- Moodle 세션 토큰 검증
- CSRF 토큰 사용
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력값 sanitization)

### 데이터 보호
- 학생 개인정보 암호화
- HTTPS 통신 강제
- 입력값 검증 및 필터링

## 11. 성능 최적화

### 캐싱
- 문제 데이터 캐싱 (Redis/Memcached)
- 소수 분해 결과 캐싱
- 정적 리소스 브라우저 캐싱

### 최적화
- Canvas 렌더링 최적화 (requestAnimationFrame)
- 이미지 스프라이트 사용
- 지연 로딩 (Lazy Loading)

## 12. 테스트 계획

### Unit Tests
- 소수 분해 알고리즘 정확성
- API 응답 포맷 검증
- 답안 검증 로직

### Integration Tests
- Moodle API 연동 테스트
- 데이터베이스 CRUD 테스트
- 전체 워크플로우 테스트

### UI Tests
- 폭죽 애니메이션 렌더링
- 사용자 입력 처리
- 반응형 디자인 테스트

## 13. 배포 및 운영

### 배포 환경
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7과 동일 서버 또는 별도 서버

### 모니터링
- 에러 로그 수집
- 사용자 활동 추적
- 성능 메트릭 측정

## 14. 향후 개선 방향

### Phase 2
- 다양한 애니메이션 테마 (꽃, 별, 물방울 등)
- 난이도별 힌트 시스템
- 리더보드 및 업적 시스템
- 음향 효과 추가

### Phase 3
- 모바일 네이티브 앱 버전
- 협동 학습 모드
- AI 기반 난이도 조절
- 다국어 지원

---

**문서 버전**: 1.0.0
**작성일**: 2025-11-18
**상태**: 설계 완료, 구현 준비
