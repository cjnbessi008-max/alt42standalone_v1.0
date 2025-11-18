# 🔗 Moodle/LMS 연동 가이드

이 문서는 ALT42 Vector Story Mode를 Moodle 3.7 및 MySQL 5.7과 연동하는 방법을 설명합니다.

## 📋 사전 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Node.js**: 18.0 이상

## 🗄️ 데이터베이스 스키마

### 1. MySQL 테이블 생성

```sql
-- 벡터 문제 테이블
CREATE TABLE mdl_alt42_vector_problems (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_type VARCHAR(50) NOT NULL,
    story_data JSON NOT NULL,
    difficulty TINYINT(1) DEFAULT 1,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_type (problem_type),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 진행도 테이블
CREATE TABLE mdl_alt42_student_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    scene_index INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    score INT DEFAULT 0,
    time_spent INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES mdl_user(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES mdl_alt42_vector_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    UNIQUE KEY unique_user_problem (user_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 활동 로그 테이블
CREATE TABLE mdl_alt42_activity_log (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES mdl_user(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES mdl_alt42_vector_problems(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_action (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. 샘플 데이터 삽입

```sql
INSERT INTO mdl_alt42_vector_problems (title, description, problem_type, story_data, difficulty, grade_level) VALUES
(
    '벡터의 탄생',
    '벡터가 무엇인지 스토리로 배워봅시다',
    'introduction',
    '{
        "scenes": [
            {
                "id": 1,
                "narration": "어느 날, 작은 마을에 화살이 날아들었습니다.",
                "vector": {"x": 0, "y": 0, "toX": 3, "toY": 4},
                "highlight": "direction",
                "duration": 3000
            }
        ]
    }',
    1,
    '중학교 1학년'
);
```

## 🔌 Moodle 플러그인 개발

### 1. 플러그인 구조

```
moodle/mod/alt42vector/
├── version.php
├── lib.php
├── view.php
├── db/
│   ├── install.xml
│   └── access.php
├── lang/
│   └── en/
│       └── alt42vector.php
└── templates/
    └── view.mustache
```

### 2. version.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_alt42vector';
$plugin->version = 2025111800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0.0';
```

### 3. lib.php (주요 함수)

```php
<?php
defined('MOODLE_INTERNAL') || die();

function alt42vector_add_instance($data) {
    global $DB;
    $data->timecreated = time();
    $data->timemodified = time();
    return $DB->insert_record('alt42vector', $data);
}

function alt42vector_get_problems($filters = []) {
    global $DB;

    $sql = "SELECT * FROM {alt42_vector_problems} WHERE 1=1";
    $params = [];

    if (!empty($filters['difficulty'])) {
        $sql .= " AND difficulty = :difficulty";
        $params['difficulty'] = $filters['difficulty'];
    }

    if (!empty($filters['type'])) {
        $sql .= " AND problem_type = :type";
        $params['type'] = $filters['type'];
    }

    return $DB->get_records_sql($sql, $params);
}

function alt42vector_save_progress($userid, $problemid, $data) {
    global $DB;

    $existing = $DB->get_record('alt42_student_progress', [
        'user_id' => $userid,
        'problem_id' => $problemid
    ]);

    if ($existing) {
        $data->id = $existing->id;
        $data->updated_at = time();
        return $DB->update_record('alt42_student_progress', $data);
    } else {
        $data->user_id = $userid;
        $data->problem_id = $problemid;
        $data->started_at = time();
        return $DB->insert_record('alt42_student_progress', $data);
    }
}
```

## 🌐 API 연동

### 1. Backend 수정 (MySQL 연결)

```javascript
// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
```

### 2. API 엔드포인트 수정

```javascript
// backend/index.js
const pool = require('./db');

app.get('/api/problems', async (req, res) => {
    try {
        const { difficulty, type, gradeLevel } = req.query;

        let sql = 'SELECT * FROM mdl_alt42_vector_problems WHERE 1=1';
        const params = [];

        if (difficulty) {
            sql += ' AND difficulty = ?';
            params.push(parseInt(difficulty));
        }

        if (type) {
            sql += ' AND problem_type = ?';
            params.push(type);
        }

        if (gradeLevel) {
            sql += ' AND grade_level = ?';
            params.push(gradeLevel);
        }

        const [rows] = await pool.execute(sql, params);

        // Parse JSON story_data
        const problems = rows.map(row => ({
            ...row,
            storyMode: JSON.parse(row.story_data)
        }));

        res.json({
            success: true,
            count: problems.length,
            problems
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error'
        });
    }
});

app.post('/api/progress', async (req, res) => {
    try {
        const { userId, problemId, sceneIndex, completed, score, timeSpent } = req.body;

        const sql = `
            INSERT INTO mdl_alt42_student_progress
            (user_id, problem_id, scene_index, completed, score, time_spent, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            scene_index = VALUES(scene_index),
            completed = VALUES(completed),
            score = VALUES(score),
            time_spent = time_spent + VALUES(time_spent),
            completed_at = VALUES(completed_at)
        `;

        const completedAt = completed ? new Date() : null;

        await pool.execute(sql, [
            userId,
            problemId,
            sceneIndex,
            completed ? 1 : 0,
            score,
            timeSpent,
            completedAt
        ]);

        res.json({
            success: true,
            message: 'Progress saved successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save progress'
        });
    }
});
```

## 🔐 인증 연동

### Moodle 세션 토큰 활용

```javascript
// backend/middleware/auth.js
const axios = require('axios');

async function verifyMoodleToken(token) {
    try {
        const response = await axios.get(
            `${process.env.MOODLE_URL}/webservice/rest/server.php`,
            {
                params: {
                    wstoken: token,
                    wsfunction: 'core_webservice_get_site_info',
                    moodlewsrestformat: 'json'
                }
            }
        );

        return response.data.userid ? response.data : null;
    } catch (error) {
        return null;
    }
}

module.exports = async (req, res, next) => {
    const token = req.headers['x-moodle-token'];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const user = await verifyMoodleToken(token);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    req.user = user;
    next();
};
```

## 📱 프론트엔드 연동

### 토큰 전달

```javascript
// frontend/src/api/client.js
const getMoodleToken = () => {
    // Moodle iframe에서 토큰 가져오기
    return window.parent.M?.cfg?.sesskey || localStorage.getItem('moodle_token');
};

export const fetchProblems = async (filters = {}) => {
    const token = getMoodleToken();

    const response = await fetch('/api/problems?' + new URLSearchParams(filters), {
        headers: {
            'X-Moodle-Token': token
        }
    });

    return response.json();
};
```

## 🧪 테스트

### 연동 테스트 체크리스트

- [ ] MySQL 연결 확인
- [ ] 문제 목록 조회 테스트
- [ ] 진행도 저장 테스트
- [ ] Moodle 인증 토큰 검증
- [ ] 학생 대시보드 데이터 표시
- [ ] 성적 연동 확인

### 테스트 쿼리

```sql
-- 학생별 진행도 확인
SELECT
    u.username,
    p.title,
    sp.completed,
    sp.score,
    sp.time_spent
FROM mdl_alt42_student_progress sp
JOIN mdl_user u ON sp.user_id = u.id
JOIN mdl_alt42_vector_problems p ON sp.problem_id = p.id
WHERE u.id = ?;

-- 문제별 완료율
SELECT
    p.title,
    COUNT(*) as total_attempts,
    SUM(sp.completed) as completed_count,
    AVG(sp.score) as avg_score
FROM mdl_alt42_vector_problems p
LEFT JOIN mdl_alt42_student_progress sp ON p.id = sp.problem_id
GROUP BY p.id;
```

## 📊 성능 최적화

### 1. 데이터베이스 인덱스

```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_user_completed ON mdl_alt42_student_progress(user_id, completed);
CREATE INDEX idx_problem_difficulty ON mdl_alt42_vector_problems(difficulty, problem_type);
```

### 2. 캐싱 전략

```javascript
// Redis를 활용한 문제 데이터 캐싱
const redis = require('redis');
const client = redis.createClient();

async function getCachedProblems() {
    const cached = await client.get('problems:all');
    if (cached) return JSON.parse(cached);

    const problems = await fetchProblemsFromDB();
    await client.setEx('problems:all', 3600, JSON.stringify(problems));
    return problems;
}
```

## 🚀 배포

### 1. 환경 변수 설정

```bash
# backend/.env
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password
MOODLE_URL=https://your-moodle-site.com
```

### 2. 프로덕션 빌드

```bash
# Frontend 빌드
cd frontend && npm run build

# Backend 시작
cd backend && npm start
```

## 📞 지원

연동 관련 문제가 발생하면 이슈를 등록해주세요.
