# Motivation Mode - "한 문제만 하자"

## 📖 Overview

Motivation Mode is a feature designed to reduce learning anxiety and increase engagement by presenting one problem at a time in a low-pressure, encouraging environment.

### Key Features

- ✨ **Single Problem Focus**: Only one problem displayed at a time
- 🎯 **No Progress Pressure**: Hides overall progress and remaining problems
- 💪 **Positive Reinforcement**: Encouraging feedback and streak tracking
- 🔥 **Celebration Milestones**: Animations for achievements
- 📊 **Analytics**: Track student motivation patterns

---

## 🚀 Quick Start

### Frontend Integration

```typescript
import { MotivationModeContainer } from '@/features/motivation-mode';
import { ModeTrigger } from '@/features/motivation-mode/types';

function MyLearningPage() {
  return (
    <MotivationModeContainer
      moduleId="your-module-id"
      initialTrigger={ModeTrigger.STUDENT_INITIATED}
      onExit={() => console.log('Student exited motivation mode')}
    />
  );
}
```

### Backend API Usage

```python
from motivation_mode import MotivationSessionManager

# Initialize manager
session_manager = MotivationSessionManager(db_connection)

# Start session
session = await session_manager.start_session(
    student_id=student_id,
    request=SessionCreateRequest(
        module_id=module_id,
        trigger=ModeTrigger.STUDENT_INITIATED
    )
)

# Submit answer
feedback = await session_manager.submit_answer(
    student_id=student_id,
    session_id=session['session_id'],
    submission=ProblemSubmission(
        problem_id=problem_id,
        answer={"value": "42"},
        time_spent_seconds=30
    )
)
```

---

## 📁 Project Structure

```
motivation-mode/
├── docs/
│   ├── motivation-mode-spec.md          # Full feature specification
│   └── MOTIVATION_MODE_README.md        # This file
├── database/
│   └── migrations/
│       └── 001_add_motivation_mode.sql  # Database schema
├── backend/
│   └── services/
│       └── motivation_mode/
│           ├── __init__.py
│           ├── session_manager.py       # Session lifecycle management
│           ├── suggestion_engine.py     # Auto-suggestion logic
│           ├── analytics_service.py     # Analytics and reporting
│           ├── config_manager.py        # Configuration management
│           └── models/
│               ├── session.py           # Data models
│               ├── config.py
│               └── analytics.py
└── frontend/
    └── src/
        └── features/
            └── motivation-mode/
                ├── components/
                │   ├── MotivationModeContainer.tsx  # Main container
                │   ├── MotivationModeHeader.tsx     # Header with exit
                │   ├── SingleProblemView.tsx        # Problem display
                │   ├── FeedbackDisplay.tsx          # Answer feedback
                │   ├── CelebrationAnimation.tsx     # Celebration effects
                │   └── SessionSummary.tsx           # End summary
                ├── hooks/
                │   ├── useMotivationSession.ts      # Session hook
                │   └── useMotivationAnalytics.ts    # Analytics hook
                ├── services/
                │   └── motivationModeApi.ts         # API client
                ├── store/
                │   └── motivationModeSlice.ts       # State management
                └── types/
                    └── motivationMode.types.ts      # TypeScript types
```

---

## 🗄️ Database Schema

### Core Tables

#### `motivation_mode_sessions`
Tracks individual learning sessions with performance metrics.

```sql
CREATE TABLE motivation_mode_sessions (
    id UUID PRIMARY KEY,
    student_id UUID,
    module_id UUID,
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    problems_completed INTEGER,
    problems_correct INTEGER,
    max_streak INTEGER,
    mode_trigger VARCHAR(50),
    exit_reason VARCHAR(50)
);
```

#### `motivation_mode_config`
Per-module configuration for behavior and triggers.

```sql
CREATE TABLE motivation_mode_config (
    id UUID PRIMARY KEY,
    module_id UUID UNIQUE,
    is_enabled BOOLEAN,
    auto_suggest_enabled BOOLEAN,
    suggest_after_wrong_answers INTEGER,
    positive_messages JSONB
);
```

#### `student_motivation_preferences`
Student-specific preferences and statistics.

```sql
CREATE TABLE student_motivation_preferences (
    id UUID PRIMARY KEY,
    student_id UUID UNIQUE,
    prefer_motivation_mode BOOLEAN,
    total_motivation_sessions INTEGER,
    highest_streak_achieved INTEGER
);
```

---

## 🔌 API Endpoints

### Start Session
```http
POST /api/modules/{module_id}/motivation-mode/start
Body: { "trigger": "student_initiated" }
Response: { "session_id": "...", "first_problem": {...}, "message": "..." }
```

### Submit Answer
```http
POST /api/modules/{module_id}/motivation-mode/submit
Body: {
  "session_id": "...",
  "problem_id": "...",
  "answer": {...},
  "time_spent_seconds": 30
}
Response: {
  "is_correct": true,
  "feedback": "잘했어요!",
  "streak": 3,
  "next_action_prompt": {...}
}
```

### End Session
```http
POST /api/modules/{module_id}/motivation-mode/exit
Body: { "session_id": "...", "exit_reason": "student_choice" }
Response: { "session_summary": {...}, "closing_message": "..." }
```

### Get Analytics (Teachers)
```http
GET /api/modules/{module_id}/motivation-mode/analytics
Query: ?student_id=...&date_from=...&date_to=...
Response: { "overall_stats": {...}, "student_breakdown": [...] }
```

---

## 🎨 UI Components

### MotivationModeContainer
Main orchestrator component that manages the entire flow.

**Props:**
- `moduleId: string` - Module identifier
- `onExit?: () => void` - Callback when user exits
- `initialTrigger?: ModeTrigger` - How session was initiated

### SingleProblemView
Displays one problem with minimal distractions.

**Features:**
- Large, readable text (20px minimum)
- Generous padding (48px)
- Clean, focused design
- Accessible form inputs

### FeedbackDisplay
Shows positive feedback after answer submission.

**Features:**
- Large check/wrong icon
- Encouraging message
- Optional celebration animation
- "Continue" or "Exit" options

### SessionSummary
End-of-session summary with encouragement.

**Features:**
- Total problems solved
- Accuracy percentage
- Highest streak
- Achievement highlights
- Positive closing message

---

## 🧪 Testing

### Unit Tests

```bash
# Backend
pytest backend/services/motivation_mode/tests/

# Frontend
npm test -- motivation-mode
```

### Integration Tests

```bash
# Full flow test
pytest backend/tests/integration/test_motivation_mode_flow.py
```

### User Acceptance Testing

Scenarios:
1. Low motivation student can easily start
2. System suggests mode after 3 wrong answers
3. Teacher can view student motivation patterns
4. Seamless mode switching

---

## 📊 Analytics & Metrics

### Student Metrics
- Total motivation mode sessions
- Average problems per session
- Accuracy in motivation mode vs. normal mode
- Streak achievements
- Return rate (next day engagement)

### Teacher Dashboard
```typescript
const analytics = await MotivationModeApi.getAnalytics(moduleId);

console.log(analytics.overall_stats);
// {
//   total_sessions: 150,
//   avg_problems_per_session: 4.5,
//   avg_accuracy_motivation_mode: 78,
//   avg_accuracy_normal_mode: 72
// }
```

### SQL Views

```sql
-- Student summary
SELECT * FROM v_student_motivation_summary
WHERE student_id = '...';

-- Module usage
SELECT * FROM v_module_motivation_usage
WHERE module_id = '...';
```

---

## ⚙️ Configuration

### Module-Level Config

```typescript
const config = await MotivationModeApi.updateConfig(moduleId, {
  is_enabled: true,
  auto_suggest_enabled: true,
  suggest_after_wrong_answers: 3,
  suggest_after_idle_seconds: 300,
  positive_messages: [
    "잘했어요!",
    "훌륭해요!",
    "완벽해요!"
  ]
});
```

### Student Preferences

```sql
-- Update student preferences
UPDATE student_motivation_preferences
SET prefer_motivation_mode = true,
    show_streak_counter = true
WHERE student_id = '...';
```

---

## 🔧 Customization

### Custom Encouragement Messages

```python
# In motivation_mode_config table
{
  "positive_messages": [
    "Great job!",
    "You're doing amazing!",
    "Keep it up!"
  ],
  "completion_messages": [
    "Well done today!",
    "You learned so much!"
  ]
}
```

### Custom Celebration Animations

```typescript
// Add to CelebrationAnimation.tsx
if (celebration.animation === 'custom_fireworks') {
  return <CustomFireworksAnimation />;
}
```

---

## 🚨 Troubleshooting

### Common Issues

**Problem:** Session doesn't start
- **Check:** Database connection
- **Check:** Module has `motivation_mode_enabled = true`
- **Check:** Student has valid ID

**Problem:** Suggestions not triggering
- **Check:** `auto_suggest_enabled = true` in config
- **Check:** Thresholds are appropriate
- **Check:** Recent attempts are being tracked

**Problem:** UI not responsive
- **Check:** Browser compatibility (Chrome, Firefox, Safari, Edge latest 2 versions)
- **Check:** JavaScript errors in console
- **Check:** Network requests completing successfully

---

## 🔐 Security Considerations

- All student data encrypted at rest (AES-256)
- RBAC: Only teachers can view aggregated analytics
- No individual student identification in exports
- Input validation on all API endpoints
- Rate limiting: 100 requests/hour per student

---

## 📈 Performance

### Expected Response Times
- Session start: < 1 second
- Problem load: < 2 seconds
- Answer submission: < 1 second
- Analytics query: < 3 seconds

### Optimization Tips
- Cache frequently accessed problems
- Use database indexes on session queries
- Lazy load celebration animations
- Preload next problem while showing feedback

---

## 🛣️ Roadmap

### Phase 2 (Post-MVP)
- [ ] Adaptive difficulty based on performance
- [ ] Personalized AI-generated encouragement
- [ ] Optional gamification (badges, achievements)
- [ ] Voice-based feedback for younger students

### Phase 3 (Advanced)
- [ ] Emotion detection via webcam
- [ ] Group motivation mode
- [ ] Integration with meditation/mindfulness
- [ ] Parent dashboard with weekly reports

---

## 📚 Related Documentation

- [Full Feature Specification](./motivation-mode-spec.md)
- [PRD: AI Education System Pipeline](../tasks/0001-prd-ai-education-pipeline.md)
- [Database Schema Design](../database/migrations/001_add_motivation_mode.sql)
- [API Documentation](#) (To be generated)

---

## 🤝 Contributing

When adding features to Motivation Mode:

1. Update this README
2. Add tests for new functionality
3. Update TypeScript types
4. Update database migrations if schema changes
5. Consider accessibility (WCAG 2.1 AA)
6. Test on mobile devices

---

## 📝 License

Part of the AI Education System Pipeline project.

---

## 👥 Support

For questions or issues:
- Technical: [Development Team Lead]
- Pedagogical: [Educational Team Lead]
- Configuration: See [Configuration Guide](#configuration)

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
