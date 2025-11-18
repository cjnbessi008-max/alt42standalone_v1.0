# 🎯 Chance Mood Recommendation System

## Overview

The **Recommendation System** is an advanced feature of Chance Mood that provides personalized learning recommendations based on student performance in probability and combinatorics problems.

## 🌟 Key Features

### For Students

#### 1. **Personalized Weak Area Analysis**
- Automatically identifies problem types where students struggle
- Categorizes weaknesses by topic:
  - Basic Probability (기본 확률)
  - Conditional Probability (조건부 확률)
  - Combination (조합)
  - Permutation (순열)
  - Compound Events (복합 사건)

#### 2. **Smart Problem Recommendations**
- Suggests specific problems to practice
- Difficulty-based recommendations (easy → medium → hard)
- Avoids problems already mastered
- Prioritizes areas with lowest success rates

#### 3. **Personalized Study Path**
- Step-by-step learning roadmap
- Clear milestones and goals
- Estimated time for each step
- Progress tracking

#### 4. **Curated Learning Resources**
- Video tutorials
- Interactive practice problems
- Concept comparisons
- Topic-specific guides

### For Teachers

#### 5. **Class-Wide Dashboard**
- Overview of all students' progress
- Identification of common weak areas
- Priority-based student list
- Actionable insights

#### 6. **Data-Driven Insights**
- Which topics need more class time
- Which students need urgent help
- Success rate trends
- Recommendation effectiveness tracking

## 📱 User Interface

### Student View - Tabbed Interface

The smartphone display now features **two tabs**:

```
┌─────────────────────────┐
│  [📊 Mood] [🎯 Recommendations]  │
├─────────────────────────┤
│  Mood Tab:              │
│  - Current emotion      │
│  - Success rate stats   │
│  - Emotion distribution │
│                         │
│  Recommendations Tab:   │
│  - Weak areas           │
│  - Recommended problems │
│  - Study path           │
│  - Learning resources   │
└─────────────────────────┘
```

### Tab 1: Mood Analysis
- Emotional color visualization
- Success rate statistics
- Problem distribution chart
- Motivational messages

### Tab 2: Recommendations
- **Priority Badge**: Urgent/High/Medium/Low
- **Weak Areas Cards**:
  - Problem type
  - Severity level
  - Success rate
  - Number of attempts
- **Recommended Problems**:
  - Problem name
  - Difficulty level
  - Reason for recommendation
- **Study Path**:
  - Step-by-step progression
  - Current step highlighted
  - Time estimates
  - Resources per step
- **Learning Resources**:
  - Video tutorials
  - Practice exercises
  - Concept explanations

## 🧠 Recommendation Algorithm

### Analysis Process

1. **Data Collection**
   ```
   Student attempts → Success rates → Problem categorization
   ```

2. **Weak Area Identification**
   - Success rate < 60% → Identified as weak area
   - Average score < 50% → High priority
   - Recency weighted (recent attempts count more)

3. **Problem Recommendation Scoring**
   ```
   Score = (0.4 × Success Rate) +
           (0.3 × Recent Performance) +
           (0.2 × Problem Similarity) +
           (0.1 × Time Spent)
   ```

4. **Study Path Generation**
   - Start with fundamentals
   - Progress to practice
   - Move to next weak area
   - Comprehensive review

### Problem Type Detection

The system uses keyword matching and pattern analysis:

| Problem Type | Keywords |
|--------------|----------|
| Basic Probability | 확률, probability, 주사위, dice, 동전, coin |
| Conditional | 조건부, conditional, given, if...then |
| Combination | 조합, combination, choose, nCr |
| Permutation | 순열, permutation, arrange, nPr |
| Compound Events | 그리고, 또는, and, or, multiple |

## 📊 Database Schema

### Table: `block_chancemood_recommend`

Stores personalized recommendations:

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| userid | INT | User ID |
| courseid | INT | Course ID |
| priority | VARCHAR(20) | urgent/high/medium/low |
| weak_areas | TEXT | JSON encoded weak areas |
| recommended_problems | TEXT | JSON problems list |
| study_path | TEXT | JSON study path |
| message | TEXT | Motivational message |
| timecreated | INT | Creation timestamp |
| timemodified | INT | Last update timestamp |

### Table: `block_chancemood_progress`

Tracks student progress:

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key |
| userid | INT | User ID |
| courseid | INT | Course ID |
| recommendid | INT | Recommendation ID (FK) |
| problem_type | VARCHAR(50) | Type of problems |
| completed_problems | INT | Count completed |
| target_problems | INT | Target count |
| current_success_rate | DECIMAL(5,2) | Current rate (0-1) |
| study_path_step | INT | Current step number |
| resources_viewed | INT | Resources accessed |
| last_practice | INT | Last practice timestamp |

## 🔌 AJAX API

### Endpoint: `/blocks/chancemood/ajax.php`

#### Actions

**1. Get Recommendations**
```javascript
{
  action: 'get_recommendations',
  courseid: 123,
  userid: 456 // optional, defaults to current user
}
```

**2. Generate New Recommendations**
```javascript
{
  action: 'generate_recommendations',
  courseid: 123,
  userid: 456
}
```

**3. Get Class Recommendations** (Teachers only)
```javascript
{
  action: 'get_class_recommendations',
  courseid: 123
}
```

**4. Mark Resource Viewed**
```javascript
{
  action: 'mark_resource_viewed',
  courseid: 123,
  resourceid: 789
}
```

**5. Update Progress**
```javascript
{
  action: 'update_progress',
  courseid: 123,
  problemtype: 'combination',
  completed: 5
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "priority": "high",
    "message": "조금 더 노력하면 돼요!",
    "weak_areas": [...],
    "problems": [...],
    "study_path": [...],
    "timestamp": 1642545600
  }
}
```

## 👩‍🏫 Teacher Dashboard

### Access

Navigate to: `/blocks/chancemood/teacher_dashboard.php?courseid=XXX`

Or click "View Teacher Dashboard" button in the block.

### Features

#### Summary Cards
- Total students
- Students needing urgent help
- High priority count
- Medium priority count

#### Common Weak Areas
- Visual tiles for each problem type
- Number of students struggling
- Average severity percentage
- Color-coded severity meters

#### Action Items
- Top 3 priority areas
- Suggested interventions
- Quick action buttons:
  - Create Lesson
  - View Students

#### Student Table
- All students with recommendations
- Current mood emoji
- Priority level
- Top weak areas
- Progress bar
- Detail view link

## 🎓 Usage Scenarios

### Scenario 1: Student Struggling with Combinations

**System Response:**
1. Identifies "Combination" as weak area (success rate: 35%)
2. Priority: HIGH
3. Recommends:
   - 3 easy combination problems
   - 4 medium combination problems
   - 2 video tutorials on nCr
   - Practice worksheet
4. Study Path:
   - Step 1: Review nCr formula (3 days)
   - Step 2: Practice 10 easy problems (1 week)
   - Step 3: Move to permutation (1 week)

**Student Sees:**
- 🟠 Orange mood indicator
- Message: "조금 더 노력하면 돼요!"
- Specific problems to solve
- Clear learning roadmap

### Scenario 2: Teacher Notices Class-Wide Issue

**Dashboard Shows:**
- 15 out of 30 students struggling with "Conditional Probability"
- Average severity: 72%
- Action: "조건부 확률 집중 수업 진행"

**Teacher Actions:**
1. Views affected students
2. Prepares targeted lesson
3. Assigns practice problems
4. Monitors progress through dashboard

## 🚀 Future Enhancements

### Planned Features (v2.0)

- [ ] **Machine Learning Integration**
  - Difficulty prediction
  - Success rate forecasting
  - Optimal problem sequencing

- [ ] **Adaptive Learning Paths**
  - Dynamic adjustment based on real-time progress
  - Personalized pacing
  - Mastery-based progression

- [ ] **Gamification**
  - Achievement badges
  - Streak tracking
  - Leaderboards (optional)
  - Progress milestones

- [ ] **Enhanced Analytics**
  - Time-to-mastery predictions
  - Learning style detection
  - Optimal study time recommendations

- [ ] **Collaboration Features**
  - Study groups based on similar weak areas
  - Peer tutoring suggestions
  - Collaborative problem solving

- [ ] **Mobile App Integration**
  - Push notifications for new recommendations
  - Offline problem practice
  - Progress sync

## 📚 Technical Implementation

### Key Classes

**`recommendation_engine.php`**
- Main recommendation logic
- Weak area analysis
- Problem recommendation
- Study path generation

**`ajax.php`**
- REST API endpoints
- Request handling
- Response formatting

**`teacher_dashboard.php`**
- Dashboard rendering
- Class-wide analytics
- Action item generation

### Performance Considerations

- **Caching**: Recommendations cached for 24 hours
- **Query Optimization**: Limited to 50 most recent problems
- **Async Loading**: AJAX prevents page blocking
- **Incremental Updates**: Only recalculate when needed

### Security

- Capability checks: `block/chancemood:viewmood`
- Teacher-only endpoints: `moodle/course:manageactivities`
- SQL injection prevention: Parameterized queries
- XSS protection: Output escaping

## 🔧 Configuration

### Admin Settings

**Site administration → Plugins → Blocks → Chance Mood**

- Enable Recommendations: On/Off
- Refresh Interval: 5-60 minutes
- Minimum Attempts: 3-10 (for reliable analysis)
- Recommendation Limit: 5-20 problems

### Per-Course Settings

- Teacher dashboard access
- Student view customization
- Resource links configuration

## 📖 Documentation

For complete documentation:
- **README.md**: Overview and installation
- **INSTALL.md**: Detailed installation guide
- **QUICKSTART_KO.md**: Korean quick start
- **RECOMMENDATIONS.md**: This file

## 💡 Tips for Teachers

1. **Check Dashboard Weekly**: Monitor student progress regularly
2. **Act on Urgent Priority**: Immediate intervention for struggling students
3. **Use Class-Wide Insights**: Adjust curriculum based on common weak areas
4. **Encourage Resource Use**: Remind students to check recommendations
5. **Track Effectiveness**: Monitor if recommendations improve performance

## 💡 Tips for Students

1. **Check Daily**: New recommendations based on recent attempts
2. **Follow Study Path**: Structured approach is more effective
3. **Use Resources**: Videos and tutorials reinforce concepts
4. **Track Progress**: Mark problems as completed
5. **Ask for Help**: Don't hesitate to consult teacher for high-priority areas

---

**Version**: 1.1
**Release Date**: 2025-01-18
**Author**: KAIST Touch Math Academy

For support, visit [GitHub Issues](https://github.com/yourusername/moodle-block_chancemood/issues)
