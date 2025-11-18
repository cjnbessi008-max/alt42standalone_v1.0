# DMN Rest Routine System for Moodle LMS

A comprehensive system that integrates with Moodle LMS to automatically suggest Default Mode Network (DMN) rest routines before and after students work on problems, optimizing learning through strategic brain breaks.

## Overview

This project provides:
- **REST API** (Node.js/TypeScript) for managing and recommending rest routines
- **PostgreSQL database** for tracking routines, sessions, and analytics
- **Moodle plugin** (PHP) that integrates with quiz activities
- **Intelligent recommendation engine** that suggests optimal rest activities based on problem complexity and student fatigue

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Moodle LMS (3.7+)                          │
│  - PHP 7.1.9, MySQL 5.7                                 │
│  - DMN Rest Routine Plugin                              │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP REST API
┌───────────────────▼─────────────────────────────────────┐
│         DMN Rest Routine API (Node.js)                  │
│  - Express.js REST endpoints                            │
│  - Recommendation engine                                │
│  - Session tracking                                     │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│         PostgreSQL Database                             │
│  - Rest routines library                                │
│  - Student sessions                                     │
│  - Analytics and effectiveness tracking                 │
└─────────────────────────────────────────────────────────┘
```

## Features

### For Students
- **Automatic rest suggestions** before and after problems
- **Guided rest routines** with step-by-step instructions
- **Variety of activities**: breathing, visualization, physical movement, mindfulness
- **Adaptive timing** based on problem complexity and fatigue
- **Optional feedback** to rate routine helpfulness

### For Teachers/Administrators
- **Configurable trigger strategies**: every problem, complex only, interval-based, fatigue-based
- **Analytics dashboard**: completion rates, effectiveness metrics
- **Customizable settings**: minimum intervals, skip permissions, complexity thresholds

### For the System
- **Intelligent recommendations** using fatigue scoring algorithm
- **Performance tracking** to optimize routine effectiveness
- **API-first design** for easy integration with other LMS platforms

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Moodle 3.4+ installation (tested with 3.7)
- Node.js 18+ (if running without Docker)
- PostgreSQL 15+ (if running without Docker)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2. Start the Backend API with Docker
```bash
# Copy environment file
cp backend/dmn-api/.env.example backend/dmn-api/.env

# Edit .env and set your configuration
nano backend/dmn-api/.env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f dmn-api
```

The API will be available at `http://localhost:3000`

#### 3. Install the Moodle Plugin
```bash
# Copy plugin to Moodle
cp -r moodle-plugin/local/dmnrest /path/to/moodle/local/

# Visit Moodle admin notifications to complete installation
# Navigate to: Site Administration > Notifications
```

#### 4. Configure the Moodle Plugin
1. Go to **Site Administration > Plugins > Local plugins > DMN Rest Routines**
2. Configure settings:
   - **Enable DMN rest routines**: Yes
   - **API endpoint**: `http://localhost:3000/api/dmn` (or your server URL)
   - **API key**: (copy from your `.env` file)
   - **Trigger strategy**: Fatigue-based (recommended)
   - **Allow students to skip**: Yes (recommended)
   - **Minimum rest interval**: 10 minutes

### Verify Installation

1. **Test API health:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

2. **Test API endpoint (with authentication):**
```bash
curl -X GET http://localhost:3000/api/dmn/routines?active_only=true \
  -H "X-API-Key: your-api-key-here"
```

3. **Test in Moodle:**
   - Create a quiz in Moodle
   - Start a quiz attempt as a student
   - You should see a rest routine suggestion before the first question

## Configuration

### Environment Variables

Edit `backend/dmn-api/.env`:

```bash
# Server
NODE_ENV=production
PORT=3000
API_KEY=your-secure-api-key-change-this

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dmn_rest_routines
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://moodle.example.com,https://moodle.example.com
```

### Moodle Plugin Settings

All settings are configurable via Moodle admin interface:

- **Trigger Strategies:**
  - **Every problem**: Show before each question
  - **Complex only**: Only for problems with complexity ≥ threshold
  - **Every N problems**: After every 5 problems (configurable)
  - **Fatigue-based**: AI-driven based on time, errors, and rest intervals (recommended)

## API Documentation

### Endpoints

#### POST /api/dmn/suggest
Get a rest routine suggestion.

**Request:**
```json
{
  "student_id": "12345",
  "module_id": "course-module-67",
  "problem_id": "question-890",
  "problem_complexity": 3,
  "trigger_point": "before",
  "session_context": {
    "problems_attempted": 5,
    "problems_correct": 3,
    "active_time_minutes": 15,
    "time_since_last_rest": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "routine": {
    "id": "uuid",
    "name": "Deep Breathing Exercise",
    "description": "Simple breathing to reset focus",
    "duration_seconds": 60,
    "type": "breathing",
    "instructions": {
      "steps": ["...", "..."]
    }
  },
  "trigger_reason": "problem_complexity_high",
  "session_id": "uuid",
  "event_id": "uuid"
}
```

#### POST /api/dmn/complete
Record routine completion.

**Request:**
```json
{
  "event_id": "uuid",
  "completed": true,
  "actual_duration_seconds": 65,
  "student_feedback": 4
}
```

#### GET /api/dmn/routines
List all available routines.

#### GET /api/dmn/analytics
Get effectiveness analytics.

Full API documentation: [docs/dmn-rest-routine-architecture.md](docs/dmn-rest-routine-architecture.md)

## Development

### Running Locally (without Docker)

#### Backend API
```bash
cd backend/dmn-api

# Install dependencies
npm install

# Set up database
createdb dmn_rest_routines
psql dmn_rest_routines < src/db/schema.sql
psql dmn_rest_routines < src/db/seed.sql

# Run development server
npm run dev
```

#### Database Migrations
```bash
# Apply schema
npm run migrate

# Seed data
npm run seed
```

### Testing
```bash
cd backend/dmn-api
npm test
```

### Building for Production
```bash
cd backend/dmn-api
npm run build
npm start
```

## Project Structure

```
alt42standalone_v1.0/
├── backend/
│   └── dmn-api/              # Node.js REST API
│       ├── src/
│       │   ├── index.ts      # Entry point
│       │   ├── routes/       # API routes
│       │   ├── services/     # Business logic
│       │   ├── middleware/   # Auth, logging, etc.
│       │   ├── db/           # Database connection & schema
│       │   └── utils/        # Utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
├── moodle-plugin/
│   └── local/dmnrest/        # Moodle plugin
│       ├── version.php       # Plugin metadata
│       ├── lib.php           # Core functions
│       ├── settings.php      # Admin settings
│       ├── classes/          # PHP classes
│       │   ├── api_client.php
│       │   └── observer.php  # Event handlers
│       ├── db/
│       │   └── events.php    # Event observers
│       ├── lang/             # Language strings
│       │   ├── en/
│       │   └── ko/
│       ├── amd/src/          # JavaScript
│       │   └── routine.js
│       └── ajax/
│           └── complete.php
├── docs/
│   └── dmn-rest-routine-architecture.md
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
└── README.md
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Native pg driver
- **Validation**: Joi
- **Logging**: Winston

### Moodle Plugin
- **Language**: PHP 7.1+
- **Compatible with**: Moodle 3.4+
- **JavaScript**: AMD modules
- **AJAX**: Moodle AJAX framework

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx

## Monitoring & Analytics

The system tracks:
- **Completion rates**: % of suggested routines completed
- **Effectiveness**: Problem accuracy improvement after rest
- **Student satisfaction**: Average feedback ratings
- **Usage patterns**: Most effective routines, optimal durations

Access analytics via the API:
```bash
curl -X GET "http://localhost:3000/api/dmn/analytics?start_date=2025-01-01" \
  -H "X-API-Key: your-api-key"
```

## Troubleshooting

### API not responding
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs dmn-api

# Restart services
docker-compose restart dmn-api
```

### Database connection issues
```bash
# Check PostgreSQL
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U postgres -d dmn_rest_routines
```

### Moodle plugin not showing routines
1. Check plugin is enabled in Moodle settings
2. Verify API endpoint URL is correct
3. Verify API key matches between Moodle and backend
4. Check browser console for JavaScript errors
5. Enable debugging in Moodle to see PHP errors

## Security

- **API Authentication**: All API endpoints require API key
- **Rate Limiting**: 100 requests/minute per Moodle instance
- **CORS**: Whitelist only allowed Moodle domains
- **Data Privacy**: Student IDs are not stored; all data is anonymized
- **SQL Injection**: Protected via parameterized queries
- **XSS**: All output is properly escaped

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: See `docs/` directory
- Email: support@example.com

## Acknowledgments

- Built for KAIST Touch Math Academy
- Part of the AI Education System Pipeline project
- Inspired by cognitive science research on Default Mode Network and learning optimization

## Version History

- **1.0.0** (2025-11-18): Initial release
  - REST API with recommendation engine
  - Moodle plugin for quiz integration
  - 10 pre-configured rest routines
  - Analytics and effectiveness tracking
