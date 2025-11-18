# ALT42 Standalone - Trap Shadow Feature

Web application that integrates with Moodle LMS to display quiz problems with trap points highlighted like shadows on a virtual smartphone screen.

## System Requirements

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Node.js**: 16+
- **npm**: 8+

## Architecture

```
┌─────────────────┐
│   Moodle LMS    │
│  (PHP + MySQL)  │
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Backend API    │
│  (Node.js)      │
└────────┬────────┘
         │ JSON
┌────────▼────────┐
│  Frontend App   │
│  (React + TS)   │
│  ┌───────────┐  │
│  │  Virtual  │  │
│  │   Phone   │  │
│  │  Screen   │  │
│  └───────────┘  │
└─────────────────┘
```

## Features

### Trap Shadow
- Displays quiz problems from Moodle
- Highlights trap points (common mistake areas) with shadow effect
- Virtual smartphone interface (right-bottom position)
- Real-time problem data from Moodle LMS

## Project Structure

```
alt42standalone_v1.0/
├── backend/          # Node.js + Express backend
├── frontend/         # React + TypeScript frontend
├── database/         # MySQL schema and scripts
├── docs/            # Documentation
└── tasks/           # Task tracking
```

## Setup

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure Moodle connection in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Database Setup
```bash
cd database
mysql -u root -p < schema.sql
```

## Environment Variables

### Backend (.env)
```
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_webservice_token
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=moodle
MYSQL_USER=moodle_user
MYSQL_PASSWORD=your_password
PORT=3001
```

## Development

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:3000`
- Virtual phone appears in bottom-right corner

## API Endpoints

### GET /api/quiz/:quizId
Fetch quiz problems with trap points

### GET /api/problem/:problemId
Get specific problem details with trap points

### POST /api/trap-points
Update trap point data

## License

MIT
