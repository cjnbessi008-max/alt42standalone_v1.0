# Confidence Scoring System - Implementation Specification

## Overview
학생들이 각 학습 개념에 대한 자신감 수준을 직접 입력하고, 교사가 이를 모니터링할 수 있는 Moodle LMS 통합 시스템

## Technical Environment
- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9
- **Frontend**: JavaScript/jQuery (Moodle standard)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Moodle 3.7 LMS                     │
│  ┌──────────────────────────────────────────────┐  │
│  │     Confidence Scoring Plugin (local)        │  │
│  │  ┌────────────┐  ┌──────────────────────┐   │  │
│  │  │ Student UI │  │   Teacher Dashboard  │   │  │
│  │  └─────┬──────┘  └───────────┬──────────┘   │  │
│  │        │                     │               │  │
│  │  ┌─────▼─────────────────────▼──────────┐   │  │
│  │  │      PHP API Controllers             │   │  │
│  │  └─────────────────┬──────────────────────┘   │  │
│  └────────────────────┼──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │
                   ┌────▼─────┐
                   │  MySQL   │
                   │   5.7    │
                   └──────────┘
```

---

## 2. Database Schema

### 2.1 Main Tables

```sql
-- 개념 정의 테이블
CREATE TABLE mdl_local_confidence_concepts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    courseid BIGINT(10) NOT NULL,
    conceptname VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    displayorder INT(5) DEFAULT 0,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY courseid (courseid),
    CONSTRAINT fk_concepts_course
        FOREIGN KEY (courseid) REFERENCES mdl_course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 개념 정의';

-- 학생 자신감 점수 테이블
CREATE TABLE mdl_local_confidence_scores (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    conceptid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    score TINYINT(2) NOT NULL,
    comment TEXT,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_concept (userid, conceptid),
    KEY userid (userid),
    KEY conceptid (conceptid),
    KEY courseid (courseid),
    CONSTRAINT fk_scores_user
        FOREIGN KEY (userid) REFERENCES mdl_user(id),
    CONSTRAINT fk_scores_concept
        FOREIGN KEY (conceptid) REFERENCES mdl_local_confidence_concepts(id),
    CONSTRAINT fk_scores_course
        FOREIGN KEY (courseid) REFERENCES mdl_course(id),
    CONSTRAINT chk_score_range
        CHECK (score BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 자신감 점수';

-- 점수 변화 이력 테이블
CREATE TABLE mdl_local_confidence_history (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    scoreid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    conceptid BIGINT(10) NOT NULL,
    oldscore TINYINT(2),
    newscore TINYINT(2) NOT NULL,
    comment TEXT,
    timecreated BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY scoreid (scoreid),
    KEY userid (userid),
    KEY conceptid (conceptid),
    CONSTRAINT fk_history_score
        FOREIGN KEY (scoreid) REFERENCES mdl_local_confidence_scores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='자신감 점수 변화 이력';

-- 개념별 알림 설정 테이블
CREATE TABLE mdl_local_confidence_alerts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    conceptid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    threshold TINYINT(2) NOT NULL,
    alerttype VARCHAR(50) NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    timecreated BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY conceptid (conceptid),
    CONSTRAINT fk_alerts_concept
        FOREIGN KEY (conceptid) REFERENCES mdl_local_confidence_concepts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='자신감 점수 알림 설정';
```

### 2.2 Index Strategy
- `userid`, `conceptid`, `courseid`에 대한 인덱스로 조회 성능 최적화
- `unique_user_concept` 제약조건으로 중복 입력 방지
- 시계열 분석을 위한 `timecreated` 인덱스

---

## 3. Moodle Plugin Structure

```
moodle/
└── local/
    └── confidence/
        ├── version.php              # 플러그인 버전 정보
        ├── settings.php             # 관리자 설정
        ├── lang/
        │   ├── en/
        │   │   └── local_confidence.php
        │   └── ko/
        │       └── local_confidence.php
        ├── classes/
        │   ├── concept_manager.php   # 개념 관리
        │   ├── score_manager.php     # 점수 관리
        │   ├── analytics.php         # 통계 분석
        │   └── privacy/
        │       └── provider.php      # GDPR 준수
        ├── db/
        │   ├── install.xml          # 데이터베이스 스키마
        │   ├── upgrade.php          # 업그레이드 스크립트
        │   ├── access.php           # 권한 정의
        │   └── services.php         # 웹서비스 정의
        ├── student/
        │   ├── index.php            # 학생 메인 페이지
        │   ├── submit.php           # 점수 제출
        │   └── history.php          # 개인 이력 조회
        ├── teacher/
        │   ├── dashboard.php        # 교사 대시보드
        │   ├── concepts.php         # 개념 관리
        │   ├── reports.php          # 리포트 조회
        │   └── export.php           # 데이터 내보내기
        ├── amd/
        │   └── src/
        │       ├── confidence_input.js   # 점수 입력 UI
        │       └── dashboard.js          # 대시보드 차트
        └── styles.css
```

---

## 4. API Endpoints

### 4.1 Student APIs

```php
// POST /local/confidence/student/submit.php
// 자신감 점수 제출
{
    "conceptid": 123,
    "score": 4,          // 1-5 scale
    "comment": "분수의 덧셈은 이해했지만 뺄셈은 아직 어려워요"
}

// GET /local/confidence/student/index.php?courseid=5
// 코스의 모든 개념과 현재 점수 조회
Response:
{
    "concepts": [
        {
            "id": 1,
            "name": "분수의 개념",
            "description": "분자와 분모의 의미 이해",
            "current_score": 4,
            "last_updated": 1700000000
        },
        ...
    ]
}

// GET /local/confidence/student/history.php?conceptid=1
// 특정 개념의 점수 변화 이력
Response:
{
    "history": [
        {
            "score": 2,
            "comment": "처음 배울 때는 어려웠어요",
            "timestamp": 1699000000
        },
        {
            "score": 4,
            "comment": "이제 이해가 됩니다",
            "timestamp": 1700000000
        }
    ]
}
```

### 4.2 Teacher APIs

```php
// GET /local/confidence/teacher/dashboard.php?courseid=5
// 코스 전체 자신감 점수 대시보드
Response:
{
    "summary": {
        "total_students": 30,
        "total_concepts": 15,
        "avg_confidence": 3.5
    },
    "concepts": [
        {
            "id": 1,
            "name": "분수의 개념",
            "avg_score": 4.2,
            "low_confidence_count": 3,  // 점수 <= 2인 학생 수
            "recent_changes": -0.2       // 최근 변화율
        },
        ...
    ],
    "students_at_risk": [
        {
            "userid": 101,
            "name": "김철수",
            "low_confidence_concepts": ["분수의 나눗셈", "소수점"],
            "avg_score": 2.1
        },
        ...
    ]
}

// POST /local/confidence/teacher/concepts.php
// 새 개념 추가
{
    "courseid": 5,
    "conceptname": "분수의 나눗셈",
    "description": "분수를 나누는 방법 이해",
    "category": "분수"
}

// GET /local/confidence/teacher/reports.php?courseid=5&conceptid=1
// 특정 개념의 상세 리포트
Response:
{
    "concept": {
        "id": 1,
        "name": "분수의 개념"
    },
    "score_distribution": {
        "1": 2,  // 매우 낮음
        "2": 3,  // 낮음
        "3": 10, // 보통
        "4": 12, // 높음
        "5": 3   // 매우 높음
    },
    "students": [
        {
            "userid": 101,
            "name": "김철수",
            "score": 2,
            "last_updated": 1700000000,
            "comment": "아직 어려워요"
        },
        ...
    ]
}
```

---

## 5. User Interface

### 5.1 Student View (학생 화면)

```html
<!-- /local/confidence/student/index.php -->
<div class="confidence-student-view">
    <h2>내 학습 자신감</h2>

    <div class="concept-list">
        <?php foreach ($concepts as $concept): ?>
        <div class="concept-card" data-conceptid="<?php echo $concept->id; ?>">
            <h3><?php echo $concept->name; ?></h3>
            <p class="concept-description"><?php echo $concept->description; ?></p>

            <!-- 자신감 점수 입력 (1-5 별점) -->
            <div class="confidence-rating">
                <label>나의 자신감:</label>
                <div class="star-rating" data-current-score="<?php echo $concept->current_score; ?>">
                    <span class="star" data-value="1">★</span>
                    <span class="star" data-value="2">★</span>
                    <span class="star" data-value="3">★</span>
                    <span class="star" data-value="4">★</span>
                    <span class="star" data-value="5">★</span>
                </div>
                <div class="score-labels">
                    <span>매우<br>낮음</span>
                    <span>낮음</span>
                    <span>보통</span>
                    <span>높음</span>
                    <span>매우<br>높음</span>
                </div>
            </div>

            <!-- 코멘트 입력 (선택) -->
            <div class="confidence-comment">
                <textarea
                    placeholder="어떤 부분이 어렵거나 쉬운가요? (선택사항)"
                    maxlength="500"></textarea>
            </div>

            <button class="btn-submit-confidence">저장</button>

            <!-- 이전 점수 표시 -->
            <?php if ($concept->current_score): ?>
            <div class="previous-score">
                마지막 평가: <?php echo $concept->current_score; ?>점
                (<?php echo userdate($concept->last_updated, '%Y-%m-%d'); ?>)
            </div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
</div>
```

### 5.2 Teacher Dashboard (교사 대시보드)

```html
<!-- /local/confidence/teacher/dashboard.php -->
<div class="confidence-teacher-dashboard">
    <h2>학급 자신감 모니터링</h2>

    <!-- 전체 요약 -->
    <div class="summary-cards">
        <div class="summary-card">
            <h3>평균 자신감</h3>
            <div class="metric-value">3.5 / 5.0</div>
        </div>
        <div class="summary-card alert">
            <h3>도움 필요 학생</h3>
            <div class="metric-value">5명</div>
        </div>
        <div class="summary-card">
            <h3>참여율</h3>
            <div class="metric-value">87%</div>
        </div>
    </div>

    <!-- 개념별 자신감 차트 -->
    <div class="concept-chart">
        <h3>개념별 평균 자신감</h3>
        <canvas id="conceptBarChart"></canvas>
    </div>

    <!-- 위험 학생 목록 -->
    <div class="at-risk-students">
        <h3>관심이 필요한 학생들 (평균 자신감 ≤ 2.5)</h3>
        <table class="generaltable">
            <thead>
                <tr>
                    <th>학생</th>
                    <th>평균 자신감</th>
                    <th>낮은 자신감 개념</th>
                    <th>액션</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>김철수</td>
                    <td class="score-low">2.1</td>
                    <td>분수의 나눗셈, 소수점 연산</td>
                    <td><button class="btn-view-detail">상세보기</button></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 개념별 분포 -->
    <div class="concept-distribution">
        <h3>개념별 점수 분포</h3>
        <select id="conceptSelector">
            <option value="1">분수의 개념</option>
            <option value="2">분수의 덧셈</option>
            <!-- ... -->
        </select>
        <canvas id="scoreDistributionChart"></canvas>
    </div>
</div>
```

---

## 6. Core PHP Classes

### 6.1 Concept Manager

```php
<?php
// classes/concept_manager.php

namespace local_confidence;

defined('MOODLE_INTERNAL') || die();

class concept_manager {

    /**
     * 새 개념 생성
     */
    public static function create_concept($courseid, $conceptname, $description, $category = '') {
        global $DB;

        $concept = new \stdClass();
        $concept->courseid = $courseid;
        $concept->conceptname = $conceptname;
        $concept->description = $description;
        $concept->category = $category;
        $concept->timecreated = time();
        $concept->timemodified = time();

        $concept->id = $DB->insert_record('local_confidence_concepts', $concept);

        // 이벤트 트리거
        $event = \local_confidence\event\concept_created::create([
            'objectid' => $concept->id,
            'context' => \context_course::instance($courseid),
            'other' => ['conceptname' => $conceptname]
        ]);
        $event->trigger();

        return $concept;
    }

    /**
     * 코스의 모든 개념 조회
     */
    public static function get_course_concepts($courseid) {
        global $DB;

        return $DB->get_records('local_confidence_concepts',
            ['courseid' => $courseid],
            'displayorder ASC, conceptname ASC'
        );
    }

    /**
     * 개념별 평균 자신감 계산
     */
    public static function get_concept_average($conceptid) {
        global $DB;

        $sql = "SELECT AVG(score) as avg_score, COUNT(*) as count
                FROM {local_confidence_scores}
                WHERE conceptid = :conceptid";

        return $DB->get_record_sql($sql, ['conceptid' => $conceptid]);
    }
}
```

### 6.2 Score Manager

```php
<?php
// classes/score_manager.php

namespace local_confidence;

defined('MOODLE_INTERNAL') || die();

class score_manager {

    /**
     * 자신감 점수 제출/업데이트
     */
    public static function submit_score($userid, $conceptid, $score, $comment = '') {
        global $DB;

        // 입력 검증
        if ($score < 1 || $score > 5) {
            throw new \invalid_parameter_exception('Score must be between 1 and 5');
        }

        // 기존 점수 확인
        $existing = $DB->get_record('local_confidence_scores', [
            'userid' => $userid,
            'conceptid' => $conceptid
        ]);

        $now = time();

        if ($existing) {
            // 업데이트
            $oldscore = $existing->score;
            $existing->score = $score;
            $existing->comment = $comment;
            $existing->timemodified = $now;

            $DB->update_record('local_confidence_scores', $existing);

            // 이력 저장
            self::save_history($existing->id, $userid, $conceptid, $oldscore, $score, $comment);

        } else {
            // 신규 생성
            $concept = $DB->get_record('local_confidence_concepts', ['id' => $conceptid], '*', MUST_EXIST);

            $scorerecord = new \stdClass();
            $scorerecord->userid = $userid;
            $scorerecord->conceptid = $conceptid;
            $scorerecord->courseid = $concept->courseid;
            $scorerecord->score = $score;
            $scorerecord->comment = $comment;
            $scorerecord->timecreated = $now;
            $scorerecord->timemodified = $now;

            $scorerecord->id = $DB->insert_record('local_confidence_scores', $scorerecord);

            // 이력 저장
            self::save_history($scorerecord->id, $userid, $conceptid, null, $score, $comment);
        }

        // 이벤트 트리거
        $event = \local_confidence\event\score_submitted::create([
            'objectid' => $conceptid,
            'relateduserid' => $userid,
            'context' => \context_course::instance($concept->courseid),
            'other' => ['score' => $score]
        ]);
        $event->trigger();

        return true;
    }

    /**
     * 학생의 모든 점수 조회
     */
    public static function get_user_scores($userid, $courseid) {
        global $DB;

        $sql = "SELECT c.id, c.conceptname, c.description, c.category,
                       s.score, s.comment, s.timemodified
                FROM {local_confidence_concepts} c
                LEFT JOIN {local_confidence_scores} s
                    ON c.id = s.conceptid AND s.userid = :userid
                WHERE c.courseid = :courseid
                ORDER BY c.displayorder ASC, c.conceptname ASC";

        return $DB->get_records_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid
        ]);
    }

    /**
     * 특정 개념의 점수 변화 이력
     */
    public static function get_score_history($userid, $conceptid) {
        global $DB;

        $sql = "SELECT h.*, s.score as current_score
                FROM {local_confidence_history} h
                JOIN {local_confidence_scores} s ON h.scoreid = s.id
                WHERE h.userid = :userid AND h.conceptid = :conceptid
                ORDER BY h.timecreated ASC";

        return $DB->get_records_sql($sql, [
            'userid' => $userid,
            'conceptid' => $conceptid
        ]);
    }

    /**
     * 점수 변화 이력 저장
     */
    private static function save_history($scoreid, $userid, $conceptid, $oldscore, $newscore, $comment) {
        global $DB;

        $history = new \stdClass();
        $history->scoreid = $scoreid;
        $history->userid = $userid;
        $history->conceptid = $conceptid;
        $history->oldscore = $oldscore;
        $history->newscore = $newscore;
        $history->comment = $comment;
        $history->timecreated = time();

        $DB->insert_record('local_confidence_history', $history);
    }
}
```

### 6.3 Analytics

```php
<?php
// classes/analytics.php

namespace local_confidence;

defined('MOODLE_INTERNAL') || die();

class analytics {

    /**
     * 코스 전체 통계
     */
    public static function get_course_statistics($courseid) {
        global $DB;

        // 전체 학생 수
        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'local/confidence:submitconfidence');
        $total_students = count($students);

        // 전체 개념 수
        $total_concepts = $DB->count_records('local_confidence_concepts', ['courseid' => $courseid]);

        // 평균 자신감
        $sql = "SELECT AVG(score) as avg_confidence
                FROM {local_confidence_scores}
                WHERE courseid = :courseid";
        $avg = $DB->get_record_sql($sql, ['courseid' => $courseid]);

        // 참여율 (점수를 입력한 학생 비율)
        $sql = "SELECT COUNT(DISTINCT userid) as active_students
                FROM {local_confidence_scores}
                WHERE courseid = :courseid";
        $active = $DB->get_record_sql($sql, ['courseid' => $courseid]);
        $participation_rate = $total_students > 0 ?
            ($active->active_students / $total_students) * 100 : 0;

        return [
            'total_students' => $total_students,
            'total_concepts' => $total_concepts,
            'avg_confidence' => round($avg->avg_confidence, 2),
            'participation_rate' => round($participation_rate, 1)
        ];
    }

    /**
     * 개념별 통계
     */
    public static function get_concept_statistics($courseid) {
        global $DB;

        $sql = "SELECT c.id, c.conceptname,
                       AVG(s.score) as avg_score,
                       COUNT(s.id) as total_responses,
                       SUM(CASE WHEN s.score <= 2 THEN 1 ELSE 0 END) as low_confidence_count
                FROM {local_confidence_concepts} c
                LEFT JOIN {local_confidence_scores} s ON c.id = s.conceptid
                WHERE c.courseid = :courseid
                GROUP BY c.id, c.conceptname
                ORDER BY avg_score ASC";

        return $DB->get_records_sql($sql, ['courseid' => $courseid]);
    }

    /**
     * 위험 학생 식별 (평균 자신감 <= 2.5)
     */
    public static function get_at_risk_students($courseid, $threshold = 2.5) {
        global $DB;

        $sql = "SELECT u.id, u.firstname, u.lastname,
                       AVG(s.score) as avg_score,
                       COUNT(s.id) as concepts_rated,
                       GROUP_CONCAT(
                           CASE WHEN s.score <= 2
                           THEN c.conceptname
                           END SEPARATOR ', '
                       ) as low_concepts
                FROM {user} u
                JOIN {local_confidence_scores} s ON u.id = s.userid
                JOIN {local_confidence_concepts} c ON s.conceptid = c.id
                WHERE s.courseid = :courseid
                GROUP BY u.id, u.firstname, u.lastname
                HAVING avg_score <= :threshold
                ORDER BY avg_score ASC";

        return $DB->get_records_sql($sql, [
            'courseid' => $courseid,
            'threshold' => $threshold
        ]);
    }

    /**
     * 점수 분포
     */
    public static function get_score_distribution($conceptid) {
        global $DB;

        $sql = "SELECT score, COUNT(*) as count
                FROM {local_confidence_scores}
                WHERE conceptid = :conceptid
                GROUP BY score
                ORDER BY score";

        $results = $DB->get_records_sql($sql, ['conceptid' => $conceptid]);

        // 1-5 점 모두 포함하도록 초기화
        $distribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($results as $result) {
            $distribution[$result->score] = $result->count;
        }

        return $distribution;
    }
}
```

---

## 7. JavaScript (AMD Module)

```javascript
// amd/src/confidence_input.js

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    return {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            var self = this;

            // 별점 호버 효과
            $('.star-rating .star').on('mouseenter', function() {
                var value = $(this).data('value');
                $(this).parent().find('.star').each(function(index) {
                    if (index < value) {
                        $(this).addClass('hover');
                    } else {
                        $(this).removeClass('hover');
                    }
                });
            });

            $('.star-rating').on('mouseleave', function() {
                $(this).find('.star').removeClass('hover');
            });

            // 별점 클릭
            $('.star-rating .star').on('click', function() {
                var value = $(this).data('value');
                var $rating = $(this).parent();

                $rating.find('.star').removeClass('selected');
                $rating.find('.star').each(function(index) {
                    if (index < value) {
                        $(this).addClass('selected');
                    }
                });

                $rating.data('selected-score', value);
            });

            // 점수 제출
            $('.btn-submit-confidence').on('click', function() {
                var $card = $(this).closest('.concept-card');
                var conceptid = $card.data('conceptid');
                var score = $card.find('.star-rating').data('selected-score');
                var comment = $card.find('textarea').val();

                if (!score) {
                    Notification.alert('알림', '자신감 점수를 선택해주세요.', '확인');
                    return;
                }

                self.submitScore(conceptid, score, comment, $(this));
            });
        },

        submitScore: function(conceptid, score, comment, $button) {
            var $originalText = $button.text();
            $button.prop('disabled', true).text('저장 중...');

            Ajax.call([{
                methodname: 'local_confidence_submit_score',
                args: {
                    conceptid: conceptid,
                    score: score,
                    comment: comment
                }
            }])[0].done(function(response) {
                if (response.success) {
                    Notification.addNotification({
                        message: '자신감 점수가 저장되었습니다.',
                        type: 'success'
                    });

                    // UI 업데이트
                    var $card = $button.closest('.concept-card');
                    $card.find('.previous-score').remove();
                    $card.append(
                        '<div class="previous-score">' +
                        '마지막 평가: ' + score + '점 (방금 전)' +
                        '</div>'
                    );
                }
                $button.prop('disabled', false).text($originalText);
            }).fail(function(error) {
                Notification.exception(error);
                $button.prop('disabled', false).text($originalText);
            });
        }
    };
});
```

---

## 8. Web Services API

```php
<?php
// db/services.php

$functions = [
    'local_confidence_submit_score' => [
        'classname'   => 'local_confidence\external\submit_score',
        'methodname'  => 'execute',
        'classpath'   => '',
        'description' => 'Submit confidence score for a concept',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/confidence:submitconfidence'
    ],
    'local_confidence_get_user_scores' => [
        'classname'   => 'local_confidence\external\get_user_scores',
        'methodname'  => 'execute',
        'classpath'   => '',
        'description' => 'Get all confidence scores for a user in a course',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/confidence:view'
    ],
    'local_confidence_get_course_statistics' => [
        'classname'   => 'local_confidence\external\get_course_statistics',
        'methodname'  => 'execute',
        'classpath'   => '',
        'description' => 'Get course-wide confidence statistics',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/confidence:viewreports'
    ]
];

$services = [
    'Confidence Scoring Service' => [
        'functions' => [
            'local_confidence_submit_score',
            'local_confidence_get_user_scores',
            'local_confidence_get_course_statistics'
        ],
        'restrictedusers' => 0,
        'enabled' => 1
    ]
];
```

---

## 9. Capabilities & Permissions

```php
<?php
// db/access.php

$capabilities = [
    'local/confidence:submitconfidence' => [
        'riskbitmask' => RISK_SPAM,
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'student' => CAP_ALLOW
        ]
    ],
    'local/confidence:view' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ],
    'local/confidence:viewreports' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ],
    'local/confidence:manageconcepts' => [
        'riskbitmask' => RISK_CONFIG,
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ]
];
```

---

## 10. Installation & Deployment

### 10.1 Installation Steps

```bash
# 1. 플러그인 파일 복사
cd /path/to/moodle
cp -r /path/to/local_confidence local/confidence

# 2. 소유자 및 권한 설정
chown -R www-data:www-data local/confidence
chmod -R 755 local/confidence

# 3. Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications 접속하여 설치 진행
```

### 10.2 Database Setup

Moodle의 플러그인 설치 과정에서 `db/install.xml`이 자동으로 실행됩니다.

수동 설치가 필요한 경우:

```bash
# Moodle CLI를 통한 업그레이드
php admin/cli/upgrade.php
```

### 10.3 Configuration

```php
// Site administration > Plugins > Local plugins > Confidence Scoring

// 설정 옵션:
- 기본 자신감 척도: 1-5 (별점) 또는 1-10 (슬라이더)
- 코멘트 필수 여부
- 자동 알림 임계값 (기본: 평균 2.5 이하)
- 이메일 알림 활성화
- 데이터 보존 기간
```

---

## 11. Testing Checklist

### 11.1 Unit Tests

```php
<?php
// tests/score_manager_test.php

namespace local_confidence;

class score_manager_test extends \advanced_testcase {

    public function test_submit_score() {
        $this->resetAfterTest(true);

        // 테스트 데이터 생성
        $user = $this->getDataGenerator()->create_user();
        $course = $this->getDataGenerator()->create_course();
        $concept = concept_manager::create_concept(
            $course->id,
            'Test Concept',
            'Test Description'
        );

        // 점수 제출
        $result = score_manager::submit_score($user->id, $concept->id, 4, 'Test comment');

        $this->assertTrue($result);

        // 데이터베이스 확인
        $record = $DB->get_record('local_confidence_scores', [
            'userid' => $user->id,
            'conceptid' => $concept->id
        ]);

        $this->assertEquals(4, $record->score);
        $this->assertEquals('Test comment', $record->comment);
    }

    public function test_score_validation() {
        $this->resetAfterTest(true);

        $user = $this->getDataGenerator()->create_user();
        $course = $this->getDataGenerator()->create_course();
        $concept = concept_manager::create_concept($course->id, 'Test', '');

        // 잘못된 점수 (범위 초과)
        $this->expectException(\invalid_parameter_exception::class);
        score_manager::submit_score($user->id, $concept->id, 6);
    }
}
```

### 11.2 Integration Test Scenarios

- [ ] 학생이 개념별 자신감 점수를 입력할 수 있다
- [ ] 동일 개념에 대해 점수를 업데이트할 수 있다
- [ ] 점수 변화 이력이 정확하게 저장된다
- [ ] 교사가 코스 전체 통계를 조회할 수 있다
- [ ] 교사가 특정 개념의 점수 분포를 확인할 수 있다
- [ ] 위험 학생 목록이 정확하게 식별된다
- [ ] 권한이 없는 사용자는 타인의 점수를 볼 수 없다
- [ ] MySQL 5.7과 호환된다
- [ ] PHP 7.1.9에서 정상 작동한다

---

## 12. Performance Optimization

### 12.1 Database Optimization

```sql
-- 자주 사용되는 쿼리 최적화를 위한 인덱스
CREATE INDEX idx_scores_course_score ON mdl_local_confidence_scores(courseid, score);
CREATE INDEX idx_scores_modified ON mdl_local_confidence_scores(timemodified);
CREATE INDEX idx_history_created ON mdl_local_confidence_history(timecreated);

-- 통계 쿼리 성능 향상을 위한 복합 인덱스
CREATE INDEX idx_scores_composite ON mdl_local_confidence_scores(courseid, conceptid, score);
```

### 12.2 Caching Strategy

```php
// 코스 통계 캐싱 (10분)
$cache = \cache::make('local_confidence', 'statistics');
$cachekey = 'course_stats_' . $courseid;

$stats = $cache->get($cachekey);
if ($stats === false) {
    $stats = analytics::get_course_statistics($courseid);
    $cache->set($cachekey, $stats);
}
```

### 12.3 Query Optimization

- 대량 데이터 조회 시 페이지네이션 적용
- N+1 쿼리 방지를 위한 JOIN 사용
- 불필요한 필드 조회 최소화 (SELECT *)

---

## 13. Security Considerations

### 13.1 Input Validation

```php
// 모든 사용자 입력 검증
function validate_score_input($score, $comment) {
    // 점수 범위 검증
    if (!is_numeric($score) || $score < 1 || $score > 5) {
        throw new \invalid_parameter_exception('Invalid score value');
    }

    // 코멘트 길이 제한
    if (strlen($comment) > 500) {
        throw new \invalid_parameter_exception('Comment too long');
    }

    // XSS 방지
    $comment = clean_param($comment, PARAM_TEXT);

    return ['score' => (int)$score, 'comment' => $comment];
}
```

### 13.2 Access Control

```php
// 권한 확인
function check_access($userid, $courseid, $action) {
    $context = \context_course::instance($courseid);

    switch ($action) {
        case 'submit':
            require_capability('local/confidence:submitconfidence', $context);
            // 학생은 자신의 점수만 제출 가능
            if ($userid != $USER->id && !has_capability('moodle/course:viewhiddenactivities', $context)) {
                throw new \moodle_exception('nopermission');
            }
            break;

        case 'viewreports':
            require_capability('local/confidence:viewreports', $context);
            break;
    }
}
```

### 13.3 SQL Injection Prevention

- Moodle의 DMLAPI 사용 (`$DB->get_records()`, `$DB->execute()`)
- 파라미터 바인딩 사용
- 사용자 입력을 직접 쿼리에 삽입하지 않음

---

## 14. Monitoring & Analytics

### 14.1 Usage Metrics

- 일일/주간 점수 제출 수
- 학생 참여율 추이
- 평균 자신감 변화 추세
- 교사 대시보드 접근 빈도

### 14.2 Alert System

```php
// 자동 알림 시스템
function check_and_send_alerts($courseid) {
    $at_risk_students = analytics::get_at_risk_students($courseid, 2.5);

    foreach ($at_risk_students as $student) {
        // 교사에게 알림
        $message = new \core\message\message();
        $message->component = 'local_confidence';
        $message->name = 'studentatrisk';
        $message->userfrom = \core_user::get_noreply_user();
        $message->userto = get_teachers($courseid);
        $message->subject = '관심 필요 학생 알림';
        $message->fullmessage = sprintf(
            '%s 학생의 평균 자신감 점수가 %.1f로 낮습니다.',
            fullname($student),
            $student->avg_score
        );

        message_send($message);
    }
}
```

---

## 15. Future Enhancements

### Phase 2 Features

1. **AI 기반 개인화 피드백**
   - 자신감 패턴 분석
   - 맞춤형 학습 자료 추천

2. **시각화 개선**
   - 시계열 차트 (자신감 변화 추이)
   - 히트맵 (학생 x 개념 매트릭스)
   - 레이더 차트 (개인별 프로필)

3. **모바일 앱 통합**
   - Moodle Mobile 앱 지원
   - 푸시 알림

4. **게이미피케이션**
   - 자신감 향상 배지
   - 학습 마일스톤

5. **LTI 통합**
   - 외부 LMS와 연동
   - 표준 학습 분석 프레임워크 지원

---

## 16. Documentation

### 16.1 User Guides

- **학생용 가이드**: 자신감 점수 입력 방법
- **교사용 가이드**: 대시보드 사용법, 데이터 해석
- **관리자용 가이드**: 설치, 설정, 유지보수

### 16.2 API Documentation

- Web Services API 명세
- 데이터베이스 스키마 다이어그램
- 클래스 다이어그램

---

## 17. Support & Maintenance

### 17.1 Troubleshooting

**일반적인 문제:**

1. **점수가 저장되지 않음**
   - 권한 확인
   - JavaScript 콘솔 에러 확인
   - 데이터베이스 연결 확인

2. **대시보드가 느림**
   - 캐시 활성화 확인
   - 데이터베이스 인덱스 확인
   - 쿼리 최적화

### 17.2 Backup & Recovery

```bash
# 데이터베이스 백업
mysqldump -u username -p database_name \
    mdl_local_confidence_concepts \
    mdl_local_confidence_scores \
    mdl_local_confidence_history \
    mdl_local_confidence_alerts \
    > confidence_backup_$(date +%Y%m%d).sql
```

---

## Appendix A: Sample Data

```sql
-- 샘플 개념 데이터
INSERT INTO mdl_local_confidence_concepts (courseid, conceptname, description, category, displayorder, timecreated, timemodified) VALUES
(5, '분수의 개념', '분자와 분모의 의미 이해', '분수', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '분수의 덧셈', '같은 분모와 다른 분모의 분수 덧셈', '분수', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '분수의 뺄셈', '분수끼리 빼기', '분수', 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '분수의 곱셈', '분수에 분수 곱하기', '분수', 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(5, '분수의 나눗셈', '분수를 분수로 나누기', '분수', 5, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

---

## Contact

**개발 팀**: [Your Team Contact]
**기술 지원**: [Support Email]
**버전**: 1.0.0
**마지막 업데이트**: 2025-11-18
