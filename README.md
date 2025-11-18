# Moodle LMS Impaired Judgment Detection System

> **자동 판단력 흐려짐 감지 시스템** - Automatic Detection of Impaired Judgment in Students

An intelligent monitoring system that integrates with Moodle 3.7 LMS to automatically detect when students' judgment becomes impaired due to fatigue, confusion, or declining cognitive performance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Moodle](https://img.shields.io/badge/moodle-3.7-orange.svg)
![MySQL](https://img.shields.io/badge/mysql-5.7-blue.svg)
![PHP](https://img.shields.io/badge/php-7.1.9-purple.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Detection Indicators](#detection-indicators)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This system provides **real-time monitoring and detection** of impaired judgment in students using Moodle LMS. By analyzing behavioral patterns and performance metrics, it alerts teachers when students show signs of:

- **Cognitive Fatigue**: Declining performance after extended study sessions
- **Confusion**: Difficulty understanding concepts leading to errors
- **Frustration**: Repeated failures causing emotional stress
- **Distraction**: Loss of focus and attention

### Why This Matters

Students experiencing impaired judgment:
- ❌ Have poor learning outcomes
- ❌ Experience decreased knowledge retention
- ❌ Develop negative associations with learning
- ❌ Waste valuable study time

Our system helps teachers **intervene at the right moment** to maximize learning effectiveness.

---

## ✨ Features

### Core Detection Capabilities

- **🎯 Multi-Factor Analysis**
  - Performance degradation tracking (accuracy, response time)
  - Behavioral pattern recognition (clicking patterns, hesitation)
  - Error classification (careless vs. conceptual)
  - Session duration monitoring

- **📊 Real-Time Monitoring**
  - Live student status dashboard for teachers
  - WebSocket-based real-time alerts
  - Customizable alert thresholds
  - Historical trend visualization

- **🔔 Intelligent Alerting**
  - Four-level alert system (Optimal → Early Warning → Moderate → Severe)
  - Confidence scoring for assessments
  - Actionable recommendations for teachers
  - Email and dashboard notifications

- **📈 Baseline Learning**
  - Personalized baseline for each student
  - Adaptive thresholds based on individual performance
  - Historical data analysis (minimum 20 interactions)

### Technical Features

- **🔌 Seamless Moodle Integration**
  - Read-only database access (no modifications to Moodle)
  - Compatible with Moodle 3.7 (MySQL 5.7, PHP 7.1.9)
  - Supports quiz attempts, activity logs, grade history

- **🚀 High Performance**
  - Asynchronous processing with Celery
  - Redis caching for real-time data
  - PostgreSQL for analytics storage
  - Sub-5-second detection latency

- **🔒 Security & Privacy**
  - Student data privacy compliance (FERPA, GDPR)
  - Role-based access control (RBAC)
  - Encrypted database connections
  - Audit logging for all assessments

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Moodle 3.7 LMS (PHP 7.1.9)                │
│  Student Quiz Attempts | Activity Logs | Grade History      │
│                      MySQL 5.7 Database                      │
└────────────┬────────────────────────────────────────────────┘
             │ (Read-only Access)
             │
┌────────────▼─────────────────────────────────────────────────┐
│         Impairment Detection Service (Python 3.11+)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Moodle Connector → Behavior Analyzer → Detector    │  │
│  │       ↓                   ↓                   ↓      │  │
│  │  Alert Engine    ←  Baseline Calculator  ←  Logger  │  │
│  └──────────────────────────────────────────────────────┘  │
│                      FastAPI + Celery                       │
└──────┬──────────────────────┬────────────────────┬──────────┘
       │                      │                    │
┌──────▼────────┐  ┌─────────▼────────┐  ┌───────▼──────────┐
│  PostgreSQL   │  │  Redis Cache     │  │  WebSocket       │
│  (Analytics)  │  │  (Real-time)     │  │  (Live Updates)  │
└───────────────┘  └──────────────────┘  └──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │  Teacher Portal  │
                   │   (React App)    │
                   └──────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python 3.11+, FastAPI |
| **Database (Analytics)** | PostgreSQL 15+ |
| **Database (Moodle)** | MySQL 5.7 (read-only) |
| **Caching** | Redis 7+ |
| **Task Queue** | Celery |
| **WebSocket** | Socket.io |
| **Containerization** | Docker + Docker Compose |
| **Monitoring** | Prometheus + Grafana |

---

## 🔍 Detection Indicators

### Performance Degradation (55% Weight)

1. **Accuracy Decline** (30%)
   - Compares current accuracy to personal baseline
   - Threshold: 20% decline triggers detection
   - Example: Baseline 85% → Current 65% = **ALERT**

2. **Response Time Increase** (25%)
   - Measures how long students take to answer
   - Threshold: 1.5x slower than baseline
   - Example: Baseline 12s → Current 20s = **ALERT**

### Error Patterns (20% Weight)

3. **Careless Errors**
   - Distinguishes careless from conceptual errors
   - Threshold: 30% careless error rate
   - Indicators: Very quick answers, pattern inconsistency

### Behavioral Patterns (25% Weight)

4. **Rapid Clicking**
   - Answers submitted in < 5 seconds
   - Indicates guessing or frustration

5. **Hesitation Events**
   - Unusually long pauses (> 60 seconds)
   - Indicates confusion or uncertainty

6. **Navigation Confusion**
   - Excessive back/forward clicks
   - Threshold: > 5 navigation events per question

7. **Session Duration**
   - Continuous study time without breaks
   - Warning: > 90 minutes continuous activity

### Impairment Scoring

| Score | Status | Action |
|-------|--------|--------|
| 0-30 | **Optimal** | No action needed |
| 31-50 | **Early Warning** | Monitor closely, suggest break |
| 51-70 | **Moderate** | Recommend break, notify teacher |
| 71-100 | **Severe** | Immediate intervention required |

---

## 📦 Installation

### Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Python 3.11+** for manual installation
- **PostgreSQL 15+** (for analytics)
- **Redis 7+** (for caching)
- **Access to Moodle MySQL database** (read-only credentials)

### Option 1: Docker Installation (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd alt42standalone_v1.0

# Copy environment configuration
cp .env.example .env

# Edit .env with your Moodle database credentials
nano .env

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd alt42standalone_v1.0

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
nano .env  # Edit with your settings

# Run database migrations
python -m alembic upgrade head

# Start the API server
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal, start Celery worker
celery -A src.tasks.celery_app worker --loglevel=info

# In another terminal, start Celery beat
celery -A src.tasks.celery_app beat --loglevel=info
```

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file with your configuration. Key settings:

#### Moodle Database (Read-Only)

```bash
MOODLE_DB_HOST=your-moodle-server.com
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=readonly_user
MOODLE_DB_PASSWORD=your_secure_password
MOODLE_DB_SSL=true
```

#### Analytics Database

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=impairment_analytics
POSTGRES_USER=analytics_user
POSTGRES_PASSWORD=your_secure_password
```

#### Detection Thresholds

```bash
THRESHOLD_ACCURACY_DECLINE=0.20  # 20% decline
THRESHOLD_RESPONSE_TIME_INCREASE=1.50  # 1.5x slower
THRESHOLD_CARELESS_ERROR_RATE=0.30  # 30% careless
SESSION_TIMEOUT=15  # minutes
```

See `.env.example` for all available options.

---

## 🚀 Usage

### Testing Moodle Connection

```bash
# Test Moodle database connectivity
python -m src.collectors.moodle_connector

# Expected output:
# ✓ Moodle database connection successful
# MySQL version: 5.7.x
```

### Running Assessment

```python
from src.collectors.moodle_connector import MoodleConnector
from src.analyzers.behavior_analyzer import BehaviorAnalyzer
from src.detectors.impairment_detector import ImpairmentDetector
from datetime import datetime, timedelta

# Initialize components
moodle = MoodleConnector(...)
analyzer = BehaviorAnalyzer()
detector = ImpairmentDetector()

# Get student data from Moodle
user_id = 12345
since = datetime.now() - timedelta(hours=1)

quiz_attempts = moodle.get_quiz_attempts(user_id, since)
activity_logs = moodle.get_activity_logs(user_id, since)

# Analyze behavior
interactions = analyzer.process_moodle_data(quiz_attempts, activity_logs)
metrics = analyzer.calculate_performance_metrics(interactions)
patterns = analyzer.analyze_behavioral_patterns(interactions, session_start, session_end)
baseline = analyzer.calculate_baseline(historical_interactions)

# Detect impairment
result = detector.assess_impairment(metrics, baseline, patterns)

print(f"Impairment Score: {result.impairment_score}/100")
print(f"Status: {result.status}")
print(f"Confidence: {result.confidence}")
print(f"Recommendation: {result.recommendation}")
```

---

## 📚 API Documentation

### REST API Endpoints

API documentation is available at `http://localhost:8000/docs` (Swagger UI)

#### Get Current Student Status

```http
GET /api/v1/students/{user_id}/impairment/current
```

**Response:**
```json
{
  "student_id": 12345,
  "session_id": "uuid-here",
  "impairment_score": 45.5,
  "status": "early_warning",
  "confidence": 0.85,
  "triggers": [
    "Accuracy declined by 22.5%",
    "Response time 1.8x slower than baseline"
  ],
  "recommendation": "Consider suggesting a 5-minute break soon.",
  "assessed_at": "2025-11-18T10:30:00Z"
}
```

#### Get Teacher Alerts

```http
GET /api/v1/teachers/{teacher_id}/alerts?status=unacknowledged&course_id=101
```

#### WebSocket Connection

```javascript
// Connect to real-time monitoring
const socket = io('ws://localhost:8000/ws');

socket.emit('subscribe', {
  teacher_id: 67890,
  course_id: 101
});

socket.on('impairment_detected', (data) => {
  console.log('Alert:', data);
  // Show notification to teacher
});
```

See full API documentation: [docs/api.md](docs/api.md)

---

## 🛠️ Development

### Project Structure

```
alt42standalone_v1.0/
├── src/
│   ├── api/              # FastAPI endpoints
│   ├── collectors/       # Moodle data collectors
│   ├── analyzers/        # Behavior analysis
│   ├── detectors/        # Impairment detection
│   ├── models/           # Database models
│   ├── tasks/            # Celery background tasks
│   └── utils/            # Utility functions
├── migrations/           # Database migrations
├── tests/                # Unit and integration tests
├── config/               # Configuration files
├── docker/               # Docker configuration
├── docs/                 # Documentation
├── requirements.txt      # Python dependencies
├── docker-compose.yml    # Docker Compose config
└── README.md             # This file
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_impairment_detector.py

# Run integration tests
pytest tests/integration/
```

### Code Quality

```bash
# Format code
black src/

# Lint code
flake8 src/

# Type checking
mypy src/
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Set `APP_ENV=production` and `DEBUG=false`
- [ ] Configure strong JWT secret key
- [ ] Enable SSL/TLS for all database connections
- [ ] Configure Sentry for error tracking
- [ ] Set up email notifications (SMTP/SendGrid/SES)
- [ ] Configure CORS origins to your domain only
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up reverse proxy (nginx) with SSL
- [ ] Configure firewall rules
- [ ] Test disaster recovery procedures

### Deployment Commands

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f

# Scale workers
docker-compose up -d --scale celery-worker=4
```

---

## 📊 Monitoring & Metrics

### Prometheus Metrics

Available at `http://localhost:9090`

- `impairment_assessments_total` - Total assessments performed
- `impairment_alerts_sent_total` - Total alerts sent
- `impairment_score_histogram` - Distribution of impairment scores
- `moodle_data_collection_duration_seconds` - Data collection latency
- `api_request_duration_seconds` - API response times

### Grafana Dashboards

Available at `http://localhost:3001` (default credentials: admin/admin)

Pre-built dashboards:
- **System Overview** - Overall system health
- **Student Monitoring** - Per-student impairment trends
- **Teacher Dashboard** - Alert statistics by teacher
- **Performance Metrics** - System performance and latency

---

## 📝 Documentation

Detailed documentation available in `docs/`:

- [Technical Specification](docs/impaired-judgment-detection-spec.md)
- [API Reference](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Deployment Guide](docs/deployment.md)
- [Configuration Guide](docs/configuration.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **KAIST Touch Math Academy** - Original project sponsor
- **Moodle Community** - For excellent LMS documentation
- **Anthropic Claude** - AI assistance in development

---

## 📞 Support

For questions and support:

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/repo/issues)
- **Email**: support@your-institution.edu

---

## 🗺️ Roadmap

### Version 2.0 (Future)
- [ ] Machine learning model for improved detection accuracy
- [ ] Support for additional LMS platforms (Canvas, Blackboard)
- [ ] Mobile app for students (self-monitoring)
- [ ] Predictive alerts (before impairment occurs)
- [ ] Automated intervention suggestions
- [ ] Multi-language support (Korean, English, Japanese, Chinese)
- [ ] Integration with learning management tools
- [ ] Advanced analytics and reporting

---

**Made with ❤️ for better education outcomes**
