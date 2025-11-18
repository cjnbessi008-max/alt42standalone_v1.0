# LMS Solution Timeline Integration

## Overview
This document describes the implementation of a comprehensive solution timeline tracking system that records every step of a student's problem-solving process and provides LMS integration capabilities.

## Architecture

### Data Model

#### SolutionTimeline Table
Records every interaction and event during a student's problem-solving session.

```sql
CREATE TABLE solution_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_id UUID NOT NULL,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solution_timelines_student ON solution_timelines(student_id);
CREATE INDEX idx_solution_timelines_session ON solution_timelines(session_id);
CREATE INDEX idx_solution_timelines_problem ON solution_timelines(problem_id);
CREATE INDEX idx_solution_timelines_timestamp ON solution_timelines(timestamp);
```

#### Event Types
- `problem_started` - Student begins working on a problem
- `input_changed` - Student modifies an input field
- `interaction` - Student interacts with UI elements (clicks, drags, etc.)
- `hint_requested` - Student requests a hint
- `answer_submitted` - Student submits an answer
- `answer_validated` - System validates the answer
- `problem_completed` - Student completes the problem
- `session_paused` - Student pauses their work
- `session_resumed` - Student resumes their work

### API Endpoints

#### Timeline Recording API

```
POST /api/timeline/events
Body:
{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "session_id": "uuid",
  "event_type": "input_changed",
  "event_data": {
    "field": "numerator",
    "previous_value": "3",
    "new_value": "5",
    "time_since_last_event": 2500
  }
}
```

```
GET /api/timeline/session/{session_id}
Response:
{
  "session_id": "uuid",
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "events": [
    {
      "event_type": "problem_started",
      "timestamp": "2025-11-18T10:00:00Z",
      "sequence_number": 1,
      "event_data": {...}
    },
    ...
  ],
  "summary": {
    "total_events": 45,
    "duration_seconds": 300,
    "answer_attempts": 3,
    "hints_used": 1,
    "completed": true
  }
}
```

#### LMS Integration API

```
GET /api/lms/student/{student_id}/timeline
Query params: start_date, end_date, module_id (optional)
Response:
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-18T23:59:59Z"
  },
  "sessions": [
    {
      "session_id": "uuid",
      "module_name": "Fractions Practice",
      "problem_id": "uuid",
      "started_at": "2025-11-18T10:00:00Z",
      "completed_at": "2025-11-18T10:05:00Z",
      "duration_seconds": 300,
      "events_count": 45,
      "outcome": "correct",
      "attempts": 3,
      "timeline_url": "/api/timeline/session/{session_id}"
    },
    ...
  ],
  "analytics": {
    "total_sessions": 24,
    "total_time_seconds": 7200,
    "average_session_duration": 300,
    "completion_rate": 0.92,
    "average_attempts": 2.1
  }
}
```

```
GET /api/lms/module/{module_id}/analytics
Response:
{
  "module_id": "uuid",
  "module_name": "Fractions Practice",
  "student_analytics": [
    {
      "student_id": "uuid",
      "student_name": "John Doe",
      "sessions_count": 24,
      "total_time_seconds": 7200,
      "completion_rate": 0.92,
      "average_attempts": 2.1,
      "progress_percentage": 85
    },
    ...
  ],
  "module_summary": {
    "total_students": 30,
    "average_completion_rate": 0.87,
    "average_time_per_problem": 250,
    "common_difficulties": [
      {
        "problem_type": "addition_different_denominators",
        "failure_rate": 0.35,
        "average_attempts": 3.2
      }
    ]
  }
}
```

### Frontend Implementation

#### Timeline Tracking Hook

```typescript
// useTimelineTracking.ts
interface TimelineEvent {
  event_type: string;
  event_data: Record<string, any>;
}

export function useTimelineTracking(
  studentId: string,
  moduleId: string,
  problemId: string
) {
  const sessionId = useRef(generateUUID());
  const sequenceNumber = useRef(0);

  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any>
  ) => {
    sequenceNumber.current++;

    await fetch('/api/timeline/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        module_id: moduleId,
        problem_id: problemId,
        session_id: sessionId.current,
        event_type: eventType,
        event_data: {
          ...eventData,
          sequence_number: sequenceNumber.current
        }
      })
    });
  }, [studentId, moduleId, problemId]);

  return { sessionId: sessionId.current, trackEvent };
}
```

#### Timeline Visualization Component

```typescript
// TimelineVisualization.tsx
interface TimelineVisualizationProps {
  sessionId: string;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  sessionId
}) => {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);

  useEffect(() => {
    fetch(`/api/timeline/session/${sessionId}`)
      .then(res => res.json())
      .then(data => setTimeline(data));
  }, [sessionId]);

  if (!timeline) return <Loading />;

  return (
    <div className="timeline-container">
      <TimelineHeader summary={timeline.summary} />
      <div className="timeline-events">
        {timeline.events.map((event, idx) => (
          <TimelineEvent
            key={idx}
            event={event}
            previousEvent={idx > 0 ? timeline.events[idx - 1] : null}
          />
        ))}
      </div>
      <TimelineAnalytics events={timeline.events} />
    </div>
  );
};
```

## Implementation Plan

### Phase 1: Database Schema
- Create solution_timelines table
- Set up indexes for performance
- Create migration scripts

### Phase 2: Backend API
- Implement timeline event recording endpoint
- Implement session retrieval endpoint
- Add LMS integration endpoints
- Implement analytics aggregation

### Phase 3: Frontend Tracking
- Create useTimelineTracking hook
- Integrate tracking into problem components
- Implement automatic event capture
- Add error handling and retry logic

### Phase 4: Visualization
- Create timeline visualization component
- Implement analytics dashboard
- Add export functionality (CSV, JSON)
- Create teacher-facing analytics views

### Phase 5: LMS Integration
- Implement LTI integration (if needed)
- Create webhook notifications
- Add real-time updates via WebSocket
- Implement data export for external LMS

## Security Considerations

1. **Data Privacy**: Only authorized teachers and admins can view student timelines
2. **RBAC**: Implement role-based access control for timeline data
3. **Data Retention**: Implement configurable retention policies
4. **Anonymization**: Support anonymized data export for research
5. **Rate Limiting**: Protect timeline recording endpoint from abuse

## Performance Considerations

1. **Batch Recording**: Buffer events and send in batches to reduce API calls
2. **Indexing**: Proper database indexes for fast queries
3. **Caching**: Cache aggregated analytics data
4. **Pagination**: Implement pagination for large timeline queries
5. **Async Processing**: Use background jobs for heavy analytics calculations

## Future Enhancements

1. **AI Analysis**: Use AI to analyze solving patterns and provide insights
2. **Predictive Analytics**: Predict student struggles before they happen
3. **Collaborative Timelines**: Track group problem-solving sessions
4. **Video Replay**: Reconstruct student's solving process as animated replay
5. **Comparative Analysis**: Compare student timelines to identify best practices
