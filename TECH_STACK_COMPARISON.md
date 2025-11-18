# Technology Stack: PRD vs. Geo Spiral App

## Side-by-Side Comparison

### Frontend Layer

```
COMPONENT        | PRD System              | Geo Spiral App         | DECISION
-----------------|-------------------------|------------------------|------------------
Framework        | React 18+ / TypeScript  | React 18+ ✓             | Use React for both
State Mgmt       | Redux Toolkit/Zustand   | Redux or Zustand        | Pick one approach
Visualization    | Generic concept maps    | Spiral renderer (NEW)   | Must build spiral
Canvas/SVG       | Not specified           | Canvas/SVG (Required)   | Decide: Canvas vs SVG
Mobile Support   | Responsive design       | Virtual phone frame(NEW)| Build phone UI
Animation        | Not specified           | Framer Motion           | Add animations
Touch Events     | Not specified           | Full gesture support    | Touch handler system
```

### Backend Layer

```
COMPONENT        | PRD System              | Geo Spiral App         | DECISION
-----------------|-------------------------|------------------------|------------------
API Gateway      | Node.js/Express         | Node.js (optional)      | Use Express/Fastify
Pipeline Engine  | Python 3.11+ FastAPI    | Not needed for MVP      | Skip initially
Moodle Plugin    | NOT INCLUDED (Future)   | REQUIRED NOW (PHP)      | Build Moodle block
PHP Version      | Not in PRD              | PHP 7.1.9 (Required)    | Exact version needed
Database ORM     | Not specified           | PHP + Moodle API        | Use Moodle abstractions
Authentication   | JWT tokens              | Moodle SSO + JWT        | Leverage Moodle auth
```

### Database Layer

```
COMPONENT        | PRD System              | Geo Spiral App         | DECISION
-----------------|-------------------------|------------------------|------------------
Primary DB       | PostgreSQL 15+          | MySQL 5.7 (Required)   | MAJOR CHANGE
Caching          | Redis 7+                | Redis optional          | Use for sessions
Graph DB         | Neo4j (future)          | Not needed              | Skip for MVP
Schema Type      | Flexible JSONB          | Relational tables       | Standard SQL
Data Model       | Dynamic per module      | Fixed spiral schema     | Pre-designed
```

### AI/ML Layer

```
COMPONENT        | PRD System              | Geo Spiral App         | DECISION
-----------------|-------------------------|------------------------|------------------
LLM Provider     | Claude API              | Not used for MVP        | Not needed initially
Embeddings       | Voyage AI / OpenAI      | Not needed              | Skip for MVP
Vector Store     | pgvector                | Not needed              | Skip for MVP
Rule Engine      | Drools/custom           | Not needed              | Skip for MVP
```

### DevOps/Deployment

```
COMPONENT        | PRD System              | Geo Spiral App         | DECISION
-----------------|-------------------------|------------------------|------------------
Containerization | Docker + Compose        | Docker + Compose ✓      | Use Docker
Orchestration    | Kubernetes (future)     | Docker Compose only     | Start with Compose
CI/CD            | GitHub Actions          | GitHub Actions ✓        | Use GH Actions
Monitoring       | Prometheus + Grafana    | Basic logging           | Add later
Logging          | ELK Stack               | Standard logging        | Add later
SSL/TLS          | Let's Encrypt           | Self-signed (dev)       | Production ready later
```

## What to Reuse from PRD

```
REUSABLE COMPONENTS:
✓ React 18+ architecture patterns
✓ TypeScript typing conventions
✓ Docker and Docker Compose approach
✓ GitHub Actions CI/CD patterns
✓ Frontend component structure

NOT DIRECTLY REUSABLE:
✗ PostgreSQL → Need MySQL adaptation
✗ Python/FastAPI pipeline → Overkill for single feature
✗ AI generation system → Not for spiral visualization
✗ Complex rule engine → Spiral has fixed math
✗ Kubernetes setup → Too early for scaling
```

## Technology Installation Matrix

```
Development Environment Setup:

TECH STACK          | DEV SETUP           | PROD SETUP          | PRIORITY
--------------------|---------------------|---------------------|----------
Docker              | docker-ce + compose | docker-ce + swarm    | CRITICAL
MySQL 5.7           | Docker container    | Managed (RDS/Azure)  | CRITICAL
PHP 7.1.9           | Docker container    | Docker container     | CRITICAL
Node.js (optional)  | nvm / homebrew      | Docker container     | MEDIUM
React 18+           | npm / yarn          | Docker container     | CRITICAL
Moodle 3.7          | Docker container    | Docker container     | CRITICAL
Git / GitHub        | Local + remote      | Remote CI/CD         | CRITICAL
Nginx               | Docker container    | Docker container     | HIGH
```

## Dependency Installation Order

```
1. Docker & Docker Compose
   └─ Required for all other services

2. MySQL 5.7 Database
   └─ Required for Moodle and app

3. Moodle 3.7 LMS
   └─ Required for block plugin development

4. Node.js / npm
   └─ Required for React frontend

5. PHP 7.1.9
   └─ Required for Moodle block

6. React 18+
   └─ For frontend visualization

7. Testing frameworks
   └─ Jest, PHPUnit, Cypress

8. Optional: Python
   └─ Only if using additional tools
```

## Cost Estimation

```
Development Costs (8-week MVP):
├── Infrastructure
│   ├── Docker (free)
│   ├── GitHub (free with students account)
│   └── Moodle (free, open source)
├── Tools
│   ├── Visual Studio Code (free)
│   ├── MySQL Workbench (free)
│   └── Postman (free)
└── Licenses
    └── None required for MVP

Production Costs (per month):
├── Server (AWS/Azure)
│   └── ~$50-200/month for small scale
├── MySQL Database
│   └── ~$30-100/month
├── CDN (optional)
│   └── ~$0-50/month
└── Monitoring (optional)
    └── ~$0-50/month

Total: $80-400/month (highly scalable)
```

## Version Compatibility Matrix

```
Component          | Required    | Recommended  | Notes
-------------------|-------------|--------------|----------------------------
PHP                | 7.1.9       | 7.4+ (newer) | Exact version for Moodle
MySQL              | 5.7         | 8.0+ (newer) | 5.7 EOL soon, upgrade advised
Moodle             | 3.7         | 4.x (newer)  | 3.7 still supported
Node.js            | 14+         | 20 LTS       | For optional API
React              | 18+         | 18.2 stable  | CSS-in-JS support needed
Docker             | 20+         | Latest       | Use latest stable
Docker Compose     | 1.27+       | Latest       | V2 recommended
```

## Breaking Changes: PRD → Geo Spiral

```
PostgreSQL → MySQL:
├── Data types: SERIAL → AUTO_INCREMENT
├── Syntax: JSONB → JSON (limited)
├── Extensions: uuid-ossp → UUID()
└── Functions: ARRAY → JSON arrays

Node.js/Python → PHP:
├── Import style: require/import → include/require
├── Database: TypeORM → PDO/Moodle
├── HTTP: Express → PHP native/FastAPI
└── Package mgmt: npm → Composer

Kubernetes → Docker Compose:
├── Deployment: manifests → compose.yml
├── Scaling: replicas → manual
├── Networking: service discovery → bridge
└── Volumes: persistent → compose volumes
```

## Migration Path (If Needed)

```
IF YOU START WITH PRD AND NEED TO SWITCH TO GEO SPIRAL:

Week 1-2: Build Geo Spiral in parallel
Week 3: Freeze PRD development
Week 4-6: Migrate critical PRD components
Week 7-8: Integrate both systems

Alternative: Complete Geo Spiral first (6-8 weeks),
then add AI system later (8-12 more weeks)
```

## Summary Table

| Aspect | PRD | Geo Spiral | Recommendation |
|--------|-----|-----------|-----------------|
| Complexity | High | Medium | Geo Spiral faster to deploy |
| Database | PostgreSQL | MySQL | MUST change |
| Backend | Node.js + Python | PHP + Node | MUST add PHP |
| AI Integration | Required | Not needed | Skip for MVP |
| Visualization | Generic | Spiral-specific | Build custom |
| LMS | Future | Now | Build Moodle block |
| Timeline | 6+ months | 6-8 weeks | Geo Spiral sooner |
| Team Size | 3-5 devs | 1-2 devs | Smaller team OK |
| Scalability | High | Medium | Scale later |
| Cost | Higher | Lower | Better ROI |

---

**Recommendation**: Build Geo Spiral first (6-8 weeks), then use that foundation to develop the broader AI Education System when more resources are available.
