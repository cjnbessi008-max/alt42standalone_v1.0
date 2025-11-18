# ALT42 - AI-Powered Logical Reasoning Refutation System

## Overview

An intelligent educational system that analyzes student's logical reasoning, identifies fallacies, and provides counterarguments to improve critical thinking skills.

## Features

- **AI-Powered Analysis**: Uses Claude API to analyze logical arguments
- **Fallacy Detection**: Identifies common logical fallacies and reasoning errors
- **Intelligent Refutation**: Generates counterarguments and guides correct reasoning
- **Progress Tracking**: Monitors student learning progress and improvement
- **Interactive Learning**: Real-time feedback and conversational learning experience

## Technology Stack

### Frontend
- React 18 + TypeScript
- Material-UI (MUI)
- Axios for API calls
- React Router for navigation

### Backend
- **API Gateway**: Node.js + Express + TypeScript
- **AI Service**: Python 3.11+ + FastAPI
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **AI Engine**: Claude API (Anthropic)

### DevOps
- Docker + Docker Compose
- JWT Authentication
- RESTful API architecture

## Project Structure

```
/
├── backend/
│   ├── api-gateway/        # Node.js Express API Gateway
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-service/         # Python FastAPI AI Service
│       ├── app/
│       │   ├── api/
│       │   ├── services/
│       │   ├── models/
│       │   └── main.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── frontend/               # React TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Sample data
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)
- Claude API Key from Anthropic

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alt42standalone_v1.0
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Claude API key and database credentials
   ```

3. **Option A: Using Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Option B: Manual Setup**

   **Database Setup**
   ```bash
   # Create database
   createdb alt42_reasoning

   # Run migrations
   psql -d alt42_reasoning -f database/schema.sql
   psql -d alt42_reasoning -f database/seed.sql
   ```

   **Backend API Gateway**
   ```bash
   cd backend/api-gateway
   npm install
   npm run dev
   ```

   **Backend AI Service**
   ```bash
   cd backend/ai-service
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8001
   ```

   **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## Core Features

### 1. Argument Submission
Students submit their logical reasoning or arguments in natural language.

### 2. AI Analysis
The system analyzes the argument for:
- Logical structure
- Premise validity
- Conclusion soundness
- Common fallacies (ad hominem, straw man, false dichotomy, etc.)

### 3. Refutation Generation
AI generates:
- Identification of logical errors
- Counterarguments
- Explanation of correct reasoning
- Guided questions to improve thinking

### 4. Learning Progress
Tracks:
- Arguments analyzed
- Improvement over time
- Common error patterns
- Mastery levels

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Arguments
- `POST /api/arguments` - Submit new argument for analysis
- `GET /api/arguments` - Get user's argument history
- `GET /api/arguments/:id` - Get specific argument details
- `GET /api/arguments/:id/refutation` - Get AI refutation

### Progress
- `GET /api/progress` - Get user progress summary
- `GET /api/progress/stats` - Get detailed statistics

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/arguments` - List all arguments
- `GET /api/admin/analytics` - System analytics

## Database Schema

Key tables:
- `users` - User accounts
- `arguments` - Student submitted arguments
- `refutations` - AI-generated refutations
- `fallacies` - Detected logical fallacies
- `progress` - Learning progress tracking

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alt42_reasoning
REDIS_URL=redis://localhost:6379

# API Keys
CLAUDE_API_KEY=your_claude_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1h

# Service Ports
API_GATEWAY_PORT=8000
AI_SERVICE_PORT=8001
FRONTEND_PORT=3000

# Environment
NODE_ENV=development
```

## Development

### Running Tests
```bash
# Backend tests
cd backend/api-gateway
npm test

cd backend/ai-service
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## Deployment

### Docker Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Set production environment variables
3. Start services with process manager (PM2, systemd)

## Future Enhancements

- [ ] Moodle LTI integration
- [ ] Multi-language support (Korean, English)
- [ ] Voice input for arguments
- [ ] Collaborative argumentation (debate mode)
- [ ] Gamification (achievements, leaderboards)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Export learning reports

## License

MIT License

## Support

For issues and questions, please create an issue in the GitHub repository.

## Contributors

Built with ❤️ for educational excellence
