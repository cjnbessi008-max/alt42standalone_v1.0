# Moodle LTI 1.3 Integration Guide

## Overview

This guide explains how to integrate the AI Education System with Moodle 3.7+ using LTI 1.3 (Learning Tools Interoperability).

## Prerequisites

- Moodle 3.7 or higher
- MySQL 5.7 database
- PHP 7.1.9 or higher
- Admin access to Moodle instance

## Architecture

```
┌─────────────┐         LTI 1.3          ┌──────────────────┐
│   Moodle    │ ◄──────────────────────► │  AI Education    │
│   3.7+      │    OIDC + OAuth 2.0      │  System (Tool)   │
└─────────────┘                           └──────────────────┘
     (Platform)                              (Tool Provider)
```

## Step 1: Register as External Tool in Moodle

### 1.1 Access External Tools

1. Log in to Moodle as administrator
2. Navigate to: **Site administration** → **Plugins** → **Activity modules** → **External tool** → **Manage tools**

### 1.2 Add LTI 1.3 Tool

Click **Configure a tool manually** and enter:

| Field | Value |
|-------|-------|
| **Tool name** | AI Education System |
| **Tool URL** | `https://your-domain.com/api/lti/launch` |
| **LTI version** | LTI 1.3 |
| **Public key type** | Keyset URL |
| **Public keyset URL** | `https://your-domain.com/api/lti/jwks` |
| **Initiate login URL** | `https://your-domain.com/api/lti/login` |
| **Redirection URI(s)** | `https://your-domain.com/api/lti/callback` |

### 1.3 Configure Tool Settings

Enable the following:

- ✅ **Share launcher's name with tool**
- ✅ **Share launcher's email with tool**
- ✅ **Accept grades from the tool** (for grade passback)
- ✅ **Force SSL**

### 1.4 Save Configuration

Click **Save changes** and note the **Tool configuration details**:
- Platform ID
- Client ID
- Deployment ID
- Public keyset URL
- Access token URL
- Authentication request URL

## Step 2: Configure AI Education System

### 2.1 Set Environment Variables

Create/update `.env` in the API Gateway:

```bash
# LTI Configuration
LTI_ENABLED=true
LTI_PLATFORM_NAME=Moodle
LTI_PLATFORM_URL=https://your-moodle-domain.com
LTI_CLIENT_ID=<client-id-from-moodle>
LTI_DEPLOYMENT_ID=<deployment-id-from-moodle>
LTI_AUTH_ENDPOINT=<auth-endpoint-from-moodle>
LTI_TOKEN_ENDPOINT=<token-endpoint-from-moodle>
LTI_JWKS_URL=<jwks-url-from-moodle>

# Database (must be MySQL 5.7 for Moodle compatibility)
DATABASE_URL=mysql://user:password@localhost:3306/ai_education
```

### 2.2 Register Platform in Database

```sql
INSERT INTO lti_integrations (
  id,
  platform_name,
  platform_url,
  client_id,
  deployment_id,
  auth_endpoint,
  token_endpoint,
  jwks_url,
  is_active
) VALUES (
  UUID(),
  'Moodle',
  'https://your-moodle-domain.com',
  '<client-id>',
  '<deployment-id>',
  '<auth-endpoint>',
  '<token-endpoint>',
  '<jwks-url>',
  TRUE
);
```

### 2.3 Restart Services

```bash
cd docker
docker-compose restart api-gateway
```

## Step 3: Test Integration

### 3.1 Add External Tool to Course

1. In Moodle, go to a course
2. Turn editing on
3. Click **Add an activity or resource**
4. Select **External tool**
5. Choose **AI Education System** from preconfigured tools
6. Click **Add**

### 3.2 Verify Launch

1. Click on the created activity
2. You should be redirected to the AI Education System
3. User information should be automatically populated

## Step 4: Enable Grade Passback (Optional)

### 4.1 Configure in AI Education System

Update module settings to enable grade sync:

```javascript
// In module configuration
{
  "grading": {
    "enabled": true,
    "max_score": 100,
    "passing_score": 70,
    "sync_to_lms": true
  }
}
```

### 4.2 Test Grade Sync

1. Complete a module activity
2. Check Moodle gradebook
3. Grades should appear automatically

## Troubleshooting

### Issue: "Invalid LTI launch"

**Cause**: Incorrect endpoint configuration

**Solution**:
- Verify all URLs in Moodle tool configuration
- Ensure HTTPS is used (not HTTP)
- Check that endpoints are accessible

### Issue: "Authentication failed"

**Cause**: Client ID or deployment ID mismatch

**Solution**:
- Double-check Client ID in `.env` matches Moodle
- Verify Deployment ID is correct
- Clear Redis cache: `docker-compose restart redis`

### Issue: "User information not passed"

**Cause**: Privacy settings in Moodle

**Solution**:
- In Moodle tool settings, enable:
  - Share launcher's name
  - Share launcher's email
  - Share launcher's ID

### Issue: "Grades not syncing"

**Cause**: Assignment and Grade Services (AGS) not enabled

**Solution**:
- In Moodle tool settings, enable "Accept grades from tool"
- Check API permissions for grade writing

## Security Considerations

### 1. HTTPS Only
- **Always** use HTTPS in production
- Never use HTTP for LTI endpoints

### 2. Validate JWT Tokens
- All LTI messages are signed JWT tokens
- Verify signature using platform's public key
- Check token expiration

### 3. Platform Whitelist
- Only accept launches from registered platforms
- Validate `iss` claim matches platform URL

### 4. State Parameter
- Use cryptographically secure random state
- Validate state parameter in callback
- Prevent CSRF attacks

## Advanced Features

### Deep Linking

Allow teachers to select specific modules from Moodle:

```javascript
// LTI Deep Linking response
{
  "type": "ltiResourceLink",
  "title": "Fractions Module",
  "url": "https://your-domain.com/modules/fractions",
  "custom": {
    "module_id": "module-uuid"
  }
}
```

### Names and Roles Provisioning (NRPS)

Access course roster from Moodle:

```javascript
// Get course members
const members = await lti.getNamesAndRoles(contextId);
```

## Reference

- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [Moodle LTI Documentation](https://docs.moodle.org/en/External_tool)
- [ltijs Library Documentation](https://cvmcosta.me/ltijs/)

## Support

For integration issues:
1. Check logs: `docker-compose logs api-gateway`
2. Enable debug mode in `.env`: `LOG_LEVEL=debug`
3. Contact development team

## Changelog

- **2025-01-18**: Initial Moodle 3.7 LTI 1.3 integration guide
