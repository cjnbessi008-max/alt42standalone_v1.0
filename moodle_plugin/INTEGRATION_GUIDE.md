# LMS Integration Guide - Cognitive Load Tips

## Overview

This guide explains how to integrate the Cognitive Load Tips plugin with various LMS platforms and external systems.

## Supported Environments

### Primary Support
- **Moodle 3.7+** (Full support)
- **MySQL 5.7+** / MariaDB 10.2+
- **PHP 7.1.9+**

### Architecture
```
┌─────────────────┐
│   Moodle LMS    │
│   (PHP 7.1.9)   │
└────────┬────────┘
         │
         ├─ Quiz Module (hooks)
         │  └─ Before question display
         │
         ├─ Cognitive Load Tips Plugin
         │  ├─ Tip Manager
         │  ├─ Difficulty Engine
         │  └─ Statistics Tracker
         │
         └─ Database (MySQL 5.7)
            ├─ Tips (14 default)
            ├─ Question Difficulty
            ├─ User Interactions
            └─ Quiz Settings
```

---

## 1. Moodle Quiz Integration

### Automatic Integration (Recommended)

The plugin automatically integrates with Moodle quizzes through hooks.

**Enable in Quiz Settings:**
```php
// Automatically added to quiz settings form
// Location: lib.php -> local_cognitiveloadtips_quiz_form_definition()

Settings available:
- Enable/Disable tips
- Difficulty threshold (1-5)
- Random vs all tips
- Allow skip option
```

### Manual Hook Integration

If automatic integration doesn't work, add manually:

**File: mod/quiz/renderer.php**

```php
// Find the question rendering function
public function question($question, $quiz, $options) {
    $output = '';

    // ADD THIS: Check and show cognitive load tips
    if (function_exists('local_cognitiveloadtips_before_question')) {
        $output .= local_cognitiveloadtips_before_question($question, $quiz);
    }

    // Original question rendering continues...
    $output .= $this->render_question_content($question, $options);

    return $output;
}
```

---

## 2. REST API Integration

### Enable Web Services

```
Site administration → Plugins → Web services → Overview
```

1. ✅ Enable web services
2. ✅ Enable REST protocol
3. Create external service "Cognitive Load Tips API"
4. Add functions (see below)
5. Generate token

### Available API Endpoints

#### Get Tips
```http
GET /webservice/rest/server.php
  ?wstoken={token}
  &wsfunction=local_cognitiveloadtips_get_tips
  &moodlewsrestformat=json
  &difficulty=4
  &language=ko
  &random=1
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "심호흡하기",
    "content": "어려운 문제를 풀기 전에...",
    "category": "breathing",
    "difficulty_min": 4,
    "difficulty_max": 5,
    "display_duration": 10,
    "is_mandatory": false,
    "language": "ko"
  }
]
```

#### Record Interaction
```http
POST /webservice/rest/server.php
  ?wstoken={token}
  &wsfunction=local_cognitiveloadtips_record_interaction
  &moodlewsrestformat=json
  &tipid=1
  &questionid=123
  &quizid=45
  &duration=15
  &skipped=0
```

**Response:**
```json
{
  "success": true,
  "message": "Interaction recorded"
}
```

#### Get Question Difficulty
```http
GET /webservice/rest/server.php
  ?wstoken={token}
  &wsfunction=local_cognitiveloadtips_get_question_difficulty
  &moodlewsrestformat=json
  &questionid=123
```

**Response:**
```json
{
  "questionid": 123,
  "difficulty": 4,
  "auto_calculated": false
}
```

#### Set Question Difficulty
```http
POST /webservice/rest/server.php
  ?wstoken={token}
  &wsfunction=local_cognitiveloadtips_set_question_difficulty
  &moodlewsrestformat=json
  &questionid=123
  &difficulty=4
```

### PHP Integration Example

```php
<?php
// External system calling Moodle API

class CognitiveLoadTipsClient {
    private $moodle_url = 'https://your-moodle.com';
    private $token = 'your_api_token';

    public function getTips($difficulty, $language = 'ko') {
        $params = [
            'wstoken' => $this->token,
            'wsfunction' => 'local_cognitiveloadtips_get_tips',
            'moodlewsrestformat' => 'json',
            'difficulty' => $difficulty,
            'language' => $language,
            'random' => 1
        ];

        $url = $this->moodle_url . '/webservice/rest/server.php?' . http_build_query($params);
        $response = file_get_contents($url);
        return json_decode($response, true);
    }

    public function recordInteraction($tipId, $questionId, $duration, $skipped = false) {
        $params = [
            'wstoken' => $this->token,
            'wsfunction' => 'local_cognitiveloadtips_record_interaction',
            'moodlewsrestformat' => 'json',
            'tipid' => $tipId,
            'questionid' => $questionId,
            'duration' => $duration,
            'skipped' => $skipped ? 1 : 0
        ];

        $ch = curl_init($this->moodle_url . '/webservice/rest/server.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage
$client = new CognitiveLoadTipsClient();

// Get tips for difficulty level 4 in Korean
$tips = $client->getTips(4, 'ko');
foreach ($tips as $tip) {
    echo $tip['title'] . ': ' . $tip['content'] . "\n";
}

// Record that user viewed the tip
$client->recordInteraction($tips[0]['id'], 123, 15, false);
```

### JavaScript Integration Example

```javascript
// External web app integrating with Moodle

class CognitiveLoadTipsAPI {
    constructor(moodleUrl, token) {
        this.moodleUrl = moodleUrl;
        this.token = token;
    }

    async getTips(difficulty, language = 'ko', random = true) {
        const params = new URLSearchParams({
            wstoken: this.token,
            wsfunction: 'local_cognitiveloadtips_get_tips',
            moodlewsrestformat: 'json',
            difficulty: difficulty,
            language: language,
            random: random ? 1 : 0
        });

        const response = await fetch(
            `${this.moodleUrl}/webservice/rest/server.php?${params}`
        );
        return await response.json();
    }

    async recordInteraction(tipId, questionId, duration, skipped = false) {
        const params = new URLSearchParams({
            wstoken: this.token,
            wsfunction: 'local_cognitiveloadtips_record_interaction',
            moodlewsrestformat: 'json',
            tipid: tipId,
            questionid: questionId,
            duration: duration,
            skipped: skipped ? 1 : 0
        });

        const response = await fetch(
            `${this.moodleUrl}/webservice/rest/server.php`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: params
            }
        );
        return await response.json();
    }
}

// Usage
const api = new CognitiveLoadTipsAPI(
    'https://your-moodle.com',
    'your_token_here'
);

// Display tips before difficult question
async function showTipsBeforeQuestion(questionId, difficulty) {
    const tips = await api.getTips(difficulty, 'ko', true);

    if (tips.length > 0) {
        const tip = tips[0];

        // Display tip to user
        displayTipModal(tip);

        // Start timer
        const startTime = Date.now();

        // When user continues
        document.getElementById('continue-btn').addEventListener('click', () => {
            const duration = Math.round((Date.now() - startTime) / 1000);
            api.recordInteraction(tip.id, questionId, duration, false);
            closeTipModal();
            showQuestion();
        });

        // When user skips
        document.getElementById('skip-btn').addEventListener('click', () => {
            const duration = Math.round((Date.now() - startTime) / 1000);
            api.recordInteraction(tip.id, questionId, duration, true);
            closeTipModal();
            showQuestion();
        });
    }
}
```

---

## 3. Database Direct Access

### Connection Parameters

```php
// From Moodle config.php
$CFG->dbtype    = 'mysqli';
$CFG->dbhost    = 'localhost';
$CFG->dbname    = 'moodle_db';
$CFG->dbuser    = 'moodle_user';
$CFG->dbpass    = 'password';
$CFG->prefix    = 'mdl_';
```

### Tables Schema

#### Tips Table
```sql
SELECT * FROM mdl_local_clt_tips
WHERE difficulty_min <= 4
  AND difficulty_max >= 4
  AND language = 'ko'
  AND enabled = 1
ORDER BY sortorder;
```

#### Question Difficulty
```sql
SELECT difficulty_level
FROM mdl_local_clt_question_difficulty
WHERE questionid = 123;
```

#### User Interactions
```sql
SELECT
    t.title,
    COUNT(*) as views,
    AVG(ui.view_duration) as avg_duration,
    SUM(CASE WHEN ui.skipped = 1 THEN 1 ELSE 0 END) as skips,
    SUM(CASE WHEN ui.was_helpful = 1 THEN 1 ELSE 0 END) as helpful
FROM mdl_local_clt_user_interactions ui
JOIN mdl_local_clt_tips t ON t.id = ui.tipid
GROUP BY t.id
ORDER BY views DESC;
```

### Python Integration Example

```python
import mysql.connector
from datetime import datetime

class MoodleCognitiveLoadTips:
    def __init__(self, host, database, user, password, prefix='mdl_'):
        self.conn = mysql.connector.connect(
            host=host,
            database=database,
            user=user,
            password=password
        )
        self.prefix = prefix

    def get_tips(self, difficulty, language='ko'):
        cursor = self.conn.cursor(dictionary=True)
        query = f"""
            SELECT * FROM {self.prefix}local_clt_tips
            WHERE difficulty_min <= %s
              AND difficulty_max >= %s
              AND language = %s
              AND enabled = 1
            ORDER BY sortorder
        """
        cursor.execute(query, (difficulty, difficulty, language))
        tips = cursor.fetchall()
        cursor.close()
        return tips

    def get_question_difficulty(self, question_id):
        cursor = self.conn.cursor(dictionary=True)
        query = f"""
            SELECT difficulty_level
            FROM {self.prefix}local_clt_question_difficulty
            WHERE questionid = %s
        """
        cursor.execute(query, (question_id,))
        result = cursor.fetchone()
        cursor.close()
        return result['difficulty_level'] if result else 3

    def record_interaction(self, user_id, tip_id, question_id, duration, skipped=False):
        cursor = self.conn.cursor()
        query = f"""
            INSERT INTO {self.prefix}local_clt_user_interactions
            (userid, tipid, questionid, view_duration, skipped, timecreated)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        timestamp = int(datetime.now().timestamp())
        cursor.execute(query, (
            user_id, tip_id, question_id, duration,
            1 if skipped else 0, timestamp
        ))
        self.conn.commit()
        cursor.close()

    def get_statistics(self):
        cursor = self.conn.cursor(dictionary=True)
        query = f"""
            SELECT
                COUNT(DISTINCT tipid) as total_tips,
                COUNT(*) as total_interactions,
                SUM(CASE WHEN skipped = 0 THEN 1 ELSE 0 END) as shown,
                SUM(CASE WHEN skipped = 1 THEN 1 ELSE 0 END) as skipped,
                AVG(view_duration) as avg_duration
            FROM {self.prefix}local_clt_user_interactions
        """
        cursor.execute(query)
        stats = cursor.fetchone()
        cursor.close()
        return stats

# Usage
db = MoodleCognitiveLoadTips(
    host='localhost',
    database='moodle_db',
    user='moodle_user',
    password='password'
)

# Get tips for difficulty 4
tips = db.get_tips(4, 'ko')
for tip in tips:
    print(f"{tip['title']}: {tip['content']}")

# Record interaction
db.record_interaction(
    user_id=123,
    tip_id=tips[0]['id'],
    question_id=456,
    duration=15,
    skipped=False
)

# Get statistics
stats = db.get_statistics()
print(f"Total interactions: {stats['total_interactions']}")
print(f"Average duration: {stats['avg_duration']} seconds")
```

---

## 4. LTI Integration (Future)

### Planned for Phase 3

The plugin will support LTI (Learning Tools Interoperability) for integration with:
- Canvas
- Blackboard
- Brightspace
- Other LTI-compliant LMS

### LTI Provider Endpoint (Planned)
```
https://your-moodle.com/local/cognitiveloadtips/lti/provider.php
```

---

## 5. Event Tracking Integration

### Moodle Events

The plugin triggers these Moodle events:

```php
// Event: Tip viewed
\local_cognitiveloadtips\event\tip_viewed::create([
    'objectid' => $tipid,
    'context' => $context,
    'other' => [
        'questionid' => $questionid,
        'difficulty' => $difficulty
    ]
])->trigger();

// Event: Feedback submitted
\local_cognitiveloadtips\event\feedback_submitted::create([
    'objectid' => $tipid,
    'context' => $context,
    'other' => [
        'helpful' => $helpful
    ]
])->trigger();
```

### Google Analytics Integration

Add to template footer:

```javascript
// Track tip interactions with Google Analytics
document.querySelectorAll('.clt-continue-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        gtag('event', 'cognitive_tip_viewed', {
            'tip_id': this.dataset.tipid,
            'difficulty': this.dataset.difficulty,
            'language': '{{language}}'
        });
    });
});
```

---

## 6. Custom Theme Integration

### Override Templates

Create custom template in your theme:

```
theme/yourtheme/templates/local_cognitiveloadtips/tip_display.mustache
```

### Custom CSS

```css
/* theme/yourtheme/style/custom.css */

.cognitive-load-tips-modal {
    /* Custom branding */
    border: 3px solid #your-brand-color;
}

.clt-header {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

---

## Security Considerations

1. **API Tokens**: Store securely, never expose in client-side code
2. **Database Access**: Use read-only accounts when possible
3. **CORS**: Configure properly for cross-origin API calls
4. **Rate Limiting**: Implement for public APIs
5. **Input Validation**: Always validate question IDs, difficulty levels

---

## Performance Optimization

### Caching

```php
// Enable caching for tips
$cache = cache::make('local_cognitiveloadtips', 'tips');
$cachekey = "tips_diff{$difficulty}_lang{$language}";

if (!$tips = $cache->get($cachekey)) {
    $tips = \local_cognitiveloadtips\tip_manager::get_tips_for_difficulty($difficulty, $language);
    $cache->set($cachekey, $tips);
}
```

### Database Indexing

Already optimized with indexes on:
- `difficulty_min, difficulty_max, enabled`
- `language`
- `questionid`
- `userid, questionid`

---

## Support

For integration assistance:
- Email: support@kaist.ac.kr
- Documentation: See README.md
- API Reference: /local/cognitiveloadtips/api/docs

---

## License

GNU GPL v3.0
