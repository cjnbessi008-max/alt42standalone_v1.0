# Data Shuffle Feature Design Document

## 1. Overview

**Purpose**: 문제와 답안을 학생별로 고르게 섞어 시험의 공정성을 유지하면서 부정행위를 방지

**Key Requirements**:
- 각 학생마다 다른 문제 순서 제공
- 각 문제의 답안 선택지도 무작위 섞기
- 동일 학생은 항상 같은 순서로 문제 접근 (세션 일관성)
- 모든 학생이 동일한 문제 세트 보장 (순서만 다름)
- Moodle 3.7 LMS 연동

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Quiz Module  │  │ Questions DB │  │ Student Data │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Moodle API      │
                    │  Connector       │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼──────────┐              ┌──────────▼─────────┐
│  Shuffle Engine    │              │  MySQL Database    │
│  (PHP 7.1.9)       │◄────────────►│  (MySQL 5.7)       │
│                    │              │                    │
│  - Fisher-Yates    │              │  - shuffle_seeds   │
│  - Seeded Random   │              │  - shuffle_history │
│  - Cache Manager   │              │  - session_data    │
└─────────┬──────────┘              └────────────────────┘
          │
          │ JSON API
          │
┌─────────▼──────────────────────────────────────────────┐
│            Frontend Web Application                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Main Desktop View (Teacher/Admin)        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Virtual Smartphone Display (Bottom Right)       │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Student Quiz View (Shuffled Questions)    │  │  │
│  │  │  - Question N of M                         │  │  │
│  │  │  - Shuffled answer choices (A, B, C, D)    │  │  │
│  │  │  - Navigation buttons                      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema (MySQL 5.7)

### 3.1 `shuffle_seeds` Table
학생별 시험별 shuffle seed 저장

```sql
CREATE TABLE shuffle_seeds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    question_seed VARCHAR(64) NOT NULL COMMENT 'Seed for question order shuffle',
    answer_seed VARCHAR(64) NOT NULL COMMENT 'Seed for answer choices shuffle',
    session_id VARCHAR(128) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    UNIQUE KEY unique_student_quiz (student_id, quiz_id),
    INDEX idx_session (session_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores shuffle seeds for consistent randomization';
```

### 3.2 `shuffle_history` Table
Shuffle 이력 추적 (감사 로그)

```sql
CREATE TABLE shuffle_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    original_position INT NOT NULL COMMENT 'Original question position',
    shuffled_position INT NOT NULL COMMENT 'Shuffled position for this student',
    answer_mapping JSON COMMENT 'Original to shuffled answer mapping: {"A":2, "B":1, "C":3, "D":0}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_quiz (student_id, quiz_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit trail for shuffle operations';
```

### 3.3 `shuffle_config` Table
Quiz별 shuffle 설정

```sql
CREATE TABLE shuffle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL UNIQUE,
    shuffle_questions BOOLEAN DEFAULT TRUE COMMENT 'Enable question order shuffling',
    shuffle_answers BOOLEAN DEFAULT TRUE COMMENT 'Enable answer choice shuffling',
    seed_strategy ENUM('student_id', 'session', 'timestamp', 'combined') DEFAULT 'combined',
    cache_duration INT DEFAULT 3600 COMMENT 'Cache duration in seconds',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Shuffle configuration per quiz';
```

---

## 4. Shuffle Algorithm

### 4.1 Fisher-Yates Shuffle (Knuth Shuffle)
**시간 복잡도**: O(n)
**공간 복잡도**: O(1) (in-place)

```php
/**
 * Deterministic Fisher-Yates shuffle using seeded random
 *
 * @param array $items Items to shuffle
 * @param string $seed Seed for reproducible randomization
 * @return array Shuffled items
 */
function seededShuffle($items, $seed) {
    $count = count($items);
    if ($count <= 1) return $items;

    // Seed the random generator
    mt_srand(crc32($seed));

    // Fisher-Yates shuffle
    for ($i = $count - 1; $i > 0; $i--) {
        $j = mt_rand(0, $i);
        // Swap
        $temp = $items[$i];
        $items[$i] = $items[$j];
        $items[$j] = $temp;
    }

    // Reset random seed to prevent side effects
    mt_srand();

    return $items;
}
```

### 4.2 Seed Generation Strategy

**Combined Seed Formula**:
```
seed = SHA256(student_id + quiz_id + quiz_start_time + salt)
```

**Properties**:
- **Deterministic**: 같은 입력 → 같은 출력
- **Unique**: 학생/시험 조합마다 다른 seed
- **Unpredictable**: 학생이 다른 학생의 순서를 예측 불가
- **Consistent**: 세션 내에서 동일한 순서 유지

---

## 5. API Endpoints

### 5.1 Get Shuffled Quiz
**Endpoint**: `GET /api/v1/quiz/{quiz_id}/shuffled`

**Request**:
```http
GET /api/v1/quiz/123/shuffled?student_id=456
Authorization: Bearer {moodle_session_token}
```

**Response**:
```json
{
  "quiz_id": 123,
  "student_id": 456,
  "total_questions": 10,
  "questions": [
    {
      "question_id": 789,
      "original_position": 5,
      "shuffled_position": 1,
      "question_text": "What is 2+2?",
      "question_type": "multiple_choice",
      "answers": [
        {
          "answer_id": "C",
          "original_position": 2,
          "shuffled_position": 0,
          "text": "4",
          "is_correct": true
        },
        {
          "answer_id": "A",
          "original_position": 0,
          "shuffled_position": 1,
          "text": "3"
        },
        {
          "answer_id": "D",
          "original_position": 3,
          "shuffled_position": 2,
          "text": "5"
        },
        {
          "answer_id": "B",
          "original_position": 1,
          "shuffled_position": 3,
          "text": "22"
        }
      ]
    }
  ],
  "shuffle_seed": "a3f5c9e2b1d4...",
  "cached": false,
  "expires_at": "2025-11-18T15:30:00Z"
}
```

### 5.2 Submit Answer
**Endpoint**: `POST /api/v1/quiz/{quiz_id}/submit`

**Request**:
```json
{
  "student_id": 456,
  "question_id": 789,
  "selected_answer_id": "C",
  "shuffled_position": 1,
  "time_spent": 45
}
```

**Response**:
```json
{
  "success": true,
  "is_correct": true,
  "original_answer_id": "C",
  "feedback": "Correct! 2+2=4"
}
```

### 5.3 Admin: View Shuffle Mapping
**Endpoint**: `GET /api/v1/admin/quiz/{quiz_id}/shuffle-map`

**Response**:
```json
{
  "quiz_id": 123,
  "students": [
    {
      "student_id": 456,
      "student_name": "Kim Minho",
      "question_order": [5, 2, 8, 1, 9, 3, 7, 4, 10, 6],
      "seed": "a3f5c9e2b1d4..."
    }
  ]
}
```

---

## 6. Frontend Implementation

### 6.1 Virtual Smartphone Display (CSS)

```css
.smartphone-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 375px;
    height: 667px;
    background: #1a1a1a;
    border-radius: 40px;
    padding: 60px 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.smartphone-screen {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 20px;
    overflow-y: auto;
    padding: 20px;
}

.question-card {
    margin-bottom: 30px;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### 6.2 Question Display Component (JavaScript)

```javascript
class ShuffledQuizRenderer {
    constructor(quizData) {
        this.quizData = quizData;
        this.currentQuestionIndex = 0;
    }

    renderQuestion(questionIndex) {
        const question = this.quizData.questions[questionIndex];

        const html = `
            <div class="question-card">
                <div class="question-header">
                    <span class="question-number">Question ${questionIndex + 1} of ${this.quizData.total_questions}</span>
                </div>
                <div class="question-text">${question.question_text}</div>
                <div class="answers-container">
                    ${question.answers.map((answer, idx) => `
                        <div class="answer-option" data-answer-id="${answer.answer_id}">
                            <input type="radio" name="answer" id="answer-${idx}" value="${answer.answer_id}">
                            <label for="answer-${idx}">
                                <span class="answer-letter">${String.fromCharCode(65 + idx)}</span>
                                <span class="answer-text">${answer.text}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="navigation-buttons">
                    <button class="btn-prev" ${questionIndex === 0 ? 'disabled' : ''}>Previous</button>
                    <button class="btn-next">Next</button>
                </div>
            </div>
        `;

        document.querySelector('.smartphone-screen').innerHTML = html;
    }
}
```

---

## 7. Moodle Integration

### 7.1 Moodle External Functions (mdl_external_functions)

```php
// File: local/datashuffle/externallib.php

class local_datashuffle_external extends external_api {

    /**
     * Get quiz questions from Moodle
     */
    public static function get_quiz_questions($quizid) {
        global $DB;

        // Validate parameters
        $params = self::validate_parameters(
            self::get_quiz_questions_parameters(),
            array('quizid' => $quizid)
        );

        // Get quiz questions
        $questions = $DB->get_records_sql("
            SELECT q.id, q.questiontext, q.qtype, qa.answer, qa.fraction
            FROM {quiz_slots} qs
            JOIN {question} q ON q.id = qs.questionid
            LEFT JOIN {question_answers} qa ON qa.question = q.id
            WHERE qs.quizid = ?
            ORDER BY qs.slot, qa.id
        ", array($quizid));

        return $questions;
    }
}
```

### 7.2 Authentication Bridge

```php
// File: api/auth/moodle_sso.php

class MoodleSSO {
    private $moodle_url;
    private $moodle_token;

    public function validateSession($session_token) {
        // Call Moodle's core_webservice_get_site_info
        $params = array(
            'wstoken' => $this->moodle_token,
            'wsfunction' => 'core_webservice_get_site_info',
            'moodlewsrestformat' => 'json'
        );

        $response = $this->callMoodleAPI($params);

        return isset($response['userid']);
    }

    private function callMoodleAPI($params) {
        $url = $this->moodle_url . '/webservice/rest/server.php';

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}
```

---

## 8. Performance Optimization

### 8.1 Caching Strategy

**Redis Cache** (optional, fallback to MySQL):
```
Key: shuffle:quiz:{quiz_id}:student:{student_id}
Value: JSON of shuffled questions
TTL: Quiz duration + 1 hour
```

**MySQL Query Optimization**:
```sql
-- Add composite index for fast lookup
CREATE INDEX idx_shuffle_lookup
ON shuffle_seeds(quiz_id, student_id, expires_at);

-- Partition shuffle_history by date for faster queries
ALTER TABLE shuffle_history
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 8.2 Load Testing Targets

- **Concurrent Students**: 500 students
- **Quiz Load Time**: < 2 seconds
- **Shuffle Computation**: < 100ms per quiz
- **Database Query**: < 50ms
- **API Response**: < 200ms (95th percentile)

---

## 9. Security Considerations

### 9.1 Shuffle Integrity

**Problem**: 학생이 다른 student_id로 요청해서 답안 순서 유추 가능

**Solution**:
```php
// Validate student identity
if ($session->student_id !== $request->student_id) {
    throw new UnauthorizedException("Student ID mismatch");
}

// Rate limiting
if ($this->getRequestCount($student_id, $time_window) > $max_requests) {
    throw new TooManyRequestsException("Rate limit exceeded");
}
```

### 9.2 Answer Verification

```php
// Don't expose correct answers in API response
// Verify on server side only
function verifyAnswer($student_id, $question_id, $selected_answer_id) {
    // Get original answer mapping
    $mapping = $this->getAnswerMapping($student_id, $question_id);

    // Convert shuffled answer back to original
    $original_answer_id = $mapping[$selected_answer_id];

    // Check correctness against original
    return $this->isCorrectAnswer($question_id, $original_answer_id);
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```php
class ShuffleAlgorithmTest extends PHPUnit_Framework_TestCase {

    public function testDeterministicShuffle() {
        $items = [1, 2, 3, 4, 5];
        $seed = "test_seed_123";

        $result1 = seededShuffle($items, $seed);
        $result2 = seededShuffle($items, $seed);

        // Same seed should produce same result
        $this->assertEquals($result1, $result2);
    }

    public function testUniqueShuffle() {
        $items = [1, 2, 3, 4, 5];

        $result1 = seededShuffle($items, "seed1");
        $result2 = seededShuffle($items, "seed2");

        // Different seeds should (likely) produce different results
        $this->assertNotEquals($result1, $result2);
    }

    public function testAllItemsPresent() {
        $items = [1, 2, 3, 4, 5];
        $result = seededShuffle($items, "test");

        sort($result);
        $this->assertEquals($items, $result);
    }
}
```

### 10.2 Integration Tests

- Moodle API 연동 테스트
- 동시 학생 접속 시나리오
- 세션 만료 처리
- 답안 제출 및 검증

---

## 11. Deployment Checklist

- [ ] MySQL 5.7 데이터베이스 설정
- [ ] PHP 7.1.9 환경 구성
- [ ] Moodle 3.7 web service 활성화
- [ ] API 토큰 생성 및 권한 설정
- [ ] Database migration 실행
- [ ] 초기 데이터 seeding
- [ ] SSL/TLS 인증서 설정
- [ ] CORS 설정 (Moodle 도메인 허용)
- [ ] 로그 모니터링 설정
- [ ] 백업 스크립트 설정

---

## 12. Future Enhancements

1. **Adaptive Shuffling**: 학생 실력에 따라 문제 난이도 조정
2. **Group-based Shuffling**: 그룹별로 다른 문제 풀 할당
3. **Real-time Analytics**: 교수자용 실시간 대시보드
4. **Mobile App**: 네이티브 iOS/Android 앱
5. **Offline Mode**: 인터넷 없이도 문제 풀이 가능
6. **AI Proctoring**: 부정행위 감지 (얼굴 인식, 시선 추적)

---

## 13. References

- [Fisher-Yates Shuffle Algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
- [Moodle External Functions API](https://docs.moodle.org/dev/External_functions_API)
- [PHP mt_rand() Documentation](https://www.php.net/manual/en/function.mt-rand.php)
- [MySQL 5.7 JSON Support](https://dev.mysql.com/doc/refman/5.7/en/json.html)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: AI Education System Team
