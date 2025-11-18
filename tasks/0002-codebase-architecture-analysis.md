# AI Education System Pipeline - Codebase Architecture Analysis

## Executive Summary

This is a **NEW PROJECT** repository containing the comprehensive Product Requirements Document (PRD) for KAIST Touch Math Academy's AI Education System Pipeline. Currently, no implementation code exists—only the detailed specification (1262 lines) in `tasks/0001-prd-ai-education-pipeline.md`.

The project is **ready for the "Mean Center Feature" implementation**, which will be a visualization component showing the average/center of gravity of student movement data.

---

## 1. PROJECT OVERVIEW

### Current Status
- **Repository**: `alt42standalone_v1.0` (v1.0 in name suggests upcoming releases)
- **Current Branch**: `claude/mean-center-feature-01PSSsYtnqSheKEbg89rbW1F`
- **Implementation Stage**: PRD Complete, Development Ready
- **Commits**: 1 (PRD document)
- **Architecture Status**: Planned but not yet implemented

### Project Goal
Build an AI-powered pipeline that transforms teacher natural language requests into complete, functional educational modules without requiring coding knowledge.

### Target User Base
- **Primary**: Teachers at KAIST Touch Math Academy (non-technical)
- **Secondary**: Students (grade 1-8 mathematics focus)
- **Tertiary**: Administrators and system maintainers

---

## 2. TECHNOLOGY STACK (PLANNED)

### Frontend Layer
```
Framework:    React 18+ with TypeScript
State Mgmt:   Redux Toolkit or Zustand
Routing:      React Router v6
UI Library:   Material-UI (MUI) or Ant Design
Forms:        React Hook Form + Yup validation
HTTP Client:  Axios with interceptors
Real-time:    Socket.io-client
```

**Key Implications for Mean Center Feature:**
- Component-based architecture
- TypeScript for type safety
- Will need to support responsive design (mobile screens)
- Real-time updates possible via WebSocket

### Backend Layer
```
API Gateway:        Node.js with Express or Fastify
Pipeline Orchestr:  Python 3.11+ with FastAPI
Task Queue:         Celery with Redis broker
AI Integration:     Anthropic Claude API (Python SDK)
Code Generation:    Jinja2 templates + AST manipulation
```

### Database Layer
```
Primary DB:         PostgreSQL 15+ (with JSONB support)
Cache:              Redis 7+
Future (Graph):     Neo4j (for ontologies)
```

**Key Implications for Mean Center Feature:**
- Structured data storage in PostgreSQL
- Fast access patterns via Redis cache
- JSONB columns for flexible schema storage

### DevOps & Infrastructure
```
Containerization:   Docker + Docker Compose
CI/CD:              GitHub Actions
Monitoring:         Prometheus + Grafana
Logging:            ELK Stack (Elasticsearch, Logstash, Kibana)
AI/ML:              Claude 3 Sonnet/Opus API
```

---

## 3. SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  Teacher UI | Student UI | Admin Dashboard                  │
│  [← Mean Center visualization fits here]                     │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│                   API Gateway (Node.js)                      │
│  Authentication | Rate Limiting | Request Routing           │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│              AI Pipeline Orchestrator (Python)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ World Model   →  Rule Engine  →  Data Manager        │  │
│  │      ↓               ↓               ↓               │  │
│  │ Input Strategy  →  UI Generator  →  Deployer        │  │
│  └──────────────────────────────────────────────────────┘  │
│  [← Mean Center data generation could be here]              │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Schemas, Data)  │   │  (Sessions)    │
└─────────────┘    │ [Student movement│   └────────────────┘
                   │  data stored]    │
                   └──────────────────┘
```

### 6-Phase Pipeline Stages
1. **World Model Reconstruction**: Extract concepts from teacher requests
2. **Rule Generation Engine**: Create validation/calculation logic
3. **Data Management**: Schema design, pseudo-data generation
4. **Input Strategy Design**: Determine data collection methods
5. **UI Auto-Generation**: Create React components automatically
6. **Integration & Deployment**: Generate complete deployable system

**Mean Center Feature Context:**
- Fits into Phase 5 (UI Auto-Generation) for visualization
- Could also involve Phase 2 (Rule Generation) for calculating averages
- Requires Phase 3 (Data Management) for storing movement coordinates

---

## 4. EXISTING LMS/MOODLE INTEGRATION

### Current Status
**NOT IMPLEMENTED YET** - Explicitly listed in "Non-Goals (Out of Scope)"

From PRD Section 5:
```
"Third-party LMS Integration: Standalone system initially; LTI integration is future work"
```

### Future Integration Points (Phase 3)
The PRD anticipates integration with:
- KAIST authentication system (SSO/SAML/OAuth)
- Student database (read-only)
- Grade system (optional export)
- LMS platforms: Canvas, Moodle, Blackboard (Phase 3+)

### Recommendations for Mean Center Feature
- Design as a **standalone component** that could be embedded in LMS later
- Ensure **data portability** (export coordinates, averages as CSV/JSON)
- Build with **iframe embedding** capability in mind
- Use standard protocols for future LMS integration

---

## 5. FRONTEND COMPONENTS FOR SMARTPHONE SCREENS

### Design Principles (from PRD Section 6.1)
```
✓ Simplicity First:      3 clicks or less for any task
✓ Progressive Disclosure: Show complexity only when needed
✓ Immediate Feedback:     Visual/textual confirmation for every action
✓ Educational Language:   Pedagogical terms, not technical jargon
✓ Consistency:            Follow KAIST design system
```

### Accessibility Requirements
- **WCAG 2.1 AA Compliance** minimum
- Keyboard navigation for all functions
- Screen reader support
- High contrast mode
- Adjustable text size

### Responsive Design Approach
- Mobile-first design strategy
- Touch-friendly interfaces
- Fluid layouts using CSS Grid/Flexbox
- Responsive typography (min 16px body text)

### Key UI Screens (Auto-Generated)
1. **Teacher Dashboard**: Module management, metrics
2. **Module Request Wizard**: 5-step request process
3. **Generated Module UI**: Student-facing interface
4. **Module Management**: Analytics, versioning, access control

### Mean Center Feature UI Components
**Expected Components:**
```typescript
// Visualization Components
<MeanCenterVisualizer />      // Display center point
<MovementTracer />             // Show student movement path
<AverageIndicator />           // Display calculated average
<TimelineSlider />             // Scrub through movements
<StatisticsPanel />            // Show calculated stats

// Mobile Optimizations
<ResponsiveChart />            // Adaptive to screen size
<TouchGestureHandler />        // Pinch zoom, drag support
<MobileMetricsCard />          // Compact stat display
```

### Responsive Breakpoints (Typical MUI/Ant Design)
```
xs: 0px      → Mobile phones
sm: 600px    → Tablets (portrait)
md: 960px    → Tablets (landscape)
lg: 1280px   → Desktops
xl: 1920px   → Large displays
```

---

## 6. EXISTING VISUALIZATION & ANIMATION FEATURES

### Current Status
**NOT IMPLEMENTED YET** - These are auto-generated based on requirements

### Planned Visualization Types (from PRD)
Per the PRD, auto-generated modules can include:

1. **Concept Maps** (in Module Request Wizard Step 2)
   - Visual representation of AI's understanding of teacher request
   - Shows concepts, relationships, entities

2. **Data Visualizations** (for module-specific needs)
   - Charts, graphs (type auto-generated based on requirements)
   - Progress indicators
   - Mastery tracking visualization

3. **Ontology Visualization** (when rules convert to ontology)
   - WebVOWL or Protégé exports for knowledge representation
   - Shows complex relationships between concepts

4. **Interactive Visualizations** (in generated student modules)
   - Fraction visualizers (pizza, cake, bar diagrams)
   - Interactive manipulatives
   - Real-time feedback visualizations

### Animation Framework Recommendations
**Not specified in PRD** - Left to developer choice. Suggest:

```typescript
// Animation libraries compatible with React
- Framer Motion       // Best for complex animations
- React Spring        // Physics-based animations
- Recharts/Visx       // Chart animations
- SVG.js             // Direct SVG animations
- Canvas-based        // For high-performance graphics
```

### Mean Center Feature Animation Needs
```
✓ Smooth trajectory drawing      → Animate path as student moves
✓ Center point emergence         → Fade-in or scale-up animation
✓ Average calculation indication → Progress bar or spinner
✓ Transitions                    → Smooth state changes
✓ Highlights                     → Emphasize mean center when updating
```

---

## 7. DATABASE CONNECTION & DATA HANDLING

### PostgreSQL Schema Design Approach

#### Core System Tables
```sql
-- Module management
modules (
  id UUID PRIMARY KEY,
  name, description, subject, grade_level,
  teacher_id UUID (FK),
  status ENUM(generating, active, archived),
  world_model JSONB,           -- AI-generated domain model
  generated_schema JSONB,       -- Database schema definition
  generated_ui JSONB,          -- UI component definitions
  version INTEGER,
  created_at, updated_at
)

-- Teacher and student management
teachers (id, name, email, institution, role, preferences JSONB)
students (id, name, grade_level, enrolled_modules ARRAY)

-- Generation tracking
generation_jobs (
  id, module_id, stage, status,
  input_data JSONB, output_data JSONB, error_log,
  started_at, completed_at
)

-- Rule management
rules (
  id, module_id, name, type,
  complexity_score INTEGER,
  is_ontology BOOLEAN,
  code TEXT,
  ontology_reference
)

-- Schema metadata
dynamic_schemas (
  id, module_id, table_name,
  schema_definition JSONB,
  migration_script TEXT,
  is_applied BOOLEAN
)
```

#### Dynamically Generated Tables (Per Module)
```sql
-- Example for Fractions Module:
fraction_problems (
  id, module_id, problem_type, numerator_1, denominator_1,
  numerator_2, denominator_2, visual_representation,
  difficulty_level, correct_answer_numerator,
  correct_answer_denominator, created_at
)

student_attempts (
  id, student_id, problem_id,
  answer_numerator, answer_denominator,
  is_correct BOOLEAN, time_spent_seconds, attempted_at
)

student_progress (
  student_id, module_id, started_at, completed_at,
  progress_percentage, [module-specific metrics]
)
```

### Data Handling Architecture

#### Data Flow Pipeline
```
Teacher Request
    ↓
[Natural Language Processing]
    ↓
[Domain Model Extraction]
    ↓
[Data Availability Check]
    ↓
[Schema Generation] → PostgreSQL DDL
    ↓
[Pseudo Data Generation] (if real data unavailable)
    ↓
[Database Creation & Migration]
    ↓
[Data Seeding & Validation]
    ↓
Ready for Student Interaction
```

#### Redis Cache Usage
```
Sessions & Authentication:  JWT tokens, session data
Rate Limiting:              API rate limit counters
Generation Progress:        Pipeline stage progress
Real-time Updates:          WebSocket message queue
Frequently Accessed Data:   Cached module metadata
```

### Mean Center Feature Data Model

**For Movement Tracking Module:**
```sql
-- Stores individual movement data points
movement_coordinates (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  module_id UUID REFERENCES modules(id),
  timestamp TIMESTAMP,
  x_coordinate FLOAT NOT NULL,
  y_coordinate FLOAT NOT NULL,
  session_id UUID,
  device_type VARCHAR(50),  -- mobile, tablet, desktop
  created_at TIMESTAMP DEFAULT NOW()
)

-- Stores calculated mean center statistics
mean_center_stats (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  module_id UUID REFERENCES modules(id),
  session_id UUID,
  mean_x FLOAT NOT NULL,
  mean_y FLOAT NOT NULL,
  calculated_at TIMESTAMP,
  point_count INTEGER,
  time_duration_seconds INTEGER,
  velocity_average FLOAT,  -- optional
  created_at TIMESTAMP DEFAULT NOW()
)

-- Index for fast queries
CREATE INDEX idx_movement_student_session 
  ON movement_coordinates(student_id, session_id);
CREATE INDEX idx_mean_center_stats_student 
  ON mean_center_stats(student_id, module_id);
```

### Connection Management (Node.js / Python)

#### Node.js (API Gateway)
```javascript
// Connection pooling with pg library
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,  // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Python (AI Pipeline)
```python
# SQLAlchemy ORM approach
from sqlalchemy import create_engine, pool

engine = create_engine(
  DATABASE_URL,
  poolclass=pool.QueuePool,
  pool_size=20,
  max_overflow=40,
  pool_pre_ping=True,  # Verify connection before use
  pool_recycle=3600    # Recycle connections every hour
)
```

### Data Validation Strategy
- **Client-side**: React Hook Form + Yup validation
- **API-level**: Express/Fastify middleware validation
- **Database-level**: Constraints, triggers, CHECK clauses
- **Business Logic**: Python FastAPI Pydantic models

---

## 8. MEAN CENTER FEATURE - IMPLEMENTATION ROADMAP

### Feature Overview
**Purpose**: Visualize the average/center of gravity of student movement on a 2D plane, showing where the "balance point" is across all collected coordinates.

### Feature Scope
```
Core Functionality:
✓ Capture student movement coordinates (x, y) over time
✓ Calculate the mean center point (average x, average y)
✓ Visualize the mean center on a 2D plane
✓ Show movement trajectory
✓ Display statistical information

Extended Features (Phase 2):
✓ Animation showing center of gravity concept
✓ Comparison of individual vs. group mean center
✓ Time-series playback of movement
✓ Multiple visualization types (scatter, heat map, trajectory)
✓ Export statistics for analysis
```

### Implementation Layers

#### 1. Backend/Database Layer
```python
# Python (FastAPI)
@app.post("/api/modules/{module_id}/movement")
async def record_movement(
  student_id: UUID,
  x: float,
  y: float,
  timestamp: datetime
):
    # Store movement coordinate
    # Optionally update running mean center

@app.get("/api/modules/{module_id}/mean-center/{student_id}")
async def get_mean_center(student_id: UUID, module_id: UUID):
    # Calculate mean center from stored coordinates
    # Return (mean_x, mean_y, point_count, stats)
```

#### 2. API Layer (Node.js)
```typescript
// Express/Fastify route
router.post('/modules/:moduleId/movement', (req, res) => {
  // Validate input
  // Forward to Python backend or call database
  // Broadcast via WebSocket to connected clients
})

router.get('/modules/:moduleId/mean-center/:studentId', (req, res) => {
  // Query PostgreSQL or Redis cache
  // Return mean center statistics
})
```

#### 3. Frontend Layer (React)
```typescript
interface MovementPoint {
  x: number;
  y: number;
  timestamp: Date;
}

interface MeanCenterData {
  mean_x: number;
  mean_y: number;
  point_count: number;
  variance_x: number;
  variance_y: number;
  centroid_trajectory: MovementPoint[];
}

// Component
<MeanCenterVisualization
  movementPoints={points}
  meanCenterData={meanCenterData}
  width={containerWidth}
  height={containerHeight}
  interactive={true}
/>
```

#### 4. Visualization Component
```typescript
// Technology: SVG + Framer Motion or Recharts
// Features:
// - Scatter plot of movement points
// - Center point highlighted
// - Optional: Trajectory line connecting points
// - Optional: Confidence ellipse around center
// - Responsive to mobile/desktop sizes
// - Touch gestures for mobile (pinch zoom, pan)

// Data representation:
// - Movement points: circles at (x, y)
// - Mean center: larger circle or star marker
// - Trajectory: line connecting points in time order
// - Legend: point count, mean coordinates, statistics
```

### Feature Location in Architecture
```
User Interaction (React Component)
    ↓
API Endpoint (Node.js) - POST /modules/{id}/movement
    ↓
Database Storage (PostgreSQL) - movement_coordinates table
    ↓
Calculation Service (Python) - Calculate mean center
    ↓
Cache Layer (Redis) - Store recent statistics
    ↓
Visualization (React) - Display mean center
```

### Mobile Considerations
- Touch-based input capture (coordinates from touch events)
- Responsive canvas/SVG sizing
- Gesture support (pinch to zoom, pan)
- Optimized rendering for low-powered devices
- Progressive enhancement (works without animations too)

---

## 9. FILE STRUCTURE (WHEN IMPLEMENTED)

### Recommended Directory Structure
```
alt42standalone_v1.0/
├── README.md                          # Project overview
├── .gitignore
├── package.json                       # Frontend dependencies
├── pyproject.toml                     # Python dependencies
├── docker-compose.yml                 # Local dev environment
│
├── frontend/                          # React application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MeanCenterVisualizer/
│   │   │   │   ├── MeanCenterVisualizer.tsx
│   │   │   │   ├── MeanCenterVisualizer.module.css
│   │   │   │   ├── useMovementTracking.ts
│   │   │   │   └── __tests__/
│   │   │   ├── TeacherDashboard/
│   │   │   ├── StudentUI/
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── meanCenterService.ts
│   │   ├── store/                    # Redux/Zustand state
│   │   ├── styles/
│   │   └── App.tsx
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── api_gateway/                  # Node.js
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── movement.ts
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── app.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── pipeline_orchestrator/        # Python
│       ├── src/
│       │   ├── stages/
│       │   │   ├── world_model/
│       │   │   ├── rule_engine/
│       │   │   ├── data_manager/
│       │   │   └── mean_center/     # ← Mean Center calculations
│       │   ├── database/
│       │   │   ├── models.py        # SQLAlchemy ORM
│       │   │   ├── schemas.py       # Movement data schema
│       │   │   └── migrations/      # Alembic migrations
│       │   ├── services/
│       │   └── main.py
│       ├── requirements.txt
│       ├── pyproject.toml
│       └── Dockerfile
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_base_tables.sql
│   │   ├── 002_create_movement_tables.sql
│   │   └── ...
│   ├── seeds/
│   └── README.md
│
├── tasks/
│   ├── 0001-prd-ai-education-pipeline.md
│   ├── 0002-mean-center-feature-spec.md
│   └── ...
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── mean-center-feature.md
│   └── ...
│
└── tests/
    ├── integration/
    ├── unit/
    └── e2e/
```

---

## 10. KEY ARCHITECTURAL INSIGHTS FOR MEAN CENTER FEATURE

### 1. Real-Time Data Streaming
- Movement coordinates will arrive continuously from frontend
- Consider WebSocket connection for real-time updates
- Redis Pub/Sub for broadcasting mean center updates to other viewers

### 2. Calculation Strategy
```
Naive approach:  Store all coordinates, recalculate on demand
   Pros:  Simple, accurate
   Cons:  Memory heavy, slow with large datasets

Incremental approach:  Update running mean
   Formula: new_mean = ((old_mean × n) + new_point) / (n + 1)
   Pros:  O(1) space, O(1) time per update
   Cons:  Slight numerical precision issues

Windowing approach:  Keep last N points
   Pros:  Recent data only, bounded memory
   Cons:  Need to track window efficiently
```

### 3. Performance Considerations
- **Storage**: At 30 FPS capture, expect ~2.6M coordinates/day per student
- **Calculation**: Incremental update optimal for real-time
- **Caching**: Store mean center results in Redis for 5-minute windows
- **Pagination**: For historical queries, paginate coordinate retrieval

### 4. Visualization Rendering
- **Canvas vs SVG**: 
  - SVG: Better for < 1000 points, responsive, accessible
  - Canvas: Better for > 1000 points, animations, WebGL possible
- **Libraries**: Recommend Recharts or Visx for initial MVP, Canvas.js for scale

### 5. Mobile Touch Capture
```typescript
// Capture touch coordinates on mobile
element.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  const rect = element.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  // Send to backend
  recordMovement(x, y);
});
```

---

## 11. NEXT STEPS FOR IMPLEMENTATION

### Phase 1: Foundation (Weeks 1-2)
1. Set up project structure (Node.js, React, Python)
2. Configure Docker Compose for local development
3. Set up PostgreSQL with base schema
4. Create mean_center feature branch and initial migrations

### Phase 2: Backend (Weeks 3-4)
1. Implement movement tracking API endpoints
2. Create database models and ORM definitions
3. Implement mean center calculation service
4. Add Redis caching layer

### Phase 3: Frontend (Weeks 5-6)
1. Create MeanCenterVisualizer React component
2. Implement touch event tracking
3. Add real-time WebSocket connection
4. Build responsive UI for mobile/desktop

### Phase 4: Integration & Testing (Weeks 7-8)
1. End-to-end integration testing
2. Performance optimization
3. Mobile device testing
4. Security review

---

## 12. RESOURCES & REFERENCES

### Key PRD Sections
- **Section 6.2**: System Architecture
- **Section 6.3**: Data Models
- **Section 6.4**: Technology Stack
- **Section 7.2**: Performance Considerations

### Related Technologies to Study
- PostgreSQL JSONB & Array types for movement data
- Redis Pub/Sub for real-time updates
- Socket.io for WebSocket connections
- SVG.js or Canvas for visualization
- Framer Motion for animations
- TypeScript generics for type-safe data handling

### Code Generation Considerations
- The Mean Center feature will be auto-generated for applicable modules
- Prompts for AI need to specify when mean center visualization is appropriate
- Feature should be modular so it can be included/excluded per module

