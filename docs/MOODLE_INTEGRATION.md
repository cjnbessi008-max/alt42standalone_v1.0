# Moodle Integration Guide

## Overview

This application integrates with Moodle LMS (3.7+) using Web Services API to:
- Sync student information
- Fetch assignment submissions
- Send feedback to students
- Update grades

## Prerequisites

- Moodle 3.7 or higher
- MySQL 5.7+ (Moodle database)
- PHP 7.1.9+ (Moodle environment)
- Administrator access to Moodle

## Step 1: Enable Web Services in Moodle

### 1.1 Enable Web Services

1. Log in as Moodle administrator
2. Navigate to: **Site administration → Advanced features**
3. Enable "Enable web services"
4. Click "Save changes"

### 1.2 Enable REST Protocol

1. Go to: **Site administration → Server → Web services → Manage protocols**
2. Enable "REST protocol"

## Step 2: Create Web Service User

### 2.1 Create a Service Account

1. Go to: **Site administration → Users → Accounts → Add a new user**
2. Create a user with:
   - Username: `ws_loopdetector`
   - Email: `loopdetector@yourdomain.com`
   - Password: (strong password)
3. Assign "Manager" or "Teacher" role

### 2.2 Create Web Service Role

1. Go to: **Site administration → Users → Permissions → Define roles**
2. Click "Add a new role"
3. Set:
   - Short name: `webservice_loopdetector`
   - Full name: `Loop Detector Web Service`
4. Assign capabilities:
   - `webservice/rest:use`
   - `moodle/user:viewdetails`
   - `moodle/course:viewparticipants`
   - `mod/assign:view`
   - `mod/assign:grade`
   - `moodle/course:useremail`

### 2.3 Assign Role to User

1. Go to user profile of `ws_loopdetector`
2. Assign the `webservice_loopdetector` role

## Step 3: Create External Service

### 3.1 Create Service

1. Go to: **Site administration → Server → Web services → External services**
2. Click "Add"
3. Configure:
   - Name: `Loop Detector Service`
   - Short name: `loopdetector`
   - Enabled: Yes
   - Authorised users only: Yes

### 3.2 Add Functions

Click "Add functions" and add these:

**User Functions:**
- `core_user_get_users_by_field`
- `core_user_get_users`
- `core_enrol_get_enrolled_users`

**Assignment Functions:**
- `mod_assign_get_assignments`
- `mod_assign_get_submissions`
- `mod_assign_save_grade`

**Messaging Functions:**
- `core_message_send_instant_messages`

**Course Functions:**
- `core_course_get_courses`
- `core_course_get_contents`

### 3.3 Authorize User

1. In "External services", click "Authorised users"
2. Add user: `ws_loopdetector`

## Step 4: Generate Token

### 4.1 Create Token

1. Go to: **Site administration → Server → Web services → Manage tokens**
2. Click "Add"
3. Select:
   - User: `ws_loopdetector`
   - Service: `Loop Detector Service`
4. Click "Save changes"
5. **Copy the generated token** (you'll need this)

## Step 5: Configure Application

### 5.1 Update Environment Variables

Edit your `.env` file:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
```

### 5.2 Test Connection

Run this test script:

```python
import asyncio
from app.services.moodle_service import MoodleService

async def test_moodle():
    service = MoodleService()
    # Test with a known user ID
    user = await service.get_user_info(2)  # Use actual user ID
    print(f"User: {user}")

asyncio.run(test_moodle())
```

## Step 6: Usage Examples

### Sync a Student from Moodle

```bash
curl -X POST http://localhost:8000/api/moodle/sync-user/123 \
  -H "Content-Type: application/json"
```

Where `123` is the Moodle user ID.

### Get Assignment Submissions

```bash
curl http://localhost:8000/api/moodle/assignment/456/submissions
```

Where `456` is the Moodle assignment ID.

### Send Feedback to Student

```bash
curl -X POST http://localhost:8000/api/moodle/send-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "subject": "Code Analysis Results",
    "message": "Your code has been analyzed. Efficiency score: 85/100"
  }'
```

## Step 7: Moodle Plugin (Optional)

For deeper integration, create a Moodle plugin:

### Plugin Structure

```
local/loopdetector/
├── version.php
├── lib.php
├── classes/
│   └── external.php
├── db/
│   ├── access.php
│   └── services.php
└── lang/
    └── en/
        └── local_loopdetector.php
```

### Example version.php

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_loopdetector';
$plugin->version = 2024011800;
$plugin->requires = 2019051100; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0';
```

### Example External Service

```php
<?php
namespace local_loopdetector;

class external extends \external_api {
    public static function submit_code_parameters() {
        return new \external_function_parameters([
            'code' => new \external_value(PARAM_TEXT, 'PHP code to analyze'),
            'assignmentid' => new \external_value(PARAM_INT, 'Assignment ID'),
        ]);
    }

    public static function submit_code($code, $assignmentid) {
        // Call your standalone API
        $ch = curl_init('http://your-detector.com/api/analysis/analyze');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'code' => $code,
            'assignment_id' => $assignmentid
        ]));
        // ... handle response
    }
}
```

## Troubleshooting

### Token Authentication Fails

- Verify token is correct
- Check token hasn't expired
- Ensure service is enabled
- Verify user has correct permissions

### Cannot Fetch User Data

- Check user ID is valid
- Verify `core_user_get_users_by_field` function is added
- Check user privacy settings

### Cannot Update Grades

- Verify `mod_assign_save_grade` function is enabled
- Check user has grading permissions
- Ensure assignment exists and is not locked

### CORS Errors

Add to Moodle config.php:

```php
$CFG->webservicecors = true;
$CFG->webservicecorsallowedorigins = 'http://localhost:3000';
```

## Security Best Practices

1. **Token Security**
   - Store token in environment variables only
   - Never commit token to version control
   - Rotate tokens periodically

2. **User Permissions**
   - Use least privilege principle
   - Create dedicated service account
   - Don't use admin account

3. **Network Security**
   - Use HTTPS for Moodle
   - Use HTTPS for your application
   - Restrict API access by IP if possible

4. **Monitoring**
   - Log all Moodle API calls
   - Monitor for unusual activity
   - Set up alerts for failures

## Advanced: Assignment Integration

### Create Custom Assignment Type

You can create a Moodle assignment type that integrates directly:

```php
// mod/assign/submission/loopdetector/locallib.php
class assign_submission_loopdetector extends assign_submission_plugin {
    public function get_name() {
        return get_string('loopdetector', 'assignsubmission_loopdetector');
    }

    public function save(stdClass $submission, stdClass $data) {
        // Submit code to analysis API
        // Store results
    }
}
```

This allows students to submit code directly in Moodle and see analysis results.

## Support

For issues related to:
- **Moodle configuration**: Check Moodle documentation
- **Web services**: Moodle forums
- **Application integration**: Open an issue in this repository
