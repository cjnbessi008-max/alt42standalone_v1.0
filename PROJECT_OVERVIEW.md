# Geo Spiral App - Quick Reference Overview

## Current Status: GREENFIELD PROJECT
Only 1 git commit with PRD documentation. No source code exists yet.

```
Current Repository Structure:
alt42standalone_v1.0/
├── .git/                               (Version control)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md    (49KB, General AI system PRD)
├── CODEBASE_ANALYSIS.md               (20KB, This analysis)
└── [ALL SOURCE CODE MISSING]
```

## What Exists (✅ = Present, ❌ = Missing)

| Component | Status | Details |
|-----------|--------|---------|
| **Documentation** | | |
| General AI System PRD | ✅ | 1,262 lines, comprehensive |
| Geo Spiral specification | ❌ | Not documented |
| Architecture diagram | ❌ | Not created |
| **Source Code** | | |
| Frontend (React) | ❌ | Not started |
| Backend (Node.js/PHP) | ❌ | Not started |
| Moodle Block | ❌ | Not started |
| Spiral visualization | ❌ | Not started |
| **Infrastructure** | | |
| Project structure | ❌ | No folders created |
| Configuration files (.env) | ❌ | Not created |
| Docker setup | ❌ | Not created |
| Database schema | ❌ | Not created |
| CI/CD pipeline | ❌ | Not configured |

## Critical Gap: PRD vs. Geo Spiral Requirements

The existing PRD describes a **general AI Education System** (teacher → generate modules).
The Geo Spiral needs a **specific visualization app** (geometric sequences → spiral display).

### Key Mismatches:
- **LMS**: PRD says "future" → Geo Spiral needs Moodle 3.7 NOW
- **Database**: PRD uses PostgreSQL → Geo Spiral needs MySQL 5.7
- **Backend**: PRD uses Node.js/Python → Geo Spiral needs PHP 7.1.9
- **UI**: PRD mentions responsive → Geo Spiral needs virtual smartphone frame
- **Visualization**: PRD has generic → Geo Spiral needs spiral algorithm

## What Needs to Be Built

### Phase 1: Setup (Weeks 1)
- Directory structure
- Configuration files (.env, docker-compose.yml)
- Moodle 3.7 development environment
- MySQL 5.7 schema

### Phase 2: Moodle Integration (Weeks 2-3)
- Moodle block plugin (PHP)
- Moodle database integration
- Authentication and permissions

### Phase 3: Spiral Visualization (Weeks 2-4)
- Spiral mathematics engine
- Canvas/SVG rendering
- Geometric sequence calculator

### Phase 4: Mobile UI (Weeks 3-5)
- Virtual smartphone frame
- Touch event handling
- Responsive design for phone

### Phase 5: Features (Weeks 5-7)
- Student progress tracking
- Teacher dashboard
- Analytics

### Phase 6: Testing & Deployment (Weeks 7-8)
- Integration testing
- Performance optimization
- Documentation

## Technology Stack (Required)

```
Frontend:
  - React 18+ (for spiral visualization UI)
  - Canvas/SVG API (for spiral rendering)
  - Three.js or D3.js (for math visualization)
  - Touch event handling (for smartphone interaction)

Backend:
  - PHP 7.1.9 (for Moodle compatibility)
  - Node.js (optional for REST API)
  - MySQL 5.7 (Moodle database requirement)

DevOps:
  - Docker & Docker Compose (environment consistency)
  - GitHub Actions (CI/CD)
  - Nginx/Apache (reverse proxy)

Moodle:
  - Moodle 3.7 (target LMS)
  - Moodle block architecture
  - Moodle database API
```

## Decision Points Before Starting

1. **Spiral Type**: Archimedean? Logarithmic? Other?
2. **Sequence Types**: Arithmetic? Geometric? Fibonacci?
3. **Rendering**: Canvas (performance) or SVG (scalable)?
4. **3D Support**: WebGL 3D or 2D only?
5. **Exact Versions**: Must use PHP 7.1.9 & MySQL 5.7, or can upgrade?
6. **Deployment**: Docker-based or direct Moodle installation?
7. **Touch Interaction**: Full gesture support or basic touch?

## Recommended Development Path

**Option A: Focused Geo Spiral (Recommended)**
```
Week 1-2: Moodle block + MySQL schema
Week 2-4: Spiral visualization engine
Week 4-5: Virtual phone UI
Week 5-6: Integration & polish
Week 6-7: Testing & deployment
Timeline: 6-7 weeks
```

**Option B: Use PRD as Foundation**
```
Adapt general AI system → Add Moodle layer → Spiral module
Timeline: 10-12 weeks
Risk: Over-engineered
```

**Option C: Parallel Development**
```
Team A: Build Geo Spiral (weeks 1-4)
Team B: Develop AI system (weeks 1-8)
Timeline: 8-9 weeks, needs coordination
```

## Files Reference

| File | Size | Purpose |
|------|------|---------|
| CODEBASE_ANALYSIS.md | 20 KB | Detailed analysis (this folder) |
| 0001-prd-ai-education-pipeline.md | 49 KB | General AI system requirements |
| PROJECT_OVERVIEW.md | This file | Quick reference |

## Next Immediate Actions

1. Review the detailed CODEBASE_ANALYSIS.md
2. Decide on development approach (Option A/B/C)
3. Answer the decision points (section above)
4. Create initial project structure
5. Set up Moodle development environment
6. Begin Phase 1 setup tasks

## Quick Facts

- **Repository URL**: Local proxy at 127.0.0.1:36129
- **Branch**: claude/geo-spiral-visualization-018ouYt4CJzbC2NDWjrp2fCD
- **Code Files**: 0 (greenfield)
- **Commits**: 1 (PRD only)
- **Lines of Documentation**: 1,262 (PRD) + 500+ (analysis)
- **Estimated MVP Time**: 6-10 weeks (1 developer) or 4-6 weeks (2-3 developers)

---

**Status**: Ready for development to begin
**Blocker**: None - can start immediately
**Dependencies**: Moodle 3.7 test environment recommended

