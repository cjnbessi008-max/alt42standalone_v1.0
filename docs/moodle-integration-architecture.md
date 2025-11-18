# Moodle LMS 통합 아키텍처: 학생 기반 개념 연결망 자동 생성

## 1. 시스템 개요

Moodle 3.7 LMS와 통합하여 학생들의 학습 활동을 분석하고, 개념 간 연결망을 자동으로 생성하는 시스템입니다.

### 기술 스택
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Frontend**: JavaScript (D3.js for visualization)

## 2. 아키텍처 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Courses    │  │  Activities  │  │  Gradebook   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────▼─────────────────────────┐      │
│  │     Concept Network Block Plugin                 │      │
│  │  (blocks/concept_network/)                       │      │
│  │  ┌──────────────────────────────────────────┐   │      │
│  │  │  Data Collector (Student Activity)       │   │      │
│  │  └──────────────┬───────────────────────────┘   │      │
│  │  ┌──────────────▼───────────────────────────┐   │      │
│  │  │  Concept Network Generator               │   │      │
│  │  │  - Activity Analysis                     │   │      │
│  │  │  - Concept Extraction                    │   │      │
│  │  │  - Relationship Mapping                  │   │      │
│  │  └──────────────┬───────────────────────────┘   │      │
│  │  ┌──────────────▼───────────────────────────┐   │      │
│  │  │  Network Visualization (D3.js)           │   │      │
│  │  └──────────────────────────────────────────┘   │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 5.7 Database                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  mdl_concept_network                                 │  │
│  │  - id, course_id, student_id, concept_graph (JSON)   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  mdl_concept_nodes                                   │  │
│  │  - id, network_id, concept_name, mastery_level       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  mdl_concept_edges                                   │  │
│  │  - id, network_id, source_id, target_id, strength    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  mdl_student_concept_progress                        │  │
│  │  - id, student_id, concept_id, attempts, score       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 3. 핵심 컴포넌트

### 3.1 Data Collector (데이터 수집기)
학생의 Moodle 활동 데이터를 수집합니다:
- Quiz 시도 및 점수
- Assignment 제출 및 성과
- Forum 참여 및 키워드 분석
- 리소스 접근 패턴
- 시간 소비 패턴

### 3.2 Concept Network Generator (개념 연결망 생성기)
학생 활동을 기반으로 개념 네트워크를 생성합니다:

**알고리즘 단계:**
1. **개념 추출 (Concept Extraction)**
   - 퀴즈/과제의 태그 및 메타데이터 분석
   - 학습 목표 (Learning Objectives) 파싱
   - 교사가 정의한 개념 맵 활용

2. **학습 패턴 분석 (Learning Pattern Analysis)**
   - 학생이 특정 개념을 얼마나 자주 접했는지
   - 개념별 성취도 (정답률, 점수)
   - 개념 학습 순서

3. **관계 매핑 (Relationship Mapping)**
   - 선행 학습 관계 (Prerequisite): A → B (A를 먼저 학습)
   - 유사성 관계 (Similarity): 동시에 자주 등장하는 개념
   - 난이도 관계 (Difficulty): 학생의 성취도 기반
   - 시간적 관계 (Temporal): 학습 시간 순서

4. **네트워크 가중치 계산 (Edge Weight Calculation)**
   - 관계 강도 = f(동시 출현 빈도, 시간적 근접성, 성취도 상관관계)
   - 정규화: 0.0 ~ 1.0

### 3.3 Visualization Component (시각화 컴포넌트)
D3.js를 사용한 인터랙티브 네트워크 시각화:
- **노드 (Nodes)**: 개념
  - 크기: 학생의 해당 개념 숙달도
  - 색상: 성취 수준 (빨강 → 노랑 → 초록)
- **엣지 (Edges)**: 개념 간 관계
  - 두께: 관계 강도
  - 타입: 선행 관계, 유사 관계 등

## 4. 데이터베이스 스키마 (MySQL 5.7)

### 4.1 mdl_concept_network
코스별/학생별 개념 네트워크 메타데이터

```sql
CREATE TABLE mdl_concept_network (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    network_data LONGTEXT DEFAULT NULL COMMENT 'JSON representation of network',
    last_updated BIGINT(10) UNSIGNED NOT NULL,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY mdl_concnetw_coustu_uix (course_id, student_id),
    KEY mdl_concnetw_cou_ix (course_id),
    KEY mdl_concnetw_stu_ix (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 mdl_concept_nodes
개념 노드 정보

```sql
CREATE TABLE mdl_concept_nodes (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    network_id BIGINT(10) UNSIGNED NOT NULL,
    concept_name VARCHAR(255) NOT NULL,
    concept_type VARCHAR(50) DEFAULT 'general' COMMENT 'general, skill, knowledge, practice',
    mastery_level DECIMAL(5,2) DEFAULT 0.00 COMMENT '0.00 to 100.00',
    total_attempts INT(11) DEFAULT 0,
    successful_attempts INT(11) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    first_encountered BIGINT(10) UNSIGNED DEFAULT NULL,
    last_practiced BIGINT(10) UNSIGNED DEFAULT NULL,
    metadata LONGTEXT DEFAULT NULL COMMENT 'Additional JSON metadata',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY mdl_concnod_net_ix (network_id),
    KEY mdl_concnod_con_ix (concept_name),
    CONSTRAINT mdl_concnod_net_fk FOREIGN KEY (network_id)
        REFERENCES mdl_concept_network(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 mdl_concept_edges
개념 간 관계 (엣지)

```sql
CREATE TABLE mdl_concept_edges (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    network_id BIGINT(10) UNSIGNED NOT NULL,
    source_node_id BIGINT(10) UNSIGNED NOT NULL,
    target_node_id BIGINT(10) UNSIGNED NOT NULL,
    relationship_type VARCHAR(50) NOT NULL COMMENT 'prerequisite, similar, temporal, difficulty',
    strength DECIMAL(5,2) DEFAULT 0.00 COMMENT '0.00 to 1.00',
    co_occurrence_count INT(11) DEFAULT 0,
    temporal_distance BIGINT(10) DEFAULT 0 COMMENT 'Time difference in seconds',
    metadata LONGTEXT DEFAULT NULL COMMENT 'Additional JSON metadata',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY mdl_concedg_net_ix (network_id),
    KEY mdl_concedg_sou_ix (source_node_id),
    KEY mdl_concedg_tar_ix (target_node_id),
    KEY mdl_concedg_rel_ix (relationship_type),
    CONSTRAINT mdl_concedg_net_fk FOREIGN KEY (network_id)
        REFERENCES mdl_concept_network(id) ON DELETE CASCADE,
    CONSTRAINT mdl_concedg_sou_fk FOREIGN KEY (source_node_id)
        REFERENCES mdl_concept_nodes(id) ON DELETE CASCADE,
    CONSTRAINT mdl_concedg_tar_fk FOREIGN KEY (target_node_id)
        REFERENCES mdl_concept_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.4 mdl_student_concept_progress
학생별 개념 학습 진행도 상세 기록

```sql
CREATE TABLE mdl_student_concept_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    concept_node_id BIGINT(10) UNSIGNED NOT NULL,
    activity_id BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'Reference to quiz/assignment',
    activity_type VARCHAR(50) DEFAULT NULL COMMENT 'quiz, assign, forum, etc',
    attempt_number INT(11) DEFAULT 1,
    score DECIMAL(10,2) DEFAULT NULL,
    max_score DECIMAL(10,2) DEFAULT NULL,
    time_spent INT(11) DEFAULT 0 COMMENT 'Seconds spent',
    is_correct TINYINT(1) DEFAULT 0,
    timestamp BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY mdl_studconprog_stu_ix (student_id),
    KEY mdl_studconprog_cou_ix (course_id),
    KEY mdl_studconprog_con_ix (concept_node_id),
    KEY mdl_studconprog_tim_ix (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.5 mdl_concept_mappings
Quiz/Assignment와 개념 매핑 (교사가 설정 또는 자동 추출)

```sql
CREATE TABLE mdl_concept_mappings (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    activity_id BIGINT(10) UNSIGNED NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    concept_name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.00 COMMENT 'Importance weight',
    is_auto_generated TINYINT(1) DEFAULT 0,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY mdl_concmap_cou_ix (course_id),
    KEY mdl_concmap_act_ix (activity_id),
    KEY mdl_concmap_con_ix (concept_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 5. API 엔드포인트

### 5.1 REST API (Moodle Web Services)

```php
// /blocks/concept_network/ajax.php

// Get concept network for a student
GET /blocks/concept_network/ajax.php?action=get_network
    &courseid={course_id}
    &studentid={student_id}
    &sesskey={sesskey}

// Update concept network (regenerate)
POST /blocks/concept_network/ajax.php?action=regenerate_network
    &courseid={course_id}
    &studentid={student_id}
    &sesskey={sesskey}

// Get student progress for specific concept
GET /blocks/concept_network/ajax.php?action=get_concept_progress
    &courseid={course_id}
    &studentid={student_id}
    &conceptname={concept_name}
    &sesskey={sesskey}

// Add/Update concept mapping
POST /blocks/concept_network/ajax.php?action=update_mapping
    &courseid={course_id}
    &activityid={activity_id}
    &activitytype={type}
    &conceptname={concept}
    &weight={weight}
    &sesskey={sesskey}
```

## 6. Moodle Block Plugin 구조

```
blocks/concept_network/
├── version.php                 # Plugin version and dependencies
├── block_concept_network.php   # Main block class
├── db/
│   ├── access.php             # Capability definitions
│   └── install.xml            # Database schema installation
├── lang/
│   ├── en/
│   │   └── block_concept_network.php  # English strings
│   └── ko/
│       └── block_concept_network.php  # Korean strings
├── classes/
│   ├── data_collector.php     # Collect student activity data
│   ├── concept_extractor.php  # Extract concepts from activities
│   ├── network_generator.php  # Generate concept network
│   ├── network_analyzer.php   # Analyze network properties
│   └── output/
│       └── network_view.php   # Renderable for visualization
├── amd/
│   └── src/
│       ├── network_visualizer.js  # D3.js visualization (AMD module)
│       └── network_controls.js    # User controls
├── styles.css                 # Block styling
├── ajax.php                   # AJAX endpoint handler
├── view.php                   # Full-page network view
└── settings.php               # Admin settings
```

## 7. 개념 네트워크 생성 알고리즘 (상세)

### 7.1 입력 데이터
- 학생 ID
- 코스 ID
- 시간 범위 (기본: 전체 기간)

### 7.2 처리 단계

**Step 1: 활동 데이터 수집**
```sql
-- Quiz attempts
SELECT q.id, q.name, qa.sumgrades, qa.timefinish
FROM mdl_quiz_attempts qa
JOIN mdl_quiz q ON q.id = qa.quiz
WHERE qa.userid = :studentid AND q.course = :courseid

-- Assignment submissions
SELECT a.id, a.name, ag.grade, as.timemodified
FROM mdl_assign_submission as
JOIN mdl_assign a ON a.id = as.assignment
LEFT JOIN mdl_assign_grades ag ON ag.assignment = a.id AND ag.userid = as.userid
WHERE as.userid = :studentid AND a.course = :courseid
```

**Step 2: 개념 추출 및 매핑**
- 각 활동에 연결된 개념 검색 (mdl_concept_mappings)
- 태그 기반 자동 추출 (활동 태그 분석)
- Learning outcomes 파싱

**Step 3: 노드 생성**
```php
foreach ($concepts as $concept) {
    $node = [
        'name' => $concept,
        'mastery_level' => calculate_mastery($student_id, $concept),
        'attempts' => count_attempts($student_id, $concept),
        'avg_score' => avg_score($student_id, $concept)
    ];
}
```

**Step 4: 엣지 생성**
```php
foreach ($concept_pairs as [$concept_a, $concept_b]) {
    $strength = calculate_relationship_strength(
        $student_id,
        $concept_a,
        $concept_b,
        $activities
    );

    if ($strength > 0.1) {  // Threshold
        $edge = [
            'source' => $concept_a,
            'target' => $concept_b,
            'strength' => $strength,
            'type' => determine_relationship_type($concept_a, $concept_b)
        ];
    }
}
```

**Step 5: 네트워크 저장**
- mdl_concept_nodes 테이블에 노드 저장
- mdl_concept_edges 테이블에 엣지 저장
- mdl_concept_network 테이블에 JSON 요약 저장

### 7.3 관계 강도 계산 공식

```
strength = w1 * co_occurrence_score
         + w2 * temporal_proximity_score
         + w3 * performance_correlation_score

where:
- co_occurrence_score = (동시 출현 횟수) / (총 활동 수)
- temporal_proximity_score = 1 / (1 + log(시간 차이))
- performance_correlation_score = pearson_correlation(성적_A, 성적_B)
- w1, w2, w3 = 가중치 (기본: 0.4, 0.3, 0.3)
```

## 8. 시각화 기능

### 8.1 네트워크 레이아웃
- Force-directed graph (D3.js force simulation)
- Hierarchical layout (선행 관계 기반)
- Circular layout (난이도 기반)

### 8.2 인터랙티브 기능
- 노드 클릭 → 개념 상세 정보 표시
- 노드 호버 → 관련 활동 목록
- 엣지 클릭 → 관계 유형 및 강도 표시
- 줌/팬 기능
- 필터링 (개념 타입, 숙달도 범위)

### 8.3 색상 코딩
```javascript
const masteryColorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(['#ff4444', '#ffbb33', '#00C851']);  // Red → Yellow → Green
```

## 9. 배포 및 설치

### 9.1 설치 단계
1. 플러그인 파일을 Moodle의 `blocks/concept_network/` 디렉토리에 복사
2. Moodle 관리자로 로그인
3. Site administration → Notifications 방문
4. 플러그인 설치 진행 (데이터베이스 테이블 자동 생성)
5. 코스 편집 모드에서 "Concept Network" 블록 추가

### 9.2 시스템 요구사항
- Moodle 3.7 이상
- PHP 7.1.9 이상
- MySQL 5.7 이상
- 브라우저: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 10. 성능 최적화

### 10.1 캐싱 전략
- 생성된 네트워크를 Moodle 캐시에 저장 (TTL: 1시간)
- 활동 데이터 변경 시 캐시 무효화

### 10.2 백그라운드 처리
- 네트워크 재생성을 scheduled task로 실행 (매일 자정)
- 대용량 데이터 처리 시 chunking

### 10.3 인덱싱
- 모든 외래 키에 인덱스 생성
- timestamp 컬럼 인덱스 (시간 범위 쿼리 최적화)

## 11. 보안 고려사항

### 11.1 접근 제어
- Capability 정의:
  - `block/concept_network:view` - 자신의 네트워크 보기
  - `block/concept_network:viewall` - 모든 학생 네트워크 보기 (교사)
  - `block/concept_network:manage` - 개념 매핑 관리 (교사)

### 11.2 데이터 보호
- 모든 AJAX 요청에 sesskey 검증
- SQL injection 방지 (prepared statements)
- XSS 방지 (출력 시 s() 함수 사용)

## 12. 향후 확장 계획

### 12.1 AI 기반 개념 추출
- Claude API 통합하여 활동 내용에서 자동으로 개념 추출
- 자연어 처리로 포럼 토론에서 개념 식별

### 12.2 예측 분석
- 다음 학습할 개념 추천
- 어려움을 겪을 가능성이 있는 개념 예측

### 12.3 그룹 비교
- 학급 평균 개념 네트워크
- 학생 간 학습 경로 비교

### 12.4 개념 온톨로지 통합
- 표준 교육 온톨로지와 연결 (Common Core, K-12 CS Framework)
- OWL/RDF 형식 지원
