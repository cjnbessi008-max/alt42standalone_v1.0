# Triple Light Stats Display - Architecture Document

## Overview

Triple Light is a web-based statistics visualization system that displays mean, median, and mode values using three colored lights. It integrates with Moodle LMS to retrieve quiz/problem data and displays real-time statistics in a virtual smartphone interface.

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Moodle LMS    │────────▶│  Backend API     │────────▶│   Frontend      │
│   (MySQL 5.7)   │         │  (Node.js)       │         │   (React)       │
│                 │         │                  │         │                 │
│ - Quiz data     │         │ - Data fetching  │         │ - Smartphone UI │
│ - Attempts      │         │ - Stats calc     │         │ - Triple Light  │
│ - Grades        │         │ - REST API       │         │ - Animations    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: CSS3 with animations
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database Client**: mysql2
- **Environment**: dotenv
- **CORS**: cors middleware

### Database
- **Database**: MySQL 5.7 (existing Moodle database)
- **Access**: Read-only queries
- **Tables Used**:
  - `mdl_quiz` - Quiz definitions
  - `mdl_quiz_attempts` - Student attempts
  - `mdl_quiz_grades` - Final grades
  - `mdl_question` - Question data

## Directory Structure

```
triple-light-stats/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SmartphoneFrame.tsx    # Virtual phone UI
│   │   │   ├── TripleLight.tsx        # 3-color light display
│   │   │   ├── StatsDisplay.tsx       # Numeric stats
│   │   │   └── QuizSelector.tsx       # Quiz selection
│   │   ├── services/
│   │   │   └── api.ts                 # API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript types
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── statsController.js     # API endpoints
│   │   ├── services/
│   │   │   ├── moodleService.js       # Moodle DB queries
│   │   │   └── statsService.js        # Statistics calculations
│   │   ├── config/
│   │   │   └── database.js            # MySQL connection
│   │   ├── middleware/
│   │   │   └── errorHandler.js        # Error handling
│   │   └── server.js                  # Express app
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── triple-light-architecture.md   # This file
│   └── api-specification.md           # API docs
└── README.md
```

## Component Design

### Frontend Components

#### 1. SmartphoneFrame
- Renders a 3D smartphone bezel
- Positioned at bottom-right of screen
- Responsive sizing
- Contains Triple Light display

#### 2. TripleLight
- Three circular lights in vertical arrangement
- Color coding:
  - Top: Red (Mean/Average)
  - Middle: Green (Median)
  - Bottom: Blue (Mode)
- Brightness intensity based on value (0-100 scale)
- Glow effects using CSS box-shadow
- Smooth transitions on value changes

#### 3. StatsDisplay
- Numeric display of statistics
- Labels for each metric
- Value formatting (1-2 decimal places)
- Count of data points

#### 4. QuizSelector
- Dropdown to select Moodle quiz
- Auto-refresh on selection change
- Shows quiz name and attempt count

### Backend Services

#### 1. MoodleService
```javascript
class MoodleService {
  async getQuizList()           // Fetch available quizzes
  async getQuizAttempts(quizId) // Get all attempts for a quiz
  async getQuizGrades(quizId)   // Get final grades
}
```

#### 2. StatsService
```javascript
class StatsService {
  calculateMean(values)    // Average
  calculateMedian(values)  // Middle value
  calculateMode(values)    // Most frequent
  normalizeToScale(value, min, max) // 0-100 scale
}
```

## API Specification

### GET /api/quizzes
Returns list of available quizzes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Week 1 Math Quiz",
      "attemptCount": 45
    }
  ]
}
```

### GET /api/stats/:quizId
Returns statistics for a specific quiz.

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": 1,
    "quizName": "Week 1 Math Quiz",
    "statistics": {
      "mean": 75.4,
      "median": 78.0,
      "mode": 82.0,
      "count": 45,
      "min": 42.0,
      "max": 98.0
    },
    "normalized": {
      "mean": 59.6,
      "median": 64.3,
      "mode": 71.4
    }
  }
}
```

## Statistics Calculation

### Mean (Average)
```
mean = (sum of all grades) / (number of grades)
```

### Median (Middle Value)
1. Sort grades in ascending order
2. If odd count: middle value
3. If even count: average of two middle values

### Mode (Most Frequent)
1. Count frequency of each grade
2. Return most frequent value
3. If multiple modes: return highest value
4. If no mode: return median

### Normalization
Convert raw scores to 0-100 brightness scale:
```
normalized = ((value - min) / (max - min)) * 100
```

## UI Layout

```
┌─────────────────────────────────────────┐
│  Main Application Area                  │
│                                          │
│  ┌────────────────┐                     │
│  │ Quiz Selector  │                     │
│  └────────────────┘                     │
│                                          │
│                              ┌──────────┐│
│                              │ 📱       ││
│                              │┌────────┐││
│                              ││  🔴    │││  ← Mean (Red)
│                              ││  75.4  │││
│                              ││        │││
│                              ││  🟢    │││  ← Median (Green)
│                              ││  78.0  │││
│                              ││        │││
│                              ││  🔵    │││  ← Mode (Blue)
│                              ││  82.0  │││
│                              │└────────┘││
│                              └──────────┘│
└─────────────────────────────────────────┘
```

## Data Flow

1. User selects quiz from dropdown
2. Frontend sends GET request to `/api/stats/:quizId`
3. Backend queries Moodle MySQL database
4. Backend calculates mean, median, mode
5. Backend normalizes values to 0-100 scale
6. Backend returns JSON response
7. Frontend updates Triple Light display
8. CSS animations show brightness changes

## Security Considerations

- **Database Access**: Read-only MySQL user
- **CORS**: Whitelist specific origins
- **Input Validation**: Sanitize quiz IDs
- **Error Handling**: Never expose database errors
- **Rate Limiting**: Prevent API abuse
- **Environment Variables**: Store credentials securely

## Deployment Options

### Option 1: Standalone Deployment
- Frontend: Nginx static hosting
- Backend: Node.js process (PM2)
- Reverse proxy: Nginx

### Option 2: Docker Deployment
- Frontend container (Nginx)
- Backend container (Node.js)
- Docker Compose orchestration

### Option 3: Moodle Plugin Integration
- Embed as Moodle block
- Use Moodle's authentication
- Access DB via Moodle APIs

## Performance Optimization

- **Caching**: Redis for frequently accessed stats
- **Debouncing**: Limit API calls on quiz selection
- **Database Indexing**: Ensure quiz_id indexes exist
- **Lazy Loading**: Load components on demand
- **Compression**: Gzip for API responses

## Future Enhancements

1. **Real-time Updates**: WebSocket for live statistics
2. **Historical Trends**: Chart showing stats over time
3. **Customizable Colors**: User-defined color schemes
4. **Multiple Metrics**: Add range, std deviation
5. **Accessibility**: Screen reader support, keyboard navigation
6. **Mobile App**: Native iOS/Android versions

## Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_readonly
DB_PASSWORD=secure_password

# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

## Testing Strategy

### Unit Tests
- Statistics calculation functions
- Data normalization logic
- Component rendering

### Integration Tests
- API endpoint responses
- Database query results
- Frontend-backend communication

### E2E Tests
- Quiz selection workflow
- Stats display updates
- Error handling scenarios

## Monitoring

- **Logging**: Winston for structured logs
- **Metrics**: Response times, error rates
- **Alerts**: Database connection failures
- **Analytics**: Most viewed quizzes

## Support & Maintenance

- **Documentation**: Keep this file updated
- **Versioning**: Semantic versioning (semver)
- **Changelog**: Track all changes
- **Backup**: Regular database backups
- **Updates**: Keep dependencies current

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Author**: AI Education System Team
