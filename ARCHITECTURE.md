# System Architecture

## Overview

The Concept Tree Moodle App is a full-stack web application that visualizes mathematical concepts as interactive tree structures. It integrates with Moodle LMS to fetch problem data and displays an interactive learning interface in a virtual smartphone UI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  Virtual Smartphone UI (Bottom Right)          │    │
│  │  - Problem Display                              │    │
│  │  - Interactive Number Badges                    │    │
│  │  - Concept Tree Visualization (SVG)             │    │
│  └────────────────────────────────────────────────┘    │
│          │                                              │
│          │ AJAX/Fetch API                               │
│          │                                              │
└──────────┼──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Express Server                      │
│  ┌────────────────────────────────────────────────┐    │
│  │              API Gateway                        │    │
│  │  - /api/concepts/:number                        │    │
│  │  - /api/problems/:id                            │    │
│  │  - /api/moodle/*                                │    │
│  │  - /api/concepts/track                          │    │
│  └────────────────────────────────────────────────┘    │
│          │                      │                       │
└──────────┼──────────────────────┼───────────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────┐   ┌──────────────────────┐
│  MySQL 5.7 Database │   │   Moodle 3.7 LMS     │
│  - concepts         │   │   (PHP 7.1.9)        │
│  - relationships    │   │   - Web Services API  │
│  - problems cache   │   │   - Course Data       │
│  - interactions     │   │   - Quiz/Problems     │
└─────────────────────┘   └──────────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI Framework | Vanilla JavaScript ES6+ | Lightweight, no dependencies |
| Styling | CSS3 with animations | Virtual smartphone UI, concept tree |
| Visualization | SVG (Scalable Vector Graphics) | Interactive tree rendering |
| API Communication | Fetch API | RESTful API calls |

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Server | Node.js + Express | HTTP server, API routing |
| Database Driver | mysql | MySQL 5.7 connection |
| Middleware | body-parser, cors | Request parsing, CORS |
| HTTP Client | axios | Moodle API integration |

### Database

| Component | Version | Purpose |
|-----------|---------|---------|
| MySQL | 5.7 | Primary data store |
| Character Set | utf8mb4 | Full Unicode support |
| Storage Engine | InnoDB | ACID compliance, foreign keys |

### External Integration

| System | Version | Protocol |
|--------|---------|----------|
| Moodle LMS | 3.7 | REST API (Web Services) |
| PHP | 7.1.9 | Moodle backend |

## Data Flow

### 1. Problem Loading Flow

```
User selects problem
       ↓
Frontend: loadProblem()
       ↓
API: GET /api/problems/:id
       ↓
Backend: moodleController.getProblem()
       ↓
Check MySQL cache
       ↓
If cached → Return from DB
If not → Fetch from Moodle API
       ↓
Extract numbers from problem text
       ↓
Return to frontend with numbers array
       ↓
Display problem + clickable number badges
```

### 2. Concept Tree Visualization Flow

```
User clicks number badge
       ↓
Frontend: showConceptTree(number)
       ↓
API: GET /api/concepts/:number?depth=3
       ↓
Backend: conceptController.getConceptTree()
       ↓
conceptService.buildConceptTree()
       ↓
Query DB: Get root concepts
       ↓
Recursively fetch child concepts
       ↓
Build tree structure with relationships
       ↓
Return JSON tree data
       ↓
Frontend: conceptTree.render(data)
       ↓
Calculate node positions (radial layout)
       ↓
Draw SVG branches (animated lines)
       ↓
Draw SVG nodes (circles + text)
       ↓
Apply animations (staggered appearance)
       ↓
Display interactive tree
```

### 3. Interaction Tracking Flow

```
User clicks number
       ↓
Frontend: trackInteraction(number)
       ↓
API: POST /api/concepts/track
       ↓
Backend: conceptController.trackInteraction()
       ↓
Insert into user_interactions table
       ↓
Record: userId, problemId, clickedNumber, sessionId, timestamp
       ↓
Return success
```

## Database Schema

### Core Tables

1. **concepts** - Stores mathematical concepts
   - Links numbers to concept names
   - Hierarchical levels
   - Descriptions

2. **concept_relationships** - Parent-child concept links
   - Defines tree structure
   - Relationship types (is-a, part-of, related-to)
   - Weight/strength of relationships

3. **moodle_problems** - Cached problem data
   - Problem text from Moodle
   - Course and problem IDs
   - Tags and difficulty

4. **problem_concepts** - Links problems to concepts
   - Maps which concepts apply to which problems
   - Relevance scores

5. **user_interactions** - Analytics and tracking
   - User behavior data
   - Click tracking
   - Session management

## API Endpoints

### Concept Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/concepts` | Get all concepts |
| GET | `/api/concepts/:number` | Get concept tree for number |
| POST | `/api/concepts/track` | Track user interaction |

### Problem Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems/:id` | Get problem by ID |

### Moodle Integration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moodle/test` | Test Moodle connection |
| GET | `/api/moodle/courses/:userId` | Get user's courses |
| GET | `/api/moodle/course/:courseId/contents` | Get course contents |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Serve frontend app |

## Frontend Architecture

### Component Structure

```
public/
├── index.html          # Main HTML structure
├── css/
│   ├── style.css       # General styles
│   ├── smartphone.css  # Virtual phone UI
│   └── concept-tree.css # Tree visualization styles
└── js/
    ├── api.js          # API communication layer
    ├── concept-tree.js # Tree rendering engine
    └── app.js          # Main application logic
```

### Key Frontend Classes

1. **API Class** (`api.js`)
   - Handles all HTTP requests
   - Error handling
   - Response parsing

2. **ConceptTree Class** (`concept-tree.js`)
   - SVG rendering
   - Layout calculation (radial tree)
   - Animations
   - Node interactions

3. **App Functions** (`app.js`)
   - Application initialization
   - Event handling
   - State management
   - UI updates

## Backend Architecture

### Directory Structure

```
backend/
├── config/
│   └── database.js      # MySQL connection pool
├── services/
│   ├── moodleService.js # Moodle API integration
│   └── conceptService.js # Concept business logic
├── controllers/
│   ├── conceptController.js # Concept HTTP handlers
│   └── moodleController.js  # Moodle HTTP handlers
└── routes/
    └── api.js           # API route definitions
```

### Service Layer Pattern

- **Services**: Business logic, database queries
- **Controllers**: HTTP request/response handling
- **Routes**: URL mapping to controllers

## Security Considerations

1. **Environment Variables**: Sensitive data in `.env`
2. **SQL Injection Prevention**: Parameterized queries
3. **CORS**: Configured for controlled access
4. **Input Validation**: Server-side validation
5. **Error Handling**: No sensitive data in errors

## Performance Optimizations

1. **Database**:
   - Indexes on frequently queried columns
   - Connection pooling
   - Query result caching

2. **Frontend**:
   - Minimal dependencies
   - CSS animations (GPU accelerated)
   - Event delegation
   - Debounced interactions

3. **API**:
   - RESTful design
   - Efficient JSON responses
   - Proper HTTP status codes

## Scalability

### Current Limitations
- Single server
- No load balancing
- No caching layer (Redis)
- Synchronous request handling

### Future Improvements
- Add Redis for caching
- Implement WebSocket for real-time updates
- Horizontal scaling with load balancer
- CDN for static assets
- Database replication

## Monitoring & Logging

### Current Implementation
- Console logging
- Error tracking in console
- Database connection status

### Recommended Additions
- Winston or Bunyan for structured logging
- PM2 for process management
- Application performance monitoring (APM)
- Database query performance tracking

## Deployment Architecture

### Development
```
localhost:3000 → Node.js → MySQL (local)
                        → Moodle (remote)
```

### Production (Recommended)
```
Internet
   ↓
Nginx (Reverse Proxy + SSL)
   ↓
PM2 → Node.js (multiple instances)
   ↓
MySQL (Production DB)
   ↓
Moodle LMS
```

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 13+ | Full support |
| Edge | 80+ | Full support |
| Mobile browsers | Modern | Responsive design |

## Future Architecture Enhancements

1. **Microservices**: Split into separate services
2. **GraphQL**: Replace REST API
3. **React/Vue**: Component-based frontend
4. **TypeScript**: Type safety
5. **Docker**: Containerization
6. **Kubernetes**: Orchestration
7. **Message Queue**: Async processing
8. **Analytics**: Advanced user behavior tracking
