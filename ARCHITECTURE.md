# Moodle LMS Correlation Analysis System Architecture

## System Overview
독립형 웹 애플리케이션으로 Moodle LMS와 연동하여 학생의 정답률과 사고 강도(추론 밀도) 간의 상관관계를 분석하는 시스템입니다.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MySQL 5.7
- **ORM**: SQLAlchemy 2.0
- **API Client**: httpx (for Moodle API)
- **Statistical Analysis**: scipy, numpy, pandas, scikit-learn
- **Task Queue**: Celery + Redis (optional)

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts + Plotly.js
- **State Management**: React Query + Zustand
- **HTTP Client**: Axios

### Infrastructure
- **Web Server**: Uvicorn (ASGI)
- **Reverse Proxy**: Nginx (production)
- **Database**: MySQL 5.7
- **Cache**: Redis (optional)
- **Containerization**: Docker + Docker Compose

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │ Correlation  │  │   Reports    │      │
│  │   Component  │  │ Visualization│  │   Generator  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (FastAPI Routes)              │   │
│  └────┬────────────────┬──────────────────┬────────────┘   │
│       │                │                  │                 │
│  ┌────▼─────┐    ┌────▼─────┐      ┌────▼─────┐          │
│  │ Moodle   │    │Reasoning │      │Statistical│          │
│  │Integration│    │ Density  │      │ Analysis │          │
│  │  Service │    │  Engine  │      │  Engine  │          │
│  └────┬─────┘    └────┬─────┘      └────┬─────┘          │
│       │               │                  │                 │
│  ┌────▼───────────────▼──────────────────▼─────┐          │
│  │         Data Access Layer (SQLAlchemy)      │          │
│  └────────────────────┬────────────────────────┘          │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    MySQL 5.7 Database                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Moodle   │  │ Reasoning  │  │Correlation │        │
│  │    Data    │  │   Metrics  │  │  Analysis  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                        ▲
┌───────────────────────┼─────────────────────────────────┐
│                  Moodle LMS 3.7                          │
│              (External System - API)                     │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Moodle Integration Service
**Responsibilities:**
- Authenticate with Moodle API
- Fetch course, student, quiz, and assignment data
- Sync student performance data
- Handle rate limiting and error recovery

**Key Functions:**
- `connect_to_moodle()` - Establish API connection
- `fetch_courses()` - Retrieve course list
- `fetch_students(course_id)` - Get enrolled students
- `fetch_quiz_attempts(quiz_id)` - Get quiz attempt data
- `sync_student_data()` - Periodic data synchronization

### 2. Reasoning Density Engine
**Responsibilities:**
- Calculate thinking intensity scores
- Track student interaction patterns
- Analyze problem-solving behaviors
- Generate cognitive load metrics

**Calculation Formula:**
```python
reasoning_density_score = (
    0.30 * time_density_score +
    0.25 * attempt_intensity_score +
    0.20 * cognitive_load_score +
    0.15 * complexity_coefficient +
    0.10 * solution_path_score
)
```

**Metrics:**
- **Time Density**: Normalized time spent per problem
- **Attempt Intensity**: Number of tries before correct answer
- **Cognitive Load**: Hint requests, pauses, revisions
- **Complexity Coefficient**: Problem difficulty level (1-5)
- **Solution Path**: Number of steps taken

### 3. Statistical Correlation Analysis Engine
**Responsibilities:**
- Calculate correlation coefficients
- Perform regression analysis
- Test statistical significance
- Generate visualizations

**Analysis Types:**
- **Pearson Correlation**: Linear relationships
- **Spearman Correlation**: Monotonic relationships
- **Linear Regression**: Predictive modeling
- **Multiple Regression**: Multi-variable analysis

**Output:**
- Correlation coefficient (r)
- p-value (significance)
- R-squared (explained variance)
- Confidence intervals
- Scatter plots with trend lines

### 4. API Layer (FastAPI Routes)

**Moodle Integration Endpoints:**
```
POST   /api/v1/moodle/connect          - Connect to Moodle instance
GET    /api/v1/moodle/courses           - List available courses
GET    /api/v1/moodle/courses/{id}/students - Get course students
POST   /api/v1/moodle/sync              - Trigger data sync
GET    /api/v1/moodle/quizzes/{id}      - Get quiz details
```

**Reasoning Density Endpoints:**
```
POST   /api/v1/reasoning/calculate      - Calculate density scores
GET    /api/v1/reasoning/student/{id}   - Get student density metrics
GET    /api/v1/reasoning/quiz/{id}      - Get quiz-level metrics
GET    /api/v1/reasoning/trends         - Get temporal trends
```

**Correlation Analysis Endpoints:**
```
POST   /api/v1/correlation/analyze      - Run correlation analysis
GET    /api/v1/correlation/results/{id} - Get analysis results
GET    /api/v1/correlation/visualize/{id} - Get visualization data
GET    /api/v1/correlation/report/{id}  - Generate PDF report
```

**Dashboard Endpoints:**
```
GET    /api/v1/dashboard/overview/{course_id} - Course overview
GET    /api/v1/dashboard/students/{course_id} - Student performance
GET    /api/v1/dashboard/insights/{course_id} - AI-generated insights
```

## Database Schema

### Core Tables

#### moodle_connections
```sql
CREATE TABLE moodle_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instance_name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### students
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    email VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_moodle_user (moodle_user_id)
);
```

#### courses
```sql
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_moodle_course (moodle_course_id)
);
```

#### quizzes
```sql
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    course_id INT NOT NULL,
    quiz_name VARCHAR(255) NOT NULL,
    time_limit INT,
    max_grade DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY idx_moodle_quiz (moodle_quiz_id)
);
```

#### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_attempt_id INT NOT NULL,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    attempt_number INT DEFAULT 1,
    started_at DATETIME,
    finished_at DATETIME,
    total_time_seconds INT,
    final_grade DECIMAL(5,2),
    state VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    UNIQUE KEY idx_moodle_attempt (moodle_attempt_id)
);
```

#### question_attempts
```sql
CREATE TABLE question_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_attempt_id INT NOT NULL,
    question_number INT,
    question_text TEXT,
    question_type VARCHAR(50),
    max_mark DECIMAL(5,2),
    achieved_mark DECIMAL(5,2),
    is_correct BOOLEAN,
    num_attempts INT DEFAULT 1,
    time_spent_seconds INT,
    hint_requests INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id)
);
```

#### reasoning_density_scores
```sql
CREATE TABLE reasoning_density_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_attempt_id INT NOT NULL,
    question_attempt_id INT,

    -- Component scores (0-100 scale)
    time_density_score DECIMAL(5,2),
    attempt_intensity_score DECIMAL(5,2),
    cognitive_load_score DECIMAL(5,2),
    complexity_coefficient DECIMAL(5,2),
    solution_path_score DECIMAL(5,2),

    -- Overall reasoning density score
    overall_density_score DECIMAL(5,2),

    -- Classification
    intensity_level ENUM('low', 'medium', 'high'),

    -- Metadata
    calculation_method VARCHAR(100),
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id),
    FOREIGN KEY (question_attempt_id) REFERENCES question_attempts(id)
);
```

#### accuracy_rates
```sql
CREATE TABLE accuracy_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT,
    course_id INT,

    -- Accuracy metrics
    total_questions INT,
    correct_answers INT,
    accuracy_percentage DECIMAL(5,2),

    -- Contextual data
    difficulty_level INT,
    topic VARCHAR(255),
    time_period_start DATE,
    time_period_end DATE,

    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

#### correlation_analyses
```sql
CREATE TABLE correlation_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_name VARCHAR(255),
    course_id INT,
    quiz_id INT,

    -- Analysis parameters
    analysis_type ENUM('pearson', 'spearman', 'kendall', 'linear_regression'),
    sample_size INT,

    -- Statistical results
    correlation_coefficient DECIMAL(6,4),
    p_value DECIMAL(10,8),
    r_squared DECIMAL(6,4),
    confidence_interval_lower DECIMAL(6,4),
    confidence_interval_upper DECIMAL(6,4),

    -- Control variables (JSON)
    control_variables JSON,

    -- Results interpretation
    significance_level DECIMAL(3,2) DEFAULT 0.05,
    is_significant BOOLEAN,
    effect_size VARCHAR(50),

    -- Metadata
    analyzed_by VARCHAR(255),
    analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
```

#### correlation_data_points
```sql
CREATE TABLE correlation_data_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correlation_analysis_id INT NOT NULL,
    student_id INT NOT NULL,

    -- Independent variable
    reasoning_density_score DECIMAL(5,2),

    -- Dependent variable
    accuracy_rate DECIMAL(5,2),

    -- Confounding variables
    time_spent_seconds INT,
    attempt_number INT,
    problem_difficulty INT,

    -- Additional metadata
    metadata JSON,

    FOREIGN KEY (correlation_analysis_id) REFERENCES correlation_analyses(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
```

## Data Flow

### 1. Data Synchronization Flow
```
Moodle LMS → Moodle Integration Service → MySQL Database
    ↓
Courses → Students → Quizzes → Quiz Attempts → Question Attempts
```

### 2. Reasoning Density Calculation Flow
```
Question Attempts Data → Reasoning Density Engine
    ↓
Calculate Component Scores:
    - Time Density
    - Attempt Intensity
    - Cognitive Load
    - Complexity
    - Solution Path
    ↓
Compute Overall Density Score → Store in reasoning_density_scores
```

### 3. Correlation Analysis Flow
```
1. Select Dataset (course/quiz)
2. Fetch Reasoning Density Scores
3. Calculate Accuracy Rates
4. Run Statistical Analysis
5. Generate Visualizations
6. Store Results in correlation_analyses
```

## Security Considerations

### Authentication & Authorization
- API token-based authentication for Moodle
- JWT tokens for internal API
- Role-based access control (RBAC)
- Teacher/Admin role verification

### Data Protection
- Encrypted storage of Moodle API tokens
- HTTPS only in production
- SQL injection prevention (parameterized queries)
- Input validation on all endpoints
- Rate limiting on API endpoints

### Privacy
- Student data anonymization options
- GDPR/FERPA compliance
- Audit logging for data access
- Data retention policies

## Deployment Architecture

### Development
```
docker-compose.yml:
    - MySQL 5.7 container
    - Backend (FastAPI) container
    - Frontend (React dev server) container
    - Redis container (optional)
```

### Production
```
Nginx → Uvicorn (FastAPI) → MySQL 5.7
    ↑
    └── React Static Build (served by Nginx)
```

## Performance Optimization

### Caching Strategy
- Redis cache for Moodle API responses (TTL: 5 minutes)
- Query result caching for expensive correlations
- Frontend query caching with React Query

### Database Optimization
- Indexes on foreign keys
- Composite indexes for frequent queries
- Connection pooling (SQLAlchemy)
- Query optimization for large datasets

### Scalability
- Async API endpoints (FastAPI)
- Background job processing (Celery) for long analyses
- Pagination for large result sets
- Incremental data sync (not full refresh)

## Monitoring & Logging

### Application Monitoring
- FastAPI built-in request logging
- Error tracking (Sentry compatible)
- Performance metrics (response times)

### Database Monitoring
- Slow query logging
- Connection pool monitoring
- Database size tracking

### Business Metrics
- Number of correlation analyses run
- Average reasoning density scores
- Sync success/failure rates

## Future Enhancements

### Phase 2
- Real-time data streaming from Moodle
- Advanced ML models for prediction
- Multi-course comparative analysis
- Student learning path recommendations

### Phase 3
- LTI 1.3 integration (seamless Moodle embedding)
- Mobile app (React Native)
- Advanced visualizations (3D correlations)
- Automated report generation and email delivery

## Development Workflow

1. **Setup**: `docker-compose up -d`
2. **Backend**: `cd backend && uvicorn main:app --reload`
3. **Frontend**: `cd frontend && npm start`
4. **Database**: Run migrations with Alembic
5. **Testing**: `pytest` for backend, `npm test` for frontend

## API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
