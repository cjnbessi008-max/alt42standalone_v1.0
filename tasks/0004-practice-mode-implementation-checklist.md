# "Practice a Bit More" Mode - Implementation Checklist

**Objective**: Implement adaptive practice mode that allows students to continue practicing when they're close to mastering a concept.

**Target Feature Release**: Integrate with Phase 2 (Rule Generation) and Phase 3 (Data Management) of the pipeline

---

## 1. DATA LAYER (PHASE 3)

### Database Schema Definition
- [ ] Create `student_progress` table (dynamically per module)
  - [ ] student_id (UUID)
  - [ ] module_id (UUID)
  - [ ] progress_percentage (INTEGER, 0-100)
  - [ ] mastery_level (ENUM: 'beginner', 'intermediate', 'advanced', 'mastery')
  - [ ] total_attempts (INTEGER)
  - [ ] correct_attempts (INTEGER)
  - [ ] accuracy_percentage (NUMERIC)
  - [ ] last_attempt_at (TIMESTAMP)
  - [ ] created_at, updated_at (TIMESTAMP)

- [ ] Create `problem_attempt` table
  - [ ] id (UUID PRIMARY KEY)
  - [ ] student_id (UUID)
  - [ ] module_id (UUID)
  - [ ] problem_id (UUID)
  - [ ] attempted_at (TIMESTAMP)
  - [ ] submitted_answer (TEXT or JSON)
  - [ ] is_correct (BOOLEAN)
  - [ ] time_spent_seconds (INTEGER)
  - [ ] hints_used (INTEGER)
  - [ ] difficulty_level (INTEGER, 1-5)
  - [ ] created_at (TIMESTAMP)

- [ ] Create `mastery_metrics` table
  - [ ] id (UUID PRIMARY KEY)
  - [ ] module_id (UUID)
  - [ ] topic_id (VARCHAR) - e.g., "fraction_addition"
  - [ ] required_correct_attempts (INTEGER) - default 5
  - [ ] min_accuracy_percentage (NUMERIC) - default 80%
  - [ ] consecutive_correct (INTEGER) - default 3
  - [ ] time_window_days (INTEGER) - default 7
  - [ ] created_at, updated_at (TIMESTAMP)

- [ ] Create `practice_trigger_rules` table
  - [ ] id (UUID PRIMARY KEY)
  - [ ] module_id (UUID)
  - [ ] trigger_type (ENUM: 'approaching_mastery', 'partial_mastery', 'needs_review')
  - [ ] accuracy_threshold (NUMERIC) - e.g., 0.75 for 75%
  - [ ] attempt_count_threshold (INTEGER) - e.g., 3
  - [ ] suggested_action (VARCHAR) - e.g., "practice_more", "review_concept", "next_topic"
  - [ ] rule_code (TEXT) - Generated rule implementation
  - [ ] created_at, updated_at (TIMESTAMP)

- [ ] Create `problem_bank` table
  - [ ] id (UUID PRIMARY KEY)
  - [ ] module_id (UUID)
  - [ ] topic_id (VARCHAR)
  - [ ] difficulty_level (INTEGER, 1-5)
  - [ ] problem_template (JSONB) - Template with placeholders
  - [ ] metadata (JSONB) - Tags, learning objectives
  - [ ] created_at, updated_at (TIMESTAMP)

### Database Indexes
- [ ] Index on student_progress(student_id, module_id)
- [ ] Index on problem_attempt(student_id, module_id, attempted_at)
- [ ] Index on problem_attempt(problem_id, is_correct)
- [ ] Index on practice_trigger_rules(module_id, trigger_type)

### Migration Scripts
- [ ] Create migration file: `002_create_practice_mode_tables.sql`
- [ ] Create seed file: `seeds/practice_mode_templates.sql`

---

## 2. RULE ENGINE (PHASE 2)

### Progression Rules
- [ ] **Rule Type: "mastery_check"**
  - [ ] Inputs: student_id, module_id, topic_id
  - [ ] Outputs: mastery_status, confidence_score, recommended_action
  - [ ] Logic:
    ```
    if (correct_attempts >= required_correct_attempts 
        AND accuracy_percentage >= min_accuracy_percentage 
        AND consecutive_correct >= required_consecutive)
      then mastery_status = "MASTERED"
      else if (accuracy_percentage >= min_accuracy_percentage * 0.9)
        then mastery_status = "APPROACHING_MASTERY"
      else mastery_status = "IN_PROGRESS"
    ```

- [ ] **Rule Type: "difficulty_progression"**
  - [ ] Inputs: mastery_status, attempt_count, accuracy_percentage
  - [ ] Outputs: next_difficulty_level, practice_recommendation
  - [ ] Logic:
    ```
    if mastery_status = "APPROACHING_MASTERY"
      then offer_practice_more_option = TRUE
      else if mastery_status = "IN_PROGRESS" 
        AND accuracy_percentage >= min_accuracy_percentage
        then increase_difficulty_gradually = TRUE
      else suggest_review = TRUE
    ```

- [ ] **Rule Type: "practice_more_suggestion"**
  - [ ] Inputs: mastery_status, accuracy_percentage, time_since_last_attempt
  - [ ] Outputs: show_practice_button, suggested_problem_count
  - [ ] Logic:
    ```
    if (mastery_status = "APPROACHING_MASTERY"
        AND accuracy_percentage BETWEEN 75-95)
      then {
        show_practice_button = TRUE
        suggested_problem_count = CEIL((100 - accuracy_percentage) / 10)
        message = "You're almost there! Practice a bit more to master this."
      }
    ```

### Feedback Rules
- [ ] **Rule Type: "hint_generation"**
  - [ ] Inputs: problem_type, student_attempt, difficulty_level, hints_used
  - [ ] Outputs: hint_text, next_steps
  - [ ] Logic: Generate contextual hints based on incorrect answer

- [ ] **Rule Type: "encouragement_message"**
  - [ ] Inputs: accuracy_percentage, attempt_count, mastery_status
  - [ ] Outputs: encouragement_message, next_action_text
  - [ ] Examples:
    - "Great job! You're 80% correct. Practice a bit more to reach 100%!"
    - "You've got this! 3 more correct answers to mastery."
    - "Keep practicing! The more you practice, the stronger you'll become."

### Rule Code Generation
- [ ] Generate Python/JavaScript rule implementations
- [ ] Create unit tests for each rule
- [ ] Validate rule logic against edge cases

---

## 3. API LAYER (NODE.JS/EXPRESS)

### Authentication & Authorization
- [ ] Protect all endpoints with JWT middleware
- [ ] Verify student enrollment in module
- [ ] Implement rate limiting (50 requests/min per student)

### Practice Mode Endpoints

#### Problem Generation
- [ ] **GET /api/modules/{moduleId}/next-problem**
  - [ ] Query studentProgress for current status
  - [ ] Select difficulty level from rules
  - [ ] Generate problem from problem_bank template
  - [ ] Return problem with metadata

- [ ] **GET /api/modules/{moduleId}/problems/{problemId}**
  - [ ] Retrieve problem with visual rendering hints
  - [ ] Include difficulty level and estimated time
  - [ ] Return problem statement + interactive elements

#### Answer Submission
- [ ] **POST /api/modules/{moduleId}/submit-answer**
  - [ ] Input validation
  - [ ] Execute validation rule
  - [ ] Determine correctness
  - [ ] Execute feedback rule
  - [ ] Update student_progress
  - [ ] Insert problem_attempt record
  - [ ] Check if mastery achieved
  - [ ] Return: { is_correct, feedback, hint?, next_action }

#### Progress Tracking
- [ ] **GET /api/modules/{moduleId}/progress**
  - [ ] Retrieve studentProgress record
  - [ ] Calculate mastery_level
  - [ ] Calculate time_to_mastery estimate
  - [ ] Return progress data + visualization data

- [ ] **GET /api/modules/{moduleId}/progress/history**
  - [ ] Retrieve paginated problem_attempt history (limit 50)
  - [ ] Include accuracy trend data
  - [ ] Include time spent per problem

#### Practice Recommendations
- [ ] **GET /api/modules/{moduleId}/practice-suggestion**
  - [ ] Execute practice_more_suggestion rule
  - [ ] Return: { should_practice, message, suggested_count }

- [ ] **POST /api/modules/{moduleId}/practice-more**
  - [ ] Student indicates desire to practice
  - [ ] Log intent in analytics
  - [ ] Generate new problem set (3-5 problems)
  - [ ] Return first problem

#### Hint System
- [ ] **POST /api/modules/{moduleId}/request-hint**
  - [ ] Check hints_used count
  - [ ] Execute hint_generation rule
  - [ ] Increment hints_used
  - [ ] Return hint text

### WebSocket Events (Real-time Updates)
- [ ] **"progress:updated"** - Broadcast when student progress changes
- [ ] **"mastery:achieved"** - Celebrate mastery milestone
- [ ] **"practice:suggested"** - Push practice-more suggestion
- [ ] **"problem:submitted"** - Confirm submission received

### Response Format Standardization
```json
{
  "success": boolean,
  "data": {
    // Endpoint-specific data
  },
  "meta": {
    "timestamp": ISO8601,
    "studentId": string,
    "moduleId": string
  },
  "error": null | {
    "code": string,
    "message": string
  }
}
```

---

## 4. FRONTEND (REACT)

### Components for Practice Mode

#### PracticeProgressIndicator Component
- [ ] Display progress percentage (0-100%)
- [ ] Show mastery level indicator (Beginner → Mastery)
- [ ] Display accuracy percentage
- [ ] Show "Practice More" button when approaching mastery
- [ ] Responsive design (mobile/tablet/desktop)

#### ProblemDisplay Component
- [ ] Render problem statement
- [ ] Display problem visuals (SVG, images, interactive elements)
- [ ] Show difficulty level indicator
- [ ] Show estimated time to complete
- [ ] Show attempt number
- [ ] Responsive layout

#### AnswerInputForm Component
- [ ] Dynamic input based on problem type:
  - [ ] Text input (for written answers)
  - [ ] Numeric input (for calculations)
  - [ ] Multiple choice (radio buttons)
  - [ ] Drag-and-drop (for visual problems)
  - [ ] Canvas input (for drawing answers)
- [ ] Client-side validation
- [ ] Submit button with loading state
- [ ] Clear/Reset button

#### FeedbackDisplay Component
- [ ] Show correct/incorrect indicator
- [ ] Display explanation for correct answer
- [ ] Show helpful feedback for incorrect answer
- [ ] Display hint (if requested)
- [ ] Show encouragement message
- [ ] Show next step action

#### PracticeMoreModal Component
- [ ] Modal triggered when mastery approaching (75%+ accuracy)
- [ ] Display message: "You're almost there! Practice a bit more?"
- [ ] Show suggested number of problems
- [ ] Buttons: "Yes, Let's Practice", "Continue to Next Topic"
- [ ] Can be dismissed

#### ProgressChart Component
- [ ] Line chart showing accuracy trend over time
- [ ] X-axis: Problem attempt number
- [ ] Y-axis: Accuracy percentage
- [ ] Show mastery threshold line (e.g., 80%)
- [ ] Highlight current attempt
- [ ] Optional: Show difficulty progression

#### HintButton Component
- [ ] "Get a Hint" button (available before answer submission)
- [ ] Show hint count (e.g., "2 hints left")
- [ ] Disable after max hints used
- [ ] Display hint in tooltip or modal

### Pages/Views for Practice Mode

#### StudentPracticeView
- [ ] Full-screen practice interface
- [ ] Left column: Problem display
- [ ] Right column: Progress indicator + controls
- [ ] Bottom: Navigation (prev/next problem, quit)
- [ ] Mobile: Stacked layout

#### PracticeProgressPage
- [ ] Historical progress view
- [ ] Charts and statistics
- [ ] Topic mastery overview
- [ ] Time spent analysis
- [ ] Comparison with classmates (optional, future)

### State Management
- [ ] Redux store structure:
  ```javascript
  {
    practice: {
      currentModule: { id, name, grade_level },
      currentProblem: { id, statement, type, difficulty },
      currentProgress: { percentage, mastery_level, accuracy },
      studentAttempts: [],
      feedbackMessage: null,
      showPracticeMore: boolean,
      loading: boolean,
      error: null
    }
  }
  ```

- [ ] Actions:
  - [ ] setCurrentModule
  - [ ] setCurrentProblem
  - [ ] submitAnswer
  - [ ] updateProgress
  - [ ] requestHint
  - [ ] showPracticeMoreModal
  - [ ] nextProblem
  - [ ] previousProblem

### API Integration (Axios)
- [ ] Create apiClient with base URL
- [ ] Implement interceptors for JWT tokens
- [ ] Create practice service layer:
  - [ ] fetchNextProblem()
  - [ ] submitAnswer()
  - [ ] fetchProgress()
  - [ ] requestHint()
  - [ ] suggestPractice()

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation (Tab, Enter, Arrow keys)
- [ ] Screen reader support (ARIA labels)
- [ ] High contrast mode support
- [ ] Adjustable text size
- [ ] Focus indicators visible

### Styling
- [ ] Follow KAIST design system (TBD)
- [ ] Responsive breakpoints: mobile (320px), tablet (768px), desktop (1200px)
- [ ] Colors: Calm, encouraging palette (blues, greens, warm accent)
- [ ] Animations: Subtle transitions for feedback
- [ ] Typography: Large, readable fonts (min 16px body text)

---

## 5. TESTING

### Unit Tests
- [ ] Rule engine logic (mastery_check, difficulty_progression)
- [ ] Progress calculation functions
- [ ] Hint generation logic
- [ ] Feedback message generation

### Integration Tests
- [ ] Problem generation workflow
- [ ] Answer submission workflow
- [ ] Progress update workflow
- [ ] Practice-more suggestion workflow

### E2E Tests (Cypress/Selenium)
- [ ] Student starts practice
- [ ] Student answers problems
- [ ] Progress updates in real-time
- [ ] Mastery message appears at 75%
- [ ] Practice-more button appears and works
- [ ] Hints are delivered correctly
- [ ] Mobile responsive behavior

### Load Testing
- [ ] 100 concurrent students practicing
- [ ] Rapid problem submission (< 100ms response time)
- [ ] WebSocket broadcast under load
- [ ] Database query performance

---

## 6. ANALYTICS & MONITORING

### Metrics to Track
- [ ] problem_attempts_per_student (count)
- [ ] accuracy_percentage (trending)
- [ ] time_to_mastery (days)
- [ ] hint_usage_rate (%)
- [ ] practice_more_clicks (count)
- [ ] feature_adoption_rate (%)
- [ ] student_satisfaction (survey)

### Logging
- [ ] Log all practice events:
  - [ ] problem_started
  - [ ] answer_submitted
  - [ ] hint_requested
  - [ ] mastery_achieved
  - [ ] practice_more_clicked

### Dashboard Metrics
- [ ] Teacher dashboard:
  - [ ] Class mastery overview
  - [ ] Students needing help (low accuracy)
  - [ ] Most practiced topics
  - [ ] Average time to mastery
  - [ ] Student engagement (active students)

- [ ] Student dashboard:
  - [ ] My progress (%)
  - [ ] Problems completed
  - [ ] Time spent
  - [ ] Achievements
  - [ ] Recommended topics for practice

---

## 7. SECURITY & VALIDATION

### Input Validation
- [ ] Sanitize all user inputs (DOMPurify)
- [ ] Validate problem ID exists and belongs to module
- [ ] Validate student enrollment
- [ ] Validate answer format matches expected type

### Authorization
- [ ] Verify student can only access their own progress
- [ ] Verify teachers can only see their own modules
- [ ] Verify admins have proper access levels

### Data Security
- [ ] Encrypt sensitive student data
- [ ] Use HTTPS for all API calls
- [ ] JWT token expiration (1 hour)
- [ ] Rate limiting on API endpoints

### Error Handling
- [ ] Try-catch blocks in async functions
- [ ] User-friendly error messages
- [ ] Log errors to monitoring service
- [ ] Graceful degradation (practice mode doesn't break core module)

---

## 8. DOCUMENTATION

### Code Documentation
- [ ] JSDoc comments for all functions
- [ ] README for practice mode feature
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component Storybook examples

### User Documentation
- [ ] Teacher guide: How to track student practice
- [ ] Student guide: How to practice and request help
- [ ] Troubleshooting: Common issues and solutions

### Architecture Documentation
- [ ] Practice mode data flow diagram
- [ ] API endpoint documentation
- [ ] Database schema diagram
- [ ] Component hierarchy diagram

---

## 9. DEPLOYMENT & DEVOPS

### Docker Configuration
- [ ] Create Dockerfile for frontend (Node.js build + Nginx)
- [ ] Create Dockerfile for backend (Node.js + Python)
- [ ] Update docker-compose.yml with all services
- [ ] Environment variable configuration

### CI/CD Pipeline
- [ ] GitHub Actions workflow for testing
- [ ] Automated test run on PR
- [ ] Code coverage reporting
- [ ] Automated deployment on merge to main

### Database Migrations
- [ ] Version control migration scripts
- [ ] Automated migration on deployment
- [ ] Rollback strategy

### Monitoring & Logging
- [ ] Winston/Pino for structured logging
- [ ] Prometheus metrics export
- [ ] Grafana dashboard for practice metrics
- [ ] Alert thresholds for high error rates

---

## 10. STAKEHOLDER APPROVAL

### Teacher Testing
- [ ] [ ] 5-10 teachers test with real student data
- [ ] [ ] Collect feedback on usefulness
- [ ] [ ] Verify practice suggestions appropriate
- [ ] [ ] Check mobile experience

### Student Testing
- [ ] [ ] 20-30 students test practice mode
- [ ] [ ] Collect satisfaction feedback
- [ ] [ ] Verify UI is intuitive
- [ ] [ ] Measure learning outcomes vs. no practice

### Admin Review
- [ ] [ ] Verify data privacy compliance
- [ ] [ ] Check audit logging
- [ ] [ ] Review API rate limiting
- [ ] [ ] Approve security checklist

---

## TIMELINE ESTIMATE

### Phase 1: Setup & Data Layer (1-2 weeks)
- Database schema design and creation
- Migration scripts
- Data model tests

### Phase 2: Rule Engine (2-3 weeks)
- Rule specification
- Rule code generation
- Rule testing

### Phase 3: API Development (2-3 weeks)
- Endpoint implementation
- WebSocket integration
- API testing

### Phase 4: Frontend Development (3-4 weeks)
- Component implementation
- State management
- Integration with backend

### Phase 5: Testing & QA (2 weeks)
- Unit/integration/E2E tests
- Load testing
- User testing

### Phase 6: Deployment & Launch (1 week)
- Production deployment
- Monitoring setup
- Launch activities

**Total**: 11-16 weeks

---

## SUCCESS CRITERIA

The "Practice a Bit More" mode is successful when:

1. ✅ **Feature Adoption**: 60%+ of active students use practice mode
2. ✅ **Learning Impact**: Students using practice mode show 10%+ improvement in mastery
3. ✅ **Time to Mastery**: Average time-to-mastery reduced by 20% vs. no practice
4. ✅ **User Satisfaction**: 4.0+/5.0 rating from both students and teachers
5. ✅ **System Performance**: <200ms response time for practice endpoints
6. ✅ **Reliability**: 99.5% uptime, <1% error rate
7. ✅ **Data Privacy**: 100% compliance with KAIST data policies

