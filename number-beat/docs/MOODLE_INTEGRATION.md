# Moodle Integration Guide

## Overview

Number Beat integrates with Moodle 3.7 LMS using Web Services (REST API) to:
1. Fetch quiz problems from Moodle courses
2. Sync student enrollment data
3. Send grades back to Moodle

## Prerequisites

- Moodle 3.7 installed and running
- Administrator access to Moodle
- Number Beat application installed

## Step 1: Enable Web Services in Moodle

### 1.1 Enable Web Services

1. Log in to Moodle as administrator
2. Navigate to: **Site administration > Advanced features**
3. Check "Enable web services"
4. Save changes

### 1.2 Enable REST Protocol

1. Navigate to: **Site administration > Plugins > Web services > Manage protocols**
2. Enable **REST protocol**

## Step 2: Create Web Service User

### 2.1 Create Dedicated User

1. Navigate to: **Site administration > Users > Accounts > Add a new user**
2. Create user with following details:
   - Username: `numberbeat_ws`
   - Password: (strong password)
   - Email: `numberbeat@yourdomain.com`
   - First name: `Number Beat`
   - Surname: `Web Service`

### 2.2 Assign System Role

1. Navigate to: **Site administration > Users > Permissions > Assign system roles**
2. Select **Manager** or create custom role with permissions:
   - `moodle/webservice:createtoken`
   - `mod/quiz:view`
   - `mod/quiz:attempt`
   - `mod/quiz:reviewmyattempts`
   - `enrol/manual:enrol`

## Step 3: Create External Service

### 3.1 Add External Service

1. Navigate to: **Site administration > Plugins > Web services > External services**
2. Click "Add" to create new service
3. Configure:
   - **Name**: `Number Beat Service`
   - **Short name**: `numberbeat_service`
   - **Enabled**: Yes
   - **Authorized users only**: Yes

### 3.2 Add Functions

Add the following functions to the service:

| Function Name | Description |
|--------------|-------------|
| `mod_quiz_get_quizzes_by_courses` | Get quizzes in courses |
| `mod_quiz_get_quiz_data` | Get quiz questions |
| `core_enrol_get_enrolled_users` | Get enrolled students |
| `mod_quiz_save_attempt` | Save quiz attempt/grade |
| `core_user_get_users` | Get user information |

To add functions:
1. Click on "Functions" for your service
2. Click "Add functions"
3. Search and add each function listed above

## Step 4: Create Web Service Token

### 4.1 Generate Token

1. Navigate to: **Site administration > Plugins > Web services > Manage tokens**
2. Click "Add"
3. Configure:
   - **User**: Select `numberbeat_ws`
   - **Service**: Select `Number Beat Service`
   - **Valid until**: Leave empty (or set expiration date)
4. Click "Save changes"
5. **Copy the generated token** - you'll need this for Number Beat configuration

### 4.2 Configure Number Beat

1. Open `number-beat/config/config.php`
2. Set the following values:

```php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_generated_token_here');
define('MOODLE_SERVICE', 'numberbeat_service');
```

## Step 5: Create Number Beat Quiz Format

### 5.1 Quiz Structure

Create a quiz in Moodle with custom question types for Number Beat problems.

### 5.2 Custom Fields

Each question should include custom JSON data in the "Question text" or use custom question type.

#### Example Question Format

**Question Name**: `순서대로 배열하기 1`

**Question Text**:
```
1부터 5까지 숫자를 순서대로 리듬에 맞춰 배열하세요
```

**Custom Data** (add in Additional content or custom field):
```json
{
  "number_sequence": "3,1,5,2,4",
  "rhythm_pattern": "quarter,quarter,quarter,quarter,quarter",
  "correct_order": "1,2,3,4,5",
  "difficulty": "easy"
}
```

### 5.3 Creating Custom Question Type (Optional)

For better integration, create a custom Moodle question type:

1. Create plugin folder: `moodle/question/type/numberbeat/`
2. Define question fields:
   - Number sequence
   - Rhythm pattern
   - Correct order
   - Difficulty level
3. Implement rendering for Moodle preview

## Step 6: Sync Data

### 6.1 Initial Sync

After creating quizzes in Moodle, sync data to Number Beat:

```bash
# Using curl
curl -X POST http://your-numberbeat-site.com/api/game_api.php/sync-moodle \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1}'
```

Or use the web interface (if implemented).

### 6.2 Automatic Sync

Set up a cron job for regular synchronization:

```bash
# Edit crontab
crontab -e

# Add line to sync every hour
0 * * * * curl -X POST http://your-numberbeat-site.com/api/game_api.php/sync-moodle -H "Content-Type: application/json" -d '{"course_id": 1}'
```

## Step 7: Test Integration

### 7.1 Test Problem Sync

1. Create a test quiz in Moodle
2. Add Number Beat questions
3. Run sync
4. Verify problems appear in Number Beat database:

```sql
SELECT * FROM problems WHERE moodle_course_id = 1;
```

### 7.2 Test Student Sync

1. Enroll test students in Moodle course
2. Run sync
3. Verify students in Number Beat:

```sql
SELECT * FROM students;
```

### 7.3 Test Grade Submission

1. Student completes a problem in Number Beat
2. Check Moodle gradebook for submitted grade
3. Verify in `moodle_sync_log`:

```sql
SELECT * FROM moodle_sync_log WHERE sync_type = 'grades' ORDER BY synced_at DESC;
```

## Troubleshooting

### Web Service Not Accessible

**Error**: "Web service not available"

**Solution**:
1. Verify web services are enabled
2. Check REST protocol is active
3. Verify token is valid and not expired
4. Check user permissions

### Authentication Failed

**Error**: "Invalid token" or "Access denied"

**Solution**:
1. Regenerate token
2. Verify token in `config.php` matches Moodle
3. Check web service user has proper roles
4. Verify authorized users setting on external service

### Function Not Available

**Error**: "Function not available"

**Solution**:
1. Add missing function to external service
2. Verify function name is correct
3. Check if function exists in your Moodle version

### No Problems Synced

**Issue**: Sync reports 0 problems synced

**Solution**:
1. Verify quiz exists in course
2. Check question format includes custom data
3. Review sync logs:
```sql
SELECT * FROM moodle_sync_log WHERE status = 'failed';
```
4. Enable debug mode in `config.php`

### CORS Errors

**Error**: "Access-Control-Allow-Origin" error

**Solution**:
Add to Moodle config.php:
```php
$CFG->forced_plugin_settings['moodle']['webservice_rest_cors_header'] = '*';
```

Or configure properly for your domain:
```php
$CFG->forced_plugin_settings['moodle']['webservice_rest_cors_header'] = 'https://your-numberbeat-site.com';
```

## Security Considerations

### 1. Token Security

- **Never** commit tokens to version control
- Use environment variables for tokens
- Set token expiration dates
- Rotate tokens regularly (every 90 days)

### 2. User Permissions

- Use dedicated web service user
- Grant minimum required permissions
- Regularly audit web service access logs

### 3. HTTPS

- **Always** use HTTPS for both Moodle and Number Beat
- Enable HTTPS-only cookies
- Use secure token transmission

### 4. IP Restrictions

Restrict web service access by IP (in Moodle):

1. Navigate to: **Site administration > Plugins > Web services > Manage tokens**
2. Edit token
3. Add IP restriction (e.g., `192.168.1.100`)

### 5. Rate Limiting

Implement rate limiting on Number Beat API to prevent abuse:

```php
// In game_api.php
define('MAX_REQUESTS_PER_HOUR', 1000);
```

## Advanced Configuration

### Custom Question Parser

If using custom question format, modify `parseQuestionToProblem()` in `moodle_integration.php`:

```php
private function parseQuestionToProblem($question, $courseId) {
    // Custom parsing logic
    $customData = json_decode($question['customfield_data'], true);

    return [
        'moodle_problem_id' => $question['id'],
        'moodle_course_id' => $courseId,
        'title' => $question['name'],
        'description' => strip_tags($question['questiontext']),
        'number_sequence' => $customData['number_sequence'],
        'rhythm_pattern' => $customData['rhythm_pattern'],
        'correct_order' => $customData['correct_order'],
        // ... more fields
    ];
}
```

### Webhook for Real-time Sync

Set up Moodle webhook to trigger sync when quizzes are modified:

1. Install Moodle event observer plugin
2. Configure webhook URL: `https://your-numberbeat-site.com/api/webhook.php`
3. Listen for events:
   - `\mod_quiz\event\quiz_created`
   - `\mod_quiz\event\quiz_updated`
   - `\core\event\user_enrolment_created`

## Support

For Moodle-related issues:
- Moodle Documentation: https://docs.moodle.org/37/en/Web_services
- Moodle Forums: https://moodle.org/forums/

For Number Beat integration issues:
- Contact: support@example.com
