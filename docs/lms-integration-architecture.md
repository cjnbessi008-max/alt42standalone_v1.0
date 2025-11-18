# Moodle LTI 1.3 Integration Architecture

**Version**: 1.0
**Date**: 2025-11-18
**Target LMS**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)
**Protocol**: LTI 1.3 (Learning Tools Interoperability)

---

## 1. Executive Summary

This document defines the integration architecture between the AI Education System and Moodle LMS using the **LTI 1.3** standard. The integration enables:

1. **Single Sign-On (SSO)**: Students/teachers launch from Moodle without re-authentication
2. **Grade Passback**: Thought Efficiency Scores (TES) automatically sync to Moodle Gradebook
3. **User Provisioning**: Automatic account creation and mapping
4. **Context Awareness**: System knows which Moodle course/assignment launched the tool

### Integration Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOODLE 3.7                              │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Gradebook │  │   Courses   │  │  LTI External Tool      │ │
│  └────────────┘  └─────────────┘  └─────────────────────────┘ │
│         ↑              │                      │                  │
│         │              │                      ↓                  │
│     Grade           Launch                LTI 1.3               │
│     Sync            Request              OIDC Flow              │
└─────────────────────────────────────────────────────────────────┘
                          │                      │
                          ↓                      ↓
┌─────────────────────────────────────────────────────────────────┐
│               AI EDUCATION SYSTEM (Our Platform)                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ LTI Handler  │  │   Session    │  │  TES Calculator     │  │
│  │   (Auth)     │→ │  Management  │→ │  & Grade Passback   │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
│         ↓                                       │                │
│  ┌──────────────────────────────────────────┐  │                │
│  │         Module Learning Interface        │  │                │
│  │  (Student solves problems, TES tracked)  │  │                │
│  └──────────────────────────────────────────┘  │                │
│                                                 ↓                │
│                                         ┌─────────────────┐     │
│                                         │  PostgreSQL DB  │     │
│                                         │  (User mapping, │     │
│                                         │   TES scores)   │     │
│                                         └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. LTI 1.3 Protocol Overview

### 2.1 Why LTI 1.3?

- **Industry Standard**: Widely supported by all major LMS platforms
- **Secure**: OAuth 2.0 + OpenID Connect based authentication
- **Moodle Native**: Moodle 3.7+ has built-in LTI 1.3 support
- **Grade Passback**: Assignment and Grade Services (AGS) for automatic grade sync

### 2.2 LTI 1.3 Components

1. **Platform (Moodle)**: The LMS that launches our tool
2. **Tool (Our System)**: The external educational application
3. **OIDC Login Flow**: Secure authentication handshake
4. **Resource Links**: Specific assignments/activities in Moodle
5. **AGS (Assignment and Grade Services)**: Grade passback API

---

## 3. Authentication Flow (OIDC Login Initiation)

### Step-by-Step Flow

```
Student clicks "Launch AI Module" in Moodle
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 1: Moodle initiates OIDC login                            │
│                                                                 │
│ POST https://our-platform.com/lti/login                        │
│ {                                                               │
│   "iss": "https://lms.kaist.ac.kr",        // Moodle URL       │
│   "login_hint": "moodle_user_12345",       // User identifier  │
│   "target_link_uri": "https://our-platform.com/lti/launch",    │
│   "lti_message_hint": "eyJ...",            // Encrypted context │
│   "client_id": "kaist_client_2025"         // Our client ID    │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 2: Our platform validates issuer and redirects            │
│                                                                 │
│ 302 Redirect to:                                               │
│ https://lms.kaist.ac.kr/mod/lti/auth.php?                     │
│   scope=openid&                                                │
│   response_type=id_token&                                      │
│   client_id=kaist_client_2025&                                │
│   redirect_uri=https://our-platform.com/lti/launch&           │
│   login_hint=moodle_user_12345&                               │
│   state=random_state_xyz&                                      │
│   nonce=random_nonce_abc&                                      │
│   lti_message_hint=eyJ...                                      │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 3: Moodle authenticates user and returns JWT              │
│                                                                 │
│ POST https://our-platform.com/lti/launch                       │
│ {                                                               │
│   "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI...│
│   "state": "random_state_xyz"                                  │
│ }                                                               │
│                                                                 │
│ JWT Payload includes:                                          │
│ {                                                               │
│   "iss": "https://lms.kaist.ac.kr",                           │
│   "sub": "moodle_user_12345",                                  │
│   "aud": "kaist_client_2025",                                 │
│   "exp": 1732000000,                                           │
│   "iat": 1731999400,                                           │
│   "nonce": "random_nonce_abc",                                 │
│   "https://purl.imsglobal.org/spec/lti/claim/message_type":   │
│     "LtiResourceLinkRequest",                                  │
│   "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",│
│   "https://purl.imsglobal.org/spec/lti/claim/roles": [        │
│     "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"│
│   ],                                                            │
│   "https://purl.imsglobal.org/spec/lti/claim/context": {      │
│     "id": "course_123",                                        │
│     "label": "MATH101",                                        │
│     "title": "Introduction to Mathematics"                     │
│   },                                                            │
│   "https://purl.imsglobal.org/spec/lti/claim/resource_link": {│
│     "id": "resource_456",                                      │
│     "title": "Fractions Module"                                │
│   },                                                            │
│   "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": { │
│     "scope": ["https://purl.imsglobal.org/spec/lti-ags/..."], │
│     "lineitems": "https://lms.kaist.ac.kr/mod/lti/services.../lineitems", │
│     "lineitem": "https://lms.kaist.ac.kr/mod/lti/services.../lineitems/789" │
│   },                                                            │
│   "given_name": "Alice",                                       │
│   "family_name": "Kim",                                        │
│   "email": "alice.student@kaist.ac.kr"                        │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 4: Our platform validates JWT signature                   │
│                                                                 │
│ 1. Fetch Moodle's public keys from JWKS endpoint:             │
│    GET https://lms.kaist.ac.kr/mod/lti/certs.php              │
│                                                                 │
│ 2. Verify JWT signature using public key                       │
│ 3. Validate claims (iss, aud, exp, nonce)                     │
│ 4. Extract user info and context                               │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 5: Create/update user mapping in our database             │
│                                                                 │
│ INSERT INTO lms_user_mappings (                                │
│   lms_integration_id,                                          │
│   lms_user_id,                                                 │
│   lms_user_email,                                              │
│   lms_user_name,                                               │
│   lms_roles,                                                   │
│   user_type,                                                   │
│   student_id                                                   │
│ ) VALUES (...) ON CONFLICT (lms_user_id) DO UPDATE ...         │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 6: Create session and redirect to module interface        │
│                                                                 │
│ 1. Generate session token (JWT)                                │
│ 2. Store launch context in lms_launch_sessions table           │
│ 3. Redirect to: /modules/{module_id}?session=token            │
└────────────────────────────────────────────────────────────────┘
                │
                ↓
        Student sees module interface
        and starts solving problems
```

---

## 4. Grade Passback (AGS - Assignment and Grade Services)

### When to Send Grades

**Trigger Events**:
1. Student completes all problems in a module
2. Student's TES score changes significantly (>5 points)
3. Teacher manually triggers grade sync
4. Scheduled daily sync (for safety)

### Grade Passback Flow

```
Student completes module
        │
        ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 1: Calculate TES score                                    │
│                                                                 │
│ POST /api/efficiency/calculate                                 │
│ {                                                               │
│   "student_id": "student-uuid-1234",                           │
│   "module_id": "module-fractions-uuid"                         │
│ }                                                               │
│                                                                 │
│ Response:                                                       │
│ {                                                               │
│   "tes_score": 96.00,                                          │
│   "percentile": 95,                                            │
│   "grade": "A"                                                 │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 2: Get OAuth2 access token from Moodle                   │
│                                                                 │
│ POST https://lms.kaist.ac.kr/mod/lti/token.php                │
│ Headers:                                                        │
│   Content-Type: application/x-www-form-urlencoded              │
│ Body:                                                           │
│   grant_type=client_credentials                                │
│   client_assertion_type=urn:ietf:params:oauth:                │
│     client-assertion-type:jwt-bearer                           │
│   client_assertion={JWT signed by our private key}            │
│   scope=https://purl.imsglobal.org/spec/lti-ags/scope/score   │
│                                                                 │
│ Response:                                                       │
│ {                                                               │
│   "access_token": "eyJhbGc...",                                │
│   "token_type": "Bearer",                                      │
│   "expires_in": 3600,                                          │
│   "scope": "https://purl.imsglobal.org/spec/lti-ags/scope/score"│
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
        │
        ↓
┌────────────────────────────────────────────────────────────────┐
│ Step 3: Send grade to Moodle via AGS endpoint                 │
│                                                                 │
│ POST {lineitem_url}/scores                                     │
│   e.g., https://lms.kaist.ac.kr/mod/lti/services.php/         │
│         course_123/lineitems/789/scores                        │
│                                                                 │
│ Headers:                                                        │
│   Authorization: Bearer eyJhbGc...                             │
│   Content-Type: application/vnd.ims.lis.v1.score+json         │
│                                                                 │
│ Body:                                                           │
│ {                                                               │
│   "userId": "moodle_user_12345",                               │
│   "activityProgress": "Completed",                             │
│   "gradingProgress": "FullyGraded",                            │
│   "timestamp": "2025-11-18T10:30:00Z",                        │
│   "scoreGiven": 96,              // TES score                  │
│   "scoreMaximum": 100,                                         │
│   "comment": "Thought Efficiency Score: 96/100 (95th percentile)"│
│ }                                                               │
│                                                                 │
│ Response: 200 OK                                               │
└────────────────────────────────────────────────────────────────┘
        │
        ↓
    Grade appears in
    Moodle Gradebook
```

---

## 5. Moodle Configuration

### 5.1 Create External Tool in Moodle

**As Moodle Administrator:**

1. Navigate to: **Site administration > Plugins > Activity modules > External tool > Manage tools**
2. Click **"Configure a tool manually"**
3. Fill in configuration:

```
Tool Settings:
    Tool name: AI Education System
    Tool URL: https://our-platform.com/lti/launch
    LTI version: LTI 1.3
    Public key type: Keyset URL
    Public keyset URL: https://our-platform.com/.well-known/jwks.json
    Initiate login URL: https://our-platform.com/lti/login
    Redirection URI(s): https://our-platform.com/lti/launch

Services:
    ☑ IMS LTI Assignment and Grade Services
        • Can create line item (optional)
        • Can view line item (required)
        • Can view result (required)
        • Can manage score (required)

    ☑ IMS LTI Names and Role Provisioning Services
        • Use this service to retrieve members' information

Privacy:
    ☑ Share launcher's name with tool
    ☑ Share launcher's email with tool
    □ Accept grades from the tool (enable this!)

Default Launch Container:
    ○ Embed (iframe within Moodle)
    ● New window (recommended for full experience)
```

4. **Save** and note the generated:
   - **Client ID** (e.g., `kaist_client_2025`)
   - **Deployment ID** (e.g., `deployment_1`)

---

### 5.2 Add Tool to a Course

**As Moodle Teacher:**

1. Go to course → **Add an activity or resource**
2. Select **External tool**
3. Configure:

```
Activity name: Fractions Efficiency Module
Preconfigured tool: AI Education System

Privacy:
    ☑ Accept grades from the tool
    Grade: 100 points (maximum)

Custom parameters (optional):
    module_id=fractions-uuid-1234
    difficulty=medium
```

4. **Save and display** → Students will see the launch button

---

## 6. Security Considerations

### 6.1 JWT Validation Checklist

Our platform MUST validate:

- ✅ **Signature**: Verify JWT signed by Moodle's private key
- ✅ **Issuer (iss)**: Matches registered Moodle URL
- ✅ **Audience (aud)**: Matches our client ID
- ✅ **Expiration (exp)**: Token not expired
- ✅ **Nonce**: Prevents replay attacks (store used nonces)
- ✅ **Message Type**: Must be `LtiResourceLinkRequest`
- ✅ **LTI Version**: Must be `1.3.0`

### 6.2 Public Key Management

**Moodle's Public Key**:
- Fetch from `jwks_url` (e.g., `https://lms.kaist.ac.kr/mod/lti/certs.php`)
- Cache for 24 hours
- Rotate if key ID (`kid`) changes

**Our Private Key**:
- Generate RSA 2048-bit key pair
- Store private key securely (AWS KMS, Azure Key Vault, or encrypted file)
- Expose public key at `https://our-platform.com/.well-known/jwks.json`

```json
// Example JWKS endpoint response
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "our-key-2025",
      "n": "xGOr-H7A...",  // Public modulus (base64url)
      "e": "AQAB"          // Public exponent
    }
  ]
}
```

---

### 6.3 Session Security

- **Session Tokens**: Use short-lived JWTs (1 hour expiry)
- **CSRF Protection**: Include state parameter in OIDC flow
- **HTTPS Only**: All communication over TLS 1.2+
- **SameSite Cookies**: Prevent CSRF if using cookies

---

## 7. Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_signature` | JWT signature verification failed | Re-fetch Moodle's public keys from JWKS endpoint |
| `nonce_already_used` | Replay attack detected | Reject request; ensure nonce storage works |
| `invalid_audience` | `aud` claim doesn't match our client ID | Check Moodle tool configuration has correct client ID |
| `token_expired` | `exp` claim in the past | Request fresh token from Moodle |
| `missing_ags_endpoint` | No grade passback URL in JWT | Verify "Assignment and Grade Services" enabled in Moodle |
| `insufficient_scope` | OAuth token lacks `score` scope | Include correct scope in token request |

### User-Friendly Error Page

```html
<!-- Display to user if LTI launch fails -->
<html>
<body>
    <h1>Unable to Launch Module</h1>
    <p>We couldn't connect to Moodle. Please try:</p>
    <ul>
        <li>Refreshing the page</li>
        <li>Logging out and back into Moodle</li>
        <li>Contacting your instructor</li>
    </ul>
    <p>Error Code: LTI_INVALID_SIGNATURE</p>
    <p>Reference ID: abc123-def456</p>
</body>
</html>
```

---

## 8. Implementation Roadmap

### Phase 1: Basic LTI Authentication (Weeks 1-2)

- [ ] Implement `/lti/login` endpoint (OIDC initiation)
- [ ] Implement `/lti/launch` endpoint (JWT validation)
- [ ] Create JWKS endpoint at `/.well-known/jwks.json`
- [ ] Build user mapping logic (Moodle user → our student)
- [ ] Session management (create JWT tokens)

**Deliverable**: Students can launch from Moodle and see module interface

---

### Phase 2: Grade Passback (Weeks 3-4)

- [ ] Implement OAuth2 client for Moodle token endpoint
- [ ] Build AGS grade submission logic
- [ ] Create trigger: calculate TES → send grade
- [ ] Test with Moodle gradebook
- [ ] Handle retry logic for failed grade submissions

**Deliverable**: TES scores automatically appear in Moodle gradebook

---

### Phase 3: Advanced Features (Weeks 5-6)

- [ ] Support multiple Moodle instances (multi-tenancy)
- [ ] Deep linking (let teachers select modules from Moodle)
- [ ] Names and Role Provisioning Service (NRPS) for roster sync
- [ ] Admin dashboard for LMS connection management

**Deliverable**: Production-ready LTI 1.3 integration

---

## 9. Testing Plan

### 9.1 Unit Tests

```python
# tests/test_lti_authentication.py
def test_validate_jwt_signature_success():
    """Test successful JWT signature validation"""
    # Given: Valid JWT from Moodle
    # When: validate_jwt() is called
    # Then: Returns decoded claims

def test_validate_jwt_expired_token():
    """Test rejection of expired tokens"""
    # Given: JWT with exp in the past
    # When: validate_jwt() is called
    # Then: Raises TokenExpiredError

def test_validate_jwt_invalid_audience():
    """Test rejection of wrong audience"""
    # Given: JWT with aud != our client_id
    # When: validate_jwt() is called
    # Then: Raises InvalidAudienceError

def test_user_mapping_creates_new_student():
    """Test automatic student account creation"""
    # Given: LTI launch with unknown lms_user_id
    # When: process_lti_launch() is called
    # Then: New student record created
    # And: lms_user_mappings entry created

def test_user_mapping_updates_existing_student():
    """Test updating existing mapping"""
    # Given: LTI launch with known lms_user_id
    # When: process_lti_launch() is called
    # Then: last_launch_at updated
    # And: total_launches incremented
```

---

### 9.2 Integration Tests

```python
# tests/test_lti_integration.py
def test_full_lti_launch_flow():
    """Test complete LTI launch from login to session creation"""
    # 1. POST /lti/login with Moodle params
    # 2. Assert redirect to Moodle auth endpoint
    # 3. POST /lti/launch with valid id_token
    # 4. Assert session created
    # 5. Assert user mapping exists

def test_grade_passback_success():
    """Test successful grade submission to Moodle"""
    # 1. Calculate TES score for student
    # 2. Call grade_passback_service.send_grade()
    # 3. Mock Moodle token endpoint (return access_token)
    # 4. Mock Moodle AGS score endpoint (return 200 OK)
    # 5. Assert grade marked as synced in DB

def test_grade_passback_retry_on_failure():
    """Test retry logic for failed grade submissions"""
    # 1. Mock Moodle AGS endpoint to return 500 error
    # 2. Call grade_passback_service.send_grade()
    # 3. Assert retry attempted 3 times
    # 4. Assert error logged
```

---

### 9.3 Manual Testing Checklist

- [ ] Launch from Moodle as student (Learner role)
- [ ] Launch from Moodle as teacher (Instructor role)
- [ ] Complete module and verify grade in Moodle gradebook
- [ ] Test with expired JWT (should reject)
- [ ] Test with invalid signature (should reject)
- [ ] Test with missing AGS endpoint (graceful error)
- [ ] Test with multiple concurrent launches (no race conditions)
- [ ] Test session timeout and re-authentication

---

## 10. Monitoring & Logging

### Key Metrics to Track

1. **LTI Launch Success Rate**: % of launches that succeed
2. **Average Launch Time**: Time from login to session creation
3. **Grade Passback Success Rate**: % of grades successfully synced
4. **JWT Validation Errors**: Count by error type
5. **Active Sessions**: Number of concurrent LTI sessions

### Logging Strategy

```python
# Log every LTI launch attempt
logger.info("LTI launch initiated", extra={
    "lms_integration_id": integration_id,
    "lms_user_id": lms_user_id,
    "context_id": context_id,
    "resource_link_id": resource_link_id
})

# Log JWT validation failures
logger.error("JWT validation failed", extra={
    "error_type": "invalid_signature",
    "lms_integration_id": integration_id,
    "kid": jwt_header.get("kid")
})

# Log grade passback attempts
logger.info("Grade passback initiated", extra={
    "student_id": student_id,
    "module_id": module_id,
    "tes_score": tes_score,
    "lineitem_url": lineitem_url
})
```

---

## 11. Rollback Plan

If integration fails in production:

1. **Disable LTI launches**: Set `lms_integrations.is_active = false`
2. **Fallback to direct login**: Provide standalone URL for students
3. **Manual grade entry**: Export TES scores as CSV for teachers
4. **Investigate logs**: Check JWT validation errors, token issues
5. **Contact Moodle admin**: Verify tool configuration unchanged

---

## 12. Moodle 3.7 Compatibility Notes

### Known Limitations

- **Deep Linking**: Moodle 3.7 has limited support (works better in 3.9+)
- **NRPS (Roster Sync)**: May require manual enrollment sync
- **Migration Claim**: Not always included in JWT

### Workarounds

- Use **Custom Parameters** to pass module_id instead of Deep Linking
- Poll Moodle enrollment API separately for roster updates
- Gracefully handle missing optional JWT claims

---

## 13. Future Enhancements

### Post-MVP Features

1. **Deep Linking**: Let teachers browse and select modules from within Moodle
2. **NRPS Integration**: Automatic roster synchronization
3. **Caliper Analytics**: Send learning analytics events to Moodle
4. **LTI Advantage Resource Selection**: Allow teachers to configure module settings during setup
5. **Multi-Instance Support**: Single deployment serving multiple Moodle instances

---

**Document Status**: Complete - Ready for Implementation
**Next Steps**: Create API specifications and backend implementation
**Dependencies**: Requires database schema (see `database-schema-lms-efficiency.md`)
