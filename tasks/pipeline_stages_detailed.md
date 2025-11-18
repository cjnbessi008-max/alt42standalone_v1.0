# AI Education System Pipeline - Detailed Stage Breakdown

## Complete 6-Stage Pipeline Architecture

### STAGE 1: WORLD MODEL RECONSTRUCTION
**Goal**: Extract semantic understanding from teacher's request

**Input**: 
```
"Create a fractions learning module for 3rd graders. 
Students should visualize and practice addition/subtraction 
using pizza or cake examples."
```

**Process** (To be implemented):
1. Parse natural language (Korean/English)
2. Extract concepts: Fraction, Numerator, Denominator, Part, Whole, Pizza, Cake
3. Identify operations: Add, Subtract, Simplify, Visualize
4. Map relationships: Fraction HAS Numerator, Fraction HAS Denominator, Pizza DIVIDED_INTO Slices
5. Build concept graph (dependency diagram)
6. Identify learning progression

**Output** (stored as JSONB):
```json
{
  "concepts": [
    {"id": "fraction", "definition": "...", "parent": null},
    {"id": "numerator", "definition": "...", "parent": "fraction"},
    {"id": "denominator", "definition": "...", "parent": "fraction"}
  ],
  "relationships": [
    {"from": "fraction", "type": "HAS", "to": "numerator"},
    {"from": "fraction", "type": "HAS", "to": "denominator"}
  ],
  "operations": [
    {"name": "add_fractions", "inputs": ["fraction", "fraction"], "output": "fraction"},
    {"name": "subtract_fractions", "inputs": ["fraction", "fraction"], "output": "fraction"}
  ],
  "progression": ["visualize", "understand_parts", "add_same_denominator", "add_different_denominator"]
}
```

**Components to Build**:
- NLP processor (Korean/English)
- Concept extractor
- Relationship mapper
- Graph builder
- Progression analyzer

---

### STAGE 2: RULE GENERATION ENGINE
**Goal**: Convert domain understanding into executable business rules

**Input**: World model from Stage 1

**Process**:
1. Extract business rules from world model
   - Validation rules: "Denominator cannot be zero"
   - Calculation rules: "Add fractions = (a*d + b*c) / (b*d)"
   - Progression rules: "Master visualization before arithmetic"
   - Feedback rules: "If incorrect, show similar problem"

2. Analyze complexity:
   - Count conditions, nesting depth, entity references, dependencies
   - Threshold: >5 conditions OR >3 nesting OR >4 entities OR cycles → Convert to Ontology

3. Generate executable code:
   ```python
   # Auto-generated rule (example)
   def validate_fraction(numerator: int, denominator: int) -> bool:
       """Validate that denominator is not zero"""
       return denominator != 0

   def add_fractions(num1: int, denom1: int, num2: int, denom2: int) -> tuple:
       """Add two fractions: (a/b) + (c/d) = (ad + bc) / bd"""
       result_num = (num1 * denom2) + (num2 * denom1)
       result_denom = denom1 * denom2
       return (result_num, result_denom)
   ```

4. Generate unit tests for each rule

**Output**:
```json
{
  "rules": [
    {
      "id": "rule_1",
      "name": "denominator_not_zero",
      "type": "validation",
      "complexity_score": 1,
      "code": "def validate_fraction(...): ...",
      "tests": [...]
    },
    {
      "id": "rule_2", 
      "name": "add_fractions",
      "type": "calculation",
      "complexity_score": 3,
      "code": "def add_fractions(...): ...",
      "tests": [...]
    }
  ]
}
```

**Components to Build**:
- Rule extractor
- Complexity analyzer
- Code generator (Python/JavaScript)
- Test generator
- Ontology converter (for complex rules)

---

### STAGE 3: DATA MANAGEMENT
**Goal**: Design database schema and prepare data

**Input**: Rules from Stage 2

**Process**:
1. Identify required entities and attributes
   - FractionProblem: numerator_1, denominator_1, numerator_2, denominator_2, visual_type, difficulty
   - StudentAttempt: student_id, problem_id, answer_numerator, answer_denominator, is_correct, time_spent
   - StudentProgress: student_id, module_id, progress_percentage, started_at, completed_at

2. Check data availability
   - Scan existing databases
   - Assess data quality
   - Identify gaps

3. Generate pseudo data (when real data unavailable)
   - Statistically realistic fraction problems
   - Realistic student attempt patterns
   - Difficulty progression

4. Design normalized schema (3NF)
   - Foreign keys
   - Constraints (CHECK, NOT NULL)
   - Indexes for performance
   - Audit columns (created_at, updated_at)

5. Generate migration scripts

**Output** (PostgreSQL schema):
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    teacher_id UUID,
    status VARCHAR(20),
    world_model JSONB,
    generated_schema JSONB,
    created_at TIMESTAMP
);

CREATE TABLE fraction_problems (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES modules(id),
    problem_type VARCHAR(50),
    numerator_1 INTEGER NOT NULL,
    denominator_1 INTEGER NOT NULL CHECK (denominator_1 > 0),
    numerator_2 INTEGER,
    denominator_2 INTEGER CHECK (denominator_2 > 0),
    visual_representation VARCHAR(20),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_attempts (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    problem_id UUID REFERENCES fraction_problems(id),
    answer_numerator INTEGER,
    answer_denominator INTEGER,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
```

**Components to Build**:
- Data scanner
- Pseudo data generator
- Schema designer
- Migration executor
- Data seeder

---

### STAGE 4: INPUT STRATEGY DESIGN
**Goal**: Determine how student data will be collected

**Input**: Data schema from Stage 3

**Process**:
1. Identify input methods for each data type
   - Numeric input: Use number input field for answers
   - Visual interaction: Drag-and-drop for fraction manipulation
   - Behavior tracking: Track time spent, attempts, interaction patterns
   - Feedback prompts: Conversational hints and guidance

2. Design validation
   - Client-side validation (immediate feedback)
   - Server-side validation (security)
   - Error messages and recovery

3. Map data flow
   - Student interaction → Data collection → Processing → Storage → Analytics

4. Consider UX
   - Minimize cognitive load
   - Progressive disclosure (show complexity gradually)
   - Multi-step workflows

**Output**:
```json
{
  "input_strategy": [
    {
      "field": "answer_numerator",
      "type": "number_input",
      "label": "Numerator (top number)",
      "validation": {
        "type": "integer",
        "min": 0,
        "max": 100
      },
      "ui_component": "NumberInput",
      "help_text": "Enter the top number of the fraction"
    },
    {
      "field": "problem_interaction",
      "type": "visual_interaction",
      "ui_component": "DragDropVisualizer",
      "behavior_tracking": ["time_spent", "drag_count", "attempts"],
      "help_text": "Drag the slices to show the fraction"
    }
  ]
}
```

**Components to Build**:
- Input method selector
- Validation rule generator
- Data flow mapper
- UX analyzer

---

### STAGE 5: UI AUTO-GENERATION
**Goal**: Create React components for student and teacher interaction

**Input**: Input strategy from Stage 4

**Process**:
1. Check for component reuse
   - FractionVisualizer (can be reused across modules)
   - Prefer existing components when compatible

2. Analyze UX journey
   - Teacher creates module request
   - System generates module
   - Student accesses module
   - Student completes problem
   - System provides feedback
   - Track progress

3. Generate React components
   ```typescript
   // Auto-generated component
   interface FractionVisualizerProps {
     numerator: number;
     denominator: number;
     visualType: 'pizza' | 'cake' | 'bar';
     onInteraction: (event: InteractionEvent) => void;
   }

   export const FractionVisualizer: React.FC<FractionVisualizerProps> = ({
     numerator,
     denominator,
     visualType,
     onInteraction
   }) => {
     return (
       <div className="visualizer" role="img" aria-label={`${numerator}/${denominator}`}>
         {/* SVG visualization */}
         {/* Drag-drop handlers */}
         {/* Accessibility features */}
       </div>
     );
   };
   ```

4. Apply styling
   - KAIST brand colors
   - Consistent fonts/spacing
   - Responsive design (mobile, tablet, desktop)
   - Dark mode support

5. Ensure accessibility
   - WCAG 2.1 AA compliance
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

**Output** (Generated React app structure):
```
src/
├── components/
│   ├── FractionVisualizer.tsx
│   ├── ProblemForm.tsx
│   ├── ProgressBar.tsx
│   ├── FeedbackDisplay.tsx
│   └── StudentDashboard.tsx
├── pages/
│   ├── ModulePage.tsx
│   └── ProgressPage.tsx
├── hooks/
│   ├── useFraction.ts
│   └── useProblemLoading.ts
└── styles/
    ├── theme.ts
    └── FractionVisualizer.module.css
```

**Components to Build**:
- React component generator
- Styling engine
- Form builder
- Accessibility checker
- Responsive design handler

---

### STAGE 6: INTEGRATION & DEPLOYMENT
**Goal**: Create complete, production-ready system

**Input**: UI components from Stage 5

**Process**:
1. Generate API endpoints
   ```
   POST   /api/modules/{id}/problems         - Get next problem
   GET    /api/modules/{id}/problems/{pid}   - Get problem details
   POST   /api/modules/{id}/submit           - Submit answer
   GET    /api/modules/{id}/progress/{sid}   - Get student progress
   PUT    /api/modules/{id}/settings         - Update module settings
   ```

2. Generate tests
   - Unit tests for generated rules
   - Integration tests for workflows
   - E2E tests for complete module

3. Create Docker container
   ```dockerfile
   FROM node:20-alpine
   FROM python:3.11-alpine
   # Include all components
   ```

4. Setup deployment
   - Docker Compose for local dev
   - Kubernetes manifests (future)
   - Environment configuration
   - Monitoring/logging

5. Generate documentation
   - API documentation (OpenAPI/Swagger)
   - User guides (teacher, student)
   - Technical docs
   - Troubleshooting guide

**Output**:
```
deployment/
├── docker-compose.yml
├── Dockerfile
├── kubernetes/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── docs/
│   ├── API.md
│   ├── USER_GUIDE.md
│   └── TECH_GUIDE.md
└── monitoring/
    ├── prometheus.yml
    └── grafana-dashboard.json
```

**Components to Build**:
- API generator
- Test generator
- Docker builder
- Deployment orchestrator
- Documentation generator

---

## Data Flow Through Pipeline

```
Teacher Input (Natural Language)
        ↓
[STAGE 1] World Model Reconstruction
        ↓ (Outputs: concepts, relationships, operations)
        ↓
[STAGE 2] Rule Generation Engine
        ↓ (Outputs: executable rules, complexity analysis)
        ↓
[STAGE 3] Data Management
        ↓ (Outputs: PostgreSQL schema, migrations, pseudo data)
        ↓
[STAGE 4] Input Strategy Design
        ↓ (Outputs: input specifications, validation rules)
        ↓
[STAGE 5] UI Auto-Generation
        ↓ (Outputs: React components, styling, accessibility)
        ↓
[STAGE 6] Integration & Deployment
        ↓ (Outputs: Docker, APIs, tests, documentation)
        ↓
Complete Educational Module (Ready for Students)
```

---

## Key Points for Implementation

### Stage Interdependencies
- Stage 1 provides input for all subsequent stages
- Stage 2 refines the model with business logic
- Stage 3 depends on understanding data needs from Stage 2
- Stage 4 depends on knowing what data exists (Stage 3)
- Stage 5 depends on understanding what inputs needed (Stage 4)
- Stage 6 packages everything for production

### Validation Gates
- After each stage, validate outputs before proceeding
- Quality checks:
  - Stage 1: Is world model comprehensive and correct?
  - Stage 2: Are rules executable and correct?
  - Stage 3: Is schema normalized and sound?
  - Stage 4: Will input strategy work for UX?
  - Stage 5: Are components accessible and responsive?
  - Stage 6: Can system be deployed and tested?

### Rollback Capabilities
- At each stage, maintain ability to return to previous version
- Version control all generated artifacts
- Track change reasons and approval

### Performance Expectations
- Simple module: 2-5 minutes end-to-end
- Medium module: 5-15 minutes
- Complex module: 15-30 minutes

---

## Technology Used Per Stage

| Stage | Primary Tech | Secondary Tech |
|-------|--------------|---|
| 1 | Claude API (NLP) | Python, NLTK |
| 2 | Python AST, Claude | Jinja2 templating |
| 3 | PostgreSQL, Alembic | Python SQLAlchemy |
| 4 | Claude, Python | JSON Schema |
| 5 | Claude, Node.js | React, TypeScript |
| 6 | Docker, GitHub Actions | PostgreSQL, Redis |

---

## Expected Artifacts Generated Per Module

1. **World Model JSON**: Domain structure
2. **Rule Code**: Python/JavaScript implementation
3. **Unit Tests**: Automated test cases
4. **Database Schema**: SQL migration files
5. **Seed Data**: JSON data files
6. **React Components**: TypeScript JSX files
7. **API Endpoints**: Express/FastAPI route definitions
8. **Integration Tests**: E2E test cases
9. **Docker Container**: Complete deployable image
10. **Documentation**: User and technical guides
11. **Monitoring Config**: Prometheus/Grafana setup

Total artifacts generated per module: 11+ files
Total lines of code generated per module: 3,000-10,000 LOC

