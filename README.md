# LMS Emotion-Based Color Mode System

Real-time emotional state detection and adaptive color mode system for educational Learning Management Systems (LMS).

## 🎨 Overview

This system automatically detects student emotional states through behavioral pattern analysis and applies scientifically-backed color modes to promote emotional stability, reduce stress, and enhance focus during learning sessions.

### Key Features

- **🧠 Real-time Emotion Detection**: Analyzes interaction patterns (clicks, errors, timing) to detect emotional states
- **🎨 Adaptive Color Modes**: Four scientifically-designed color palettes (Neutral, Calming, Energetic, Refresh)
- **⚡ WebSocket Integration**: Real-time color mode switching with smooth transitions
- **🎯 Behavioral Tracking**: Comprehensive interaction monitoring for accurate emotion detection
- **👤 User Control**: Manual override and preference customization
- **♿ Accessibility**: WCAG 2.1 AA compliant across all color modes
- **📊 Analytics**: Track color mode effectiveness and student emotional trends

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Color Modes](#color-modes)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React 18+)                      │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ EmotionalTheme   │  │ BehaviorTracker                │  │
│  │ Context Provider │  │ Component                      │  │
│  └────────┬─────────┘  └──────────┬─────────────────────┘  │
│           │                       │                         │
│           │         WebSocket     │  REST API               │
│           └───────────┬───────────┴─────────────┐           │
└───────────────────────┼─────────────────────────┼───────────┘
                        │                         │
┌───────────────────────┼─────────────────────────┼───────────┐
│              Backend (Python FastAPI)           │           │
│  ┌────────────────────▼─────────────────────┐  │           │
│  │  Emotion Detection Service              │  │           │
│  │  - Rule-based classification            │  │           │
│  │  - Behavioral pattern analysis          │  │           │
│  └─────────────────────┬───────────────────┘  │           │
│                        │                       │           │
│  ┌─────────────────────▼───────────────────┐  │           │
│  │  PostgreSQL Database                    │  │           │
│  │  - Emotional states                     │◄─┘           │
│  │  - Behavior metrics                     │              │
│  │  - Student preferences                  │              │
│  └─────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Material-UI (MUI) for theming
- Socket.io-client for WebSocket
- Emotion/styled for CSS-in-JS

**Backend:**
- Python 3.11+
- FastAPI for REST API
- SQLAlchemy for ORM
- PostgreSQL 15+ for database
- Redis for caching (optional)

## 📦 Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **PostgreSQL**: 15 or higher
- **Redis**: 7+ (optional, for caching)
- **npm** or **yarn**: Latest version

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/lms-emotion-color-mode.git
cd lms-emotion-color-mode
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb lms_emotion_db

# Run migrations
psql -U your_username -d lms_emotion_db -f ../database/migrations/001_create_emotion_tables.sql
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your API endpoints
nano .env
```

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lms_emotion_db

# Server
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000

# Emotion Detection
EMOTION_DETECTION_ALGORITHM_VERSION=1.0
DEFAULT_DETECTION_SENSITIVITY=medium
```

### Frontend Configuration (`frontend/.env`)

```env
# API
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=ws://localhost:8000

# Features
REACT_APP_ENABLE_EMOTION_DETECTION=true
REACT_APP_AUTO_MODE_ENABLED=true
```

## 💻 Usage

### Start Backend Server

```bash
cd backend
source venv/bin/activate
python main.py
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

### Integration Example

```typescript
import React from 'react';
import { EmotionalThemeProvider } from './contexts/EmotionalThemeContext';
import { BehaviorTracker } from './components/BehaviorTracker';
import ColorModeSelector from './components/ColorModeSelector';

function App() {
  const studentId = 12345; // From your auth system
  const sessionId = 'session_abc123';

  return (
    <EmotionalThemeProvider
      studentId={studentId}
      sessionId={sessionId}
      apiBaseUrl="/api/v1"
      wsBaseUrl="ws://localhost:8000"
    >
      <BehaviorTracker
        studentId={studentId}
        sessionId={sessionId}
        enabled={true}
      >
        {/* Your app content */}
        <YourAppContent />

        {/* Color mode selector UI */}
        <ColorModeSelector position="bottom-right" />
      </BehaviorTracker>
    </EmotionalThemeProvider>
  );
}
```

## 📚 API Documentation

### Analyze Emotion

**Endpoint:** `POST /api/v1/emotion/analyze`

**Request:**
```json
{
  "student_id": 12345,
  "session_id": "sess_abc123",
  "behavior_metrics": {
    "avg_click_interval": 2.8,
    "error_rate": 0.25,
    "task_completion_rate": 0.70,
    "idle_time_seconds": 120,
    "retry_count": 4,
    "session_duration_minutes": 15
  },
  "current_mode": "neutral",
  "sensitivity": "medium"
}
```

**Response:**
```json
{
  "student_id": 12345,
  "detected_emotion": "stressed",
  "confidence": 0.87,
  "recommended_mode": "calming",
  "should_switch": true,
  "reason": "Stress detected: high error rate, multiple retry attempts",
  "all_scores": {
    "stressed": 0.87,
    "calm": 0.32,
    "engaged": 0.25,
    "tired": 0.18
  }
}
```

### Get Current Emotion

**Endpoint:** `GET /api/v1/emotion/student/{student_id}/current?session_id={session_id}`

### Update Preferences

**Endpoint:** `POST /api/v1/emotion/student/{student_id}/preferences`

**Request:**
```json
{
  "auto_mode_enabled": false,
  "preferred_default_mode": "calming",
  "emotion_detection_sensitivity": "low",
  "disabled_modes": ["energetic"]
}
```

### WebSocket Connection

**Endpoint:** `ws://localhost:8000/api/v1/emotion/ws/{student_id}/{session_id}`

**Events:**
- `color_mode_change`: Color mode switched
- `emotion_detected`: New emotion detected
- `connected`: Initial connection established

## 🗃️ Database Schema

### Core Tables

1. **student_emotional_states**: Detected emotions and applied color modes
2. **behavior_metrics**: Granular interaction events
3. **color_mode_history**: Color mode change log
4. **student_color_preferences**: User preferences
5. **emotion_detection_logs**: Algorithm decision logs

See `database/migrations/001_create_emotion_tables.sql` for complete schema.

## 🎨 Color Modes

### Neutral (Productivity)
- **Use Case**: Calm, focused learning
- **Colors**: Professional blue, neutral grey
- **Psychological Effect**: Balanced, focused

### Calming
- **Use Case**: Stressed, frustrated state
- **Colors**: Soft green, gentle blue
- **Psychological Effect**: Reduces anxiety, promotes calm

### Energetic
- **Use Case**: Engaged, motivated learning
- **Colors**: Energizing orange, optimistic yellow
- **Psychological Effect**: Stimulates creativity, enhances energy

### Refresh
- **Use Case**: Tired, disengaged state
- **Colors**: Vibrant pink, bright cyan
- **Psychological Effect**: Increases alertness, re-engages focus

## 🛠️ Development

### Run Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting

```bash
# Backend (Python)
black backend/
flake8 backend/

# Frontend (TypeScript)
npm run lint
npm run format
```

### Project Structure

```
lms-emotion-color-mode/
├── backend/
│   ├── api/              # FastAPI routes
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── main.py           # Application entry point
├── frontend/
│   └── src/
│       ├── components/   # React components
│       ├── contexts/     # Context providers
│       ├── themes/       # MUI themes
│       └── types/        # TypeScript types
├── database/
│   └── migrations/       # SQL migration scripts
└── tasks/
    └── *.md              # PRD and documentation
```

## 🚢 Deployment

### Docker Deployment (Coming Soon)

```bash
docker-compose up -d
```

### Production Checklist

- [ ] Set `DEBUG_MODE=false` in backend `.env`
- [ ] Configure production database credentials
- [ ] Set up Redis for caching
- [ ] Configure CORS for production frontend URL
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Enable HTTPS/WSS for WebSocket
- [ ] Set up monitoring and logging
- [ ] Configure data retention policies
- [ ] Test accessibility compliance
- [ ] Load testing for concurrent users

## 🧪 Testing

### Manual Testing Scenarios

1. **Stress Detection**: Make multiple errors rapidly
2. **Engagement Detection**: Work steadily with low errors
3. **Tired Detection**: Long idle periods, slow interactions
4. **Manual Override**: Switch modes manually via selector
5. **Preference Persistence**: Reload page, check preferences retained
6. **WebSocket Reconnection**: Disconnect network, verify reconnection

## 📖 Documentation

- **PRD**: See `tasks/0002-prd-emotion-based-color-mode.md`
- **API Docs**: `http://localhost:8000/docs` (when server is running)
- **Integration Guide**: See `frontend/src/App.example.tsx`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- AI Education System Team - KAIST Touch Math Academy

## 🙏 Acknowledgments

- Color psychology research: Küller et al. (2009), Lee et al. (2015)
- Material-UI for excellent theming system
- FastAPI for modern Python web framework
- KAIST Touch Math Academy for project sponsorship

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@kaist-touchmath.edu

---

**Built with ❤️ for better learning experiences**
