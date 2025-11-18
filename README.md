# AI Education System Pipeline

AI-powered educational module generation system for KAIST Touch Math Academy.

## Overview

This system transforms teacher requests into complete educational modules through an intelligent AI pipeline:
- **World Model Reconstruction**: Understands educational concepts
- **Rule Generation**: Creates business logic automatically
- **Data Management**: Generates schemas and pseudo data
- **UI Auto-Generation**: Creates React interfaces
- **Deployment**: Produces ready-to-use modules

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Material-UI for components
- Redux Toolkit for state management

### Backend
- **API Gateway**: Node.js + Express
- **AI Pipeline**: Python 3.11+ + FastAPI
- **Database**: MySQL 5.7 (Moodle compatible)
- **Cache**: Redis 7+
- **AI**: Claude API (Anthropic)

### LMS Integration
- **Moodle 3.7+** via LTI 1.3
- Supports standalone and embedded deployment

## Project Structure

```
alt42standalone_v1.0/
├── backend/
│   ├── api-gateway/       # Node.js REST API
│   └── ai-pipeline/       # Python AI orchestrator
├── frontend/              # React application
├── database/              # Schema and migrations
├── docker/                # Docker configurations
├── docs/                  # Documentation
└── tasks/                 # Project planning (PRD)
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- MySQL 5.7 (or via Docker)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd alt42standalone_v1.0

# Start services with Docker Compose
cd docker
docker-compose up -d

# Install frontend dependencies
cd ../frontend
npm install
npm run dev

# Install backend dependencies
cd ../backend/api-gateway
npm install
npm run dev

cd ../ai-pipeline
pip install -r requirements.txt
uvicorn main:app --reload
```

## Development

### API Gateway (Node.js)
```bash
cd backend/api-gateway
npm run dev
```
Runs on `http://localhost:3000`

### AI Pipeline (Python)
```bash
cd backend/ai-pipeline
uvicorn main:app --reload
```
Runs on `http://localhost:8000`

### Frontend (React)
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`

## Moodle Integration

### LTI 1.3 Configuration
1. Register as LTI tool in Moodle
2. Configure OAuth2 endpoints
3. Set up deep linking (optional)
4. Enable grade passback (optional)

See `docs/moodle-integration.md` for detailed setup.

## Environment Variables

Create `.env` files in respective directories:

### Backend API Gateway (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/ai_education
REDIS_URL=redis://localhost:6379
AI_PIPELINE_URL=http://localhost:8000
JWT_SECRET=your-secret-key
```

### AI Pipeline (.env)
```
ANTHROPIC_API_KEY=your-api-key
DATABASE_URL=mysql://user:password@localhost:3306/ai_education
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_LTI_ENABLED=true
```

## Testing

```bash
# Backend API tests
cd backend/api-gateway
npm test

# AI Pipeline tests
cd backend/ai-pipeline
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment

### Docker Production Build
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Manual Deployment
See `docs/deployment.md` for detailed instructions.

## Documentation

- [Product Requirements Document](tasks/0001-prd-ai-education-pipeline.md)
- [API Documentation](docs/api.md)
- [Moodle Integration Guide](docs/moodle-integration.md)
- [Architecture Overview](docs/architecture.md)

## License

Copyright © 2025 KAIST Touch Math Academy

## Contact

For questions or support, contact the development team.
