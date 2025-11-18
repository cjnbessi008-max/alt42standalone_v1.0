# Key PRD Sections Reference Guide for "Practice a Bit More" Implementation

## Essential PRD Sections to Review

### For Practice Mode Architecture
**File**: `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md`

1. **Section 3: User Stories** (Lines 55-118)
   - Story 4: Student seamless learning experience
   - Story 3: Iterative refinement (practice feedback)
   - Key for understanding practice mode UX

2. **Section 4: Functional Requirements** (Lines 121-319)
   - **FR-1.4**: Event flow definition → Practice sequences
   - **FR-2.1 to FR-2.3**: Rule generation → Difficulty progression rules
   - **FR-3.4**: Data management → Progress tracking schema
   - **FR-4.1 to FR-4.3**: Input strategy → How students practice
   - **FR-5.2 to FR-5.4**: UI generation → Practice UI components

3. **Section 6.2: System Architecture** (Lines 414-500)
   - Complete system architecture diagram
   - Component interactions
   - Where practice mode fits in

4. **Section 6.3: Data Models** (Lines 500-563)
   - **Module Entity**: Stores module definitions
   - **Rule Entity**: Progression and feedback rules
   - **StudentProgress Entity**: Core for practice mode
   - **DynamicSchema**: Auto-generated per module

5. **Section 6.4: Technology Stack** (Lines 564-598)
   - Frontend: React 18+ with WebSocket
   - Backend: Node.js API + Python pipeline
   - Database: PostgreSQL + Redis

6. **Section 7.2: Complexity Management** (Lines 631-650)
   - Rule complexity metrics
   - Ontology conversion approach
   - Relevant for adaptive difficulty in practice mode

### LMS Integration Specific
**File**: `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md`

**Section 7.6: Integration Points** (Lines 711-745)
- **Authentication**: KAIST SSO (SAML/OAuth)
- **Student Database**: Read-only roster access
- **Grade System**: Optional progress export
- **LMS Integration** (Future): LTI standard support

**Section 5: Non-Goals** (Lines 328-360)
- What's OUT of scope for MVP:
  - Third-party LMS integration (Phase 3)
  - Robot avatar integration
  - Voice input
  - Gamification features

### Example Implementation
**Section 11 Appendix B: Example Teacher Request** (Lines 1093-1137)
- Fractions module example
- Shows how world model → rules → data → UI flow works
- Perfect reference for practice mode design

### API Design
**Section 11 Appendix C: Technical Specifications** (Lines 1138-1205)
```
Generated API Endpoints:
POST   /api/modules/{module_id}/problems          ← Practice problem generation
POST   /api/modules/{module_id}/submit            ← Practice answer submission
GET    /api/modules/{module_id}/progress/{student_id} ← Progress tracking
```

---

## Critical Open Questions (MUST Answer Before Implementation)

**Section 9: Open Questions** (Lines 886-981)

### Blocking Questions (Answer FIRST)
1. **Line 890-893**: KAIST Authentication System type?
2. **Line 895-898**: Existing platform to integrate with?
3. **Line 900-903**: Deployment environment?
4. **Line 905-908**: Claude API budget constraints?

### Important for Practice Mode
7. **Line 922-926**: KAIST design system specifications?
8. **Line 928-930**: What student data is available?
9. **Line 932-935**: Module approval workflow needed?

---

## Key Metrics for Practice Mode Success

**Section 8: Success Metrics** (Lines 748-883)

Primary KPIs applicable to practice mode:
1. **Generation Speed** (Line 761-769): < 2 hours to create module with practice features
2. **System Accuracy** (Line 771-779): > 85% quality (minimal teacher adjustments)
3. **Student Learning Outcomes** (Line 796-800): Practice should improve or maintain learning

Module-specific metrics:
- Student completion rates on practice problems
- Time-to-mastery tracking
- Attempt count before mastery
- Hint usage patterns

---

## Implementation Dependencies & Prerequisites

### Before Starting Practice Mode Development

1. **Answer Open Questions** (Section 9)
   - KAIST SSO implementation
   - Deployment environment setup
   - Student data access specifications

2. **Define Practice Mode Scope**
   - Which progression rules trigger "practice more"?
   - What constitutes "mastery"?
   - How many practice problems per topic?
   - Adaptive difficulty progression

3. **Establish Database Schema**
   - Extend StudentProgress model
   - Define ProblemAttempt tracking
   - Create MasteryMetrics table
   - Plan for rule storage

4. **Choose Technologies**
   - Final decision: React + TypeScript vs others?
   - Express.js or Fastify for API gateway?
   - PostgreSQL version and extensions?
   - Redis version and pub/sub strategy?

---

## Practice Mode Feature Mapping to Pipeline Phases

### Phase 1: World Model Reconstruction
- Understand what concepts need practice
- Map prerequisite relationships
- Define learning pathways

### Phase 2: Rule Generation (PRIMARY for practice mode)
- **Progression rules**: When is student ready for harder problems?
- **Validation rules**: Is answer correct/incorrect?
- **Feedback rules**: What hint to show? What encouragement?
- **Generation rules**: What problem should be generated next?

### Phase 3: Data Management
- StudentProgress tracking (completion %, mastery level)
- StudentAttempt history (answers, timestamps, hints used)
- Problem bank (auto-generated problems for practice)

### Phase 4: Input Strategy Design
- How student inputs answers (numeric, multiple choice, drag-drop)
- When to show hints (after N attempts?)
- How to request more practice

### Phase 5: UI Auto-Generation
- Problem display component
- Answer input form
- Feedback display (correct/incorrect explanation)
- Progress indicator (percent complete, mastery meter)
- Practice controls (submit, get hint, request different problem)

### Phase 6: Integration & Deployment
- WebSocket endpoint for real-time progress updates
- REST endpoints for practice operations
- Analytics/monitoring for practice patterns

---

## Current Implementation Status

| Component | Status | Location |
|---|---|---|
| PRD Document | ✅ Complete | `/home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md` |
| Architecture Diagram | ✅ Complete | Section 6.2 |
| Data Models | ✅ Defined | Section 6.3 |
| Technology Stack | ✅ Specified | Section 6.4 |
| API Endpoints | ✅ Specified | Section 11 Appendix C |
| Frontend Code | ❌ Not started | To be created: `/frontend/` |
| Backend Code | ❌ Not started | To be created: `/backend/` |
| Database Schema | ❌ Not started | To be created: `/backend/database/` |
| Docker Configuration | ❌ Not started | To be created: `docker-compose.yml` |
| CI/CD Pipeline | ❌ Not started | To be created: `.github/workflows/` |

---

## Recommendations for Practice Mode Implementation

### Start With These Components
1. **StudentProgress Data Model**
   - Create database schema for tracking practice metrics
   - Define mastery thresholds per topic

2. **Rule Engine for Progression**
   - Implement basic progression rules
   - Determine "ready for next difficulty" logic
   - Create feedback generation rules

3. **Problem Generation Service**
   - Implement templates for problem generation
   - Add difficulty parameter adjustment
   - Create problem bank seeding

4. **Student UI Components**
   - Problem display component
   - Answer input form
   - Feedback display
   - Progress indicator

5. **API Endpoints for Practice**
   - GET /api/modules/{id}/next-problem
   - POST /api/modules/{id}/submit-answer
   - GET /api/modules/{id}/progress
   - POST /api/modules/{id}/request-hint

### Integration Checklist
- [ ] KAIST SSO authentication working
- [ ] Student roster sync from KAIST system
- [ ] Module generation pipeline (Phases 1-2) implemented
- [ ] PostgreSQL schema created with practice tables
- [ ] Redis session management configured
- [ ] WebSocket connections for real-time updates
- [ ] Practice endpoints secured and rate-limited
- [ ] Teacher dashboard showing practice metrics
- [ ] Student UI responsive on mobile/tablet
- [ ] Error handling and retry logic in place

---

## File References & Line Numbers

Quick lookup for specific PRD sections:
- User Stories: 55-118
- Functional Requirements: 121-319
- Design Considerations: 362-599
- Technical Considerations: 601-745
- Success Metrics: 748-883
- Open Questions: 886-981
- Development Phases: 984-1077
- Glossary: 1082-1091
- Example Implementation: 1093-1137
- Technical Specs: 1138-1205
- Security Checklist: 1207-1230

Total PRD size: 1262 lines, ~49KB

