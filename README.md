# AI Education System Pipeline

AI-powered educational module generation pipeline with **One-Frame Case** visualization for KAIST Touch Math Academy.

## Overview

This system enables teachers to create sophisticated educational modules through natural language requests. The AI pipeline automatically generates:

- Database schemas and data management
- Business logic and rules
- User interfaces with One-Frame Case visualizations
- Complete, working educational modules

## Key Features

### One-Frame Case Visualization

**One-Frame Case** compresses multiple solution paths or scenarios into a single animated visualization, helping students:

- Understand different problem-solving approaches at a glance
- Explore various case scenarios interactively
- Compare different methods side-by-side
- Learn optimal strategies through visual guidance

**Features:**
- Multiple layout algorithms (tree, grid, radial, flow)
- Customizable animations (sequential, parallel, radial)
- Virtual smartphone viewport display
- Interactive case exploration with progress tracking
- LMS integration (Moodle) for problem data and progress sync

## Project Structure

```
alt42standalone_v1.0/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── OneFrameCase/ # One-Frame Case components
│   │   │   │   ├── OneFrameCaseViewer.tsx
│   │   │   │   ├── CaseNode.tsx
│   │   │   │   ├── CaseLayout.ts
│   │   │   │   └── *.css
│   │   │   └── SmartphoneViewport.tsx
│   │   ├── types/            # TypeScript type definitions
│   │   ├── services/         # API services
│   │   ├── pages/            # Page components
│   │   └── styles/           # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # Python FastAPI backend
│   ├── api/                  # API endpoints
│   │   ├── cases.py          # One-Frame Case endpoints
│   │   └── lms.py            # LMS integration endpoints
│   ├── services/             # Business logic
│   │   └── mock_lms.py       # Mock LMS service
│   ├── models/               # Database models
│   │   ├── case_models.py    # Case visualization models
│   │   └── base.py
│   ├── config/               # Configuration
│   │   └── settings.py
│   ├── main.py               # FastAPI app
│   └── requirements.txt
│
├── database/                 # Database schemas
│   ├── schemas/
│   │   └── 001_initial_schema.sql
│   ├── migrations/
│   └── seeds/
│
├── docs/                     # Documentation
│   └── features/
│       └── one-frame-case.md # One-Frame Case specification
│
└── tasks/                    # Project management
    └── 0001-prd-ai-education-pipeline.md

```

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for build tooling
- **React Spring** for animations
- **D3.js** for layout algorithms
- **Material-UI** for UI components
- **Zustand** for state management

### Backend
- **Python 3.11+**
- **FastAPI** for API framework
- **SQLAlchemy** for ORM
- **PostgreSQL 15+** for database
- **Redis** for caching
- **Anthropic Claude API** for AI generation

### DevOps
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+ (optional for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Run development server
python main.py
# Or with auto-reload:
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

### Database Setup

```bash
# Create database
createdb ai_education

# Run initial schema
psql ai_education < database/schemas/001_initial_schema.sql
```

## API Endpoints

### One-Frame Case

- `POST /api/cases/generate` - Generate case visualization from problem
- `GET /api/cases/{case_id}` - Get case visualization
- `POST /api/cases/{case_id}/interact` - Record student interaction
- `GET /api/cases/student/{student_id}/progress` - Get student progress

### LMS Integration

- `GET /api/lms/problems/{problem_id}` - Get problem from LMS
- `GET /api/lms/problems` - List all problems with filters
- `POST /api/lms/progress/update` - Update student progress
- `POST /api/lms/grades/submit` - Submit grade to LMS
- `GET /api/lms/students/{student_id}` - Get student info
- `GET /api/lms/status` - Check LMS connection status

## Development

### Running Tests

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
# Backend
black backend/
isort backend/

# Frontend
cd frontend
npm run lint
```

## LMS Integration

Currently using **Mock LMS Service** for development. The system is designed to integrate with:

- **Moodle 3.7+** (planned)
- **Canvas** (future)
- Custom LMS via REST API

### Mock LMS

The mock service provides sample problems:
- `fraction-add-1`: Fraction addition (1/2 + 1/3)
- `fraction-multiply-1`: Fraction multiplication (2/3 × 3/4)
- `equation-solve-1`: Linear equation (2x + 5 = 13)

## One-Frame Case Example

```typescript
const caseData: CaseData = {
  id: "fraction-add-demo",
  title: "분수 덧셈의 여러 방법",
  description: "1/2 + 1/3을 푸는 다양한 접근법",
  cases: [
    {
      id: "root",
      label: "문제: 1/2 + 1/3",
      content: { type: "text", data: "분수를 더해봅시다" },
      connections: ["method-1", "method-2", "method-3"]
    },
    {
      id: "method-1",
      label: "방법 1: 공통분모 사용",
      content: {
        type: "interactive",
        data: { steps: ["1/2 = 3/6", "1/3 = 2/6", "3/6 + 2/6 = 5/6"] }
      },
      metadata: { difficulty: 2, isRecommended: true }
    },
    // ... more cases
  ],
  layout: { algorithm: "tree", spacing: 80 },
  animation: { type: "sequential", duration: 500 }
};
```

## Smartphone Viewport

Cases are displayed in a virtual smartphone frame (default: bottom-right position):

```typescript
<SmartphoneViewport
  width={375}
  height={667}
  position="bottom-right"
  scale={0.6}
>
  <OneFrameCaseViewer caseData={caseData} />
</SmartphoneViewport>
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add tests
4. Submit a pull request

## License

Proprietary - KAIST Touch Math Academy

## Contact

For questions or support, contact the development team.

---

**Version**: 0.1.0
**Last Updated**: 2025-11-18
**Status**: Initial Development
