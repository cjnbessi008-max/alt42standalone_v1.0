# Mean Center Feature - Quick Reference Guide

## Overview
A visualization component that displays the average (center of gravity) of student movement coordinates in real-time, showing how the "balance point" shifts as students interact with the interface.

---

## Key Information at a Glance

### Technology Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18+ with TypeScript, SVG/Canvas visualization |
| **Backend API** | Node.js (Express/Fastify) with REST/WebSocket |
| **Backend Logic** | Python 3.11+ with FastAPI |
| **Database** | PostgreSQL 15+ (movement_coordinates, mean_center_stats tables) |
| **Cache** | Redis 7+ for real-time stats |
| **Real-time** | Socket.io for WebSocket connections |

---

## Data Flow Architecture

```
Student touches/moves on screen
         ↓
JavaScript captures coordinates
         ↓
POST /api/modules/{id}/movement
         ↓
Node.js API Gateway validates & broadcasts
         ↓
PostgreSQL stores movement_coordinates row
         ↓
Python service calculates mean center (avg x, avg y)
         ↓
Redis caches latest statistics
         ↓
WebSocket broadcasts update to frontend
         ↓
React component re-renders visualization
         ↓
SVG/Canvas shows center point + trajectory
```

---

## Database Schema (Mean Center Tables)

### movement_coordinates
```sql
id UUID PRIMARY KEY
student_id UUID REFERENCES students(id)
module_id UUID REFERENCES modules(id)
timestamp TIMESTAMP
x_coordinate FLOAT
y_coordinate FLOAT
session_id UUID
device_type VARCHAR(50)
created_at TIMESTAMP DEFAULT NOW()

INDEX: (student_id, session_id)
```

### mean_center_stats
```sql
id UUID PRIMARY KEY
student_id UUID REFERENCES students(id)
module_id UUID REFERENCES modules(id)
session_id UUID
mean_x FLOAT
mean_y FLOAT
calculated_at TIMESTAMP
point_count INTEGER
time_duration_seconds INTEGER
velocity_average FLOAT (optional)
created_at TIMESTAMP DEFAULT NOW()

INDEX: (student_id, module_id)
```

---

## React Component Structure

```typescript
src/components/MeanCenterVisualizer/
├── MeanCenterVisualizer.tsx          // Main component
├── MeanCenterVisualizer.module.css   // Styles
├── useMovementTracking.ts            // Custom hook for touch events
├── useWebSocket.ts                   // WebSocket connection hook
└── __tests__/
    └── MeanCenterVisualizer.test.tsx // Unit tests

src/services/
├── meanCenterService.ts              // API calls
└── movementCalculator.ts             // Statistical calculations
```

---

## Key Formulas & Calculations

### Mean Center (Average Point)
```
mean_x = Σ(x_i) / n
mean_y = Σ(y_i) / n

Where:
  x_i, y_i = individual coordinates
  n = number of points
```

### Incremental Update (Real-time)
```
new_mean = ((old_mean × n) + new_point) / (n + 1)

Advantage: O(1) time and space per update
Disadvantage: Minor numerical precision drift
```

### Optional: Standard Deviation
```
σ_x = √(Σ((x_i - mean_x)²) / n)
σ_y = √(Σ((y_i - mean_y)²) / n)

Shows spread of movement around center
```

---

## API Endpoints

### Record Movement
```http
POST /api/modules/{moduleId}/movement
Content-Type: application/json

{
  "studentId": "uuid",
  "x": 150.5,
  "y": 200.3,
  "timestamp": "2025-11-18T10:30:45Z"
}

Response:
{
  "success": true,
  "pointCount": 42,
  "meanX": 175.2,
  "meanY": 210.1
}
```

### Get Mean Center Stats
```http
GET /api/modules/{moduleId}/mean-center/{studentId}

Response:
{
  "meanX": 175.2,
  "meanY": 210.1,
  "pointCount": 42,
  "varianceX": 450.5,
  "varianceY": 380.2,
  "sessionDurationSeconds": 300,
  "velocityAverage": 5.2,
  "calculatedAt": "2025-11-18T10:30:45Z"
}
```

### WebSocket: Real-time Updates
```javascript
// Client listens to mean center updates
socket.on('mean-center-updated', (data) => {
  // {meanX, meanY, pointCount, timestamp}
  // Update visualization
});

// Client sends movement data
socket.emit('movement', {
  x: 150.5,
  y: 200.3,
  timestamp: Date.now()
});
```

---

## Frontend Component Example

```typescript
interface MeanCenterVisualizerProps {
  width: number;
  height: number;
  moduleId: string;
  studentId: string;
  interactive?: boolean;
  showStats?: boolean;
}

export const MeanCenterVisualizer: React.FC<MeanCenterVisualizerProps> = ({
  width,
  height,
  moduleId,
  studentId,
  interactive = true,
  showStats = true
}) => {
  // 1. Listen to touch/mouse events
  // 2. Send coordinates via API
  // 3. Receive mean center updates
  // 4. Animate visualization
  // 5. Display statistics panel

  return (
    <div className="mean-center-container">
      <svg width={width} height={height}>
        {/* Movement points as circles */}
        {points.map(p => (
          <circle cx={p.x} cy={p.y} r="3" fill="blue" opacity="0.5" />
        ))}
        
        {/* Trajectory line */}
        <polyline 
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="gray" opacity="0.3"
        />
        
        {/* Mean center point */}
        <circle 
          cx={meanX} cy={meanY} r="8" 
          fill="red" stroke="darkred" strokeWidth="2"
        />
      </svg>
      
      {showStats && <StatisticsPanel stats={stats} />}
    </div>
  );
};
```

---

## Mobile Touch Handling

```typescript
// Hook for capturing touch events
const useMovementTracking = (moduleId: string, studentId: string) => {
  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Send to API
    recordMovement({ moduleId, studentId, x, y });
  };

  return { handleTouchMove };
};
```

---

## Performance Considerations

| Metric | Target | Strategy |
|--------|--------|----------|
| **Points per session** | 1,000-10,000 | Pagination, windowing |
| **Update frequency** | 30+ FPS | Incremental calculation, caching |
| **Storage per day** | ~2.6M points | Archive old sessions |
| **Visualization lag** | <100ms | WebSocket + client-side caching |
| **Database queries** | <5ms | Indexes on (student_id, session_id) |

---

## Implementation Phases

### Phase 1: Backend (Weeks 1-2)
- [ ] PostgreSQL migration: Create movement_coordinates table
- [ ] PostgreSQL migration: Create mean_center_stats table
- [ ] Node.js endpoint: POST /movement
- [ ] Node.js endpoint: GET /mean-center/{studentId}
- [ ] Python service: Mean center calculator
- [ ] Redis cache: Store latest statistics

### Phase 2: Frontend (Weeks 3-4)
- [ ] React component: MeanCenterVisualizer
- [ ] Touch event handling: useMovementTracking hook
- [ ] WebSocket integration: Real-time updates
- [ ] SVG visualization: Points, trajectory, center
- [ ] Statistics panel: Display calculated metrics

### Phase 3: Integration (Week 5)
- [ ] End-to-end testing: Touch input to visualization
- [ ] Mobile device testing: Various screen sizes
- [ ] Performance testing: 10,000+ points handling
- [ ] Accessibility audit: WCAG 2.1 AA compliance

### Phase 4: Polish (Week 6)
- [ ] Animations: Smooth point emergence, trajectory drawing
- [ ] Error handling: Network failures, invalid data
- [ ] Documentation: API docs, component Storybook
- [ ] Demo creation: Video showing feature in action

---

## File Locations & Resources

| Item | Location |
|------|----------|
| **PRD Document** | `/tasks/0001-prd-ai-education-pipeline.md` |
| **Architecture Analysis** | `/tasks/0002-codebase-architecture-analysis.md` |
| **Expected Frontend Path** | `frontend/src/components/MeanCenterVisualizer/` |
| **Expected Backend Path** | `backend/api_gateway/src/routes/movement.ts` |
| **Expected Python Service** | `backend/pipeline_orchestrator/src/stages/mean_center/` |
| **Database Migrations** | `database/migrations/003_create_movement_tables.sql` |

---

## Key Design Decisions to Make

1. **Calculation Method**
   - Naive (store all, recalculate) vs Incremental (running average)
   - Recommendation: Incremental for real-time, naive for historical

2. **Visualization Type**
   - SVG (responsive, accessible) vs Canvas (high-performance)
   - Recommendation: SVG for MVP (<1000 points), Canvas for scale

3. **Real-time Transport**
   - WebSocket (bidirectional) vs HTTP polling (simpler)
   - Recommendation: WebSocket for <100ms latency requirement

4. **Data Retention**
   - Keep all movements forever vs Archive old sessions
   - Recommendation: Keep 30 days in hot storage, archive thereafter

5. **Mobile vs Desktop**
   - Touch-based vs Mouse-based coordinate capture
   - Recommendation: Support both, auto-detect based on device

---

## Common Pitfalls to Avoid

1. **Numerical Precision**: Use `number` carefully; consider BigDecimal-like solutions for large sums
2. **WebSocket Overhead**: Don't send every movement update; batch or debounce
3. **Memory Leaks**: Properly cleanup event listeners and WebSocket connections
4. **Security**: Validate all coordinates server-side; don't trust client-side values
5. **Accessibility**: Ensure visualization works with screen readers; provide numeric display option
6. **Mobile Performance**: Throttle touch events; offload calculation to backend

---

## Testing Strategy

### Unit Tests
```typescript
describe('MeanCenterCalculator', () => {
  it('calculates mean of coordinates correctly')
  it('handles incremental updates')
  it('calculates standard deviation')
})
```

### Integration Tests
```typescript
describe('Movement API', () => {
  it('stores coordinates in database')
  it('returns correct mean center statistics')
  it('broadcasts via WebSocket')
})
```

### E2E Tests
```typescript
describe('Mean Center Feature', () => {
  it('captures touch movement on mobile')
  it('displays visualization in real-time')
  it('shows correct statistics panel')
})
```

---

## Success Criteria

- [ ] Students can interact with movement capture on mobile devices
- [ ] Mean center point updates in <100ms of coordinate recording
- [ ] Visualization renders smoothly with 1,000+ points
- [ ] Statistics panel displays accurate mean, variance, duration
- [ ] Feature works offline with graceful fallback
- [ ] 100% WCAG 2.1 AA accessibility compliance
- [ ] API handles 1,000 requests/second sustained load
- [ ] Database storage optimized (indexes performing well)

---
