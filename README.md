# 3D Matching Guide

Educational web application for matching 3D objects with 2D shapes through touch/finger gestures.

## Features

- 📱 Virtual smartphone display interface
- 🎯 3D to 2D shape matching with finger gestures
- 🔗 LMS integration ready (Moodle compatible)
- 📊 Problem management and analytics
- 🌐 Korean/English language support

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL 15+
- **Caching**: Redis 7+
- **Deployment**: Docker

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start PostgreSQL and Redis:
```bash
docker-compose up -d
```

6. Run database migrations:
```bash
npm run db:migrate
```

7. Seed sample data (optional):
```bash
npm run db:seed
```

8. Start development servers:
```bash
npm run dev:full
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
alt42standalone_v1.0/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── db/               # Database utilities
│   └── index.js          # Server entry point
├── docs/                 # Documentation
└── tasks/                # Project tasks and PRD
```

## API Endpoints

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/problems` - Create new problem
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem

### Matching
- `POST /api/matching/submit` - Submit matching answer
- `GET /api/matching/progress/:studentId` - Get student progress

### LMS Integration
- `POST /api/lms/sync` - Sync with LMS (future)
- `GET /api/lms/problems/:moduleId` - Get problems from LMS

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
npm run db:migrate
```

## LMS Integration

This application is designed to integrate with Learning Management Systems like Moodle 3.7+ through:
- LTI (Learning Tools Interoperability) protocol
- REST API for problem synchronization
- OAuth 2.0 authentication

See [docs/LMS_INTEGRATION.md](docs/LMS_INTEGRATION.md) for details.

## License

MIT

## Support

For issues and questions, please contact KAIST Touch Math Academy.
