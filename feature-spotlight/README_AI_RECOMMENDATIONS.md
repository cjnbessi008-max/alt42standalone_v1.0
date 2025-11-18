# AI Function Recommendation System

## 🎯 Overview

The AI Function Recommendation System is an intelligent, adaptive learning platform that provides personalized mathematical function recommendations based on student performance, learning patterns, and skill levels. This system extends the Feature Spotlight platform with cutting-edge AI-powered personalization.

## 🌟 Key Features

### 1. **Multiple Recommendation Strategies**

The system implements 5 distinct recommendation algorithms that can be used individually or combined:

#### **Hybrid Recommendation** (Default)
- Combines all strategies with weighted scoring
- Weights:
  - Skill Match: 30%
  - Historical Success Rate: 25%
  - Collaborative Filtering: 20%
  - Diversity: 15%
  - Recency: 10%

#### **Skill-Based Recommendations**
- Matches functions to student's current skill level
- Adaptive difficulty progression
- Prevents overwhelming or boring students

#### **Collaborative Filtering**
- "Students like you also succeeded with..."
- Finds similar students based on performance patterns
- Recommends functions that helped similar students

#### **Content-Based Filtering**
- Recommends functions similar to ones the student mastered
- Based on function type, complexity, and features
- Ensures conceptual continuity

#### **Sequential Learning Paths**
- Pre-designed curriculum sequences
- Progressive difficulty increase
- Teacher-curated learning journeys

### 2. **Student Learning Profiles**

Each student has a comprehensive profile tracking:

- **Skill Level**: beginner | intermediate | advanced | expert
- **Mastery Scores** (0-100 scale):
  - Polynomial functions
  - Trigonometric functions
  - Exponential functions
  - Rational functions
  - Calculus concepts
- **Learning Preferences**:
  - Preferred difficulty level
  - Learning pace
  - Visual learning preference
- **Performance Statistics**:
  - Total problems attempted
  - Success rate
  - Average time per problem
  - Last active date

### 3. **Function Library**

Pre-populated library with 13+ functions including:

**Beginner Level:**
- Basic quadratic: `x^2`
- Shifted quadratic: `x^2 - 4`
- Scaled quadratic: `2*x^2 + 3`

**Intermediate Level:**
- Standard cubic: `x^3 - 3*x`
- Complex cubic: `x^3 - 6*x^2 + 9*x + 1`
- Trigonometric: `sin(x)`, `cos(x)`

**Advanced Level:**
- Quartic: `x^4 - 4*x^3 + 4*x^2`
- Mixed functions: `x*sin(x)`
- Gaussian: `exp(-x^2)`

**Expert Level:**
- Rational: `x/(1 + x^2)`
- Exponential decay: `x^2*exp(-x)`
- Sinc function: `sin(x)/x`

Each function includes:
- Complexity score (0-100)
- Feature tags (maxima, minima, inflection points)
- Prerequisites
- Learning objectives
- Hints
- Statistical data (success rate, average time)

### 4. **Learning Paths**

Pre-defined sequential learning journeys:

1. **초급 과정: 이차함수 마스터** (Beginner: Quadratic Mastery)
   - Duration: ~30 minutes
   - 3 functions, gradual progression

2. **중급 과정: 미적분 기초** (Intermediate: Calculus Fundamentals)
   - Duration: ~60 minutes
   - 4 functions covering extrema and inflection points

3. **고급 과정: 복잡한 함수 분석** (Advanced: Complex Function Analysis)
   - Duration: ~90 minutes
   - Quartic, mixed, and exponential functions

4. **전문가 과정: 특수 함수** (Expert: Special Functions)
   - Duration: ~120 minutes
   - Rational, special, and advanced functions

### 5. **Intelligent Tracking & Analytics**

The system tracks:
- **Attempt History**: Every student interaction with functions
- **Feature Interactions**: Which features students clicked/identified
- **Time Spent**: Detailed time tracking per problem
- **Accuracy Scores**: Performance metrics
- **Recommendation Outcomes**: Whether recommended functions helped

## 🏗️ Architecture

### Database Schema

**Core Tables:**
1. `fs_student_profiles` - Student learning profiles and skill levels
2. `fs_function_library` - Pre-defined function repository
3. `fs_attempt_history` - Detailed attempt tracking
4. `fs_recommendations_log` - Recommendation audit trail
5. `fs_learning_paths` - Curated learning sequences
6. `fs_ai_recommendation_cache` - AI-generated recommendation cache

**Views:**
- `v_student_statistics` - Aggregated student performance
- `v_function_popularity` - Function usage and success metrics

### Backend Components

**PHP Classes:**
1. `RecommendationEngine.php` - Core recommendation logic
   - 500+ lines of sophisticated algorithms
   - Multiple strategy implementations
   - Caching and optimization

2. `recommendation_api.php` - RESTful API endpoints
   - GET `/get_recommendations` - Fetch personalized recommendations
   - GET `/get_student_profile` - Retrieve student profile
   - POST `/update_student_profile` - Update student data
   - POST `/record_attempt` - Log student attempts
   - GET `/get_learning_paths` - List available paths
   - GET `/get_function_details` - Function metadata
   - POST `/rate_recommendation` - Feedback collection
   - GET `/get_statistics` - Performance analytics

### Frontend Components

**JavaScript Modules:**
1. `recommendation-system.js` - Frontend recommendation controller
   - API communication
   - UI rendering
   - Event handling
   - Modal displays

**CSS Stylesheets:**
1. `recommendation.css` - Complete UI styling
   - Card layouts
   - Modal dialogs
   - Responsive design
   - Animations

## 🚀 Installation

### 1. Database Setup

```bash
# Install base schema first
mysql -u root -p < database/schema.sql

# Then install recommendation schema
mysql -u root -p < database/recommendation_schema.sql
```

### 2. Configuration

Edit `backend/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

define('FS_DB_NAME', 'feature_spotlight');
```

### 3. Test the System

Open `frontend/index_with_recommendations.html` in your browser.

## 📊 Usage Examples

### Basic Recommendation Request

```javascript
const recommendationSystem = new RecommendationSystem({
    userId: 123,
    language: 'ko',
    strategy: 'hybrid'
});

await recommendationSystem.init('recommendations-container');
```

### Change Recommendation Strategy

```javascript
// Switch to skill-based recommendations
await recommendationSystem.loadRecommendations(5, 'skill_based');

// Use collaborative filtering
await recommendationSystem.loadRecommendations(5, 'collaborative');
```

### Record Student Attempt

```javascript
await recommendationSystem.recordAttempt(
    functionId: 5,
    isCorrect: true,
    timeSpent: 45,
    {
        hints_used: 1,
        features_clicked: ['local_maximum', 'inflection_point'],
        accuracy_score: 85.5
    }
);
```

### Update Student Profile

```javascript
const response = await fetch(api_url, {
    method: 'POST',
    body: JSON.stringify({
        action: 'update_student_profile',
        user_id: 123,
        skill_level: 'intermediate',
        calculus_mastery: 75.5,
        preferred_difficulty: 'medium'
    })
});
```

## 🧠 Recommendation Algorithm Details

### Scoring Breakdown

Each candidate function receives a composite score based on:

#### 1. Skill Match Score (30% weight)
- Compares function difficulty to student mastery level
- Perfect match (±10 points): 100 points
- Good match (±20 points): 80 points
- Acceptable (±30 points): 60 points
- Poor match (>30 points): 40 points

#### 2. Success Rate Score (25% weight)
- Historical success rate of the function
- Direct percentage (0-100)

#### 3. Collaborative Score (20% weight)
- Find 5-10 most similar students
- Similarity based on mastery levels across all categories
- Count how many succeeded with this function
- Score = (success_count / total_similar) * 100

#### 4. Diversity Score (15% weight)
- Encourages trying new function types
- Never attempted type: 100 points
- 1-2 attempts: 80 points
- 3-5 attempts: 60 points
- 5+ attempts: 40 points

#### 5. Recency Score (10% weight)
- Penalizes recently attempted functions
- Never attempted: 100 points
- 7+ days ago: 100 points
- 3-7 days ago: 70 points
- 1-3 days ago: 50 points
- <1 day ago: 20 points

### Final Score Calculation

```
final_score = (skill_match * 0.30) +
              (success_rate * 0.25) +
              (collaborative * 0.20) +
              (diversity * 0.15) +
              (recency * 0.10)
```

Functions are ranked by final score, and top N are returned.

## 📈 Analytics & Insights

### Student Statistics View

```sql
SELECT * FROM v_student_statistics WHERE user_id = ?;
```

Returns:
- Overall success rate
- Average accuracy
- Unique functions attempted
- Last attempt date

### Function Popularity View

```sql
SELECT * FROM v_function_popularity ORDER BY engagement_score DESC;
```

Returns:
- Total attempts
- Unique users
- Success rate
- Average completion time
- Engagement score

## 🎨 UI/UX Features

### Recommendation Cards

Each recommendation displays:
- **Rank** (#1, #2, #3...)
- **Difficulty Badge** (color-coded)
- **Function Expression** (syntax highlighted)
- **Feature Badges** (maxima, minima, inflection)
- **Confidence Bar** (visual score representation)
- **Reasoning** ("Why this function?")
- **Score Breakdown** (expandable details)
- **Action Buttons** (Analyze, View Details)

### Function Details Modal

Clicking "View Details" shows:
- Full function metadata
- Learning objectives
- Prerequisites
- Hints
- Statistical insights
- Success rates from other students

### Strategy Selector

Dropdown to switch between:
- 통합 추천 (Hybrid)
- 실력 기반 (Skill-Based)
- 협업 필터링 (Collaborative)
- 학습 경로 (Learning Path)

## 🔮 Future Enhancements

### Planned Features

1. **Claude AI Integration**
   - Natural language explanations of why functions are recommended
   - Personalized learning advice
   - Adaptive hint generation

2. **Advanced Analytics**
   - Learning curve visualization
   - Strength/weakness heatmaps
   - Predictive success modeling

3. **Social Features**
   - Study groups
   - Peer recommendations
   - Leaderboards

4. **Adaptive Difficulty**
   - Real-time difficulty adjustment
   - Dynamic complexity scoring
   - Auto-generated variations

5. **Multi-modal Learning**
   - Video tutorials for functions
   - Interactive visualizations
   - Step-by-step solutions

## 🧪 Testing

### Test Data

The system includes sample data for testing:
- 13 pre-defined functions across all difficulty levels
- 4 learning paths
- Feature definitions with Korean/English labels

### Test Users

Create test profiles:

```sql
INSERT INTO fs_student_profiles (user_id, skill_level, calculus_mastery)
VALUES (1, 'beginner', 25.0);

INSERT INTO fs_student_profiles (user_id, skill_level, calculus_mastery)
VALUES (2, 'intermediate', 55.0);
```

### Test Recommendations

```bash
# Get recommendations for beginner user
curl "http://localhost/feature-spotlight/backend/recommendation_api.php?action=get_recommendations&user_id=1&count=5&strategy=hybrid"
```

## 📚 API Documentation

Full API documentation available in `docs/API.md`

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/get_recommendations` | GET | Fetch personalized recommendations |
| `/get_student_profile` | GET | Get student profile and statistics |
| `/update_student_profile` | POST | Update student data |
| `/record_attempt` | POST | Log student attempt |
| `/get_learning_paths` | GET | List available learning paths |
| `/get_function_details` | GET | Get function metadata |
| `/rate_recommendation` | POST | Submit feedback |
| `/get_statistics` | GET | Retrieve analytics |

## 🤝 Contributing

This system is designed to be extended. To add new recommendation strategies:

1. Add method to `RecommendationEngine.php`:
```php
private function getMyCustomRecommendations($count) {
    // Your algorithm here
    return $recommendations;
}
```

2. Register in `getRecommendations()` switch statement
3. Add to frontend strategy dropdown
4. Test and submit PR

## 📄 License

MIT License - KAIST Touch Math Academy

## 👥 Authors

KAIST Touch Math Academy Development Team
- AI/ML Integration
- Educational Psychology Consultation
- Full-Stack Development

## 🙏 Acknowledgments

- Anthropic Claude for AI capabilities
- Moodle community for LMS standards
- KAIST students for testing and feedback

---

**Version**: 2.0.0
**Last Updated**: 2025-11-18
**Status**: Production Ready ✅
