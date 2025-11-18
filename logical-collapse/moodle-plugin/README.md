# Moodle Plugin for Logical Collapse

## Overview

This directory contains the Moodle plugin integration for the Logical Collapse system. The plugin enables Moodle 3.7 to communicate with the Logical Collapse web app.

## Requirements

- Moodle 3.7
- PHP 7.1.9+
- MySQL 5.7+
- Web Services enabled in Moodle

## Installation

### 1. Enable Moodle Web Services

1. Log in to Moodle as administrator
2. Go to **Site Administration > Advanced Features**
3. Enable "Enable web services"
4. Save changes

### 2. Create Web Service

1. Go to **Site Administration > Plugins > Web Services > External Services**
2. Click "Add"
3. Name: `Logical Collapse API`
4. Short name: `logical_collapse`
5. Enabled: Yes
6. Select required functions:
   - `mod_quiz_get_quiz_by_courses`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_save_attempt`
   - `core_user_get_users_by_field`
   - `core_grades_update_grades`

### 3. Create Service User

1. Go to **Site Administration > Plugins > Web Services > Manage tokens**
2. Click "Add"
3. Select User (create a dedicated service user)
4. Select Service: `Logical Collapse API`
5. Copy the generated token

### 4. Configure Logical Collapse

Add the token to your `.env` file:

```env
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
```

## Web Service Functions

### `mod_quiz_get_quiz_by_courses`
Fetches quiz/problem data from Moodle courses.

**Parameters:**
- `courseids` (optional): Array of course IDs

**Returns:**
- Array of quiz objects with questions

### `mod_quiz_save_attempt`
Saves student attempt data back to Moodle.

**Parameters:**
- `attemptid`: Quiz attempt ID
- `data`: JSON string with step validation data

**Returns:**
- Success status

### `core_user_get_users_by_field`
Gets user information by field.

**Parameters:**
- `field`: Field name (id, username, email)
- `values`: Array of values to search

**Returns:**
- Array of user objects

## Data Mapping

### Moodle Quiz → Logical Collapse Problem

```
Moodle Quiz {
  id → problem.moodle_id
  name → problem.title
  intro → problem.description
  questions → problem.reasoning_steps (transformed)
}
```

### Logical Collapse Validation → Moodle Attempt

```
Step Validation {
  problem_id → quiz attempt ID
  step_index → question slot
  is_correct → grade (1 or 0)
  student_id → Moodle user ID
}
```

## Custom Question Type (Optional)

For advanced integration, you can create a custom Moodle question type for logical reasoning:

1. Navigate to `/question/type/` in your Moodle installation
2. Create a new folder `logicalreasoning`
3. Implement the question type interface
4. Register the question type

See Moodle documentation for creating custom question types:
https://docs.moodle.org/dev/Question_types

## Troubleshooting

### Token Authentication Fails

1. Check that web services are enabled
2. Verify the token is correct
3. Ensure the service user has necessary capabilities
4. Check Moodle logs: **Site Administration > Reports > Logs**

### Quiz Data Not Syncing

1. Verify web service functions are added to the service
2. Check that quizzes are published and visible
3. Review Moodle web service logs
4. Test the web service using Moodle's web service test client

### CORS Issues

If running Moodle and Logical Collapse on different domains:

1. Install Moodle CORS plugin or configure Apache/Nginx headers
2. Add to Moodle config:

```php
$CFG->allowedcorsorigins = [
    'http://localhost:3000',
    'http://your-logical-collapse-domain.com'
];
```

## Security Considerations

1. **Token Security**: Never commit tokens to version control
2. **HTTPS**: Use HTTPS in production for Moodle API calls
3. **IP Restrictions**: Limit web service access by IP if possible
4. **Capability Checks**: Ensure service user has minimal required capabilities
5. **Rate Limiting**: Implement rate limiting on API calls

## Testing

Test the integration with curl:

```bash
curl "http://your-moodle-site.com/webservice/rest/server.php?\
wstoken=YOUR_TOKEN&\
wsfunction=core_webservice_get_site_info&\
moodlewsrestformat=json"
```

Expected response should include site information.

## Support

For Moodle-specific issues:
- Moodle Documentation: https://docs.moodle.org
- Moodle Forums: https://moodle.org/forums/

For Logical Collapse integration:
- See main README.md in project root
