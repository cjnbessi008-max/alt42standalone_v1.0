# DMN Rest Routine API

REST API service for managing and recommending Default Mode Network (DMN) rest routines for educational contexts.

## Features

- **REST API** for routine management and suggestions
- **Intelligent recommendation engine** based on problem complexity and student fatigue
- **Session tracking** for student progress monitoring
- **Analytics** for effectiveness measurement
- **PostgreSQL database** for data persistence
- **Docker support** for easy deployment

## Installation

### Using Docker (Recommended)

```bash
# From project root
docker-compose up -d dmn-api postgres
```

### Manual Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env

# Set up database
createdb dmn_rest_routines
psql dmn_rest_routines < src/db/schema.sql
psql dmn_rest_routines < src/db/seed.sql

# Build TypeScript
npm run build

# Start server
npm start
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### Health Check
```
GET /health
```

### DMN Routines

#### Get Suggestion
```
POST /api/dmn/suggest
Headers: X-API-Key: <your-api-key>
Body: {
  "student_id": "string",
  "module_id": "string",
  "problem_complexity": 1-5,
  "trigger_point": "before" | "after",
  "session_context": {
    "problems_attempted": number,
    "problems_correct": number,
    "active_time_minutes": number,
    "time_since_last_rest": number
  }
}
```

#### Record Completion
```
POST /api/dmn/complete
Headers: X-API-Key: <your-api-key>
Body: {
  "event_id": "uuid",
  "completed": boolean,
  "actual_duration_seconds": number,
  "student_feedback": 1-5
}
```

#### List Routines
```
GET /api/dmn/routines?active_only=true
Headers: X-API-Key: <your-api-key>
```

#### Get Analytics
```
GET /api/dmn/analytics?student_id=&start_date=&end_date=
Headers: X-API-Key: <your-api-key>
```

## Environment Variables

See `.env.example` for all available options.

Required:
- `API_KEY`: Secret key for API authentication
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection

## Database Schema

See `src/db/schema.sql` for complete schema.

Main tables:
- `dmn_routines`: Available rest routine activities
- `dmn_sessions`: Student session tracking
- `dmn_events`: Rest routine suggestion and completion events
- `dmn_analytics`: Aggregated effectiveness metrics

## Recommendation Algorithm

The engine calculates a fatigue score (0-1) based on:
- **Time on task** (40% weight): Longer sessions = higher fatigue
- **Error rate** (30% weight): More errors = higher fatigue
- **Time since last rest** (30% weight): Longer since rest = higher fatigue

Routine selection considers:
- Problem complexity level
- Calculated fatigue score
- Routine duration appropriateness
- Variety (avoids repeating recent routines)
- Trigger point (before vs. after)

## Security

- API key authentication required for all endpoints
- Rate limiting: 100 requests/minute
- CORS configured for allowed origins only
- Input validation on all requests
- Parameterized database queries to prevent SQL injection

## Performance

- Response time target: < 200ms (p95)
- Routine definitions cached for 5 minutes
- Database indexes on all foreign keys and query fields
- Connection pooling for database (max 20 connections)

## Logging

Logs are written to:
- Console: All levels based on LOG_LEVEL
- `logs/error.log`: Error level only
- `logs/combined.log`: All levels

Log levels: error, warn, info, debug

## Monitoring

Health check endpoint for monitoring:
```bash
curl http://localhost:3000/health
```

Docker health check configured automatically.

## License

MIT
