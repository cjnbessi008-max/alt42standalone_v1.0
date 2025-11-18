# ALT42 LMS Solution Timeline Integration

A comprehensive system for recording and analyzing student problem-solving processes, with full LMS integration capabilities.

## Overview

This system provides:
- **Real-time Timeline Tracking**: Records every step of a student's problem-solving journey
- **LMS Integration**: Export data to external Learning Management Systems via REST API and xAPI
- **Analytics Dashboard**: Visualize student progress and identify learning patterns
- **Performance Insights**: Track completion rates, accuracy, time spent, and engagement metrics

## Features

### Timeline Recording
- Automatic event tracking (inputs, clicks, submissions, etc.)
- Batch recording for performance optimization
- Client-side buffering with automatic flushing
- Session pause/resume detection
- Sequence numbering for event ordering

### LMS Integration
- RESTful API endpoints for data access
- xAPI (Experience API) statement generation
- Multiple export formats (JSON, CSV, xAPI)
- Real-time and batch synchronization
- Webhook support for LMS notifications

### Analytics & Visualization
- Student progress dashboards
- Session timeline visualization
- Module-wide performance analytics
- Difficulty pattern identification
- Engagement metrics tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (React + TypeScript)                │
│  Timeline Tracking | Visualization | Progress Dashboard     │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  Timeline API | LMS API | xAPI Generation                   │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  solution_timelines | session_summaries | xapi_statements   │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **Set up the database**
```bash
# Create database
createdb alt42_education

# Run migrations
psql -d alt42_education -f database/migrations/001_create_solution_timelines.sql
psql -d alt42_education -f database/migrations/002_create_lms_integration_tables.sql
```

3. **Configure backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

4. **Configure frontend**
```bash
cd ../frontend
npm install
# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env
```

5. **Start services**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Usage Examples

### 1. Track Student Problem-Solving

```typescript
import { useTimelineTracking } from './hooks/useTimelineTracking';

function ProblemComponent() {
  const { trackEvent } = useTimelineTracking({
    studentId: 'student-123',
    moduleId: 'fractions-module',
    problemId: 'problem-456'
  });

  const handleInputChange = (field: string, value: string) => {
    trackEvent('input_changed', {
      field,
      previous_value: previousValue,
      new_value: value
    });
  };

  const handleSubmit = () => {
    trackEvent('answer_submitted', {
      answer: studentAnswer,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div>
      <input onChange={(e) => handleInputChange('answer', e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### 2. Display Student Progress

```typescript
import StudentProgressDashboard from './components/StudentProgressDashboard';

function TeacherView() {
  return (
    <StudentProgressDashboard
      studentId="student-123"
      moduleId="fractions-module"
    />
  );
}
```

### 3. Visualize Session Timeline

```typescript
import TimelineVisualization from './components/TimelineVisualization';

function SessionReview({ sessionId }: { sessionId: string }) {
  return (
    <TimelineVisualization sessionId={sessionId} />
  );
}
```

### 4. Export Data to LMS

```typescript
import { lmsApi } from './services/api';

async function exportToLMS(studentId: string, moduleId: string) {
  // Get comprehensive timeline data
  const data = await lmsApi.getStudentTimeline(studentId, {
    moduleId,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31')
  });

  // Export as CSV
  const csvData = await lmsApi.exportData(studentId, moduleId, {
    exportType: 'timeline',
    format: 'csv'
  });

  // Get xAPI statements
  const xapiStatements = await lmsApi.getXAPIStatements({
    studentId,
    moduleId,
    limit: 100
  });
}
```

## API Documentation

### Timeline Endpoints

#### Record Event
```
POST /api/timeline/events
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "session_id": "uuid",
  "event_type": "input_changed",
  "event_data": { ... },
  "sequence_number": 1
}
```

#### Get Session Timeline
```
GET /api/timeline/session/:sessionId

Response:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "summary": { ... },
    "events": [ ... ]
  }
}
```

### LMS Integration Endpoints

#### Get Student Timeline for LMS
```
GET /api/lms/student/:studentId/timeline?start_date=2025-01-01&end_date=2025-12-31&module_id=uuid

Response:
{
  "success": true,
  "data": {
    "student_id": "uuid",
    "sessions": [ ... ],
    "analytics": { ... }
  }
}
```

#### Export Student Data
```
POST /api/lms/export
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "export_type": "timeline",
  "format": "json"
}
```

For complete API documentation, see [docs/lms-solution-timeline.md](docs/lms-solution-timeline.md)

## Database Schema

### Key Tables

- **solution_timelines**: Individual timeline events
- **session_summaries**: Aggregated session data
- **xapi_statements**: xAPI statements for LMS integration
- **lms_configurations**: LMS connection settings
- **lms_exports**: Export tracking

See [database/migrations/](database/migrations/) for complete schema definitions.

## Configuration

### Environment Variables

**Backend (.env)**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alt42_education
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000
```

## Features in Detail

### Automatic Timeline Tracking
The system automatically tracks:
- Problem start/completion
- Input changes with previous/new values
- UI interactions (clicks, drags, etc.)
- Hint requests
- Answer submissions and validations
- Session pauses/resumes
- Time between events

### Session Analytics
For each session, the system calculates:
- Total duration
- Active vs. paused time
- Number of attempts
- Hints used
- Input changes count
- UI interaction count
- Success/failure status

### Student Progress Metrics
- Completion rate across problems
- Accuracy rate
- Average time per problem
- Average attempts per problem
- Average hints used
- Progress over time

### LMS Integration
- **xAPI Support**: Automatically generates xAPI statements
- **Multiple Formats**: Export as JSON, CSV, or xAPI
- **Real-time Sync**: Webhook support for LMS notifications
- **Batch Export**: Export data for multiple students/modules

## Development

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Database Migrations
```bash
# Apply migrations
psql -d alt42_education -f database/migrations/001_create_solution_timelines.sql
psql -d alt42_education -f database/migrations/002_create_lms_integration_tables.sql
```

## Technology Stack

**Frontend**
- React 18
- TypeScript
- Vite
- Axios
- date-fns
- Recharts

**Backend**
- Node.js
- Express
- TypeScript
- PostgreSQL
- pg (node-postgres)

**Database**
- PostgreSQL 15+
- JSONB for flexible event data
- Full-text search support
- Automatic triggers for analytics

## Performance Considerations

- **Batch Recording**: Events are buffered and sent in batches to reduce API calls
- **Database Indexing**: Optimized indexes for fast queries
- **Automatic Aggregation**: Session summaries updated via database triggers
- **Caching**: Redis support for frequently accessed data (optional)

## Security

- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- CORS configuration
- Rate limiting support
- Helmet.js for security headers
- Environment-based configuration

## Contributing

See [tasks/0001-prd-ai-education-pipeline.md](tasks/0001-prd-ai-education-pipeline.md) for project requirements and roadmap.

## License

MIT

## Support

For questions or issues, please open a GitHub issue or contact the development team.

## Related Documentation

- [LMS Integration Guide](docs/lms-solution-timeline.md)
- [Product Requirements Document](tasks/0001-prd-ai-education-pipeline.md)
- [Database Schema](database/migrations/)
- [API Reference](backend/src/api/)

## Future Enhancements

- [ ] Real-time collaboration tracking
- [ ] AI-powered learning pattern analysis
- [ ] Video replay of solving process
- [ ] Advanced visualization with D3.js
- [ ] Mobile app support
- [ ] WebSocket support for live updates
- [ ] Multi-language support (i18n)
- [ ] Advanced LMS integrations (Canvas, Moodle, Blackboard)
