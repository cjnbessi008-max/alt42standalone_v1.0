# LMS Integration Guide

## Overview

The 3D Matching Guide supports integration with Learning Management Systems (LMS) like Moodle through LTI (Learning Tools Interoperability) and REST API.

## Supported LMS Platforms

- **Moodle 3.7+** (Primary target)
- **Canvas LMS** (Future support)
- **Blackboard Learn** (Future support)

## Integration Methods

### 1. LTI (Learning Tools Interoperability)

LTI is the standard protocol for integrating external tools with LMS platforms.

#### Moodle LTI Setup

1. **In Moodle (as Administrator)**:
   - Navigate to Site Administration > Plugins > Activity modules > External tool > Manage tools
   - Click "Configure a tool manually"
   - Fill in the configuration:
     - Tool name: `3D Matching Guide`
     - Tool URL: `https://your-domain.com/lti/launch`
     - Consumer key: (generate a secure key)
     - Shared secret: (generate a secure secret)
   - Set privacy settings:
     - Share launcher's name with tool: Yes
     - Share launcher's email with tool: Yes
   - Save changes

2. **In 3D Matching Guide**:
   - Use the LMS configuration API endpoint:
     ```bash
     POST /api/lms/configure
     {
       "lms_type": "moodle",
       "lms_url": "https://your-moodle.com",
       "consumer_key": "your-consumer-key",
       "shared_secret": "your-shared-secret",
       "course_id": "course-123"
     }
     ```

3. **Add to Course**:
   - In your Moodle course, add an "External tool" activity
   - Select "3D Matching Guide" from the preconfigured tools
   - Configure which problem to display

#### LTI Launch Flow

```
Student clicks activity in Moodle
    ↓
Moodle sends LTI launch request (signed with OAuth)
    ↓
3D Matching Guide validates signature
    ↓
Creates/authenticates user session
    ↓
Displays the matching problem
    ↓
Student completes activity
    ↓
Results sent back to Moodle gradebook
```

### 2. REST API Integration

For custom integrations, use the REST API to sync problems and results.

#### Authentication

Use API keys for authentication:

```bash
# Get API key from admin panel
curl -X POST https://your-domain.com/api/auth/api-key \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"name": "Moodle Integration", "permissions": ["read", "write"]}'
```

#### Sync Problems from Moodle

```bash
POST /api/lms/sync
Content-Type: application/json
Authorization: Bearer ${API_KEY}

{
  "lms_id": 1,
  "sync_type": "problems",
  "module_ids": ["mod_123", "mod_456"]
}
```

#### Get Problems for Module

```bash
GET /api/lms/problems/mod_123
Authorization: Bearer ${API_KEY}
```

Response:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "title": "Basic 3D Matching",
      "lms_module_id": "mod_123",
      "difficulty_level": 1,
      "pair_count": 6
    }
  ]
}
```

#### Submit Results to LMS

```bash
POST /api/lms/submit-grade
Content-Type: application/json
Authorization: Bearer ${API_KEY}

{
  "student_id": 123,
  "problem_id": 1,
  "lms_user_id": "moodle_user_456",
  "score": 85,
  "max_score": 100,
  "completed_at": "2023-12-01T10:30:00Z"
}
```

## Moodle Integration Example

### Step-by-Step Integration

1. **Create Problem in 3D Matching Guide**:
```bash
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Geometry Basics",
    "title_ko": "기하학 기초",
    "description": "Match 3D shapes with 2D representations",
    "difficulty_level": 1,
    "category": "geometry",
    "lms_module_id": "mod_123",
    "created_by": 1
  }'
```

2. **Configure LMS Integration**:
```bash
curl -X POST http://localhost:5000/api/lms/configure \
  -H "Content-Type: application/json" \
  -d '{
    "lms_type": "moodle",
    "lms_url": "https://moodle.kaist.ac.kr",
    "lms_api_key": "your-moodle-api-key",
    "consumer_key": "your-consumer-key",
    "shared_secret": "your-shared-secret",
    "course_id": "course_123"
  }'
```

3. **Check LMS Status**:
```bash
curl http://localhost:5000/api/lms/status
```

## Database Schema

### LMS Integrations Table

```sql
CREATE TABLE lms_integrations (
  id SERIAL PRIMARY KEY,
  lms_type VARCHAR(50) NOT NULL,          -- 'moodle', 'canvas', etc.
  lms_url VARCHAR(500) NOT NULL,
  lms_api_key VARCHAR(255),
  consumer_key VARCHAR(255),               -- For LTI
  shared_secret VARCHAR(255),              -- For LTI
  course_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50),
  config JSONB,                            -- Additional configuration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Problems Table (LMS Fields)

```sql
-- Additional fields in problems table
lms_problem_id VARCHAR(100),    -- External LMS problem ID
lms_module_id VARCHAR(100),     -- LMS module/activity ID
```

### Users Table (LMS Fields)

```sql
-- Additional field in users table
lms_user_id VARCHAR(100),       -- External LMS user ID
```

## Configuration

### Environment Variables

```bash
# Enable LMS integration
LMS_INTEGRATION_ENABLED=true

# LMS API settings
LMS_API_URL=https://moodle.kaist.ac.kr/webservice/rest/server.php
LMS_API_KEY=your-moodle-web-service-key

# LTI settings
LTI_CONSUMER_KEY=your-consumer-key
LTI_SHARED_SECRET=your-shared-secret
```

## Security Considerations

1. **OAuth Signature Validation**: Always validate LTI launch requests
2. **HTTPS Only**: Use HTTPS for all LMS communications
3. **API Key Rotation**: Rotate API keys regularly
4. **User Privacy**: Only request necessary user data
5. **Data Encryption**: Encrypt sensitive data in transit and at rest

## Gradebook Integration

### Sending Grades to Moodle

Use the Moodle Gradebook API:

```php
// Moodle side (example)
require_once($CFG->libdir . '/gradelib.php');

$grade_item = array(
    'itemname' => '3D Matching Guide',
    'gradetype' => GRADE_TYPE_VALUE,
    'grademax' => 100,
    'grademin' => 0
);

grade_update('mod/lti', $course->id, 'mod', 'lti', $lti->id, 0, $grade, $grade_item);
```

### Grade Sync API

```bash
POST /api/lms/sync-grades
Authorization: Bearer ${API_KEY}

{
  "lms_id": 1,
  "module_id": "mod_123",
  "grades": [
    {
      "lms_user_id": "user_456",
      "student_id": 2,
      "problem_id": 1,
      "score": 85,
      "max_score": 100
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **LTI Launch Fails**:
   - Check consumer key and shared secret
   - Verify OAuth signature
   - Check server time sync

2. **Grades Not Syncing**:
   - Verify API key permissions
   - Check gradebook configuration
   - Review sync logs

3. **User Authentication Issues**:
   - Verify LMS user ID mapping
   - Check session management
   - Review CORS settings

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

Check logs:
```bash
tail -f combined.log | grep LMS
```

## Future Enhancements (Phase 3)

- [ ] Full LTI 1.3 support
- [ ] Deep linking support
- [ ] Canvas LMS integration
- [ ] Blackboard Learn integration
- [ ] Assignment passing (LTI Outcomes)
- [ ] Content-Item Message support
- [ ] Roster sync automation
- [ ] Single Sign-On (SSO) with SAML

## Support

For LMS integration support, contact:
- Email: support@example.com
- Documentation: https://docs.example.com/lms-integration
- GitHub Issues: https://github.com/your-org/3d-matching-guide/issues
