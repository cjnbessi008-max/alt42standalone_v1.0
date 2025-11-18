# Regularity Pattern Module Specification
## Educational Module for Platonic Solids Visualization

---

## 1. Overview

### Module Name
**Regularity Pattern (정다면체 규칙성 패턴)**

### Educational Objective
Enable students to understand the mathematical regularity and symmetry of Platonic solids (regular polyhedra) through interactive color pattern visualization on a virtual smartphone interface.

### Target Audience
- **Primary**: Middle school students (Grades 6-9)
- **Secondary**: High school geometry students
- **Tertiary**: Teachers demonstrating 3D geometry concepts

### Key Learning Outcomes
Students will be able to:
1. Identify the five Platonic solids (tetrahedron, cube, octahedron, dodecahedron, icosahedron)
2. Recognize regularity patterns through color-coded faces, edges, and vertices
3. Understand the relationship between faces, edges, and vertices (Euler's formula: V - E + F = 2)
4. Explore symmetry groups and rotational patterns
5. Visualize 3D geometry concepts in an interactive environment

---

## 2. Module Description

### What is "Regularity Pattern"?

Regular polyhedra (Platonic solids) exhibit perfect mathematical regularity:
- All faces are identical regular polygons
- All vertices are identical (same number of faces meet at each vertex)
- All edges are identical in length

This module visualizes this regularity through **color patterns** that highlight:
- **Face patterns**: Color-coded faces showing symmetry groups
- **Edge patterns**: Highlighting edge relationships and dual polyhedra
- **Vertex patterns**: Showing vertex configurations
- **Rotation patterns**: Animated color flows demonstrating rotational symmetry

### Virtual Smartphone Display

The module renders in a **virtual smartphone interface** positioned in the lower-right corner of the screen, simulating a mobile AR/VR learning experience:

```
┌─────────────────────────────────────────────────┐
│  Main LMS Content Area                          │
│                                                  │
│  [Problem Description, Instructions, etc.]      │
│                                                  │
│                                                  │
│                                    ┌──────────┐ │
│                                    │ 📱       │ │
│                                    │ Virtual  │ │
│                                    │ Phone    │ │
│                                    │ Display  │ │
│                                    │          │ │
│                                    │ [3D      │ │
│                                    │  Model]  │ │
│                                    │          │ │
│                                    └──────────┘ │
└─────────────────────────────────────────────────┘
```

**Virtual Phone Features**:
- Responsive 9:16 aspect ratio (smartphone portrait)
- Touch/drag interaction for 3D rotation
- Pinch-to-zoom support
- Preset view buttons (top, front, side, perspective)
- Color pattern selector
- Animation controls (play, pause, speed)

---

## 3. Platonic Solids Coverage

### The Five Regular Polyhedra

| Polyhedron | Faces | Vertices | Edges | Face Shape | Vertices per Face | Faces per Vertex |
|------------|-------|----------|-------|------------|-------------------|------------------|
| **Tetrahedron** (정사면체) | 4 | 4 | 6 | Equilateral Triangle | 3 | 3 |
| **Cube** (정육면체) | 6 | 8 | 12 | Square | 4 | 3 |
| **Octahedron** (정팔면체) | 8 | 6 | 12 | Equilateral Triangle | 3 | 4 |
| **Dodecahedron** (정십이면체) | 12 | 20 | 30 | Regular Pentagon | 5 | 3 |
| **Icosahedron** (정이십면체) | 20 | 12 | 30 | Equilateral Triangle | 3 | 5 |

### Dual Relationships
The module visualizes dual polyhedra relationships:
- **Cube ↔ Octahedron**: Placing vertices at face centers creates the dual
- **Dodecahedron ↔ Icosahedron**: Pentagon-based and triangle-based duals
- **Tetrahedron**: Self-dual

---

## 4. Color Pattern Modes

### Mode 1: Face Symmetry Coloring
Colors faces based on symmetry equivalence classes.

**Example - Cube**:
- Top/Bottom: Blue
- Front/Back: Red
- Left/Right: Green

**Educational Value**: Shows which faces are equivalent under rotational symmetry.

### Mode 2: Vertex Configuration Coloring
Colors faces based on their relationship to vertex neighborhoods.

**Example - Dodecahedron**:
- Faces surrounding each vertex get gradient colors
- Demonstrates how faces meet at vertices

### Mode 3: Euler Characteristic Visualization
Interactive mode highlighting V (vertices), E (edges), F (faces) separately.

**Interactive Elements**:
- Toggle vertices: Show/hide vertex points with count
- Toggle edges: Highlight edge network with count
- Toggle faces: Show filled or wireframe faces with count
- Display: V - E + F = 2 (always!)

### Mode 4: Rotation Animation
Animated color flow showing rotational symmetry axes.

**Example - Octahedron**:
- 3-fold rotation axes through opposite vertices (4 axes)
- 4-fold rotation axes through opposite face centers (3 axes)
- 2-fold rotation axes through edge midpoints (6 axes)

Colors flow along rotation paths to visualize symmetry.

### Mode 5: Dual Polyhedra Overlay
Simultaneously displays a polyhedron and its dual in contrasting colors.

**Example - Cube + Octahedron**:
- Cube: Semi-transparent blue
- Octahedron (vertices at cube face centers): Opaque orange
- Shows geometric duality relationship

---

## 5. Technical Architecture

### 5.1 Frontend Stack

**Primary Technology**: React 18+ with TypeScript

**3D Rendering**:
- **Three.js** (primary): WebGL-based 3D library
- **React Three Fiber** (R3F): React renderer for Three.js
- **Drei**: Helper components for R3F (cameras, controls, geometry)

**UI Components**:
- **Material-UI (MUI)**: For control panels and buttons
- **Framer Motion**: For smooth animations and transitions

**Smartphone Emulator**:
- Custom React component mimicking smartphone frame
- CSS transforms for 3D perspective effect
- Touch event handling for mobile interactions

### 5.2 3D Model Generation

**Geometry Creation**:
```typescript
// Example: Platonic solid geometries in Three.js
import {
  TetrahedronGeometry,
  BoxGeometry,
  OctahedronGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry
} from 'three';

const polyhedra = {
  tetrahedron: new TetrahedronGeometry(1),
  cube: new BoxGeometry(1, 1, 1),
  octahedron: new OctahedronGeometry(1),
  dodecahedron: new DodecahedronGeometry(1),
  icosahedron: new IcosahedronGeometry(1)
};
```

**Color Pattern Application**:
- Vertex colors using BufferGeometry attributes
- Custom shaders for advanced color patterns
- Face indexing for symmetry-based coloring

### 5.3 Database Schema

```sql
-- Module: Regularity Pattern
-- Auto-generated by AI Education Pipeline

CREATE TABLE polyhedron_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    polyhedron_type VARCHAR(20) NOT NULL
        CHECK (polyhedron_type IN ('tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron')),
    color_mode VARCHAR(30) NOT NULL
        CHECK (color_mode IN ('face_symmetry', 'vertex_config', 'euler_viz', 'rotation_anim', 'dual_overlay')),
    interaction_time_seconds INTEGER NOT NULL DEFAULT 0,
    rotation_count INTEGER DEFAULT 0,
    zoom_count INTEGER DEFAULT 0,
    mode_switches INTEGER DEFAULT 0,
    completed_quiz BOOLEAN DEFAULT FALSE,
    quiz_score DECIMAL(5,2),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE euler_explorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES polyhedron_sessions(id),
    polyhedron_type VARCHAR(20) NOT NULL,
    student_counted_vertices INTEGER,
    student_counted_edges INTEGER,
    student_counted_faces INTEGER,
    student_calculated_euler BOOLEAN, -- Did they verify V - E + F = 2?
    is_correct BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE symmetry_identifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES polyhedron_sessions(id),
    polyhedron_type VARCHAR(20) NOT NULL,
    symmetry_type VARCHAR(30) NOT NULL
        CHECK (symmetry_type IN ('rotational', 'reflectional', 'dual')),
    student_identified_count INTEGER, -- How many symmetry axes did student identify?
    correct_count INTEGER NOT NULL,   -- Actual count
    accuracy_score DECIMAL(5,2),
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pattern_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    favorite_polyhedron VARCHAR(20),
    favorite_color_mode VARCHAR(30),
    total_exploration_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_polyhedron_sessions_student ON polyhedron_sessions(student_id);
CREATE INDEX idx_euler_explorations_session ON euler_explorations(session_id);
CREATE INDEX idx_symmetry_identifications_session ON symmetry_identifications(session_id);
```

### 5.4 API Endpoints

```typescript
// Auto-generated RESTful API endpoints

// Start a new polyhedron exploration session
POST /api/regularity-pattern/session
Body: {
  student_id: string,
  polyhedron_type: string,
  color_mode: string
}

// Update session interaction metrics
PATCH /api/regularity-pattern/session/:id/interaction
Body: {
  rotation_count?: number,
  zoom_count?: number,
  mode_switches?: number,
  interaction_time_seconds: number
}

// Submit Euler characteristic exploration
POST /api/regularity-pattern/euler-exploration
Body: {
  session_id: string,
  student_counted_vertices: number,
  student_counted_edges: number,
  student_counted_faces: number,
  student_calculated_euler: boolean
}

// Submit symmetry identification
POST /api/regularity-pattern/symmetry-identification
Body: {
  session_id: string,
  symmetry_type: string,
  student_identified_count: number
}

// Get student progress and statistics
GET /api/regularity-pattern/student/:student_id/progress

// Get leaderboard (optional gamification)
GET /api/regularity-pattern/leaderboard
Query params: ?metric=exploration_time | quiz_score | accuracy
```

---

## 6. User Interface Design

### 6.1 Virtual Smartphone Component

**Smartphone Frame Specifications**:
- **Dimensions**: 375px × 667px (iPhone 8 size) - scalable
- **Position**: Fixed bottom-right corner with 20px margin
- **Appearance**:
  - Rounded corners (border-radius: 30px)
  - Device frame with notch/camera styling
  - Glass reflection effect (subtle gradient overlay)
  - Shadow for 3D depth effect

**Screen Layout**:
```
┌─────────────────────────────┐
│ 📱  Regularity Pattern      │ ← Header
├─────────────────────────────┤
│                             │
│                             │
│      [3D Polyhedron]        │ ← Main 3D Canvas
│      (Interactive)          │
│                             │
│                             │
├─────────────────────────────┤
│ [Tetra][Cube][Octa]...     │ ← Polyhedron Selector
├─────────────────────────────┤
│ Color Mode: [Dropdown ▼]    │ ← Color Pattern Selector
├─────────────────────────────┤
│ V: 8  E: 12  F: 6           │ ← Live Count Display
│ V - E + F = 2 ✓             │ ← Euler Verification
├─────────────────────────────┤
│ [⟲ Reset] [▶ Animate]      │ ← Control Buttons
└─────────────────────────────┘
```

### 6.2 Interaction Design

**Primary Interactions**:
1. **Drag to Rotate**: Click and drag to rotate polyhedron in 3D
2. **Pinch to Zoom**: Two-finger pinch (or scroll wheel) to zoom
3. **Double-tap**: Reset to default view
4. **Preset Views**: Buttons for standard viewing angles

**Secondary Interactions**:
1. **Polyhedron Selection**: Tap to switch between 5 solids
2. **Color Mode Selection**: Dropdown to change pattern mode
3. **Animation Control**: Play/pause rotation animations
4. **Quiz Mode**: Interactive questions overlay

### 6.3 Accessibility Features

**Visual Accessibility**:
- High contrast mode for patterns
- Colorblind-friendly palettes
- Adjustable rotation speed
- Text labels for all visual elements

**Keyboard Navigation**:
- Arrow keys: Rotate polyhedron
- +/- keys: Zoom in/out
- Space: Toggle animation
- Tab: Navigate controls

**Screen Reader Support**:
- ARIA labels describing polyhedron type and properties
- Announced count updates (V, E, F values)
- Descriptive pattern mode names

---

## 7. Learning Activities

### Activity 1: Polyhedron Explorer
**Objective**: Familiarize students with the five Platonic solids

**Steps**:
1. Student selects each polyhedron one by one
2. Rotates and examines from different angles
3. Counts vertices, edges, and faces
4. Verifies Euler's formula (V - E + F = 2)

**Assessment**: Completion tracking + accuracy of counts

### Activity 2: Symmetry Detective
**Objective**: Identify rotational symmetry axes

**Steps**:
1. Enable "Rotation Animation" color mode
2. Observe color flow patterns
3. Count how many rotation axes of each type (2-fold, 3-fold, 4-fold, 5-fold)
4. Submit answers for validation

**Example Questions**:
- "How many 3-fold rotation axes does a tetrahedron have?" (Answer: 4)
- "How many 5-fold rotation axes does an icosahedron have?" (Answer: 6)

### Activity 3: Dual Discovery
**Objective**: Understand dual polyhedra relationships

**Steps**:
1. Enable "Dual Polyhedra Overlay" mode
2. Observe cube + octahedron pair
3. Count: Cube vertices (8) = Octahedron faces (8)
4. Observe: Dodecahedron vertices (20) = Icosahedron faces (20)

**Assessment**: Quiz on dual relationships

### Activity 4: Pattern Prediction
**Objective**: Predict symmetry patterns before revealing

**Steps**:
1. Show wireframe polyhedron only
2. Ask: "If we color faces by symmetry groups, how many colors will we need?"
3. Student submits prediction
4. Reveal actual "Face Symmetry" pattern
5. Discuss why prediction was correct/incorrect

### Activity 5: Build Your Own Pattern
**Advanced Feature**: Student-created color patterns

**Steps**:
1. Student selects polyhedron
2. Interactive face-painting tool
3. Student creates their own color pattern
4. System analyzes: "This pattern has 3 symmetry axes"
5. Save and share with classmates

---

## 8. Integration with LMS (Moodle)

### 8.1 LMS Compatibility Requirements

**Primary LMS**: Moodle 3.7+
**Secondary Support**: Canvas, Blackboard (future)

### 8.2 Integration Methods

**Method 1: LTI (Learning Tools Interoperability) 1.3**
- Standard protocol for embedding external tools in LMS
- Moodle provides student context (user ID, course ID, role)
- Regularity Pattern module receives context via LTI launch
- Grades/completion sent back to Moodle gradebook

**LTI Implementation**:
```typescript
// LTI launch endpoint
POST /api/lti/launch
Headers: {
  Authorization: "Bearer <LTI_JWT_TOKEN>"
}
Body: {
  iss: "https://moodle.kaist.ac.kr",
  aud: "regularity-pattern-client-id",
  sub: "student-uuid",
  context_id: "course-123",
  roles: ["Learner"]
}

// Response: Redirect to embedded activity
Redirect: /embed/regularity-pattern?session=<SESSION_TOKEN>
```

**Method 2: iFrame Embedding**
- Simpler integration for Moodle activities
- Embed via `<iframe>` in Moodle page
- Pass student ID via URL parameter (secured with JWT)

```html
<!-- Moodle Page HTML -->
<iframe
  src="https://regularity-pattern.kaist.ac.kr/embed?student_id=xyz&signature=abc123"
  width="100%"
  height="800px"
  allow="accelerometer; gyroscope"
  sandbox="allow-scripts allow-same-origin">
</iframe>
```

**Method 3: Moodle Plugin** (Future Enhancement)
- Native Moodle activity module
- Installed via Moodle plugin directory
- Deeper integration with Moodle gradebook and analytics

### 8.3 Data Synchronization

**Student Enrollment**:
- Moodle pushes student roster via LTI or REST API
- Regularity Pattern creates student records
- Bi-directional sync for updates

**Grade Passback**:
- Module completion status → Moodle gradebook
- Quiz scores → Moodle assignment grades
- Exploration time → Moodle activity completion criteria

**Progress Tracking**:
- Moodle displays completion percentage
- Detailed analytics available in Regularity Pattern dashboard
- Export to Moodle reports

### 8.4 Moodle Database Integration (Optional)

For tighter integration, connect to Moodle database (read-only):

**Moodle Database Info** (from user description):
- **Database**: MySQL 5.7
- **PHP Version**: 7.1.9
- **Moodle Version**: 3.7

**Read Student Data**:
```sql
-- Read from Moodle database (read-only connection)
SELECT
  u.id as moodle_user_id,
  u.username,
  u.firstname,
  u.lastname,
  u.email,
  c.id as course_id,
  c.fullname as course_name
FROM mdl_user u
JOIN mdl_user_enrolments ue ON u.id = ue.userid
JOIN mdl_enrol e ON ue.enrolid = e.id
JOIN mdl_course c ON e.courseid = c.id
WHERE c.id = ?
  AND u.deleted = 0
  AND ue.status = 0;
```

**Write Grades to Moodle**:
```sql
-- Insert grade for assignment
INSERT INTO mdl_grade_grades (
  itemid,
  userid,
  rawgrade,
  finalgrade,
  timecreated,
  timemodified
) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  rawgrade = VALUES(rawgrade),
  finalgrade = VALUES(finalgrade),
  timemodified = UNIX_TIMESTAMP();
```

**Security Considerations**:
- Use read-only MySQL user for data fetching
- Use Moodle's grade_update API for grade writes (don't write directly to DB)
- Encrypt database credentials
- Implement connection pooling and caching

---

## 9. Technical Implementation Details

### 9.1 React Component Structure

```typescript
// Main App Component
<RegularityPatternApp>
  <VirtualSmartphone>
    <PhoneFrame>
      <AppHeader />
      <PolyhedronCanvas>
        <Scene>
          <AmbientLight />
          <DirectionalLight />
          <PolyhedronMesh
            type={selectedPolyhedron}
            colorMode={selectedColorMode}
            rotation={rotation}
          />
          {showDual && <DualPolyhedronMesh />}
        </Scene>
        <OrbitControls />
      </PolyhedronCanvas>
      <ControlPanel>
        <PolyhedronSelector />
        <ColorModeSelector />
        <EulerDisplay />
        <AnimationControls />
      </ControlPanel>
    </PhoneFrame>
  </VirtualSmartphone>
</RegularityPatternApp>
```

### 9.2 Color Pattern Algorithm

**Face Symmetry Coloring Algorithm**:
```typescript
interface Face {
  vertices: Vector3[];
  normal: Vector3;
  centroid: Vector3;
}

function computeFaceSymmetryColors(
  polyhedron: Polyhedron,
  symmetryGroup: SymmetryGroup
): Color[] {
  const faces = polyhedron.getFaces();
  const orbits = symmetryGroup.computeOrbits(faces);

  // Each orbit gets a unique color
  const colors = generateDistinctColors(orbits.length);

  return faces.map(face => {
    const orbitIndex = findOrbitIndex(face, orbits);
    return colors[orbitIndex];
  });
}

// Symmetry group for cube (Oh - octahedral symmetry)
const cubeSymmetry = new SymmetryGroup({
  order: 48, // 48 symmetry operations
  rotationAxes: [
    { type: '4-fold', count: 3 }, // Face-to-face
    { type: '3-fold', count: 4 }, // Vertex-to-vertex
    { type: '2-fold', count: 6 }  // Edge-to-edge
  ]
});
```

**Rotation Animation Algorithm**:
```typescript
function animateRotationPattern(
  polyhedron: Polyhedron,
  axis: Vector3,
  foldOrder: number // 2, 3, 4, or 5
): Animation {
  const angleStep = (2 * Math.PI) / foldOrder;

  return {
    duration: 3000, // 3 seconds per rotation
    keyframes: Array.from({ length: foldOrder + 1 }, (_, i) => ({
      angle: i * angleStep,
      colors: computeColorFlowAtAngle(polyhedron, axis, i * angleStep)
    }))
  };
}

function computeColorFlowAtAngle(
  polyhedron: Polyhedron,
  axis: Vector3,
  angle: number
): Color[] {
  // Create color gradient based on angular distance from rotation
  return polyhedron.getFaces().map(face => {
    const angularDist = computeAngularDistance(face.centroid, axis, angle);
    return interpolateColor(COLOR_START, COLOR_END, angularDist / Math.PI);
  });
}
```

### 9.3 Performance Optimization

**Geometry Caching**:
- Pre-compute all 5 polyhedron geometries at app load
- Cache in memory (total size < 100KB)
- No runtime geometry generation

**Color Buffer Updates**:
- Use BufferGeometry with updateable vertex colors
- Update only color attributes when mode changes
- Avoid full geometry reconstruction

**Animation Frame Rate**:
- Target: 60 FPS
- Use `requestAnimationFrame` for smooth animations
- Throttle interaction events (drag, zoom) to 60Hz max

**Mobile Optimization**:
- Reduce polygon count for mobile devices
- Use simpler shaders on low-end devices
- Implement level-of-detail (LOD) for zoom levels

---

## 10. Assessment & Analytics

### 10.1 Formative Assessment

**Real-time Feedback**:
- Immediate validation when counting V, E, F
- Visual confirmation when identifying symmetries
- Color-coded correctness indicators

**Progress Indicators**:
- Completion percentage per activity
- Time spent per polyhedron
- Mastery level (novice, intermediate, expert)

### 10.2 Summative Assessment

**Quiz Questions** (auto-generated):

1. **Counting Challenge**
   - "The dodecahedron has ___ vertices, ___ edges, and ___ faces."
   - Auto-graded numeric input

2. **Symmetry Recognition**
   - "How many 5-fold rotation axes does the icosahedron have?"
   - Multiple choice: [4, 6, 8, 10, 12]

3. **Dual Relationships**
   - "Which polyhedron is the dual of the cube?"
   - Multiple choice: [Tetrahedron, Octahedron, Dodecahedron, Icosahedron]

4. **Pattern Matching**
   - Show color pattern, ask: "Which polyhedron is this?"
   - Visual multiple choice

5. **Euler's Formula**
   - "Verify: Does the octahedron satisfy V - E + F = 2?"
   - True/False with calculation shown

### 10.3 Learning Analytics

**Teacher Dashboard Metrics**:
- Average exploration time per student
- Most/least explored polyhedra
- Common misconceptions (wrong counts, wrong symmetry IDs)
- Quiz score distribution
- Engagement patterns (time of day, session length)

**Student Dashboard Metrics**:
- Personal best scores
- Polyhedra mastered (✓/✗)
- Exploration time vs. class average
- Achievements unlocked

**Data Visualizations**:
- Heatmap: Which polyhedron faces students interact with most
- Timeline: Progression through activities
- Comparison: Student vs. class performance

---

## 11. Future Enhancements

### Phase 2 Features

1. **AR Mode**: Use device camera for augmented reality overlay
2. **VR Mode**: Immersive VR experience with headset support
3. **Multiplayer**: Collaborative exploration with classmates
4. **Custom Polyhedra**: Explore Archimedean solids, Johnson solids, etc.
5. **Physical Model Export**: 3D print STL files of explored polyhedra
6. **Voice Narration**: Guided tours with audio explanations
7. **Haptic Feedback**: Vibration when discovering symmetries (mobile)

### Advanced Topics

1. **Crystallography Connection**: Map Platonic solids to crystal systems
2. **Chemistry Integration**: Molecular geometry (tetrahedral, octahedral complexes)
3. **Art & Architecture**: Historical uses of regular polyhedra (Islamic art, Buckminster Fuller)
4. **Graph Theory**: Dual graphs and planar graph properties

---

## 12. Success Metrics (Specific to Regularity Pattern)

### Primary KPIs

1. **Engagement Rate**
   - Target: >80% of students complete all 5 polyhedron explorations
   - Measurement: Completion tracking per student

2. **Accuracy Rate**
   - Target: >90% accuracy on Euler characteristic verification after practice
   - Measurement: Correct V-E+F calculations / Total attempts

3. **Retention**
   - Target: Students can recall polyhedron properties 1 week later
   - Measurement: Follow-up quiz scores

4. **Time to Mastery**
   - Target: <30 minutes to explore all 5 polyhedra with confidence
   - Measurement: Session duration + self-reported confidence

### Secondary Metrics

5. **Preferred Learning Mode**
   - Which color pattern mode do students find most helpful?
   - Survey + usage analytics

6. **Transfer Learning**
   - Can students apply symmetry understanding to new contexts?
   - Post-module application problems

---

## 13. Development Roadmap

### Sprint 1: Core 3D Visualization (Week 1-2)
- [ ] Set up React + Three.js + TypeScript project
- [ ] Implement 5 Platonic solid geometries
- [ ] Basic orbit controls (rotate, zoom)
- [ ] Virtual smartphone frame component

### Sprint 2: Color Pattern Modes (Week 3-4)
- [ ] Face symmetry coloring algorithm
- [ ] Euler characteristic display (V, E, F counters)
- [ ] Color mode selector UI
- [ ] Smooth transitions between modes

### Sprint 3: Interactive Activities (Week 5-6)
- [ ] Counting activity (V, E, F input fields)
- [ ] Symmetry identification quiz
- [ ] Dual polyhedra overlay mode
- [ ] Progress tracking

### Sprint 4: LMS Integration (Week 7-8)
- [ ] LTI 1.3 implementation
- [ ] Moodle iFrame embedding support
- [ ] Grade passback to LMS
- [ ] Student roster sync

### Sprint 5: Analytics & Polish (Week 9-10)
- [ ] Teacher analytics dashboard
- [ ] Student progress dashboard
- [ ] Accessibility improvements (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Cross-browser testing

### Sprint 6: Testing & Launch (Week 11-12)
- [ ] User acceptance testing with teachers
- [ ] Student pilot (20-30 students)
- [ ] Bug fixes and refinements
- [ ] Documentation and training materials
- [ ] Production deployment

---

## 14. Technical Requirements Summary

### Frontend
- **Framework**: React 18+ with TypeScript
- **3D Engine**: Three.js + React Three Fiber
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand or React Context
- **Build Tool**: Vite
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Backend (if standalone)
- **Runtime**: Node.js 18+ or Python 3.11+ (FastAPI)
- **Database**: PostgreSQL 15+ (or MySQL 5.7 for Moodle compatibility)
- **API**: RESTful with OpenAPI documentation
- **Authentication**: JWT tokens or LTI OAuth

### LMS Integration
- **Protocol**: LTI 1.3 (primary)
- **Alternative**: iFrame embedding with JWT
- **Moodle Version**: 3.7+ (supports LTI 1.3)
- **Grade Sync**: Moodle Gradebook API

### Deployment
- **Hosting**: Docker containers
- **CDN**: CloudFront or Cloudflare (for static assets)
- **SSL**: Required (TLS 1.3)
- **Scaling**: Horizontal (load balanced)

---

## 15. Open Questions & Decisions Needed

### High Priority

1. **Deployment Target**
   - Will this be deployed as part of existing KAIST infrastructure?
   - Standalone domain or subdomain?
   - On-premise or cloud (AWS/GCP/Azure)?

2. **Database Choice**
   - PostgreSQL (modern, recommended) or MySQL 5.7 (Moodle compatibility)?
   - If MySQL, need to adapt schema (no native UUID type)

3. **Authentication Method**
   - Full LTI integration or simpler iFrame approach for MVP?
   - Does KAIST have existing LTI tools we can reference?

4. **Student Data Privacy**
   - What student data can be stored?
   - Data retention policies?
   - GDPR/PIPA compliance requirements?

### Medium Priority

5. **Grading Scheme**
   - What weight for different activities (exploration vs. quiz)?
   - Pass/fail or percentage grades?
   - Extra credit for advanced features?

6. **Internationalization**
   - Korean and English UI (both required for MVP)?
   - Which language for 3D labels and tooltips?

7. **Mobile Device Support**
   - Target actual smartphones or just virtual smartphone display?
   - If real mobile, need progressive web app (PWA)?

---

## 16. Appendix: Color Palettes

### Colorblind-Friendly Palettes

**Palette 1: IBM Design (for 6 colors)**
```css
--color-1: #648FFF; /* Blue */
--color-2: #785EF0; /* Purple */
--color-3: #DC267F; /* Magenta */
--color-4: #FE6100; /* Orange */
--color-5: #FFB000; /* Yellow */
--color-6: #00C49A; /* Teal */
```

**Palette 2: Wong (for 8 colors)**
```css
--black: #000000;
--orange: #E69F00;
--sky-blue: #56B4E9;
--bluish-green: #009E73;
--yellow: #F0E442;
--blue: #0072B2;
--vermillion: #D55E00;
--reddish-purple: #CC79A7;
```

### Symmetry Animation Colors

**Gradient for rotation flow**:
```css
--flow-start: #FF6B6B;   /* Warm red */
--flow-middle: #4ECDC4;  /* Cool cyan */
--flow-end: #45B7D1;     /* Deep blue */
```

---

## 17. References & Inspirations

### Academic Resources
1. **Platonic Solids Properties**: [Wikipedia - Platonic Solid](https://en.wikipedia.org/wiki/Platonic_solid)
2. **Symmetry Groups**: Conway Notation for 3D symmetry groups
3. **Euler's Polyhedron Formula**: V - E + F = 2 (for convex polyhedra)

### Similar Educational Tools
1. **GeoGebra 3D**: Interactive geometry software
2. **Math3D**: Online 3D graphing calculator
3. **PolyHédronisme**: Polyhedra notation and Conway operators
4. **Polypad** (Mathigon): Virtual manipulatives including polyhedra

### Design Inspirations
1. **Apple ARKit demos**: AR polyhedra exploration
2. **Google Arts & Culture**: Smartphone-in-browser presentation
3. **Brilliant.org**: Interactive math visualizations

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Branch**: `claude/add-regularity-pattern-01929yeyYdJdVjJHrNGb5N3K`
- **Related PRD**: `0001-prd-ai-education-pipeline.md`
- **Status**: Ready for Review
- **Target Audience**: Developers, Teachers, Educational Designers

---

## Next Steps

1. **Review & Feedback**: Stakeholder review of module specification
2. **Technical Feasibility**: Confirm LMS integration approach
3. **Prototype**: Build proof-of-concept with one polyhedron
4. **User Testing**: Test with small group of students
5. **Iterate**: Refine based on feedback
6. **Full Development**: Execute 12-week sprint plan
7. **Deployment**: Launch in Moodle environment

---

*This module specification is designed to integrate with the AI Education System Pipeline described in PRD 0001, or to function as a standalone educational web application with LMS integration capabilities.*
