# KAIST Alt42 Standalone AI Education System Pipeline

A comprehensive AI-powered system for generating educational modules automatically from natural language teacher requests.

## Project Overview

This is a greenfield project (pre-development stage) for an AI Education System Pipeline that empowers teachers to create sophisticated educational modules without requiring coding knowledge. The system uses Claude AI to automatically generate:

- Database schemas
- Business rules and validation logic
- User interface components (React)
- API endpoints
- Complete deployable modules

**Current Status**: Architecture planning phase with comprehensive PRD and detailed technical analysis documents.

---

## Quick Navigation

### Core Documentation

1. **[0001-prd-ai-education-pipeline.md](./tasks/0001-prd-ai-education-pipeline.md)** (49 KB)
   - Complete Product Requirements Document
   - 1246 lines covering all aspects of the system
   - Sections: Goals, User Stories, Functional Requirements, Architecture, Success Metrics
   - **Start here for understanding the complete vision**

2. **[0002-codebase-analysis-reading-feature.md](./tasks/0002-codebase-analysis-reading-feature.md)** (24 KB)
   - Comprehensive analysis of current state and architecture
   - Detailed breakdown of technology stack
   - Current codebase structure (greenfield status)
   - Implementation roadmap for reading time feature
   - **Read this for understanding how everything fits together**

3. **[0003-quick-reference-reading-feature.md](./tasks/0003-quick-reference-reading-feature.md)** (12 KB)
   - Quick reference guide for implementation
   - Key tables, API endpoints, and components
   - Implementation checklist with timelines
   - Technical decisions to make
   - **Use this as your daily reference during development**

4. **[0004-reading-feature-architecture-deep-dive.md](./tasks/0004-reading-feature-architecture-deep-dive.md)** (32 KB)
   - Detailed system flow diagrams
   - Complete API specifications with examples
   - Database schema design with SQL
   - Performance optimization strategies
   - Security and monitoring considerations
   - **Reference this for implementation details**

---

## Project Structure

```
alt42standalone_v1.0/
├── README.md                                    (This file)
├── .git/                                        (Git repository)
└── tasks/
    ├── 0001-prd-ai-education-pipeline.md       The complete PRD
    ├── 0002-codebase-analysis-reading-feature.md  Architecture analysis
    ├── 0003-quick-reference-reading-feature.md    Quick reference guide
    └── 0004-reading-feature-architecture-deep-dive.md  Detailed architecture
```

**Note**: No source code files yet - this is the planning phase. Source code will be created following this architecture.

---

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI** or Ant Design for components
- **Redux Toolkit** or Zustand for state management
- **Socket.io-client** for real-time updates
- **React Hook Form** for form handling

### Backend
- **Node.js Express/Fastify** - API Gateway
- **Python 3.11+ FastAPI** - AI Pipeline Orchestrator
- **Celery + Redis** - Task queue and caching
- **Anthropic Claude API** - AI reasoning engine

### Database & Storage
- **PostgreSQL 15+** - Primary database with JSONB support
- **Redis 7+** - Caching and session management
- **pgvector** - Vector storage for embeddings

### DevOps
- **Docker + Docker Compose** - Containerization
- **GitHub Actions** - CI/CD
- **Prometheus + Grafana** - Monitoring
- **ELK Stack** - Logging

---

## System Architecture Overview

### 6-Phase AI Pipeline

The system automatically generates educational modules through 6 sequential phases:

```
Phase 1: World Model Reconstruction
  ├─ Parse natural language requests
  ├─ Extract educational concepts
  └─ Build semantic domain models
         ↓
Phase 2: Rule Generation Engine
  ├─ Extract business rules
  ├─ Generate executable code
  └─ Complexity analysis
         ↓
Phase 3: Data Management
  ├─ Schema design
  ├─ Pseudo data generation
  └─ Database creation
         ↓
Phase 4: Input Strategy Design
  ├─ Determine input methods
  ├─ Design data collection
  └─ Plan data flows
         ↓
Phase 5: UI Auto-Generation
  ├─ Generate React components
  ├─ Apply styling and theming
  └─ Ensure accessibility
         ↓
Phase 6: Integration & Deployment
  ├─ Generate API endpoints
  ├─ Create Docker containers
  └─ Produce documentation
```

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│        Frontend (React) - Teacher & Student UI  │
└──────────────────┬──────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────▼──────────────────────────────┐
│       API Gateway (Node.js)                     │
│  Auth | Rate Limiting | Routing                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│    AI Pipeline Orchestrator (Python)            │
│  ┌─────────────────────────────────────────┐   │
│  │ World Model → Rules → Data → Input →   │   │
│  │   UI Generation → Deployment            │   │
│  └─────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┬────────────┐
        ↓          ↓          ↓            ↓
    Claude API  PostgreSQL  Redis      Generated APIs
```

---

## Reading Time Tracking & Comprehension Summary Feature

This is the primary feature being implemented. It tracks how long students spend reading problems and provides AI-generated comprehension summaries.

### Key Components

1. **Reading Analytics Data Capture**
   - Track time spent reading each problem
   - Monitor reading speed (words per minute)
   - Record engagement patterns (rereading, scrolling)
   - Detect comprehension issues (time vs. accuracy)

2. **Comprehension Score Calculation**
   - Multi-factor: reading_speed + accuracy + attempts
   - Normalized against grade-level and problem-type baselines
   - Identifies patterns (reading too fast, too slow, ideal pace)

3. **AI-Generated Summaries**
   - Uses Claude API to generate personalized summaries
   - Provides actionable recommendations for students/teachers
   - Detects when intervention is needed
   - Supports multiple student grade levels

4. **Dashboard & Reporting**
   - Student view: Personal reading insights and feedback
   - Teacher view: Class analytics and struggling student alerts
   - Admin view: System-wide patterns and metrics

### Data Model Overview

```sql
-- Raw reading events per problem
reading_analytics {
  student_id, problem_id, module_id,
  reading_time_seconds, words_in_problem, reading_speed_wpm,
  re_reading_count, time_before_first_action,
  first_attempt_correct, total_attempts, hint_count,
  comprehension_score, reading_difficulty_match
}

-- Periodic aggregations for reporting
comprehension_summaries {
  student_id, module_id, period (daily/weekly/monthly),
  avg_reading_time, avg_reading_speed, comprehension_score_avg,
  problems_too_easy_ratio, problems_too_hard_ratio,
  generated_summary (AI-generated), recommendations
}
```

---

## Getting Started

### For Architects & Tech Leads
1. Read **0001-prd-ai-education-pipeline.md** (Section 6.2 for architecture)
2. Review **0002-codebase-analysis-reading-feature.md** (Sections 2-3 for stack)
3. Reference **0004-reading-feature-architecture-deep-dive.md** for detailed specs

### For Backend Engineers
1. Read **0003-quick-reference-reading-feature.md** (Section 3 for data model)
2. Review **0004-reading-feature-architecture-deep-dive.md** (Database & API sections)
3. Follow the implementation checklist in Section 8

### For Frontend Engineers
1. Review **0003-quick-reference-reading-feature.md** (Section 6 for components)
2. Check **0004-reading-feature-architecture-deep-dive.md** (State management & components)
3. Plan component hierarchy and hooks

### For DevOps & Infrastructure
1. Review **0001-prd-ai-education-pipeline.md** (Section 6.4 for tech stack)
2. Check **0002-codebase-analysis-reading-feature.md** (Section 2 for requirements)
3. Plan deployment infrastructure and monitoring

---

## Next Steps

### Phase 0-1: Architecture & Planning (Weeks 1-2)
- [ ] Clarify business requirements with stakeholders
- [ ] Define comprehension scoring algorithm
- [ ] Design database schemas (finalize from provided specs)
- [ ] Plan Claude API prompts for summaries
- [ ] Set up development environment

### Phase 2-3: Implementation (Weeks 3-8)
- [ ] Implement PostgreSQL tables and migrations
- [ ] Build reading analytics service (backend)
- [ ] Implement comprehension calculator
- [ ] Create API endpoints
- [ ] Build frontend components

### Phase 4-5: AI Integration (Weeks 9-16)
- [ ] Integrate Claude API for summaries
- [ ] Implement caching layer (Redis)
- [ ] Build dashboard components
- [ ] Add real-time feedback system
- [ ] Implement teacher reporting views

### Phase 6: Testing & Deployment (Weeks 17-26)
- [ ] Unit and integration tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

---

## Key Documents Reference

| Document | Size | Purpose | Key Sections |
|----------|------|---------|--------------|
| 0001-prd-ai-education-pipeline.md | 49 KB | Complete specification | Sections 4, 6, 7 |
| 0002-codebase-analysis-reading-feature.md | 24 KB | Architecture analysis | Sections 2-3, 10 |
| 0003-quick-reference-reading-feature.md | 12 KB | Developer reference | Sections 1-8 |
| 0004-reading-feature-architecture-deep-dive.md | 32 KB | Technical deep dive | Database, API, Design |

---

## Important PRD Sections for Reading Feature

- **FR-3** (Data Management) - How to store reading metrics
- **FR-4** (Input Strategy) - How to collect behavioral data
- **FR-5** (UI Generation) - Auto-generate reading summary components
- **FR-7.1** (AI Integration) - Claude API for summary generation
- **Section 6.3** (Data Models) - Tables to extend
- **Section 7.3** (Performance) - Optimization strategies
- **Section 7.5** (Security) - Student data protection

---

## Success Criteria

### Technical Metrics
- API latency <200ms for recording metrics
- <500ms for generating summaries
- 99% uptime for analytics endpoints
- >85% accuracy in comprehension score calculation

### Product Metrics
- 40% of teachers use reading insights
- 70%+ student satisfaction with feedback
- 20% reduction in comprehension issues
- <10% manual editing needed for AI summaries

---

## Branch & Git Strategy

- **Current Branch**: `claude/lms-reading-summary-feature-01SLkhXcjHgxFukDRxH1JLe9`
- **Main Branch**: TBD (to be created)
- **Development Flow**: Feature branch → Pull request → Main

---

## Questions & Support

### For Architecture Questions
- See Section 6.2 in 0001-prd-ai-education-pipeline.md
- Reference 0004-reading-feature-architecture-deep-dive.md

### For Implementation Questions
- Check 0003-quick-reference-reading-feature.md (Section 9)
- Review 0002-codebase-analysis-reading-feature.md (Section 14)

### For Specific Features
- Database: 0004-reading-feature-architecture-deep-dive.md (Database Schema)
- API: 0004-reading-feature-architecture-deep-dive.md (API Endpoints)
- Frontend: 0003-quick-reference-reading-feature.md (Section 6)
- AI Integration: 0003-quick-reference-reading-feature.md (Section 5)

---

## Document Maintenance

These documents were generated as part of the codebase exploration and analysis process. They serve as:

1. **Reference documentation** - For current and future team members
2. **Implementation guide** - For developers building the system
3. **Architecture blueprint** - For technical decisions
4. **Specification** - For acceptance criteria and testing

As the system develops, keep these documents updated to reflect:
- Architectural changes
- Implementation discoveries
- Lessons learned
- Updated success metrics

---

## License & Ownership

KAIST Touch Math Academy - Internal Project

---

**Last Updated**: November 18, 2025
**Created By**: AI Code Analysis
**Status**: Ready for Development Planning
