# LMS Practice Integration - System Design

## Overview

독립형 웹앱으로 Moodle LMS와 연동하여 학생들이 문제를 다양한 방식으로 풀도록 유도하는 지능형 연습 시스템.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────────┐  ┌──────────────────────────────┐    │
│  │ Practice UI     │  │ Alternative Solutions View   │    │
│  │ - Problem View  │  │ - Different Approaches       │    │
│  │ - Solution Input│  │ - Strategy Suggestions       │    │
│  │ - Progress Track│  │ - Comparison View            │    │
│  └─────────────────┘  └──────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                Backend (Python FastAPI)                      │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ Moodle API   │  │ AI Solution     │  │ Recommendation│ │
│  │ Integration  │  │ Generator       │  │ Engine        │ │
│  │              │  │ (Claude API)    │  │               │ │
│  └──────────────┘  └─────────────────┘  └───────────────┘ │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ Auth Service │  │ Progress        │  │ Analytics     │ │
│  │              │  │ Tracker         │  │               │ │
│  └──────────────┘  └─────────────────┘  └───────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                Database (PostgreSQL)                         │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ problems │ │ solutions  │ │ attempts │ │ strategies  │ │
│  │ users    │ │ progress   │ │ sessions │ │ recommendations││
│  └──────────┘ └────────────┘ └──────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              Moodle LMS (External)                          │
│  - Web Services API (REST)                                  │
│  - OAuth 2.0 / Token Authentication                         │
│  - Quiz/Question Bank                                       │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Moodle Integration
- **Authentication**: OAuth 2.0 or Moodle token-based auth
- **Data Sync**: Import problems from Moodle question bank
- **Grade Sync**: Send student progress back to Moodle
- **API Methods**:
  - `core_course_get_courses` - Get course list
  - `mod_quiz_get_quizzes_by_courses` - Get quizzes
  - `core_question_get_questions` - Get questions
  - `core_grades_update_grades` - Update student grades

### 2. Alternative Solution Generation (AI-Powered)

**Approach Types**:
- **Different Methods**: Same answer, different solving strategies
- **Reverse Problems**: Given answer, find the question
- **Analogous Problems**: Similar structure, different context
- **Decomposition**: Break complex problem into sub-problems
- **Visual vs Algebraic**: Different representation methods

**Example - Math Problem**:
```
Original: "Solve: 2x + 5 = 13"

Alternative Approaches:
1. Algebraic Method: 2x = 13 - 5, x = 8/2 = 4
2. Balance Method: Subtract 5 from both sides, divide by 2
3. Guess and Check: Try x=1,2,3,4... verify
4. Graphical Method: Plot y = 2x + 5 and y = 13, find intersection
5. Reverse: Given x=4, create equation
```

### 3. Recommendation Engine

**Student Model**:
```python
{
  "student_id": "uuid",
  "mastery_level": "beginner|intermediate|advanced",
  "attempted_approaches": ["algebraic", "graphical"],
  "weak_strategies": ["visual_representation"],
  "learning_style": "analytical|visual|kinesthetic",
  "success_rate_by_method": {
    "algebraic": 0.85,
    "graphical": 0.60,
    "verbal": 0.75
  }
}
```

**Recommendation Algorithm**:
1. Analyze student's previous attempts and success rates
2. Identify under-utilized solving strategies
3. Use AI to generate problems targeting weak areas
4. Progressive difficulty based on mastery
5. Suggest 2-3 alternative approaches per problem

### 4. Progress Tracking

**Metrics**:
- Problems solved per approach type
- Time spent per solving method
- Success rate improvement over time
- Strategy diversity score (# of different methods used)
- Mastery level per topic

## Database Schema

```sql
-- Moodle integration
CREATE TABLE moodle_config (
    id SERIAL PRIMARY KEY,
    moodle_url VARCHAR(255) NOT NULL,
    api_token TEXT NOT NULL,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP
);

-- Users (synced from Moodle)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    learning_profile JSONB, -- AI-analyzed learning style
    created_at TIMESTAMP DEFAULT NOW()
);

-- Problems (imported from Moodle or generated)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_question_id INTEGER, -- NULL if AI-generated
    course_id INTEGER,
    quiz_id INTEGER,
    problem_type VARCHAR(50), -- 'math', 'coding', 'logic', etc.
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    original_text TEXT NOT NULL,
    original_solution TEXT,
    topic VARCHAR(100),
    metadata JSONB, -- Additional problem data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alternative solving strategies for problems
CREATE TABLE solution_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    strategy_type VARCHAR(50), -- 'algebraic', 'graphical', 'numerical', etc.
    strategy_name VARCHAR(100),
    description TEXT,
    solution_steps JSONB, -- Step-by-step solution
    difficulty_modifier INTEGER DEFAULT 0, -- -2 to +2
    generated_by VARCHAR(50) DEFAULT 'ai', -- 'ai' or 'teacher'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES solution_strategies(id),
    attempt_number INTEGER DEFAULT 1,
    student_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    attempted_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, problem_id, strategy_id, attempt_number)
);

-- Practice sessions
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50), -- 'guided', 'free_practice', 'challenge'
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_problems INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    strategies_explored INTEGER DEFAULT 0
);

-- AI-generated recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    recommended_strategy_id UUID REFERENCES solution_strategies(id),
    reason TEXT, -- Why this strategy is recommended
    priority INTEGER DEFAULT 1, -- 1 (highest) to 5 (lowest)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'skipped', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Student progress by strategy
CREATE TABLE strategy_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_type VARCHAR(50),
    topic VARCHAR(100),
    attempts_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN attempts_count > 0
        THEN (success_count::DECIMAL / attempts_count * 100)
        ELSE 0 END
    ) STORED,
    mastery_level VARCHAR(20) DEFAULT 'novice', -- 'novice', 'developing', 'proficient', 'expert'
    last_practiced_at TIMESTAMP,

    UNIQUE(user_id, strategy_type, topic)
);

-- Indexes for performance
CREATE INDEX idx_attempts_user_problem ON student_attempts(user_id, problem_id);
CREATE INDEX idx_recommendations_user_status ON recommendations(user_id, status);
CREATE INDEX idx_problems_type_difficulty ON problems(problem_type, difficulty_level);
CREATE INDEX idx_strategy_mastery_user ON strategy_mastery(user_id);
```

## API Endpoints

### Moodle Integration
```
POST   /api/v1/moodle/connect        # Connect to Moodle instance
GET    /api/v1/moodle/courses        # Get courses
GET    /api/v1/moodle/sync           # Sync problems from Moodle
POST   /api/v1/moodle/grades         # Send grades back to Moodle
```

### Problems & Solutions
```
GET    /api/v1/problems              # List problems
GET    /api/v1/problems/:id          # Get problem details
POST   /api/v1/problems/:id/strategies/generate  # Generate alternative strategies
GET    /api/v1/problems/:id/strategies           # Get all strategies for problem
```

### Practice & Attempts
```
POST   /api/v1/sessions              # Start practice session
GET    /api/v1/sessions/:id          # Get session details
POST   /api/v1/attempts              # Submit attempt
GET    /api/v1/attempts/history      # Get user attempt history
```

### Recommendations
```
GET    /api/v1/recommendations       # Get personalized recommendations
POST   /api/v1/recommendations/:id/accept   # Accept recommendation
POST   /api/v1/recommendations/:id/skip     # Skip recommendation
```

### Analytics
```
GET    /api/v1/analytics/progress    # Student progress overview
GET    /api/v1/analytics/strategies  # Strategy mastery breakdown
GET    /api/v1/analytics/insights    # AI-generated insights
```

## AI Solution Generator (Claude API)

### Prompt Template
```python
SYSTEM_PROMPT = """
You are an expert math educator who specializes in teaching multiple
problem-solving strategies. Given a problem, generate alternative
approaches that help students develop flexible thinking.

For each alternative approach:
1. Name the strategy clearly
2. Explain when to use this approach
3. Provide step-by-step solution
4. Highlight the advantages of this method
5. Note any prerequisites or difficulty level
"""

USER_PROMPT = """
Problem: {problem_text}
Original Solution: {original_solution}
Student Level: {mastery_level}
Weak Areas: {weak_strategies}

Generate 3-5 alternative solving strategies that would help this
student develop diverse problem-solving skills.

Focus on strategies they haven't mastered yet.
"""
```

### Strategy Generation Flow
```
1. Analyze problem type and topic
2. Identify applicable solving strategies
3. Filter based on student's mastery level
4. Generate detailed solutions via Claude API
5. Store in database with metadata
6. Rank by relevance to student's learning goals
```

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI** for components
- **React Query** for data fetching
- **Zustand** for state management
- **KaTeX** for math rendering
- **Monaco Editor** for code problems

### Backend
- **Python 3.11+**
- **FastAPI** for REST API
- **SQLAlchemy** for ORM
- **Alembic** for migrations
- **Pydantic** for validation
- **httpx** for Moodle API calls
- **anthropic** for Claude API

### Database
- **PostgreSQL 15+**
- **Redis** for caching and sessions

### DevOps
- **Docker** & Docker Compose
- **GitHub Actions** for CI/CD
- **pytest** for testing
- **Black** & **Ruff** for code quality

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Setup project structure
- [ ] Database schema implementation
- [ ] Moodle API integration module
- [ ] Basic authentication

### Phase 2: Core Features (Weeks 3-5)
- [ ] AI solution generator
- [ ] Recommendation engine
- [ ] Progress tracking system
- [ ] REST API endpoints

### Phase 3: Frontend (Weeks 6-8)
- [ ] Practice interface UI
- [ ] Alternative solutions view
- [ ] Progress dashboard
- [ ] Admin panel for Moodle config

### Phase 4: Intelligence (Weeks 9-10)
- [ ] Learning profile analysis
- [ ] Adaptive recommendations
- [ ] Strategy difficulty adjustment
- [ ] Insights generation

### Phase 5: Testing & Launch (Weeks 11-12)
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

## Success Metrics

- **Student Engagement**: % of students using alternative strategies
- **Strategy Diversity**: Avg # of different methods per student
- **Learning Improvement**: Pre/post test score improvement
- **Retention**: % of students returning for practice
- **Satisfaction**: NPS score from students and teachers

## Security Considerations

- OAuth 2.0 for Moodle authentication
- JWT tokens for API authentication
- Rate limiting on AI generation endpoints
- Input validation and sanitization
- HTTPS only
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS protection in frontend

## Cost Estimation

**Claude API Usage**:
- ~500 tokens per strategy generation
- 5 strategies per problem
- 100 problems per course
- 10 courses
- Cost: ~$25-50 per full sync (one-time per course)
- Ongoing: ~$10-20/month for new recommendations

**Infrastructure**:
- VPS/Cloud: $20-50/month
- PostgreSQL: Included or $10/month
- Redis: Included or $5/month
- Total: ~$35-70/month + one-time API costs
