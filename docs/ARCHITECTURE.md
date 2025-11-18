# ALT42 Expansion Mode - Architecture Documentation

## System Overview

ALT42 Expansion Mode is a standalone web application that integrates with Moodle LMS to provide an interactive learning experience with a unique "expansion" mechanism.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            React Frontend (Port 3000)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ StatusBar  │  │ ControlPanel│  │ Smartphone │    │  │
│  │  │ Component  │  │  Component  │  │   Screen   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │                                                       │  │
│  │               API Service (Axios)                    │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP/REST
                          │
┌─────────────────────────▼───────────────────────────────────┐
│           Node.js Backend (Express, Port 3001)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Gateway                         │  │
│  │  ┌─────────────┐              ┌─────────────┐       │  │
│  │  │   Moodle    │              │  Expansion  │       │  │
│  │  │   Routes    │              │   Routes    │       │  │
│  │  └──────┬──────┘              └─────────────┘       │  │
│  │         │                                            │  │
│  │  ┌──────▼────────────────┐                          │  │
│  │  │   Moodle Service      │                          │  │
│  │  │  (API Integration)    │                          │  │
│  │  └──────┬────────────────┘                          │  │
│  └─────────┼───────────────────────────────────────────┘  │
└────────────┼───────────────────────────────────────────────┘
             │ REST API
             │
┌────────────▼───────────────────────────────────────────────┐
│              Moodle LMS (External)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Web Services API (MySQL 5.7, PHP 7.1.9)          │  │
│  │    - mod_quiz_get_quiz_questions                     │  │
│  │    - core_question_get_question_data                 │  │
│  │    - mod_quiz_process_attempt                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (React)

#### 1. App.js (Main Container)
- **Responsibilities**:
  - State management for entire application
  - Orchestrates communication between components
  - Manages expansion mode logic
  - Handles question loading and progression

- **Key State**:
  - `expansionMode`: Current mode (time-based, progress-based, hybrid)
  - `isActive`: Whether expansion is active
  - `currentSize`: Current smartphone screen size
  - `progress`: Learning progress percentage
  - `questions`: Array of questions from Moodle

#### 2. SmartphoneScreen Component
- **Responsibilities**:
  - Renders virtual smartphone interface
  - Displays questions and answer inputs
  - Handles answer submission
  - Animates size changes

- **Props**:
  - `size`: Current screen size
  - `isActive`: Expansion active state
  - `question`: Current question object
  - `onAnswerSubmit`: Callback for answer submission
  - `progress`: Current progress percentage

#### 3. ControlPanel Component
- **Responsibilities**:
  - Mode selection interface
  - Start/stop/reset controls
  - Configuration display
  - User instructions

- **Props**:
  - `isActive`: Current active state
  - `expansionMode`: Selected mode
  - `onModeChange`: Mode change callback
  - `onStart/onStop/onReset`: Control callbacks
  - `config`: Expansion configuration

#### 4. StatusBar Component
- **Responsibilities**:
  - Real-time status display
  - Elapsed time tracking
  - Progress visualization
  - Screen size indicators

- **Props**:
  - `isActive`: Active state
  - `progress`: Learning progress
  - `currentSize`: Current screen size
  - `maxSize`: Maximum screen size
  - `mode`: Current expansion mode

#### 5. API Service
- **Responsibilities**:
  - HTTP communication with backend
  - Request/response handling
  - Error handling
  - Data transformation

- **Methods**:
  - `getExpansionConfig()`
  - `calculateExpansion(params)`
  - `getQuestions(quizId)`
  - `submitAnswer(questionId, answer, userId)`

### Backend (Node.js/Express)

#### 1. Server (server.js)
- **Responsibilities**:
  - Initialize Express application
  - Configure middleware
  - Route registration
  - Error handling

#### 2. Moodle Routes (/api/moodle)
- **Endpoints**:
  - `GET /questions/:quizId` - Get quiz questions
  - `GET /question/:questionId` - Get question details
  - `POST /submit` - Submit answer
  - `GET /progress/:userId/:quizId` - Get user progress
  - `GET /test` - Test connection

#### 3. Expansion Routes (/api/expansion)
- **Endpoints**:
  - `GET /config` - Get expansion configuration
  - `POST /calculate` - Calculate current expansion
  - `GET /stats` - Get expansion statistics

#### 4. Moodle Service
- **Responsibilities**:
  - Moodle API integration
  - Mock data generation (when Moodle unavailable)
  - Response transformation

- **Methods**:
  - `callMoodleAPI(wsfunction, params)`
  - `getQuizQuestions(quizId)`
  - `getQuestionDetails(questionId)`
  - `submitAnswer(questionId, answer, userId)`
  - `getUserProgress(userId, quizId)`
  - `testConnection()`

## Data Flow

### Expansion Mode Flow

1. **Initialization**:
   ```
   User -> ControlPanel -> App.js
   App.js -> API Service -> Backend /expansion/config
   Backend -> App.js -> setState(config)
   ```

2. **Start Expansion**:
   ```
   User clicks "Start" -> onStart()
   App.js -> setIsActive(true), setStartTime(now)
   App.js -> Start interval (100ms)
   ```

3. **Expansion Update Loop**:
   ```
   Interval -> updateExpansion()
   App.js -> API Service -> /expansion/calculate
   Backend calculates size based on mode
   Backend -> App.js -> setState(currentSize)
   App.js -> SmartphoneScreen (re-render with new size)
   ```

### Question Flow

1. **Load Questions**:
   ```
   App.js (mount) -> loadQuestions()
   API Service -> /moodle/questions/1
   Backend -> Moodle Service -> Moodle API
   Moodle -> Backend -> Frontend
   App.js -> setState(questions)
   SmartphoneScreen -> Display first question
   ```

2. **Submit Answer**:
   ```
   User types answer -> SmartphoneScreen
   User clicks "Submit" -> onAnswerSubmit(answer)
   App.js -> API Service -> /moodle/submit
   Backend -> Moodle Service -> Moodle API
   Moodle evaluates answer
   Backend -> Frontend (result)
   If correct: update progress
   Move to next question
   ```

## Expansion Mode Algorithms

### Time-Based Mode
```javascript
elapsed = currentTime - startTime
expansionFactor = min(elapsed / duration, 1)
currentSize = startSize + (endSize - startSize) * easedFactor
```

### Progress-Based Mode
```javascript
expansionFactor = min(progressPercentage / 100, 1)
currentSize = startSize + (endSize - startSize) * easedFactor
```

### Hybrid Mode
```javascript
timeFactor = min(elapsed / duration, 1)
progressFactor = min(progressPercentage / 100, 1)
expansionFactor = (timeFactor + progressFactor) / 2
currentSize = startSize + (endSize - startSize) * easedFactor
```

### Easing Function
```javascript
// Cubic ease-in-out for smooth animation
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
```

## Security Considerations

### Backend
- **CORS**: Configured to accept requests from frontend origin
- **Input Validation**: All user inputs validated before processing
- **Error Handling**: Sensitive information not exposed in error messages
- **Token Security**: Moodle token stored in environment variables

### Frontend
- **XSS Prevention**: React automatically escapes values
- **API Key Protection**: No sensitive keys in frontend code
- **HTTPS**: Should be enforced in production

## Performance Optimization

### Frontend
- **React.StrictMode**: Development-time checks
- **Component Optimization**: Minimal re-renders
- **CSS Animations**: GPU-accelerated transforms
- **Debouncing**: Expansion calculations throttled to 100ms

### Backend
- **Response Caching**: Consider implementing for static configuration
- **Connection Pooling**: For Moodle API calls
- **Error Recovery**: Automatic retry with exponential backoff

## Deployment Considerations

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Proxy configured in frontend package.json

### Production
- Build frontend: `npm run build:frontend`
- Serve static files through Express
- Use environment variables for configuration
- Enable production mode: `NODE_ENV=production`

## Monitoring and Logging

### Backend Logs
- Request logging middleware
- Error logging
- Moodle API call logging

### Frontend
- Console errors in development
- Consider integrating error tracking service

## Future Enhancements

1. **WebSocket Integration**: Real-time updates
2. **Persistence**: Save progress to database
3. **Analytics**: Track user behavior and performance
4. **Authentication**: User login system
5. **Multiple Quizzes**: Support for multiple quiz selection
6. **Customization**: User-configurable themes and settings
7. **Mobile App**: Native mobile application
8. **Offline Mode**: Work without internet connection

## Technology Versions

- **Node.js**: 14.x or higher
- **React**: 18.2.0
- **Express**: 4.18.2
- **Moodle**: 3.7 or higher
- **MySQL**: 5.7 (Moodle database)
- **PHP**: 7.1.9 (Moodle)

## API Documentation

See README.md for complete API endpoint documentation.

---

Last Updated: 2025-11-18
