# LMS Integration Guide

## Overview

The DMN Math Game supports LTI 1.3 (Learning Tools Interoperability) for seamless integration with Learning Management Systems like Canvas, Moodle, and Blackboard.

## Prerequisites

- Access to LMS admin panel
- Your DMN Math Game instance URL
- SSL/TLS certificate (required for LTI 1.3)

## Setup Steps

### 1. Configure Your DMN Math Game Instance

First, set up the LTI configuration in your backend environment:

```bash
# backend/.env
BASE_URL=https://your-domain.com
LTI_CLIENT_ID=your-client-id-from-lms
LTI_DEPLOYMENT_ID=your-deployment-id-from-lms
LTI_ISS=https://your-lms-platform.com
LTI_AUTH_URL=https://your-lms-platform.com/api/lti/authorize_redirect
LTI_TOKEN_URL=https://your-lms-platform.com/login/oauth2/token
LTI_KEYSET_URL=https://your-lms-platform.com/api/lti/security/jwks
```

### 2. Register the Tool in Your LMS

#### For Canvas

1. Navigate to **Admin** → **Developer Keys** → **+ Developer Key** → **+ LTI Key**

2. Use the following configuration JSON (or access it at `https://your-domain.com/api/lti/config.json`):

```json
{
  "title": "DMN Math Game",
  "description": "A mini arithmetic game for Default Mode Network recovery",
  "oidc_initiation_url": "https://your-domain.com/api/lti/login",
  "target_link_uri": "https://your-domain.com/api/lti/launch",
  "scopes": [
    "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
    "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
    "https://purl.imsglobal.org/spec/lti-ags/scope/score"
  ],
  "public_jwk_url": "https://your-domain.com/api/lti/jwks"
}
```

3. Configure placements:
   - **Course Navigation**: Students can access the game from course menu
   - **Assignment Selection**: Teachers can add the game as an assignment

4. Save and note the **Client ID** - you'll need this for your `.env` file

#### For Moodle

1. Navigate to **Site Administration** → **Plugins** → **Activity modules** → **External tool** → **Manage tools**

2. Click **Configure a tool manually**

3. Fill in:
   - **Tool name**: DMN Math Game
   - **Tool URL**: `https://your-domain.com/api/lti/launch`
   - **LTI version**: LTI 1.3
   - **Public key type**: Keyset URL
   - **Public keyset**: `https://your-domain.com/api/lti/jwks`
   - **Initiate login URL**: `https://your-domain.com/api/lti/login`
   - **Redirection URI(s)**: `https://your-domain.com/api/lti/launch`

4. Enable required services:
   - Assignment and Grade Services
   - Names and Role Provisioning Services

5. Save and note the **Client ID**

#### For Blackboard Learn

1. Navigate to **System Admin** → **Integrations** → **LTI Tool Providers** → **Register LTI 1.3 Tool**

2. Enter your configuration:
   - **Client ID**: Generate new (copy this for your `.env`)
   - **Tool Login Initiation URL**: `https://your-domain.com/api/lti/login`
   - **Tool Redirect URL**: `https://your-domain.com/api/lti/launch`
   - **Tool JWKS URL**: `https://your-domain.com/api/lti/jwks`

3. Enable placements and save

### 3. Add the Game to a Course

#### Canvas
1. Go to your course
2. Click **Settings** → **Navigation**
3. Find "DMN Math Game" and drag it to the active area
4. Save

Or add as an assignment:
1. **Assignments** → **+ Assignment**
2. **Submission Type** → **External Tool**
3. Find and select "DMN Math Game"

#### Moodle
1. Turn editing on
2. **Add an activity or resource** → **External tool**
3. Select "DMN Math Game" from the preconfigured tools
4. Configure and save

#### Blackboard
1. **Content** → **Build Content** → **LTI Link**
2. Select "DMN Math Game"
3. Configure and submit

## Testing the Integration

1. Launch the game from your LMS course as a student
2. Verify that:
   - You're automatically logged in (no separate authentication)
   - Your LMS user information is displayed
   - Game progress is tracked
   - Scores are sent back to the LMS (if configured as an assignment)

## Grade Passback

The DMN Math Game automatically sends scores back to the LMS when:
- The game is added as a graded assignment
- A student completes a game session (10 problems)

The score is calculated as: `(correct_answers / total_problems) × 100`

### Viewing Grades in LMS

**Canvas**: Navigate to **Grades** to see student scores

**Moodle**: Check the **Gradebook**

**Blackboard**: View in **Grade Center**

## Troubleshooting

### "Invalid LTI launch" error

**Cause**: Configuration mismatch between LMS and tool

**Solution**:
1. Verify all URLs in your `.env` file match your LMS configuration
2. Check that your `CLIENT_ID` and `DEPLOYMENT_ID` are correct
3. Ensure your tool is deployed over HTTPS (LTI 1.3 requirement)

### Students not being created

**Cause**: Missing user information in LTI launch

**Solution**:
1. In LMS tool configuration, ensure "Send user data" is enabled
2. Check privacy settings in the LMS

### Grades not appearing in LMS

**Cause**: Grade passback not configured or failing

**Solution**:
1. Verify the Assignment and Grade Services (AGS) scope is enabled
2. Check backend logs for grade passback errors
3. Ensure the LMS assignment is configured to accept grades

### Session timeout issues

**Cause**: LTI session expiration

**Solution**:
1. Check your `SECRET_KEY` in backend `.env`
2. Verify Redis is running for session storage
3. Consider increasing session timeout in LTI configuration

## Security Considerations

1. **HTTPS Required**: LTI 1.3 mandates HTTPS. Do not use HTTP in production.

2. **Key Rotation**: Regularly rotate your LTI keys (recommended: every 6 months)

3. **Validate Launches**: The tool validates all LTI launches. Never skip validation.

4. **Secure Storage**: Store `CLIENT_ID`, `DEPLOYMENT_ID`, and `SECRET_KEY` securely. Never commit them to version control.

## Advanced Configuration

### Custom Launch Parameters

You can pass custom parameters from the LMS to customize behavior:

In LMS tool configuration, add custom parameters:
```
difficulty_level=2
max_problems=15
```

### Multiple LMS Support

To support multiple LMS platforms simultaneously, update `lti_config.json`:

```json
{
  "https://canvas.instructure.com": [{...}],
  "https://moodle.org": [{...}],
  "https://blackboard.com": [{...}]
}
```

## Support

For integration issues:
1. Check the [main README](../README.md)
2. Review backend logs: `docker-compose logs backend`
3. Enable debug mode: `FLASK_DEBUG=True` in `.env`

## References

- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3)
- [Canvas LTI Documentation](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)
- [Moodle LTI Documentation](https://docs.moodle.org/en/LTI_and_Moodle)
