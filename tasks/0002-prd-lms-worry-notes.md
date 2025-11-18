# Product Requirements Document: LMS-Integrated Worry Notes System

## 1. Introduction/Overview

### Background
Students in educational settings often experience various concerns, anxieties, and challenges during their learning journey. These "worry notes" - whether academic struggles, emotional difficulties, or environmental concerns - are valuable signals that educators need to understand and address promptly. However, managing these concerns across many students is challenging without proper tools.

### Problem Statement
Currently, student concerns are:
- Scattered across various communication channels (email, chat, verbal)
- Difficult to track and prioritize systematically
- Time-consuming for teachers to categorize and respond to
- Easy to overlook urgent issues among routine questions
- Not connected to student's learning context from LMS

### Solution
A web application that:
1. **Collects** student worry notes in a structured, accessible way
2. **Integrates** with LMS to understand student learning context
3. **Analyzes** notes using AI to categorize, prioritize, and extract insights
4. **Presents** organized dashboards for teachers to respond effectively
5. **Tracks** resolution and patterns over time

### Goal
Empower teachers to understand and respond to student concerns proactively by automatically organizing worry notes with AI, reducing response time by 70% while improving support quality.

---

## 2. Goals

### Primary Goals
1. **Reduce Teacher Workload**: Automate categorization and prioritization of student concerns
2. **Early Intervention**: Identify urgent concerns within minutes, not days
3. **Context-Aware Support**: Connect concerns to student's LMS activity and performance
4. **Pattern Recognition**: Surface trends across students and topics
5. **Privacy & Trust**: Secure, confidential system students trust to share concerns

### Secondary Goals
1. Build comprehensive student support history
2. Generate insights for curriculum improvement
3. Enable proactive outreach before concerns escalate
4. Facilitate collaboration between teachers and counselors
5. Track intervention effectiveness over time

### Success Metrics
- 80% of students actively use the system (post 1 worry note per month minimum)
- Average teacher response time < 4 hours for urgent concerns
- 90% accuracy in AI categorization (validated by teacher feedback)
- Teacher time spent on concern management reduced by 70%
- Student satisfaction with support increases by 40%

---

## 3. User Stories

### Primary User: Students

**Story 1: Express Concerns Safely**
> As a **student**, I want to **write about my learning concerns in a safe, private space**, so that **I can get help without embarrassment in front of classmates**.

**Acceptance Criteria**:
- Simple, accessible interface from within LMS or standalone
- Anonymous option for sensitive concerns
- Confirmation that note was received
- Optional notification when teacher responds

**Story 2: Track My Concerns**
> As a **student**, I want to **see my past worry notes and how they were resolved**, so that **I can track my progress and feel supported**.

**Acceptance Criteria**:
- Personal history of worry notes
- Status indicators (new, reviewing, resolved)
- Teacher responses visible
- Ability to mark as resolved from student side

### Primary User: Teachers

**Story 3: Organized Concern Dashboard**
> As a **teacher**, I want to **see all student concerns organized by category and urgency**, so that **I can prioritize my responses effectively**.

**Acceptance Criteria**:
- Dashboard with categorized concerns (academic, emotional, environmental, technical)
- Priority indicators (urgent, high, medium, low)
- Filter by student, date, category, status
- Quick response actions

**Story 4: Student Context**
> As a **teacher**, I want to **see a student's LMS activity and performance alongside their worry note**, so that **I can provide contextual support**.

**Acceptance Criteria**:
- Recent assignment submissions and grades
- Course engagement metrics
- Related worry notes history
- Suggested interventions based on patterns

**Story 5: Pattern Recognition**
> As a **teacher**, I want to **identify common concerns across my students**, so that **I can address systemic issues proactively**.

**Acceptance Criteria**:
- Trend analysis dashboard
- Common themes highlighted
- Time-series view of concern types
- Ability to create class-wide announcements from patterns

### Secondary User: Administrators/Counselors

**Story 6: System-Wide Insights**
> As an **administrator**, I want to **see concern patterns across teachers and courses**, so that **I can identify areas needing institutional support**.

**Acceptance Criteria**:
- Cross-course analytics
- Teacher response time metrics
- Student wellbeing trends
- Export capabilities for reports

---

## 4. Functional Requirements

### Phase 1: Core Worry Notes System

**FR-1.1: Student Worry Note Submission**
- System MUST provide simple text input for worry notes
- System MUST support markdown formatting for clarity
- System MUST allow optional anonymity (for urgent concerns requiring intervention)
- System MUST timestamp all submissions
- System SHOULD support file attachments (screenshots of assignments, etc.)
- System MUST confirm successful submission

**FR-1.2: Note Categorization**
- System MUST automatically categorize notes using AI into:
  - **Academic**: Subject-specific difficulties, assignment confusion, learning gaps
  - **Emotional**: Stress, anxiety, motivation issues, confidence concerns
  - **Technical**: Platform issues, access problems, tool difficulties
  - **Environmental**: Time management, home environment, health issues
  - **Social**: Peer interaction, group work concerns
  - **Other**: Uncategorized for edge cases
- System MUST allow teacher to recategorize if needed
- System MUST support multi-label categorization (a note can have multiple categories)

**FR-1.3: Priority Assessment**
- System MUST automatically assess priority level:
  - **Urgent**: Immediate intervention needed (crisis language, deadline imminent, severe distress)
  - **High**: Important but not immediate (consistent struggles, declining performance)
  - **Medium**: Standard concerns (clarification questions, mild confusion)
  - **Low**: Informational or resolved independently
- System MUST use sentiment analysis to detect distress signals
- System MUST flag keywords indicating crisis (self-harm, severe anxiety, etc.)
- System MUST notify designated personnel for urgent concerns within 5 minutes

**FR-1.4: AI Analysis & Insights**
- System MUST extract key themes from note text
- System MUST identify related concepts from LMS context (course topics, assignments)
- System MUST generate suggested teacher responses (templates that can be customized)
- System MUST identify related previous notes from same student
- System SHOULD suggest relevant resources (articles, videos, support services)

### Phase 2: LMS Integration

**FR-2.1: LMS Authentication**
- System MUST support LTI 1.3 standard for LMS integration
- System MUST support OAuth 2.0 for API access
- System MUST support SSO (Single Sign-On) from major LMS platforms:
  - Canvas
  - Moodle
  - Google Classroom
  - Blackboard Learn
- System MUST handle session management securely
- System MUST gracefully degrade if LMS connection fails (standalone mode)

**FR-2.2: Student Context Retrieval**
- System MUST fetch student's recent course activity:
  - Assignment submissions (last 30 days)
  - Quiz/test scores
  - Discussion participation
  - Login frequency
- System MUST fetch course information:
  - Current modules/units
  - Upcoming deadlines
  - Course materials
- System MUST respect LMS privacy settings and permissions
- System MUST cache data to minimize LMS API calls (refresh every 6 hours)

**FR-2.3: Bi-directional Sync**
- System MAY push worry note status to LMS gradebook notes (if teacher enables)
- System MAY create LMS calendar events for follow-up meetings
- System MUST maintain data consistency if LMS connection is lost

### Phase 3: Teacher Dashboard

**FR-3.1: Main Dashboard View**
- System MUST display concern cards with:
  - Student name (or "Anonymous" with unique ID)
  - Timestamp (how long ago)
  - Category badges
  - Priority indicator
  - Status (new, in review, resolved)
  - First 100 characters of note
- System MUST support sorting by: priority, date, category, student
- System MUST support filtering by: category, priority, status, date range, student
- System MUST support search by keyword
- System MUST show count of unread concerns prominently

**FR-3.2: Concern Detail View**
- System MUST show full worry note with formatting
- System MUST display AI-generated insights:
  - Category and priority explanation
  - Key themes extracted
  - Related concerns from this student
  - Suggested responses
- System MUST show student context from LMS:
  - Recent grades and submissions
  - Course engagement level
  - Related course content
- System MUST provide response interface with:
  - Rich text editor
  - Template suggestions from AI
  - Mark as resolved button
  - Flag for follow-up
  - Assign to counselor option

**FR-3.3: Analytics Dashboard**
- System MUST provide visualizations:
  - Concern volume over time (line chart)
  - Category breakdown (pie chart)
  - Priority distribution (bar chart)
  - Response time metrics (histogram)
  - Top recurring themes (word cloud)
- System MUST support date range filtering
- System MUST support export to CSV/PDF
- System MUST show individual student concern history timeline

**FR-3.4: Bulk Actions**
- System MUST support selecting multiple concerns
- System MUST allow bulk categorization adjustment
- System MUST allow bulk status changes
- System MUST allow bulk assignment to counselor
- System MAY support bulk response templates (e.g., "assignment extension granted to all")

### Phase 4: Communication & Notifications

**FR-4.1: Response System**
- System MUST allow teachers to respond to concerns via the platform
- System MUST notify students of responses via:
  - In-app notification
  - Email (configurable)
  - LMS notification (if integrated)
- System MUST support threaded conversations
- System MUST maintain conversation history

**FR-4.2: Notification Rules**
- System MUST send immediate notification to designated teacher for urgent concerns
- System MUST send daily digest of new concerns to teachers (configurable time)
- System MUST escalate if urgent concern not acknowledged within 1 hour
- System MUST remind teacher of unresolved concerns older than 3 days
- Students MUST receive confirmation within 5 minutes of submission

**FR-4.3: Collaboration**
- System MUST allow teachers to assign concerns to counselors/specialists
- System MUST support internal notes (not visible to students)
- System MUST track who has viewed/responded to each concern
- System MAY support @mentions for team collaboration

### Phase 5: Privacy & Security

**FR-5.1: Data Privacy**
- System MUST encrypt all worry notes at rest (AES-256)
- System MUST encrypt all data in transit (TLS 1.3)
- System MUST comply with FERPA (Family Educational Rights and Privacy Act)
- System MUST comply with COPPA if serving students under 13
- System MUST support GDPR right to deletion
- System MUST anonymize data in analytics/exports

**FR-5.2: Access Control**
- System MUST implement role-based access control:
  - **Student**: Can only see own notes and responses
  - **Teacher**: Can see notes from own students/courses
  - **Counselor**: Can see assigned notes + aggregate analytics
  - **Admin**: Can see system-wide analytics (anonymized) + configuration
- System MUST log all access to worry notes for audit
- System MUST support temporary access grants (e.g., substitute teacher)

**FR-5.3: Crisis Protocol**
- System MUST flag crisis keywords immediately (self-harm, suicide, abuse)
- System MUST alert multiple designated personnel simultaneously for crisis flags
- System MUST provide crisis resources to student immediately upon detection
- System MUST maintain crisis flag history for institutional reporting
- System MUST comply with mandatory reporting requirements

### Cross-Cutting Requirements

**FR-6.1: Internationalization**
- System MUST support Korean as primary language
- System MUST support English
- System MUST detect student's LMS language preference
- AI categorization MUST work in both Korean and English

**FR-6.2: Performance**
- System MUST load dashboard in < 2 seconds
- AI categorization MUST complete in < 10 seconds
- System MUST support 1000 concurrent users
- System MUST handle 10,000 worry notes per day

**FR-6.3: Reliability**
- System MUST maintain 99.5% uptime
- System MUST queue submissions during outages (no data loss)
- System MUST gracefully degrade if AI service is unavailable (manual categorization)
- System MUST backup data daily

---

## 5. Non-Goals (Out of Scope)

### Out of Scope for MVP

1. **Video/Voice Messages**: Text-only for MVP; multimedia in Phase 2
2. **Real-time Chat**: Asynchronous communication only; chat in future
3. **Mobile Native Apps**: Responsive web app only; native apps future
4. **AI Chatbot Responses**: Teacher must review and send responses; full automation Phase 3
5. **Parent Portal**: Teacher and student only; parent access future
6. **Peer Support Features**: No student-to-student visibility; future feature
7. **Gamification**: No badges/points for concern resolution; future
8. **Integration with External Counseling Services**: Referral only; deep integration future
9. **Predictive Analytics**: Descriptive analytics only; predictive models Phase 2
10. **Custom Workflows**: Standard workflow only; custom workflows Phase 3

### Technical Limitations Accepted for MVP

1. **LMS Coverage**: Focus on Canvas, Moodle, Google Classroom; others Phase 2
2. **Scalability**: Optimized for single institution (<5000 students)
3. **Advanced NLP**: Basic categorization; sentiment analysis Phase 2
4. **Offline Support**: Requires internet connection

---

## 6. Design Considerations

### 6.1 User Interface/UX

**Design Principles**:
- **Safety First**: Warm, supportive design language; avoid clinical/cold aesthetic
- **Simplicity**: Students should be able to submit concern in < 30 seconds
- **Clarity**: Teachers should understand priority at a glance
- **Empathy**: Language should be supportive, never judgmental
- **Accessibility**: WCAG 2.1 AA compliance for all users

**Key Screens**:

**Student View**:
1. **New Worry Note Form**
   - Large text area with prompt: "What's on your mind? How can we help?"
   - Optional category pre-selection (but AI will recategorize)
   - Anonymous toggle
   - Attachment option
   - "Submit" button (prominent, encouraging)
   - Example prompts visible

2. **My Concerns Dashboard**
   - List of submitted concerns with status
   - Teacher responses highlighted
   - Ability to mark resolved
   - Encouragement messages when resolved

**Teacher View**:
1. **Main Dashboard**
   - Card-based layout for concerns
   - Color-coded priority (red=urgent, orange=high, yellow=medium, green=low)
   - Filters sidebar (category, priority, status, student)
   - Search bar
   - Urgent concerns highlighted at top
   - Quick stats: # new today, # unresolved, avg response time

2. **Concern Detail**
   - Left panel: Full concern text, student info, LMS context
   - Right panel: AI insights, suggested responses, related concerns
   - Bottom: Response editor with templates
   - Action buttons: Resolve, Follow-up, Assign, Flag

3. **Analytics**
   - Tab-based navigation: Overview, Trends, Students, Export
   - Interactive charts (Chart.js or Recharts)
   - Date range picker
   - Export button

**Visual Design**:
- Color scheme: Calm blues and greens (reduce anxiety)
- Typography: Clear, readable fonts (Noto Sans for Korean, Inter for English)
- Spacing: Generous whitespace
- Icons: Friendly, rounded icons (Lucide React or Heroicons)

### 6.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)               │
│     Student UI  |  Teacher Dashboard  |  Admin Panel    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼────────────────────────────────────┐
│              API Gateway (FastAPI)                      │
│   Authentication | Rate Limiting | Request Routing      │
└──────┬─────────────────────┬──────────────┬────────────┘
       │                     │              │
┌──────▼─────────┐  ┌────────▼──────┐  ┌───▼──────────┐
│ Worry Notes    │  │ AI Analysis   │  │ LMS          │
│ Service        │  │ Service       │  │ Integration  │
│ (CRUD, Status) │  │ (Claude API)  │  │ (LTI, OAuth) │
└────────┬───────┘  └───────┬───────┘  └───┬──────────┘
         │                  │              │
         └──────────┬───────┴──────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              PostgreSQL Database                        │
│   users | worry_notes | categories | responses |       │
│   lms_context | analytics | notifications              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Redis (Cache + Job Queue)                       │
│   Session cache | LMS data cache | Background jobs     │
└─────────────────────────────────────────────────────────┘
```

**Component Responsibilities**:

1. **Frontend (React + TypeScript + Vite)**
   - Student and teacher interfaces
   - State management (Zustand or Redux)
   - Real-time updates (WebSocket)
   - Responsive design (Tailwind CSS)

2. **API Gateway (FastAPI)**
   - RESTful API endpoints
   - JWT authentication
   - Rate limiting
   - WebSocket server for real-time notifications
   - Request validation (Pydantic)

3. **Worry Notes Service**
   - CRUD operations for worry notes
   - Status management
   - Response handling
   - History tracking

4. **AI Analysis Service**
   - Claude API integration
   - Categorization logic
   - Priority assessment
   - Sentiment analysis
   - Theme extraction
   - Response suggestion generation

5. **LMS Integration Service**
   - LTI 1.3 provider
   - OAuth 2.0 client
   - LMS API adapters (Canvas, Moodle, Google Classroom)
   - Context retrieval and caching
   - Grade sync (optional)

6. **Notification Service**
   - Email notifications (SendGrid/AWS SES)
   - In-app notifications
   - LMS notifications
   - Escalation logic
   - Digest generation

### 6.3 Data Models

**Core Entities**:

```python
# User
class User:
    id: UUID
    email: str
    name: str
    role: Enum[student, teacher, counselor, admin]
    lms_user_id: str
    institution_id: UUID
    preferences: JSON  # notification settings, language, etc.
    created_at: datetime

# WorryNote
class WorryNote:
    id: UUID
    student_id: UUID
    course_id: UUID (nullable, if from LMS)
    content: text
    is_anonymous: bool
    anonymous_id: str (if anonymous)
    category: Enum[academic, emotional, technical, environmental, social, other]
    priority: Enum[urgent, high, medium, low]
    status: Enum[new, reviewing, resolved, escalated]
    ai_analysis: JSON  # themes, sentiment, suggestions
    attachments: JSON[]
    submitted_at: datetime
    resolved_at: datetime (nullable)
    assigned_to: UUID (nullable, counselor/teacher)

# Category (for tracking AI categorization)
class Category:
    id: UUID
    name: str
    description: str
    keywords: str[]
    color: str (hex)

# Response
class Response:
    id: UUID
    worry_note_id: UUID
    responder_id: UUID
    content: text
    is_internal_note: bool  # not visible to student
    created_at: datetime

# LMSContext (cached student context)
class LMSContext:
    id: UUID
    student_id: UUID
    course_id: UUID
    recent_assignments: JSON[]  # last 10 submissions
    recent_grades: JSON[]
    engagement_score: float (0-1)
    last_login: datetime
    upcoming_deadlines: JSON[]
    cached_at: datetime

# Notification
class Notification:
    id: UUID
    recipient_id: UUID
    type: Enum[concern_submitted, response_received, urgent_alert, daily_digest]
    content: JSON
    read: bool
    sent_at: datetime

# AuditLog
class AuditLog:
    id: UUID
    user_id: UUID
    action: str
    resource_type: str
    resource_id: UUID
    details: JSON
    ip_address: str
    timestamp: datetime
```

### 6.4 Technology Stack

**Frontend**:
- Framework: React 18 + TypeScript
- Build Tool: Vite
- State Management: Zustand (lightweight, simple)
- Routing: React Router v6
- UI Components: shadcn/ui (accessible, customizable)
- Styling: Tailwind CSS
- Forms: React Hook Form + Zod validation
- Charts: Recharts
- API Client: TanStack Query (React Query)
- Real-time: Socket.io-client
- Internationalization: i18next

**Backend**:
- Framework: Python FastAPI
- ORM: SQLAlchemy 2.0
- Validation: Pydantic v2
- Task Queue: Celery + Redis
- WebSocket: FastAPI WebSockets
- Testing: pytest

**AI/ML**:
- LLM: Claude 3.5 Sonnet (Anthropic)
- Python SDK: anthropic
- Embeddings: Voyage AI (for semantic search of similar concerns)

**Database**:
- Primary: PostgreSQL 15+
- Cache: Redis 7+
- Search: PostgreSQL full-text search (pg_trgm extension)

**LMS Integration**:
- LTI: pylti1.3
- OAuth: authlib
- LMS SDKs: canvasapi, moodlepy, google-classroom

**DevOps**:
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana
- Logging: Structured logging (loguru) + ELK stack
- Error Tracking: Sentry

**Security**:
- Authentication: JWT (PyJWT)
- Encryption: cryptography library
- Secrets Management: python-dotenv (dev), AWS Secrets Manager (prod)
- Rate Limiting: slowapi

---

## 7. Technical Considerations

### 7.1 AI Prompt Engineering

**Categorization Prompt Template**:
```
You are an educational support AI analyzing a student's concern.

Student's concern:
"""
{worry_note_content}
"""

Student context:
- Grade level: {grade_level}
- Course: {course_name}
- Recent performance: {recent_grades_summary}
- Recent activity: {engagement_summary}

Task: Analyze this concern and provide:
1. Primary category (academic, emotional, technical, environmental, social, other)
2. Priority level (urgent, high, medium, low) - consider:
   - Urgency language (deadlines, "need help now")
   - Emotional distress indicators
   - Impact on learning
   - Crisis keywords (flag separately)
3. Key themes (3-5 keywords)
4. Sentiment score (-1 to 1)
5. Suggested response (2-3 sentence template for teacher)
6. Relevant resources (if applicable)

Output as JSON.
```

**Crisis Detection Prompt**:
```
Analyze the following student message for crisis indicators:

Message: {content}

Check for:
1. Self-harm or suicide ideation
2. Abuse or violence mentions
3. Severe distress or panic
4. Emergency situations

Output:
- is_crisis: boolean
- crisis_type: string (if applicable)
- confidence: float (0-1)
- immediate_actions: list of strings
```

### 7.2 Performance Optimization

**Expected Load**:
- 1000 students, 200 teachers
- Average 5 worry notes per student per semester = 5000 notes
- Peak: 50 notes per hour during exam periods
- 100 concurrent users (10% of user base)

**Optimization Strategies**:
1. **Caching**:
   - LMS context cached for 6 hours (Redis)
   - AI categorization results cached
   - Dashboard data cached for 5 minutes

2. **Database**:
   - Index on worry_notes(student_id, submitted_at)
   - Index on worry_notes(status, priority)
   - Partition worry_notes by semester
   - Database connection pooling

3. **AI API**:
   - Batch categorization for low-priority notes (process every 5 minutes)
   - Immediate categorization for new submissions
   - Cache similar concerns to avoid re-analysis

4. **Frontend**:
   - Code splitting by route
   - Lazy loading for charts and analytics
   - Virtual scrolling for long lists
   - Optimistic UI updates

### 7.3 LMS Integration Challenges

**Authentication Complexity**:
- Different LMS platforms use different auth mechanisms
- Solution: Adapter pattern with platform-specific implementations
- Fallback: Manual roster upload if LMS integration fails

**Data Sync**:
- LMS APIs have rate limits
- Solution: Cache aggressively, refresh on-demand
- Background sync jobs every 6 hours for enrolled students

**Permissions**:
- Teachers may not have API access in some LMS setups
- Solution: Admin-level integration at institution level
- Graceful degradation: Manual student-teacher linking

### 7.4 Privacy & Compliance

**FERPA Compliance**:
- Worry notes are "education records" under FERPA
- Must have proper access controls
- Must support parent access for students under 18
- Must support record amendment requests

**Crisis Response**:
- Legal obligation to report certain concerns (varies by jurisdiction)
- Must balance privacy with safety
- Clear crisis protocol documented in Terms of Service
- Training for teachers on crisis identification

**Data Retention**:
- Keep worry notes for duration of enrollment + 1 year
- Allow students to request deletion (with limitations for crisis cases)
- Anonymize analytics data
- Regular data purging for old records

---

## 8. Success Metrics

### Primary Metrics

**1. Student Adoption**
- Target: 80% of enrolled students submit at least 1 worry note per semester
- Measurement: (Active students / Total enrolled) × 100
- Frequency: Weekly tracking, monthly reporting

**2. Teacher Response Time**
- Target: Average < 4 hours for urgent, < 24 hours for high priority
- Measurement: Median time from submission to first response
- Breakdown by priority level
- Frequency: Daily monitoring

**3. AI Categorization Accuracy**
- Target: 90% agreement with teacher's final categorization
- Measurement: Compare AI initial category with teacher's (if changed)
- Calculate confusion matrix
- Frequency: Weekly review of discrepancies

**4. Teacher Time Savings**
- Target: 70% reduction in time spent on concern management
- Baseline: Survey teachers on current time spent
- Measurement: Time tracking + survey at 3 months
- Frequency: Quarterly

**5. Student Satisfaction**
- Target: 85% of students rate support as "helpful" or "very helpful"
- Measurement: Optional rating after concern resolved
- Frequency: Continuous, reported monthly

### Secondary Metrics

**6. System Usage**
- Daily active users (DAU)
- Concerns submitted per day
- Response rate (% of concerns with teacher response)
- Resolution rate (% of concerns marked resolved)

**7. Concern Patterns**
- Category distribution (are most concerns academic? emotional?)
- Priority distribution (are we correctly identifying urgent cases?)
- Time-to-resolution by category
- Recurring concerns (same student, similar issues)

**8. Technical Performance**
- API response time (p50, p95, p99)
- AI categorization time
- Uptime percentage
- Error rate

**9. Teacher Engagement**
- % of teachers using dashboard weekly
- Average concerns reviewed per teacher per week
- Use of AI suggested responses (adoption rate)
- Analytics dashboard views

### Crisis Metrics

**10. Crisis Response**
- Time to crisis flag detection (target: < 1 minute)
- Time to crisis notification sent (target: < 5 minutes)
- % of crisis flags acknowledged within 1 hour (target: 100%)
- False positive rate for crisis detection (target: < 5%)

### Review Process

**Weekly**:
- Response time metrics
- System uptime and performance
- Critical errors and bugs

**Monthly**:
- Adoption and usage trends
- AI accuracy review
- Top 10 concern themes

**Quarterly**:
- Comprehensive success review
- Teacher and student satisfaction surveys
- Pattern analysis for curriculum insights
- ROI calculation (time saved × teacher hourly cost)

---

## 9. Implementation Plan

### Phase 0: Setup (Week 1)
- Project structure setup
- Development environment
- Database design and setup
- CI/CD pipeline

### Phase 1: Core Backend (Weeks 2-3)
- User authentication and authorization
- Worry note CRUD API
- Database models and migrations
- Response API
- Basic notification system

### Phase 2: AI Integration (Week 4)
- Claude API integration
- Categorization service
- Priority assessment
- Sentiment analysis
- Response suggestion generation

### Phase 3: Frontend Core (Weeks 5-6)
- Student worry note submission form
- Teacher dashboard (list view)
- Concern detail view
- Response interface
- Basic filtering and search

### Phase 4: LMS Integration (Week 7)
- LTI 1.3 implementation
- Canvas integration (priority 1)
- Student context retrieval
- Context caching
- OAuth flow

### Phase 5: Advanced Features (Weeks 8-9)
- Analytics dashboard
- Bulk actions
- Advanced filtering
- Internal notes
- Counselor assignment
- WebSocket real-time updates

### Phase 6: Polish & Testing (Week 10)
- UI/UX refinement
- Accessibility audit
- Performance optimization
- Security audit
- End-to-end testing
- Documentation

### Phase 7: Deployment & Beta (Weeks 11-12)
- Production deployment
- Beta testing with 1-2 courses
- Monitoring setup
- Bug fixes
- User training materials

### Phase 8: General Availability (Week 13+)
- Full rollout
- Ongoing support
- Iteration based on feedback
- Feature enhancements

---

## 10. Open Questions

### High Priority

1. **Institution Specifics**
   - Which LMS is primarily used? (Canvas, Moodle, Google Classroom, other?)
   - Is there existing SSO infrastructure?
   - What are the crisis reporting protocols?

2. **Regulatory**
   - Are there specific privacy regulations beyond FERPA?
   - What are mandatory reporting requirements?
   - Data residency requirements?

3. **Resources**
   - What is the budget for Claude API usage?
   - What is hosting environment? (cloud provider, on-premise?)
   - Are there existing counseling/support services to integrate with?

### Medium Priority

4. **Scale**
   - How many students/teachers in pilot?
   - Expected growth trajectory?

5. **Existing Systems**
   - Are there existing concern tracking systems to migrate from?
   - Existing student support infrastructure?

6. **Customization**
   - Need for custom concern categories beyond standard set?
   - Institution-specific workflows?

---

## 11. Appendices

### Appendix A: Example Worry Notes

**Example 1: Academic**
```
Student submission:
"I don't understand how to do problem 15 on the homework. I've been
stuck for an hour. The assignment is due tomorrow and I'm really
stressed. Can someone explain the steps?"

AI Analysis:
- Category: Academic
- Priority: High (deadline pressure)
- Themes: homework help, problem-solving, time pressure
- Sentiment: -0.4 (mild stress)
- Suggested Response: "I see you're working hard on the homework.
  Let's schedule a quick 15-minute session to walk through problem 15
  together. Can you meet during office hours tomorrow morning?"
```

**Example 2: Emotional**
```
Student submission:
"I feel like I'm falling behind everyone else. I study so hard but my
grades aren't improving. I'm starting to think maybe I'm just not good
at math. I don't know what to do."

AI Analysis:
- Category: Emotional (with academic component)
- Priority: Medium
- Themes: self-doubt, comparison, effort vs. results, math anxiety
- Sentiment: -0.6 (moderate distress)
- Suggested Response: "Thank you for sharing this. Your effort is clear
  and valuable. Let's look at your learning approach together - often
  small changes in study strategies make big differences. Would you be
  open to trying some new techniques?"
```

**Example 3: Crisis (Urgent)**
```
Student submission:
"Everything feels overwhelming. I can't sleep, can't focus. I keep
thinking everyone would be better off without me. I don't know who
else to tell."

AI Analysis:
- Category: Emotional
- Priority: URGENT - CRISIS DETECTED
- Crisis Type: Possible suicidal ideation
- Themes: overwhelm, sleep issues, suicidal thoughts
- Sentiment: -0.9 (severe distress)
- Immediate Actions:
  1. Alert designated crisis counselor immediately
  2. Provide student with crisis hotline resources
  3. Flag for in-person follow-up within 24 hours
  4. Do not respond via platform - personal outreach required
```

### Appendix B: Database Schema

```sql
-- Core tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'counselor', 'admin')),
    lms_user_id VARCHAR(255),
    institution_id UUID,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE worry_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id),
    course_id UUID,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    anonymous_id VARCHAR(50),
    category VARCHAR(20) NOT NULL CHECK (category IN ('academic', 'emotional', 'technical', 'environmental', 'social', 'other')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'escalated')),
    ai_analysis JSONB,
    attachments JSONB DEFAULT '[]',
    submitted_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    is_crisis BOOLEAN DEFAULT false
);

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worry_note_id UUID NOT NULL REFERENCES worry_notes(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lms_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL,
    recent_assignments JSONB DEFAULT '[]',
    recent_grades JSONB DEFAULT '[]',
    engagement_score DECIMAL(3,2),
    last_login TIMESTAMP,
    upcoming_deadlines JSONB DEFAULT '[]',
    cached_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_worry_notes_student ON worry_notes(student_id, submitted_at DESC);
CREATE INDEX idx_worry_notes_status ON worry_notes(status, priority);
CREATE INDEX idx_worry_notes_category ON worry_notes(category);
CREATE INDEX idx_worry_notes_assigned ON worry_notes(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_responses_note ON responses(worry_note_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_lms_context_student ON lms_context(student_id);

-- Full-text search
CREATE INDEX idx_worry_notes_content_fts ON worry_notes USING gin(to_tsvector('english', content));
```

### Appendix C: API Endpoints

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/lti-launch  # LTI 1.3 launch

# Worry Notes (Student)
POST   /api/notes
GET    /api/notes/my
GET    /api/notes/{id}
PATCH  /api/notes/{id}/resolve

# Worry Notes (Teacher)
GET    /api/notes  # with filters: category, priority, status, student_id, date_range
GET    /api/notes/{id}
PATCH  /api/notes/{id}/category
PATCH  /api/notes/{id}/priority
PATCH  /api/notes/{id}/status
PATCH  /api/notes/{id}/assign
POST   /api/notes/bulk/update

# Responses
POST   /api/notes/{id}/responses
GET    /api/notes/{id}/responses

# Analytics
GET    /api/analytics/overview  # category breakdown, priority dist, volume over time
GET    /api/analytics/trends  # time-series data
GET    /api/analytics/students/{id}  # individual student history

# LMS Integration
GET    /api/lms/context/{student_id}  # cached context
POST   /api/lms/sync/{student_id}  # force refresh

# Notifications
GET    /api/notifications
PATCH  /api/notifications/{id}/read
PATCH  /api/notifications/read-all

# Admin
GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/audit-logs
GET    /api/admin/system-stats
```

---

## Document Control

- **Version**: 1.0.0
- **Created**: 2025-11-18
- **Status**: Draft for Review
- **Target Audience**: Development Team, Product Stakeholders
- **Next Steps**: Technical design document, database schema finalization, API contract
- **Related Documents**: 0001-prd-ai-education-pipeline.md

---

## Feedback

This PRD is ready for stakeholder review. Key decisions needed:
1. LMS platform priority (which to integrate first?)
2. Crisis protocol specifics (institution-dependent)
3. Budget approval for Claude API usage
4. Timeline approval for 13-week delivery

Ready to proceed with implementation once approved.
