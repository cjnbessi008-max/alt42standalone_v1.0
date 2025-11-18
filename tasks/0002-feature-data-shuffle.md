# Feature Specification: Data Shuffle

## 1. Overview

**Feature Name**: Data Shuffle
**Description**: 문제와 답안을 고르게 섞어 학생들에게 제공하는 기능
**Purpose**: 시험/평가의 무결성을 보장하고, 학생 간 부정행위 방지
**Priority**: High
**Status**: In Development

---

## 2. Functional Requirements

### 2.1 Core Functionality

#### 문제 순서 셔플 (Question Shuffle)
- **FR-001**: 시스템은 문제 세트의 순서를 무작위로 섞을 수 있어야 함
- **FR-002**: 셔플된 순서는 각 학생마다 다르게 적용됨
- **FR-003**: 동일 학생이 재접속 시 동일한 순서를 보장해야 함

#### 답안 선택지 셔플 (Answer Choice Shuffle)
- **FR-004**: 객관식 문제의 선택지 순서를 무작위로 섞을 수 있어야 함
- **FR-005**: 정답 매핑은 자동으로 업데이트되어야 함
- **FR-006**: "모두 맞음", "모두 틀림" 등의 특수 선택지는 셔플 대상에서 제외 가능해야 함

#### 균등 분포 (Uniform Distribution)
- **FR-007**: 셔플 알고리즘은 모든 순열이 동일한 확률로 나타나야 함 (Fisher-Yates)
- **FR-008**: 시드 기반 난수 생성으로 재현 가능성 보장

### 2.2 Configuration Options

#### 교사 설정 (Teacher Configuration)
- **FR-009**: 문제 셔플 활성화/비활성화 옵션
- **FR-010**: 답안 셔플 활성화/비활성화 옵션
- **FR-011**: 문제 유형별 셔플 규칙 설정
  - 객관식(MCQ): 선택지 셔플
  - 주관식(Short Answer): 셔플 불필요
  - True/False: 선택지 고정 또는 셔플

#### 고급 설정
- **FR-012**: 특정 문제 그룹을 함께 유지 (순서는 바뀌지만 그룹은 유지)
- **FR-013**: 난이도 순서 유지 옵션 (쉬운 문제 → 어려운 문제)
- **FR-014**: 섹션별 독립 셔플 (Section A, B, C 각각 내부 셔플)

---

## 3. Technical Specifications

### 3.1 Architecture

```
┌─────────────────┐
│  Teacher UI     │  (문제 세트 구성 + 셔플 설정)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Shuffle Configuration      │
│  - Question Shuffle: ON/OFF │
│  - Answer Shuffle: ON/OFF   │
│  - Seed Strategy: AUTO      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Shuffle Service            │
│  - Generate Student Seed    │
│  - Apply Fisher-Yates       │
│  - Map Answer Keys          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Student View   │  (셔플된 문제/답안 표시)
└─────────────────┘
```

### 3.2 Data Model

#### Database Schema

```sql
-- 문제 세트 설정
CREATE TABLE question_sets (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES modules(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_answers BOOLEAN DEFAULT FALSE,
    shuffle_strategy ENUM('random', 'seeded', 'group_preserve') DEFAULT 'seeded',
    created_by UUID REFERENCES teachers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 문제 정보
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    question_set_id UUID REFERENCES question_sets(id),
    question_text TEXT NOT NULL,
    question_type ENUM('mcq', 'true_false', 'short_answer', 'essay') NOT NULL,
    original_order INT NOT NULL,  -- 원본 순서
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),
    section VARCHAR(50),  -- 섹션별 그룹핑
    group_id UUID,  -- 함께 유지할 문제 그룹
    metadata JSONB,  -- 추가 설정
    created_at TIMESTAMP DEFAULT NOW()
);

-- 답안 선택지
CREATE TABLE answer_choices (
    id UUID PRIMARY KEY,
    question_id UUID REFERENCES questions(id),
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    original_order INT NOT NULL,  -- 원본 순서 (A, B, C, D)
    is_fixed BOOLEAN DEFAULT FALSE,  -- 셔플 제외 여부 ("없음", "모두 맞음" 등)
    created_at TIMESTAMP DEFAULT NOW()
);

-- 학생별 셔플 매핑
CREATE TABLE student_shuffle_maps (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    question_set_id UUID REFERENCES question_sets(id),
    shuffle_seed BIGINT NOT NULL,  -- 셔플 시드
    question_order JSONB NOT NULL,  -- [q3, q1, q5, q2, q4]
    answer_order_map JSONB NOT NULL,  -- {q1: [2,0,3,1], q2: [1,3,0,2]}
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, question_set_id)
);

-- 학생 답안 제출
CREATE TABLE student_answers (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    question_id UUID REFERENCES questions(id),
    shuffle_map_id UUID REFERENCES student_shuffle_maps(id),
    selected_choice_id UUID REFERENCES answer_choices(id),  -- 실제 선택한 답안 ID
    displayed_position INT,  -- 학생에게 표시된 위치 (셔플 후)
    answer_text TEXT,  -- 주관식 답안
    is_correct BOOLEAN,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_questions_set ON questions(question_set_id, original_order);
CREATE INDEX idx_answers_question ON answer_choices(question_id, original_order);
CREATE INDEX idx_shuffle_student_set ON student_shuffle_maps(student_id, question_set_id);
CREATE INDEX idx_student_answers_map ON student_answers(shuffle_map_id);
```

### 3.3 Shuffle Algorithms

#### Fisher-Yates Shuffle (균등 분포 보장)

```javascript
/**
 * Fisher-Yates Shuffle Algorithm
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 *
 * @param {Array} array - 셔플할 배열
 * @param {number} seed - 난수 시드 (재현성 보장)
 * @returns {Array} 셔플된 배열
 */
function fisherYatesShuffle(array, seed) {
    const rng = new SeededRandom(seed);
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Seeded Random Number Generator (LCG)
 * Linear Congruential Generator
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}
```

#### 시드 생성 전략

```javascript
/**
 * 학생별 고유 시드 생성
 *
 * @param {string} studentId - 학생 UUID
 * @param {string} questionSetId - 문제 세트 UUID
 * @returns {number} 시드 값
 */
function generateShuffleSeed(studentId, questionSetId) {
    const combined = `${studentId}-${questionSetId}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
}
```

### 3.4 API Endpoints

#### Backend API (Node.js/Express)

```javascript
// 문제 세트 생성 (교사)
POST /api/question-sets
Request Body:
{
    "module_id": "uuid",
    "name": "중간고사 1회",
    "shuffle_questions": true,
    "shuffle_answers": true,
    "shuffle_strategy": "seeded"
}

// 문제 세트에 문제 추가
POST /api/question-sets/:id/questions
Request Body:
{
    "question_text": "다음 중 옳은 것은?",
    "question_type": "mcq",
    "original_order": 1,
    "difficulty_level": 3,
    "section": "A",
    "choices": [
        {"text": "선택지 1", "is_correct": false, "original_order": 0},
        {"text": "선택지 2", "is_correct": true, "original_order": 1},
        {"text": "선택지 3", "is_correct": false, "original_order": 2},
        {"text": "선택지 4", "is_correct": false, "original_order": 3}
    ]
}

// 학생용 셔플된 문제 세트 조회
GET /api/question-sets/:id/student-view
Headers: Authorization: Bearer <student_token>
Response:
{
    "question_set_id": "uuid",
    "shuffle_map_id": "uuid",
    "shuffle_seed": 12345678,
    "questions": [
        {
            "id": "q3-uuid",
            "displayed_position": 1,
            "question_text": "...",
            "choices": [
                {
                    "id": "c2-uuid",
                    "displayed_position": "A",
                    "text": "선택지 3"
                },
                {
                    "id": "c1-uuid",
                    "displayed_position": "B",
                    "text": "선택지 2"  // 정답이지만 B로 표시됨
                }
            ]
        }
    ]
}

// 답안 제출
POST /api/question-sets/:id/submit
Request Body:
{
    "shuffle_map_id": "uuid",
    "answers": [
        {
            "question_id": "uuid",
            "selected_choice_id": "uuid",  // 실제 선택지 ID
            "displayed_position": "B"  // 학생에게 표시된 위치
        }
    ]
}

// 채점 결과 조회
GET /api/question-sets/:id/results/:student_id
Response:
{
    "total_questions": 20,
    "correct_answers": 18,
    "score": 90.0,
    "details": [
        {
            "question_id": "uuid",
            "original_position": 5,
            "displayed_position": 1,
            "selected_answer": "B",
            "correct_answer": "B",  // 셔플 후 정답
            "original_correct": "C",  // 원본 정답
            "is_correct": true
        }
    ]
}
```

---

## 4. Implementation Plan

### Phase 1: Database Setup (Week 1)
- [x] Design database schema
- [ ] Create migration files
- [ ] Set up PostgreSQL database
- [ ] Create seed data for testing

### Phase 2: Backend Implementation (Week 2-3)
- [ ] Implement Shuffle Service
  - [ ] Fisher-Yates algorithm
  - [ ] Seeded RNG
  - [ ] Answer mapping logic
- [ ] Create REST API endpoints
- [ ] Unit tests for shuffle algorithms
- [ ] Integration tests for API

### Phase 3: Frontend Implementation (Week 4)
- [ ] Teacher UI: Question Set Builder
  - [ ] Shuffle configuration panel
  - [ ] Question/Answer editor
  - [ ] Preview mode
- [ ] Student UI: Quiz View
  - [ ] Display shuffled questions
  - [ ] Answer selection
  - [ ] Submit answers
- [ ] Results Dashboard

### Phase 4: Testing & Optimization (Week 5)
- [ ] End-to-end testing
- [ ] Performance testing (1000+ questions)
- [ ] Security audit (prevent answer key exposure)
- [ ] Accessibility compliance

---

## 5. Security Considerations

### 5.1 Answer Key Protection
- **SEC-001**: 정답 정보는 클라이언트로 전송하지 않음
- **SEC-002**: API는 선택지 ID만 전송, 정답 여부는 서버에서만 검증
- **SEC-003**: Shuffle seed는 서버에서 생성, 클라이언트는 결과만 수신

### 5.2 Integrity Verification
- **SEC-004**: 답안 제출 시 shuffle_map_id 검증
- **SEC-005**: 학생이 자신의 shuffle map만 접근 가능하도록 인증
- **SEC-006**: CSRF 토큰 및 rate limiting 적용

---

## 6. Performance Optimization

### 6.1 Caching Strategy
- Redis에 학생별 shuffle map 캐싱 (TTL: 시험 종료 시까지)
- 문제 세트 메타데이터 캐싱 (TTL: 1시간)

### 6.2 Database Optimization
- 인덱스 최적화 (student_id + question_set_id)
- JSONB 컬럼에 GIN 인덱스 적용

---

## 7. Testing Strategy

### 7.1 Unit Tests
```javascript
describe('Fisher-Yates Shuffle', () => {
    test('should produce uniform distribution', () => {
        const iterations = 100000;
        const array = [1, 2, 3, 4, 5];
        const positionCounts = {};

        for (let i = 0; i < iterations; i++) {
            const shuffled = fisherYatesShuffle(array, i);
            shuffled.forEach((value, index) => {
                const key = `${value}-${index}`;
                positionCounts[key] = (positionCounts[key] || 0) + 1;
            });
        }

        // 각 값이 각 위치에 나타날 확률은 1/5 = 20%
        // 오차범위 ±2%
        Object.values(positionCounts).forEach(count => {
            const probability = count / iterations;
            expect(probability).toBeCloseTo(0.2, 0.02);
        });
    });

    test('should be deterministic with same seed', () => {
        const array = [1, 2, 3, 4, 5];
        const result1 = fisherYatesShuffle(array, 12345);
        const result2 = fisherYatesShuffle(array, 12345);
        expect(result1).toEqual(result2);
    });
});
```

---

## 8. User Interface Design

### 8.1 Teacher Configuration Panel

```
┌─────────────────────────────────────────────┐
│ Question Set Configuration                  │
├─────────────────────────────────────────────┤
│                                             │
│ ☑ Shuffle Questions                         │
│   └─ 학생마다 다른 순서로 문제 표시         │
│                                             │
│ ☑ Shuffle Answer Choices                    │
│   └─ 객관식 선택지 순서 랜덤화              │
│                                             │
│ Shuffle Strategy:                           │
│   ● Seeded (Reproducible)                   │
│   ○ Pure Random                             │
│                                             │
│ Advanced Options:                           │
│   ☐ Preserve question groups                │
│   ☐ Maintain difficulty order               │
│   ☐ Section-based independent shuffle       │
│                                             │
└─────────────────────────────────────────────┘
```

### 8.2 Student Quiz View

```
┌─────────────────────────────────────────────┐
│ 중간고사 1회                                │
├─────────────────────────────────────────────┤
│                                             │
│ Question 1 of 20                            │
│                                             │
│ 다음 중 Python의 특징이 아닌 것은?          │
│                                             │
│ ○ A. 인터프리터 언어                        │
│ ○ B. 정적 타입 언어                         │
│ ○ C. 동적 타입 언어                         │
│ ○ D. 고수준 언어                            │
│                                             │
│ [Previous]  [Next]  [Submit]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 9. Acceptance Criteria

- [ ] 문제 순서가 학생마다 다르게 표시됨
- [ ] 선택지 순서가 무작위로 섞임
- [ ] 동일 학생은 재접속 시 같은 순서 유지
- [ ] 정답 채점이 정확하게 이루어짐
- [ ] 셔플 알고리즘이 균등 분포를 만족함 (통계적 검증)
- [ ] 100명 동시 접속 시 3초 이내 응답
- [ ] 정답 정보가 클라이언트에 노출되지 않음

---

## 10. Future Enhancements

- 문제 풀 기반 동적 문제 선택 (각 학생마다 다른 문제)
- 난이도 적응형 테스트 (Adaptive Testing)
- 문제 은행 (Question Bank) 관리
- 통계 분석 대시보드 (문제별 정답률, 변별도)
- LMS/Moodle 연동 (IMS QTI 표준)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-18 | Claude | Initial specification |
