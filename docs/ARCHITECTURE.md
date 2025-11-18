# Power Candle - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Moodle LMS 3.7                         │
│              (Quiz Activities, Student Data)                │
└───────────────────────┬─────────────────────────────────────┘
                        │ Web Services API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Power Candle Backend                      │
│                    (PHP 7.1.9)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (REST)                                    │  │
│  │  - Problem Fetcher                                   │  │
│  │  - Answer Submission                                 │  │
│  │  - Progress Tracker                                  │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────────┐  │
│  │  Business Logic                                      │  │
│  │  - Logarithm Calculator                              │  │
│  │  - Answer Validator                                  │  │
│  │  - Candle Count Generator                            │  │
│  └────────────┬─────────────────────────────────────────┘  │
└───────────────┼─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│                    MySQL 5.7 Database                       │
│  - Problems (cached from Moodle)                            │
│  - Student Attempts                                         │
│  - Session Data                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Power Candle Frontend (React)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Virtual Smartphone Container                 │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Problem Display                               │ │  │
│  │  │  "Calculate: log₂ 8 = ?"                      │ │  │
│  │  ├────────────────────────────────────────────────┤ │  │
│  │  │  Candle Visualization Area                     │ │  │
│  │  │  🕯️ 🕯️ 🕯️                                      │ │  │
│  │  │  (Animated candles)                            │ │  │
│  │  ├────────────────────────────────────────────────┤ │  │
│  │  │  Answer Input                                  │ │  │
│  │  │  [ Your answer: ___ ]                          │ │  │
│  │  ├────────────────────────────────────────────────┤ │  │
│  │  │  Action Buttons                                │ │  │
│  │  │  [Submit] [Hint] [Next]                        │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Backend Components

#### 1. API Layer (`/backend/api/`)

**`problem.php`** - Problem Management
- `GET /api/problem/:id` - Fetch problem from Moodle
- Response format:
```json
{
  "id": 123,
  "type": "calculate",
  "base": 2,
  "result": 8,
  "question": "Calculate log₂ 8",
  "difficulty": 1
}
```

**`submit.php`** - Answer Submission
- `POST /api/submit` - Submit student answer
- Request body:
```json
{
  "problem_id": 123,
  "student_id": 456,
  "answer": 3,
  "time_spent": 45
}
```
- Response:
```json
{
  "correct": true,
  "correct_answer": 3,
  "feedback": "Great job! 2³ = 8",
  "candle_count": 3
}
```

**`progress.php`** - Progress Tracking
- `GET /api/progress/:student_id` - Get student progress
- Response:
```json
{
  "student_id": 456,
  "total_problems": 10,
  "solved": 7,
  "accuracy": 85.7,
  "recent_attempts": [...]
}
```

#### 2. Business Logic (`/backend/models/`)

**`LogarithmCalculator.php`**
```php
class LogarithmCalculator {
    public function calculate($base, $result) {
        // Returns the power (candle count)
        return log($result, $base);
    }

    public function verify($base, $power, $result) {
        // Verify if base^power = result
        return pow($base, $power) == $result;
    }

    public function generateCandleSteps($base, $power) {
        // Generate step-by-step visualization
        $steps = [];
        for ($i = 1; $i <= $power; $i++) {
            $steps[] = pow($base, $i);
        }
        return $steps;
    }
}
```

**`AnswerValidator.php`**
```php
class AnswerValidator {
    public function validate($problem, $answer) {
        $correct = $this->calculator->calculate(
            $problem['base'],
            $problem['result']
        );

        return [
            'correct' => $answer == $correct,
            'expected' => $correct,
            'feedback' => $this->generateFeedback($problem, $answer, $correct)
        ];
    }
}
```

#### 3. Moodle Integration (`/backend/utils/`)

**`MoodleClient.php`**
```php
class MoodleClient {
    private $moodle_url;
    private $token;

    public function getProblem($quiz_id, $question_id) {
        // Call Moodle Web Services API
        $response = $this->callMoodleAPI(
            'mod_quiz_get_attempt_data',
            ['quizid' => $quiz_id]
        );
        return $this->parseProblem($response);
    }

    public function submitGrade($student_id, $quiz_id, $grade) {
        // Submit grade back to Moodle
        return $this->callMoodleAPI(
            'mod_quiz_save_attempt',
            ['attemptid' => ..., 'grade' => $grade]
        );
    }
}
```

### Frontend Components

#### 1. Core UI Components

**`SmartphoneFrame.tsx`**
```tsx
interface SmartphoneFrameProps {
  children: React.ReactNode;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  return (
    <div className="smartphone-frame">
      <div className="screen">
        <div className="notch"></div>
        <div className="content">
          {children}
        </div>
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};
```

**`CandleDisplay.tsx`**
```tsx
interface CandleDisplayProps {
  count: number;
  animated?: boolean;
  highlight?: number; // Highlight specific candle
}

export const CandleDisplay: React.FC<CandleDisplayProps> = ({
  count,
  animated = true,
  highlight
}) => {
  return (
    <div className="candle-container">
      {Array.from({ length: count }, (_, i) => (
        <Candle
          key={i}
          index={i}
          animated={animated}
          highlighted={i === highlight}
        />
      ))}
    </div>
  );
};
```

**`Candle.tsx`**
```tsx
interface CandleProps {
  index: number;
  animated?: boolean;
  highlighted?: boolean;
}

export const Candle: React.FC<CandleProps> = ({
  index,
  animated,
  highlighted
}) => {
  const [isLit, setIsLit] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsLit(true), index * 300);
      return () => clearTimeout(timer);
    }
  }, [animated, index]);

  return (
    <div className={`candle ${isLit ? 'lit' : ''} ${highlighted ? 'highlight' : ''}`}>
      <div className="flame"></div>
      <div className="wick"></div>
      <div className="wax"></div>
    </div>
  );
};
```

**`ProblemView.tsx`**
```tsx
interface ProblemViewProps {
  problem: Problem;
  onSubmit: (answer: number) => void;
  onHint: () => void;
}

export const ProblemView: React.FC<ProblemViewProps> = ({
  problem,
  onSubmit,
  onHint
}) => {
  const [answer, setAnswer] = useState('');
  const [showCandles, setShowCandles] = useState(false);

  return (
    <div className="problem-view">
      <div className="question">
        Calculate: log<sub>{problem.base}</sub> {problem.result} = ?
      </div>

      {showCandles && (
        <CandleDisplay count={problem.correctAnswer} animated={true} />
      )}

      <input
        type="number"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer"
      />

      <div className="actions">
        <button onClick={() => onSubmit(Number(answer))}>Submit</button>
        <button onClick={onHint}>Hint</button>
      </div>
    </div>
  );
};
```

#### 2. State Management

**`useProblem.ts`** - Custom Hook
```tsx
interface UseProblemReturn {
  problem: Problem | null;
  loading: boolean;
  error: Error | null;
  submitAnswer: (answer: number) => Promise<SubmitResult>;
  nextProblem: () => Promise<void>;
}

export const useProblem = (problemId?: string): UseProblemReturn => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProblem = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getProblem(id);
      setProblem(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: number) => {
    if (!problem) return;
    return await api.submitAnswer(problem.id, answer);
  };

  return { problem, loading, error, submitAnswer, nextProblem };
};
```

### Database Schema

#### Tables

**`problems`** - Cached problem data from Moodle
```sql
CREATE TABLE problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_question_id INT NOT NULL,
    problem_type ENUM('calculate', 'verify', 'multiple_choice') NOT NULL,
    base INT NOT NULL,
    result INT NOT NULL,
    correct_answer INT NOT NULL,
    difficulty INT DEFAULT 1,
    question_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
);
```

**`student_attempts`** - Track student submissions
```sql
CREATE TABLE student_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    answer INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INT, -- seconds
    hint_used BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id),
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id)
);
```

**`sessions`** - Track learning sessions
```sql
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    student_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    problems_attempted INT DEFAULT 0,
    problems_correct INT DEFAULT 0
);
```

## Data Flow

### Problem Loading Flow
```
1. Student opens app → Frontend loads
2. Frontend requests problem → GET /api/problem/:id
3. Backend checks cache → Query `problems` table
4. If not cached → Fetch from Moodle API
5. Backend returns problem data → Frontend displays
6. Frontend shows candle visualization → User interacts
```

### Answer Submission Flow
```
1. Student enters answer → Clicks Submit
2. Frontend sends answer → POST /api/submit
3. Backend validates answer → LogarithmCalculator
4. Backend records attempt → Insert into `student_attempts`
5. Backend sends to Moodle → MoodleClient.submitGrade()
6. Backend returns result → Frontend shows feedback
7. Frontend animates candles → Visual confirmation
```

## Security Considerations

### API Security
- **Authentication**: Session-based auth with Moodle SSO
- **CORS**: Whitelist Moodle domain and app domain
- **Input Validation**: Sanitize all inputs (base, result, answer)
- **Rate Limiting**: Prevent abuse (max 100 requests/minute)

### Data Protection
- **Student Data**: Store minimal PII, comply with FERPA
- **SQL Injection**: Use prepared statements (PDO)
- **XSS Prevention**: Escape all output in React

## Performance Optimization

### Backend
- **Caching**: Cache problem data from Moodle (reduce API calls)
- **Database Indexing**: Index student_id, problem_id for fast queries
- **Connection Pooling**: Reuse database connections

### Frontend
- **Code Splitting**: Lazy load components
- **Asset Optimization**: Compress images, minify CSS/JS
- **Service Worker**: Cache static assets for offline support

## Monitoring & Analytics

### Key Metrics
- **Performance**: API response time, page load time
- **Usage**: Active students, problems attempted, completion rate
- **Learning**: Average time per problem, accuracy by difficulty
- **Errors**: Failed API calls, client-side errors

### Logging
- Backend: PHP error log + custom application log
- Frontend: Console errors sent to backend
- Moodle: Standard Moodle logging integration

## Deployment

### Production Environment
```
┌─────────────────────┐
│   Load Balancer     │
│   (nginx/Apache)    │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌───▼───┐
│PHP-FPM│    │MySQL  │
│Backend│───▶│ 5.7   │
└───────┘    └───────┘
    │
    ▼
┌─────────────────────┐
│  React Build        │
│  (Static Files)     │
└─────────────────────┘
```

### Deployment Steps
1. Build frontend: `npm run build`
2. Deploy PHP backend to web server
3. Configure database connection
4. Set up Moodle API credentials
5. Configure domain and SSL
6. Test end-to-end integration

## Future Enhancements

### Phase 2 Features
- Multiple logarithm bases (e.g., natural log, log₁₀)
- Animated step-by-step visualization
- Gamification (achievements, streaks)
- Peer comparison and leaderboards
- Voice narration for explanations

### Technical Improvements
- GraphQL API for more efficient data fetching
- WebSocket for real-time updates
- Progressive Web App (PWA) for offline support
- A/B testing framework for pedagogical approaches
