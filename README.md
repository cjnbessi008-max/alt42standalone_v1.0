# Quantifier Friends

An interactive educational web app that teaches logical quantifiers (universal "모든" and existential "어떤") through character-based explanations.

## Features

- 🎓 Character-based teaching of logical quantifiers
- 📱 Smartphone simulator interface (right-bottom corner)
- 🔗 Moodle LMS integration for problem sets
- 🎨 Interactive animations and visualizations
- 📊 Student progress tracking

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Styled Components / CSS Modules
- Smartphone UI simulator component

### Backend
- Node.js + Express
- PostgreSQL (database)
- REST API for Moodle integration

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Database models
│   │   └── services/    # Business logic
│   └── config/          # Configuration files
├── docs/              # Documentation
└── docker-compose.yml # Development environment

```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```

5. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Moodle Integration

The app receives problem information from Moodle LMS through REST API endpoints:

- `POST /api/problems` - Receive problem sets from Moodle
- `GET /api/problems/:id` - Get specific problem details
- `POST /api/submissions` - Submit student answers
- `GET /api/progress/:studentId` - Get student progress

## License

MIT
