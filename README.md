# Permutation Pattern Matching - Educational Web App

## Overview
An educational web application that integrates with Moodle LMS to provide interactive permutation pattern matching exercises. The app displays a virtual smartphone interface in the bottom-right corner of the screen where students can solve pattern-based permutation puzzles.

## Features
- 🎮 Interactive permutation pattern matching game
- 📱 Virtual smartphone display interface
- 🔗 Moodle LMS integration (PHP 7.1.9, Moodle 3.7)
- 📊 Student progress tracking
- 🎯 Multiple difficulty levels
- 📈 Real-time feedback and scoring

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for fast development
- TailwindCSS for styling
- Axios for API calls

### Backend
- Python 3.11+ with FastAPI
- MySQL 5.7 database
- SQLAlchemy ORM
- Pydantic for data validation

### Integration
- Moodle 3.7 (PHP 7.1.9)
- REST API for LMS communication
- JWT authentication

## Project Structure
```
alt42standalone_v1.0/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── core/        # Core configurations
│   │   └── utils/       # Utility functions
│   ├── requirements.txt
│   └── main.py
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── styles/      # CSS/SCSS styles
│   ├── package.json
│   └── vite.config.ts
├── database/            # Database schemas and migrations
├── docs/               # Documentation
└── docker-compose.yml  # Docker configuration
```

## Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 5.7
- Docker (optional)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Database Setup
```bash
mysql -u root -p < database/schema.sql
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Docker
```bash
docker-compose up --build
```

## Moodle Integration

### API Endpoints
- `POST /api/v1/problems/fetch` - Fetch problem from Moodle
- `POST /api/v1/submit` - Submit answer to Moodle
- `GET /api/v1/progress/:student_id` - Get student progress

### Configuration
1. Set Moodle URL in `.env` file
2. Configure API token in Moodle admin panel
3. Update `backend/app/core/config.py` with credentials

## Permutation Pattern Concept

Students are presented with a sequence pattern and must arrange elements in the correct permutation order. For example:
- Pattern: [A, B, C] → [C, A, B]
- Student must recognize the rotation pattern and apply it to new sequences

## License
MIT License

## Contributors
- KAIST Touch Math Academy
- AI Education Pipeline Team
