# DMN Recovery Mini Math Game

## Overview

A web-based mini arithmetic game designed for Default Mode Network (DMN) recovery. This lightweight educational game helps students relax and recover their brain's resting-state network after intensive learning sessions while maintaining mathematical engagement.

## Features

- **Simple Arithmetic Practice**: Addition, subtraction, multiplication problems
- **Progressive Difficulty**: Adapts to student performance
- **Low Cognitive Load**: Designed specifically for brain recovery periods
- **LMS Integration**: Compatible with Learning Management Systems via LTI 1.3
- **Progress Tracking**: Monitors student performance and recovery patterns
- **Responsive Design**: Works on tablets, computers, and interactive displays

## Architecture

```
dmn-math-game/
├── backend/          # Python Flask API
│   ├── src/
│   │   ├── api/      # REST endpoints
│   │   ├── models/   # Data models
│   │   ├── services/ # Business logic
│   │   └── lms/      # LMS integration (LTI)
│   └── tests/
├── frontend/         # React web app
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│   └── public/
├── database/         # PostgreSQL schemas
└── docs/            # Documentation
```

## Technology Stack

### Backend
- **Framework**: Flask 3.0
- **Database**: PostgreSQL 15
- **Authentication**: JWT + LTI 1.3
- **API**: RESTful with OpenAPI docs

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build**: Vite

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Docker (Recommended)
```bash
docker-compose up -d
```

## LMS Integration

This game supports LTI 1.3 (Learning Tools Interoperability) for seamless integration with:
- Canvas
- Moodle
- Blackboard
- Other LTI-compatible LMS platforms

### LTI Configuration
See [docs/LMS_INTEGRATION.md](docs/LMS_INTEGRATION.md) for detailed setup instructions.

## Game Mechanics

### DMN Recovery Design Principles

1. **Low Stress**: Problems are intentionally simple and non-threatening
2. **Short Sessions**: 3-5 minute gameplay recommended
3. **Gentle Feedback**: Positive reinforcement without pressure
4. **Visual Calm**: Soft colors, minimal animations
5. **Self-Paced**: No timers or rush mechanics

### Problem Types

- **Level 1**: Single-digit addition/subtraction (e.g., 3 + 4)
- **Level 2**: Two-digit addition/subtraction (e.g., 12 + 7)
- **Level 3**: Simple multiplication (e.g., 5 × 3)

## API Endpoints

### Game API
- `POST /api/game/start` - Start new game session
- `GET /api/game/problem` - Get next problem
- `POST /api/game/answer` - Submit answer
- `GET /api/game/progress/:studentId` - Get student progress

### LMS Integration
- `POST /api/lti/login` - LTI login initiation
- `POST /api/lti/launch` - LTI launch endpoint
- `GET /api/lti/jwks` - Public key set

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/dmn_math_game
SECRET_KEY=your-secret-key-here
LTI_CLIENT_ID=your-lti-client-id
LTI_DEPLOYMENT_ID=your-deployment-id

# Frontend
VITE_API_URL=http://localhost:5000
```

## Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Style
- Backend: Black + Flake8
- Frontend: ESLint + Prettier

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment instructions.

## License

MIT License - See LICENSE file for details

## Contact

For questions about this module, contact the KAIST Touch Math Academy development team.

## Related Documentation

- [Product Requirements Document](../tasks/0001-prd-ai-education-pipeline.md)
- [LMS Integration Guide](docs/LMS_INTEGRATION.md)
- [API Documentation](docs/API.md)
