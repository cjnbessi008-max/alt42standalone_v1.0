# Solution Gap Quantification System (논리적 간격 정량화 시스템)

A standalone web application that quantifies logical gaps in student problem-solving processes.

## Overview

This system analyzes student solution steps to identify and quantify logical gaps, missing steps, and errors in problem-solving processes. It uses AI-powered analysis to provide detailed feedback on solution quality.

## Features

- **Step-by-Step Solution Tracking**: Capture each step of student problem-solving
- **Logic Gap Detection**: Identify missing logical steps or reasoning errors
- **Gap Quantification**: Measure the severity and type of logical gaps
- **AI-Powered Analysis**: Use Claude AI for intelligent gap detection
- **Visual Feedback**: Present analysis results in an intuitive interface
- **Multi-Subject Support**: Extensible to mathematics, coding, logic problems

## Technology Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15+** with JSONB support
- **SQLAlchemy** for ORM
- **Anthropic Claude API** for AI analysis
- **Pydantic** for data validation

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Axios** for API communication
- **TailwindCSS** for styling
- **React Hook Form** for form handling

### DevOps
- **Docker & Docker Compose** for containerization
- **PostgreSQL** in Docker container
- **Nginx** for reverse proxy (production)

## Project Structure

```
.
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes and endpoints
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic and AI services
│   │   └── core/           # Configuration and utilities
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
├── database/              # Database schema and migrations
│   ├── migrations/
│   └── init.sql
├── docs/                  # Documentation
├── docker-compose.yml     # Docker orchestration
└── .env.example          # Environment variables template
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. Copy environment configuration:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Core Concepts

### Solution Gap Analysis

The system analyzes student solutions through:

1. **Step Extraction**: Parse solution into discrete logical steps
2. **Expected Path Generation**: AI generates expected solution path
3. **Gap Detection**: Compare student steps with expected path
4. **Gap Quantification**: Measure gaps using multiple metrics:
   - Missing step count
   - Logic jump severity
   - Error types (conceptual, computational, etc.)
   - Completeness score

### Gap Metrics

- **Completeness Score** (0-100): How complete is the solution
- **Logic Continuity** (0-100): How well steps connect logically
- **Error Count**: Number of errors detected
- **Missing Critical Steps**: Key steps that were skipped
- **Severity Level**: LOW, MEDIUM, HIGH, CRITICAL

## API Endpoints

### Problems
- `POST /api/problems` - Create a new problem
- `GET /api/problems/{id}` - Get problem details
- `GET /api/problems` - List all problems

### Solutions
- `POST /api/solutions` - Submit a student solution
- `GET /api/solutions/{id}` - Get solution details
- `POST /api/solutions/{id}/analyze` - Analyze solution for gaps

### Analysis
- `GET /api/analysis/{solution_id}` - Get gap analysis results
- `GET /api/analysis/{solution_id}/visualization` - Get visual representation

## Configuration

Key environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solutiongap

# AI Service
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Application
DEBUG=True
SECRET_KEY=your_secret_key_here
CORS_ORIGINS=http://localhost:3000
```

## Development Roadmap

- [x] Phase 1: Project setup and architecture
- [ ] Phase 2: Database schema and models
- [ ] Phase 3: Backend API implementation
- [ ] Phase 4: AI gap analysis engine
- [ ] Phase 5: Frontend UI development
- [ ] Phase 6: Integration testing
- [ ] Phase 7: Deployment and documentation

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

[To be determined]

## Support

For issues and questions, please create an issue in the repository.

## Authors

Built for KAIST Touch Math Academy
