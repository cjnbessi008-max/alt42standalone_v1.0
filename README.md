# AI Thinking Routine Engine for Moodle LMS

**Intelligent Learning Optimization System** that analyzes top-performing students' learning patterns and generates personalized thinking routines for optimal academic performance.

## 🎯 Overview

This system integrates with **Moodle 3.7 LMS** (MySQL 5.7, PHP 7.1.9) to:

1. **Extract** comprehensive learning behavior data from Moodle
2. **Analyze** top-tier student routines and identify success patterns
3. **Model** optimal thinking routines using AI (Claude by Anthropic)
4. **Generate** personalized recommendations for each student

### Key Features

- ✅ **Top Performer Analysis**: Identifies patterns among top 10% students
- ✅ **AI-Powered Recommendations**: Uses Claude AI to generate personalized study routines
- ✅ **Performance Gap Analysis**: Compares individual students to top performers
- ✅ **Thinking Routine Generation**: Creates structured learning methodologies
- ✅ **Real-time Analytics**: RESTful API for integration with any frontend
- ✅ **Moodle Plugin**: Native Moodle integration via local plugin

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vue/etc)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────┴────────────────────────────────────┐
│              Thinking Routine Engine (FastAPI)               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Analysis   │  │  AI Service  │  │    Cache     │      │
│  │  Service    │  │   (Claude)   │  │   (Redis)    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────┴────────┐          ┌──────────┴─────────┐
│  Moodle MySQL   │          │   PostgreSQL       │
│  (Read-Only)    │          │   (Analytics DB)   │
│  - User Data    │          │   - Cache          │
│  - Logs         │          │   - Patterns       │
│  - Grades       │          │   - AI Logs        │
└─────────────────┘          └────────────────────┘
```

## 📦 Components

### 1. Moodle Integration Plugin (`moodle-integration/`)
- **Location**: `local/thinkroutine/`
- **Type**: Moodle local plugin
- **Features**:
  - Web services API for data extraction
  - Student activity analysis
  - Course analytics endpoints

### 2. Thinking Routine Engine (`thinking-routine-engine/`)
- **Framework**: FastAPI (Python 3.11+)
- **Features**:
  - Data extraction from Moodle database
  - Top performer pattern analysis
  - AI-powered routine generation
  - Personalized recommendations

### 3. AI Service
- **Provider**: Anthropic Claude
- **Model**: Claude 3 Sonnet
- **Purpose**:
  - Pattern identification
  - Recommendation generation
  - Thinking routine creation

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Moodle 3.7+ with MySQL 5.7
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **Configure environment variables**
```bash
cd thinking-routine-engine
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up Moodle plugin**
```bash
# Copy plugin to your Moodle installation
cp -r moodle-integration/local/thinkroutine /path/to/moodle/local/

# Navigate to Moodle admin to install plugin
# Site administration > Notifications
```

4. **Start services with Docker**
```bash
cd ..
docker-compose up -d
```

5. **Verify installation**
```bash
curl http://localhost:8000/health
```

### Manual Installation (Without Docker)

1. **Install Python dependencies**
```bash
cd thinking-routine-engine
pip install -r requirements.txt
```

2. **Set up databases**
- PostgreSQL for analytics
- Redis for caching
- MySQL/MariaDB for Moodle (existing)

3. **Run the API server**
```bash
python main.py
```

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### 1. Student Analysis
```http
GET /students/{user_id}/analysis?course_id={course_id}&lookback_days=90
```

**Response:**
```json
{
  "userid": 123,
  "total_sessions": 45,
  "avg_session_duration": 52.3,
  "total_time_spent": 38.5,
  "completion_rate": 87.5,
  "avg_grade": 85.2,
  "peak_performance_time": "afternoon",
  "learning_velocity": 1.2
}
```

#### 2. Course Analytics
```http
GET /courses/{course_id}/analytics?top_percentile=10.0
```

**Response:**
```json
{
  "courseid": 5,
  "total_students": 120,
  "top_performers_count": 12,
  "avg_top_performer_grade": 92.3,
  "common_patterns": [...],
  "optimal_study_duration": 55.0,
  "optimal_session_frequency": 4.2,
  "recommended_time_of_day": "afternoon"
}
```

#### 3. Personalized Recommendations
```http
GET /students/{user_id}/courses/{course_id}/recommendations
```

**Response:**
```json
{
  "userid": 123,
  "courseid": 5,
  "current_performance_percentile": 45.8,
  "recommendations": [
    {
      "category": "Time Management",
      "title": "Extend Study Sessions",
      "description": "...",
      "priority": "high",
      "expected_impact": 8.5
    }
  ],
  "thinking_routine": {
    "morning_routine": "...",
    "study_approach": "...",
    "problem_solving_steps": "...",
    "review_schedule": "..."
  },
  "gap_analysis": [...]
}
```

#### 4. Thinking Routine (Optimized)
```http
GET /students/{user_id}/courses/{course_id}/routine
```

#### 5. Gap Analysis
```http
GET /students/{user_id}/courses/{course_id}/gap-analysis
```

#### 6. Course Leaderboard
```http
GET /courses/{course_id}/leaderboard?top_n=10
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MOODLE_DB_HOST` | Moodle MySQL host | localhost |
| `MOODLE_DB_PORT` | MySQL port | 3306 |
| `MOODLE_DB_NAME` | Moodle database name | moodle |
| `MOODLE_DB_USER` | Database user | moodle |
| `MOODLE_DB_PASSWORD` | Database password | - |
| `ANTHROPIC_API_KEY` | Claude API key | - |
| `TOP_PERFORMER_PERCENTILE` | Top % to analyze | 10.0 |
| `SESSION_GAP_MINUTES` | Session gap threshold | 30 |
| `ANALYSIS_LOOKBACK_DAYS` | Analysis period | 90 |

## 🧠 How It Works

### 1. Data Extraction
- Connects to Moodle database (read-only)
- Extracts user logs, quiz attempts, grades, forum posts
- Identifies learning sessions (activity patterns)

### 2. Top Performer Analysis
- Identifies top 10% students by grade
- Analyzes their study patterns:
  - Session duration and frequency
  - Time-of-day preferences
  - Completion rates
  - Learning velocity (improvement rate)

### 3. AI Pattern Recognition
- Sends aggregated data to Claude AI
- Identifies non-obvious success patterns
- Generates evidence-based recommendations

### 4. Personalized Routine Generation
- Compares student to top performers
- Identifies performance gaps
- Creates customized thinking routine:
  - Morning preparation steps
  - Study approach methodology
  - Problem-solving framework
  - Spaced repetition schedule

### 5. Continuous Optimization
- Tracks routine effectiveness
- Adjusts recommendations based on progress
- Learns from successful implementations

## 📊 Data Models

### Student Activity Metrics
- **Sessions**: Learning session count and duration
- **Time Patterns**: Morning/afternoon/evening/night distribution
- **Engagement**: Forum posts, resource views, activity completion
- **Performance**: Quiz grades, overall grade, learning velocity

### Top Performer Patterns
- **Study Duration**: Optimal session length
- **Frequency**: Sessions per week
- **Timing**: Best time of day for performance
- **Behaviors**: Common success patterns

### Thinking Routine
- **Morning Routine**: Pre-study preparation steps
- **Study Approach**: Evidence-based learning strategies
- **Problem-Solving**: Systematic approach to challenges
- **Review Schedule**: Spaced repetition timing

## 🔐 Security

- **Read-Only Database Access**: Moodle DB user should have SELECT-only permissions
- **API Authentication**: Implement JWT or OAuth2 for production
- **Data Privacy**: No PII stored outside Moodle database
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configure allowed origins in `.env`

## 🧪 Testing

### Unit Tests
```bash
cd thinking-routine-engine
pytest tests/
```

### API Tests
```bash
pytest tests/api/
```

### Integration Tests
```bash
pytest tests/integration/
```

## 📈 Performance Optimization

- **Caching**: Redis caches frequently accessed analysis results
- **Database Indexing**: Ensure Moodle tables are properly indexed
- **Async Processing**: Background tasks for heavy computations
- **AI Cost Optimization**: Prompt engineering to minimize token usage

## 🛠️ Troubleshooting

### Common Issues

**1. Cannot connect to Moodle database**
- Verify MySQL credentials in `.env`
- Check network connectivity
- Ensure MySQL user has necessary permissions

**2. AI service errors**
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API rate limits and usage
- Review error logs in `thinking-routine-api` container

**3. No top performers found**
- Ensure course has sufficient student activity
- Check `TOP_PERFORMER_PERCENTILE` setting
- Verify grade data exists in Moodle

## 📝 Development

### Project Structure
```
alt42standalone_v1.0/
├── moodle-integration/          # Moodle plugin
│   └── local/thinkroutine/
│       ├── version.php
│       ├── db/services.php
│       ├── externallib.php
│       └── classes/analyzer.php
├── thinking-routine-engine/     # Python API
│   ├── main.py                  # FastAPI app
│   ├── config.py                # Configuration
│   ├── database.py              # DB connections
│   ├── models/                  # Data models
│   │   ├── moodle_models.py
│   │   └── app_models.py
│   └── services/                # Business logic
│       ├── moodle_service.py
│       ├── ai_service.py
│       └── analysis_service.py
├── docker/                      # Docker configs
│   └── Dockerfile.api
├── docker-compose.yml
└── README.md
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[Your License Here]

## 🤝 Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [Wiki]
- Email: [Contact]

## 🙏 Acknowledgments

- **Moodle Community**: For the excellent LMS platform
- **Anthropic**: For Claude AI API
- **KAIST Touch Math Academy**: Original use case inspiration

---

**Built with ❤️ for optimal learning**
