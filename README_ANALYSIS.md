# Codebase Analysis & Calming Message Feature Documentation

## What You'll Find Here

This repository contains comprehensive documentation for the KAIST AI Education System Pipeline project and the "Calming Message" feature being implemented on the `claude/add-calming-message-feature-*` branch.

## Documentation Files

### 1. **CODEBASE_ANALYSIS.md** (Comprehensive)
- **Best for**: Understanding the full system architecture
- **Contents**:
  - Overall 3-tier architecture (Frontend/Middleware/Pipeline)
  - 6-phase generation pipeline explained
  - Problem display components and navigation
  - Difficulty levels & categorization system
  - Audio/media capabilities
  - Technical file structure (when implemented)
  - Calming message integration points
  - Risk factors and mitigation
- **Length**: ~10KB
- **Time to read**: 15-20 minutes

### 2. **CALMING_MESSAGE_FEATURE_GUIDE.md** (Implementation Focus)
- **Best for**: Building the feature
- **Contents**:
  - Feature requirements and user story
  - Database schema (2 new tables)
  - Frontend component architecture & code samples
  - Backend API endpoints with code samples
  - Audio generation strategies (Pre-recorded vs TTS)
  - Teacher configuration UI
  - Testing strategy
  - Success metrics
  - 8-week implementation timeline
- **Length**: ~12KB
- **Time to read**: 20-30 minutes

### 3. **ARCHITECTURE_SUMMARY.md** (Quick Reference)
- **Best for**: Quick lookups and decision-making
- **Contents**:
  - System architecture diagram
  - 6-phase pipeline overview
  - Problem display architecture
  - Difficulty level scale explanation
  - Calming message feature flow
  - Database schema tables
  - Frontend/Backend components needed
  - Implementation checklist
  - Timeline estimate
  - Risk mitigation table
- **Length**: ~8KB
- **Time to read**: 10-15 minutes

### 4. **tasks/0001-prd-ai-education-pipeline.md** (Original PRD)
- **Best for**: Understanding the vision and requirements
- **Contents**:
  - Product overview and goals
  - User stories (teachers, students, admins)
  - Functional requirements (6 phases)
  - Technical architecture and stack
  - Success metrics and KPIs
  - Open questions and assumptions
  - Development roadmap
- **Length**: ~50KB
- **Time to read**: 45-60 minutes

---

## Quick Start Guide

### If you have 5 minutes:
Read the **"System Architecture at a Glance"** section in `ARCHITECTURE_SUMMARY.md`

### If you have 15 minutes:
1. Read `ARCHITECTURE_SUMMARY.md` entirely
2. Skim the "Calming Message Feature Flow" diagram

### If you have 45 minutes:
1. Read `ARCHITECTURE_SUMMARY.md` (15 min)
2. Read `CALMING_MESSAGE_FEATURE_GUIDE.md` sections 1-4 (30 min)

### If you're building the feature:
1. Start with `CALMING_MESSAGE_FEATURE_GUIDE.md` sections 2-8
2. Reference `ARCHITECTURE_SUMMARY.md` for integration points
3. Check `CODEBASE_ANALYSIS.md` for deeper understanding

### If you're new to the project:
1. Read `ARCHITECTURE_SUMMARY.md` (quick overview)
2. Skim `tasks/0001-prd-ai-education-pipeline.md` (sections 1-4)
3. Deep dive into specific components as needed

---

## Key Concepts Explained

### The Pipeline
The system has 6 phases that automatically generate educational modules:
1. **World Model** - Extract concepts from teacher request
2. **Rules** - Generate business logic
3. **Data** - Create database schema
4. **Input Strategy** - Plan how to collect student data
5. **UI** - Generate React components
6. **Deploy** - Package for deployment

### Problem Difficulty Levels (1-5)
```
1-3: No calming message
4-5: Show calming message
```

### Calming Message Feature
When a student encounters a problem with difficulty >= 4:
1. Show overlay with breathing animation
2. Play encouraging audio message (2-3 seconds)
3. Display text message
4. Auto-advance after 10 seconds or user skip
5. Log interaction for analytics

---

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Node.js/Express (API Gateway)
- **Pipeline**: Python/FastAPI (Orchestrator)
- **Database**: PostgreSQL (with JSONB)
- **Cache**: Redis
- **AI**: Claude API (Anthropic)
- **Deployment**: Docker + Docker Compose

---

## Current Project Status

**What exists**:
- Complete PRD with specifications
- Architecture design completed
- Technology stack decided
- Success metrics defined

**What needs to be built**:
- Frontend React application
- Backend API Gateway
- Python Pipeline Orchestrator
- Database infrastructure
- Calming Message feature (in progress)

**Current branch**: `claude/add-calming-message-feature-018J9Vw8ayt3yygT3bi6ZaYf`

---

## Database Tables Needed for Calming Messages

### module_calming_config
```
id, module_id, is_enabled, difficulty_threshold (1-5),
message_templates (JSON), audio_enabled, text_enabled,
animation_type, timeout_seconds, created_at, updated_at
```

### calming_message_interactions
```
id, module_id, student_id, problem_id, difficulty_level,
message_type, shown_at, duration_viewed_seconds,
student_feedback, feedback_at
```

---

## API Endpoints Needed

```
GET    /api/modules/:moduleId/calming-config
POST   /api/modules/:moduleId/calming-config
GET    /api/modules/:moduleId/audio/calming_message_:level
POST   /api/modules/:moduleId/interactions/calming_message
PUT    /api/modules/:moduleId/interactions/:id
GET    /api/modules/:moduleId/analytics/calming_messages
```

---

## React Components to Build

1. **CalmingMessageOverlay.tsx** - Main overlay component
2. **BreathingAnimation.tsx** - Visual animation
3. **AudioPlayer.tsx** - Audio playback
4. **CalmingMessageSettings.tsx** - Teacher configuration UI

---

## Implementation Timeline

**Phase Duration**: ~8 weeks from start to production

| Weeks | Tasks |
|-------|-------|
| 1-2 | Database schema + migrations |
| 2-3 | Backend API endpoints + audio serving |
| 3-4 | Frontend components + styling |
| 4-5 | Integration + testing |
| 5-6 | Teacher UI + analytics |
| 6-7 | Accessibility + refinement |
| 7-8 | Deployment + monitoring |

---

## Decision Points

### Audio Strategy
- **Recommended**: Pre-recorded messages (low latency, personal touch)
- **Alternative**: TTS (scalable, dynamic)
- **Future**: Hybrid approach

### Message Customization
- **MVP**: Same message for all students
- **Phase 2**: Adaptive messages based on student preferences

### Accessibility
- **Minimum**: WCAG 2.1 AA compliance
- **Includes**: Text alternatives, keyboard navigation, screen reader support

---

## Success Metrics

### Quantitative
- 30%+ students encounter difficulty >= 4
- 60%+ mark message as helpful
- 10%+ reduction in problem abandonment

### Qualitative
- Teachers report messages help students persist
- Students feel supported with challenging problems
- Reduced visible frustration with hard problems

---

## Related Files in Repository

```
/home/user/alt42standalone_v1.0/
├── CODEBASE_ANALYSIS.md (comprehensive architecture)
├── CALMING_MESSAGE_FEATURE_GUIDE.md (implementation guide)
├── ARCHITECTURE_SUMMARY.md (quick reference)
├── README_ANALYSIS.md (this file)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md (original PRD)
└── [Feature code will go here]
```

---

## How to Use This Documentation

### For System Design
- Start with `ARCHITECTURE_SUMMARY.md`
- Deep dive with `CODEBASE_ANALYSIS.md`
- Reference PRD for validation

### For Feature Implementation
- Follow `CALMING_MESSAGE_FEATURE_GUIDE.md` step-by-step
- Use code samples provided
- Reference `ARCHITECTURE_SUMMARY.md` for integration points

### For Integration
- Check "Integration Points" sections in each doc
- Verify database schema changes
- Confirm API endpoint structure

### For Troubleshooting
- Check "Risk Factors & Mitigation" in `ARCHITECTURE_SUMMARY.md`
- Review "Testing Strategy" in `CALMING_MESSAGE_FEATURE_GUIDE.md`
- Consult PRD for scope clarification

---

## Questions & Clarifications

### What's the relationship between these documents?

```
PRD (Original)
  ├── CODEBASE_ANALYSIS (Deep dive on architecture)
  ├── ARCHITECTURE_SUMMARY (Quick reference)
  └── CALMING_MESSAGE_FEATURE_GUIDE (Implementation spec)
```

- **PRD**: The complete product specification
- **CODEBASE_ANALYSIS**: How the system is structured
- **ARCHITECTURE_SUMMARY**: Quick facts and decisions
- **FEATURE_GUIDE**: Detailed implementation steps

### Which document should I read first?
Start with `ARCHITECTURE_SUMMARY.md` (~15 min) then go deeper based on your role.

### Is there actual code in the repository?
No, this is a greenfield project. The PRD is complete; implementation hasn't started yet.

### Can I use these as implementation specs?
Yes! `CALMING_MESSAGE_FEATURE_GUIDE.md` includes code samples, API specs, and SQL schemas ready to use.

---

## Contributing

When making changes to the feature:
1. Update relevant documentation
2. Keep architecture diagrams current
3. Add new decision points to ARCHITECTURE_SUMMARY
4. Update timeline if estimates change

---

## Document Maintenance

- **Last Updated**: 2025-11-18
- **Version**: 1.0.0
- **Status**: Ready for implementation
- **Next Review**: Before Phase 1 completion

---

## Additional Resources

- **Claude API Docs**: https://docs.anthropic.com/
- **React Docs**: https://react.dev/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Docs**: https://expressjs.com/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## Contact & Feedback

For questions or clarifications:
1. Check the relevant documentation file first
2. Look for "Questions & Next Steps" sections
3. Review "Open Questions" in the original PRD
4. Create an issue with specific questions

---

## Document Index

| File | Purpose | Length | Read Time |
|------|---------|--------|-----------|
| CODEBASE_ANALYSIS.md | Complete architecture overview | 10KB | 15-20 min |
| CALMING_MESSAGE_FEATURE_GUIDE.md | Implementation specifications | 12KB | 20-30 min |
| ARCHITECTURE_SUMMARY.md | Quick reference guide | 8KB | 10-15 min |
| README_ANALYSIS.md | This index (navigation) | 6KB | 5-10 min |
| tasks/0001-prd-ai-education-pipeline.md | Original PRD | 50KB | 45-60 min |

**Total**: ~86KB of documentation
**Total Read Time**: 95-135 minutes (comprehensive)
**Quick Path**: 25-35 minutes (ARCHITECTURE_SUMMARY + FEATURE_GUIDE overview)

