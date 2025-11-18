# AI Education System with DMN Rest Detection

An intelligent educational platform that automatically detects student cognitive fatigue using Default Mode Network (DMN) activation patterns and provides personalized break recommendations.

## Overview

This system combines two powerful capabilities:

1. **AI Education Pipeline**: Transforms teacher requests into complete educational modules with automated database design, UI generation, and deployment
2. **DMN Rest Detection**: Monitors student engagement patterns to detect cognitive fatigue and recommend optimal break times

## Features

### DMN Rest Detection & Recommendation System

- **Real-time Activity Monitoring**: Tracks student interactions, response times, error rates, and engagement patterns
- **Intelligent Fatigue Detection**: Analyzes behavioral signals to calculate DMN activation scores
- **Personalized Break Recommendations**: Suggests break types, durations, and activities based on individual student needs
- **LMS Integration**: Seamlessly integrates with Canvas, Moodle, Blackboard, and custom LMS platforms
- **Evidence-based Activities**: Curated library of physical, cognitive, and mindfulness break activities
- **Analytics Dashboard**: Tracks break effectiveness and student wellbeing metrics

### Key Capabilities

- 🧠 **Cognitive Load Monitoring**: Detects when students need breaks before burnout occurs
- ⏰ **Optimal Timing**: Recommends breaks at the right moment using behavioral analysis
- 🎯 **Personalization**: Adapts to individual student preferences and learning patterns
- 📊 **Analytics**: Tracks effectiveness and continuously improves recommendations
- 🔗 **LMS Integration**: Works with existing learning management systems
- 📱 **Cross-platform**: Web-based interface accessible on any device

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LMS Integration Layer                     │
│              (Canvas, Moodle, Custom LMS APIs)               │
└───────────────────┬─────────────────────────────────────────┘
                    │ Student Activity Events
┌───────────────────▼─────────────────────────────────────────┐
│                  Activity Monitoring Service                 │
│       (WebSocket Server + REST API Gateway)                  │
└───────────┬─────────────────────────────────────────────────┘
            │ Real-time Activity Stream
┌───────────▼──────────────────────────────────────────────────┐
│            DMN Detection & Analysis Engine                    │
│  - Interaction Pattern Analysis                              │
│  - Cognitive Load Calculation                                │
│  - Fatigue Detection                                         │
└───────────┬──────────────────────────────────────────────────┘
            │ DMN Activation Signal
┌───────────▼──────────────────────────────────────────────────┐
│          Break Recommendation Engine                          │
│  - Personalized Break Suggestions                            │
│  - Break Activity Recommendation                             │
└───────────┬──────────────────────────────────────────────────┘
            │ Break Recommendations
┌───────────▼──────────────────────────────────────────────────┐
│           Student Webapp UI                                   │
│       (Break Notifications + Activity Guide)                  │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15+** for data storage
- **Redis** for caching and session management
- **Anthropic Claude API** for AI capabilities

### Frontend
- **React 18+** with TypeScript
- **Material-UI (MUI)** for UI components
- **Axios** for API communication
- **Custom hooks** for DMN monitoring

### Database
- PostgreSQL with JSONB support
- Optimized schemas for time-series activity data
- Efficient indexing for real-time queries

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alt42standalone_v1.0
   ```

2. **Set up the database**
   ```bash
   psql -U postgres -d your_database -f database/migrations/001_create_dmn_detection_schema.sql
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Configure environment variables**
   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379
   API_SECRET_KEY=your-secret-key

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:8000
   ```

6. **Start the backend server**
   ```bash
   cd backend
   uvicorn api.dmn_detection_api:app --reload --port 8000
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

## API Documentation

### REST API Endpoints

#### Activity Tracking
- `POST /api/v1/dmn/activity` - Submit activity event
- `POST /api/v1/dmn/activity/batch` - Submit multiple events

#### DMN Status
- `GET /api/v1/dmn/status/{student_id}` - Get current DMN status
- `GET /api/v1/dmn/session/{session_id}/timeline` - Get DMN timeline

#### Break Recommendations
- `POST /api/v1/dmn/recommend-break` - Generate break recommendation
- `POST /api/v1/dmn/break/acknowledge` - Accept/defer/dismiss break
- `POST /api/v1/dmn/break/complete` - Report break completion

#### LMS Integration
- `POST /api/v1/dmn/lms/webhook` - Receive LMS webhook events
- `GET /api/v1/dmn/lms/mapping/{lms_user_id}` - Get student mapping

#### Student Preferences
- `GET /api/v1/dmn/preferences/{student_id}` - Get preferences
- `PUT /api/v1/dmn/preferences/{student_id}` - Update preferences

#### Analytics
- `GET /api/v1/dmn/analytics/{student_id}` - Get student analytics
- `GET /api/v1/dmn/analytics/class/{class_id}` - Get class analytics

Full API documentation available at: `http://localhost:8000/api/docs`

## Usage

### For Students

1. **Automatic Monitoring**: The system monitors your learning activity automatically
2. **Break Notifications**: Receive timely break suggestions when fatigue is detected
3. **Choose Your Break**: Accept, defer, or dismiss recommendations based on your needs
4. **Guided Activities**: Follow step-by-step break activity instructions
5. **Track Progress**: See how breaks improve your learning effectiveness

### For Teachers

1. **Monitor Class**: View aggregated DMN scores and break patterns for your class
2. **Identify At-Risk Students**: See which students may be experiencing fatigue
3. **Review Analytics**: Track break effectiveness and student wellbeing trends
4. **Customize Settings**: Adjust sensitivity and recommendations for your class

### For Developers

1. **Integrate with LMS**: Use webhook endpoints to send activity data
2. **Customize Detection**: Adjust DMN detection parameters in configuration
3. **Add Activities**: Extend the break activity library
4. **Build Extensions**: Use the REST API to build custom features

## DMN Detection Algorithm

The system calculates a composite DMN activation score (0-1) based on:

1. **Interaction Slowdown (25%)**: Response time increases and pattern changes
2. **Error Rate (30%)**: Declining accuracy and correctness
3. **Study Duration (20%)**: Time since session start
4. **Engagement (15%)**: Interaction frequency and quality
5. **Idle Time (10%)**: Periods of inactivity

### Fatigue Levels

- **Active** (0.0-0.39): Optimal learning state
- **Mild** (0.40-0.64): Early fatigue signals
- **Moderate** (0.65-0.84): Break recommended
- **High** (0.85-1.0): Urgent break needed

## LMS Integration

### Supported Platforms

- **Canvas LMS**: Full webhook support
- **Moodle**: Web services integration
- **Blackboard Learn**: REST API integration
- **Custom LMS**: Generic webhook format

### Integration Steps

1. Configure webhook endpoint in your LMS
2. Set webhook secret for security
3. Map LMS user IDs to student IDs
4. Test webhook delivery

Example webhook configuration:
```json
{
  "url": "https://your-domain.com/api/v1/dmn/lms/webhook",
  "events": ["assignment_submitted", "quiz_submitted", "page_view"],
  "secret": "your-webhook-secret"
}
```

## Configuration

### DMN Detection Config

```python
# Component weights
WEIGHT_INTERACTION_SLOWDOWN = 0.25
WEIGHT_ERROR_RATE = 0.30
WEIGHT_STUDY_DURATION = 0.20
WEIGHT_ENGAGEMENT = 0.15
WEIGHT_IDLE_TIME = 0.10

# Fatigue thresholds
THRESHOLD_MILD = 0.40
THRESHOLD_MODERATE = 0.65
THRESHOLD_HIGH = 0.85

# Session parameters
OPTIMAL_SESSION_DURATION_MINUTES = 25
FATIGUE_ONSET_MINUTES = 40
```

### Student Preferences

Students can customize:
- Preferred break duration (1-30 minutes)
- Break activity preferences (physical, cognitive, visual, etc.)
- DMN detection sensitivity (0.5-2.0 multiplier)
- Notification settings
- Quiet hours (no break suggestions)

## Testing

### Run Backend Tests

```bash
cd backend
pytest tests/test_dmn_detection.py -v
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

## Project Structure

```
alt42standalone_v1.0/
├── backend/
│   ├── api/
│   │   └── dmn_detection_api.py       # FastAPI endpoints
│   ├── services/
│   │   ├── dmn_detection_service.py   # DMN detection logic
│   │   ├── break_recommendation_engine.py  # Break recommendations
│   │   └── lms_integration_service.py # LMS adapters
│   └── tests/
│       └── test_dmn_detection.py      # Unit tests
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── BreakNotification.tsx  # Break notification UI
│       │   └── BreakActivityGuide.tsx # Activity guide UI
│       └── hooks/
│           └── useDMNMonitoring.ts    # DMN monitoring hook
├── database/
│   └── migrations/
│       └── 001_create_dmn_detection_schema.sql
├── docs/
│   └── dmn-rest-detection-system.md   # System documentation
└── tasks/
    └── 0001-prd-ai-education-pipeline.md
```

## Performance

- **Response Time**: < 100ms for activity tracking
- **DMN Calculation**: < 50ms per analysis
- **Database Queries**: Optimized with indexes for sub-second responses
- **Scalability**: Supports 100+ concurrent students per instance

## Privacy & Ethics

- **Data Minimization**: Collects only necessary engagement metrics
- **Transparency**: Students can view their own DMN scores and activity logs
- **Opt-out Option**: Students can disable DMN detection
- **No Surveillance**: System focuses on helping, not monitoring for punishment
- **Data Retention**: Activity logs retained for 90 days, aggregated data indefinitely

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[License information to be added]

## Support

For questions or issues:
- GitHub Issues: [Repository Issues]
- Documentation: `/docs`
- Email: [support email]

## Acknowledgments

- Based on research on Default Mode Network and cognitive fatigue
- Inspired by evidence-based break strategies (Pomodoro Technique, 20-20-20 rule)
- Built with modern web technologies and AI capabilities

## Roadmap

### Phase 1 (Current)
- [x] Core DMN detection algorithm
- [x] REST API implementation
- [x] Basic break recommendations
- [x] LMS integration framework
- [x] Frontend components

### Phase 2 (Planned)
- [ ] Machine learning model for improved detection
- [ ] Biometric integration (heart rate, eye-tracking)
- [ ] Social break coordination
- [ ] Gamification and wellness challenges
- [ ] Mobile app (iOS/Android)

### Phase 3 (Future)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Adaptive learning pathways
- [ ] Research platform for educational studies

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Active Development
