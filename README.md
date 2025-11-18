# Math Calculation Error Detection System

An intelligent web application that automatically detects and provides feedback on mathematical calculation errors for educational purposes.

## Features

- **Real-time Error Detection**: Instantly validates student answers and identifies calculation mistakes
- **Intelligent Feedback**: AI-powered explanations for errors using Claude API
- **Multiple Problem Types**: Supports fractions, arithmetic, and more
- **Progress Tracking**: Monitor student performance and error patterns
- **Teacher Dashboard**: Analytics and insights on common student errors
- **Standalone Web App**: No LMS integration required

## Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Claude AI (Anthropic)

### Frontend
- React 18
- TypeScript
- Material-UI
- Vite

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Environment Setup

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

#### Using Docker
```bash
docker-compose up -d postgres
```

#### Manual Setup
```bash
createdb math_error_detection
psql math_error_detection < database/migrations/001_initial_schema.sql
```

### 4. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 5. Run the Application

#### Using Docker Compose (Recommended)
```bash
docker-compose up
```

#### Manual
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
alt42standalone_v1.0/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── vite.config.ts
├── database/                # Database migrations
│   └── migrations/
├── docker-compose.yml
└── README.md
```

## API Documentation

### Endpoints

#### Problems
- `GET /api/v1/problems` - List all problems
- `GET /api/v1/problems/:id` - Get specific problem
- `POST /api/v1/problems` - Create new problem (teacher only)

#### Submissions
- `POST /api/v1/problems/:id/submit` - Submit answer for validation
- `GET /api/v1/submissions/:id` - Get submission details

#### Students
- `GET /api/v1/students/:id/progress` - Get student progress
- `GET /api/v1/students/:id/errors` - Get error patterns

#### Analytics (Teacher)
- `GET /api/v1/analytics/errors` - Common error patterns
- `GET /api/v1/analytics/performance` - Class performance metrics

## Features in Detail

### Calculation Error Detection

The system uses a multi-layer approach:

1. **Rule-based Validation**: Fast checks for common errors
   - Division by zero
   - Invalid fraction formats
   - Out-of-range values

2. **Mathematical Verification**: Validates correctness
   - Compares student answer with correct solution
   - Checks equivalent forms (e.g., 2/4 = 1/2)

3. **AI-Powered Feedback**: Contextual explanations
   - Identifies type of error (conceptual vs. arithmetic)
   - Provides step-by-step correction
   - Suggests learning resources

### Supported Problem Types

- **Fractions**: Addition, subtraction, multiplication, division, simplification
- **Arithmetic**: Basic operations with integers and decimals
- (More types to be added)

## Development

### Run Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

MIT

## Support

For questions or issues, please contact the KAIST Touch Math Academy team.
