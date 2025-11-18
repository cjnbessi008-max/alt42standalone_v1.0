# Thought Efficiency Score (TES) Model
## 시간 대비 사고 효율 측정 시스템

**Version**: 1.0
**Date**: 2025-11-18
**Target LMS**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)

---

## 1. Executive Summary

The **Thought Efficiency Score (TES)** is a comprehensive metric that measures how effectively students solve educational problems relative to the time invested. Unlike traditional accuracy-only metrics, TES evaluates the quality of thinking processes by considering:

- **Speed of correct responses**
- **Pattern of attempts** (first-try success vs. trial-and-error)
- **Consistency across problem types**
- **Improvement trajectory over time**

### Key Formula
```
TES = (Correctness × 0.40) + (Speed × 0.30) + (First-Try Success × 0.20) + (Consistency × 0.10)
```

Score range: **0-100** (normalized to Moodle grading scale)

---

## 2. Core Metrics Definition

### 2.1 Correctness Score (40% weight)

**Definition**: Percentage of correct answers within a module or problem set.

**Calculation**:
```
Correctness = (Correct Attempts / Total Attempts) × 100
```

**Example**:
- Student attempts 20 problems
- 16 answers are correct
- Correctness = (16/20) × 100 = 80%

**Rationale**: Accuracy is fundamental but shouldn't be the only factor. A student who takes 10 minutes per problem with 100% accuracy may be less efficient than one who completes them in 2 minutes with 90% accuracy.

---

### 2.2 Speed Score (30% weight)

**Definition**: How quickly the student solves problems compared to the cohort average.

**Calculation**:
```
Speed_Raw = Cohort_Median_Time / Student_Average_Time
Speed_Normalized = min(100, Speed_Raw × 100)
```

**Example**:
- Cohort median time per problem: 120 seconds
- Student average time: 80 seconds
- Speed_Raw = 120/80 = 1.5
- Speed_Normalized = min(100, 1.5 × 100) = 100

**Boundary Conditions**:
- If student is faster than cohort: Score approaches 100
- If student is slower: Score decreases proportionally
- Cap at 100 to prevent outliers from skewing results
- Minimum time threshold: 5 seconds (prevents random clicking)

**Rationale**: Efficiency includes time management. However, we normalize against cohort to account for problem difficulty variations.

---

### 2.3 First-Try Success Rate (20% weight)

**Definition**: Percentage of problems solved correctly on the first attempt (no hints, no retries).

**Calculation**:
```
First_Try_Success = (First_Attempt_Correct / Total_Problems) × 100
```

**Example**:
- Total problems: 20
- Solved on first try: 14
- Used hints/retries: 6
- FTS = (14/20) × 100 = 70%

**Rationale**: This metric captures problem-solving intuition and deep understanding. Students who rely heavily on trial-and-error demonstrate lower thinking efficiency even if they eventually reach correct answers.

---

### 2.4 Consistency Score (10% weight)

**Definition**: Standard deviation of performance across different problem types, inverted to reward stability.

**Calculation**:
```
Problem_Type_Scores = [score_type1, score_type2, ..., score_typeN]
Std_Dev = standard_deviation(Problem_Type_Scores)
Consistency = max(0, 100 - (Std_Dev × 2))
```

**Example**:
- Fractions module with 3 types: visualization, addition, subtraction
- Type scores: [95%, 85%, 90%]
- Std_Dev = 5.0
- Consistency = max(0, 100 - (5.0 × 2)) = 90

**Rationale**: A student who excels at visualization but struggles with operations has uneven understanding. High consistency indicates robust conceptual knowledge.

---

## 3. Overall TES Calculation

### 3.1 Weighted Composite Score

```python
def calculate_tes(student_data, cohort_data):
    """
    Calculate Thought Efficiency Score

    Args:
        student_data: {
            'correct_attempts': int,
            'total_attempts': int,
            'avg_time_seconds': float,
            'first_try_correct': int,
            'total_problems': int,
            'problem_type_scores': List[float]
        }
        cohort_data: {
            'median_time_seconds': float
        }

    Returns:
        float: TES score (0-100)
    """

    # Correctness (40%)
    correctness = (student_data['correct_attempts'] /
                   student_data['total_attempts']) * 100

    # Speed (30%)
    speed_raw = cohort_data['median_time_seconds'] / student_data['avg_time_seconds']
    speed = min(100, speed_raw * 100)

    # First-Try Success (20%)
    fts = (student_data['first_try_correct'] /
           student_data['total_problems']) * 100

    # Consistency (10%)
    import numpy as np
    std_dev = np.std(student_data['problem_type_scores'])
    consistency = max(0, 100 - (std_dev * 2))

    # Weighted composite
    tes = (correctness * 0.40 +
           speed * 0.30 +
           fts * 0.20 +
           consistency * 0.10)

    return round(tes, 2)
```

---

### 3.2 Grade Mapping to Moodle

Moodle 3.7 typically uses 0-100 scale. TES maps directly:

| TES Range | Moodle Grade | Letter Grade (if applicable) | Performance Level |
|-----------|--------------|------------------------------|-------------------|
| 90-100    | 90-100       | A                            | Excellent Efficiency |
| 80-89     | 80-89        | B                            | Good Efficiency |
| 70-79     | 70-79        | C                            | Satisfactory Efficiency |
| 60-69     | 60-69        | D                            | Below Average Efficiency |
| 0-59      | 0-59         | F                            | Poor Efficiency |

**Pass Threshold**: TES ≥ 70 (configurable per module)

---

## 4. Efficiency Insights for Teachers

### 4.1 Student-Level Insights

**High Efficiency (TES > 85)**:
- "Student demonstrates strong problem-solving intuition"
- "Consistently solves problems quickly and accurately"
- "Minimal reliance on hints or multiple attempts"

**Medium Efficiency (TES 70-85)**:
- "Student understands concepts but may benefit from practice"
- "Some inconsistency across problem types detected"
- "Consider targeted review for weaker areas"

**Low Efficiency (TES < 70)**:
- "Student struggles with time management or accuracy"
- "Heavy reliance on trial-and-error approach"
- "Recommend intervention: tutoring or prerequisite review"

---

### 4.2 Cohort-Level Analytics

**Dashboard Metrics**:
1. **Average TES**: Cohort mean TES score
2. **TES Distribution**: Histogram of score ranges
3. **Top Performers**: Students in top 10% by TES
4. **At-Risk Students**: Students with TES < 60
5. **Improvement Trends**: Week-over-week TES changes

**Comparative Analysis**:
```
Student TES: 78
Cohort Average: 72
Percentile Rank: 68th percentile

Breakdown:
- Correctness: 85% (cohort avg: 80%)
- Speed: 95% (cohort avg: 75%) ← Strength
- First-Try: 60% (cohort avg: 70%) ← Weakness
- Consistency: 80% (cohort avg: 85%)
```

---

## 5. Implementation Requirements

### 5.1 Data Collection Points

**Per Problem Attempt**:
- `problem_id`: UUID
- `student_id`: UUID
- `attempted_at`: Timestamp
- `time_spent_seconds`: Integer
- `is_correct`: Boolean
- `attempt_number`: Integer (1 for first try)
- `hints_used`: Integer
- `problem_type`: String (e.g., "visualization", "addition")

**Minimum Sample Size**:
- At least **10 problems** attempted before calculating TES
- If < 10 attempts: Display "Insufficient Data" instead of score

---

### 5.2 Calculation Triggers

**Real-Time Calculation**:
- After each problem submission
- Update student's TES in database

**Batch Recalculation**:
- Nightly job to recalculate cohort statistics
- Update percentile ranks
- Regenerate teacher insights

**API Endpoint**:
```
POST /api/efficiency/calculate
Body: {
    "student_id": "uuid",
    "module_id": "uuid",
    "force_recalc": false
}
```

---

### 5.3 Moodle Integration Points

**Grade Passback**:
```php
// Moodle gradebook item creation
$grade_item = new grade_item();
$grade_item->courseid = $course_id;
$grade_item->itemtype = 'mod';
$grade_item->itemmodule = 'lti';
$grade_item->iteminstance = $lti_instance_id;
$grade_item->itemname = 'Thought Efficiency Score';
$grade_item->grademax = 100;
$grade_item->grademin = 0;
$grade_item->insert();

// Update student grade
$grade_grade = new grade_grade();
$grade_grade->itemid = $grade_item->id;
$grade_grade->userid = $moodle_user_id;
$grade_grade->finalgrade = $tes_score; // 0-100
$grade_grade->insert();
```

**LTI Launch Context**:
- Capture `context_id` (Moodle course ID)
- Capture `user_id` (Moodle user ID)
- Map to internal student records

---

## 6. Sample Scenarios

### Scenario 1: High Performer
```
Student: Alice
Module: Fractions (20 problems)

Data:
- Correct: 19/20 (95%)
- Avg time: 45 seconds (cohort median: 90s)
- First-try: 18/20 (90%)
- Type scores: [95%, 95%, 95%] (std_dev: 0)

Calculation:
- Correctness: 95 × 0.40 = 38.0
- Speed: min(100, (90/45)×100) = 100 × 0.30 = 30.0
- FTS: 90 × 0.20 = 18.0
- Consistency: max(0, 100-(0×2)) = 100 × 0.10 = 10.0
TES = 38.0 + 30.0 + 18.0 + 10.0 = 96.0
```

**Teacher Insight**: "Alice demonstrates exceptional efficiency. She solves problems quickly with near-perfect accuracy and strong first-try success."

---

### Scenario 2: Slow but Accurate
```
Student: Bob
Module: Fractions (20 problems)

Data:
- Correct: 20/20 (100%)
- Avg time: 180 seconds (cohort median: 90s)
- First-try: 20/20 (100%)
- Type scores: [100%, 100%, 100%] (std_dev: 0)

Calculation:
- Correctness: 100 × 0.40 = 40.0
- Speed: min(100, (90/180)×100) = 50 × 0.30 = 15.0
- FTS: 100 × 0.20 = 20.0
- Consistency: 100 × 0.10 = 10.0
TES = 40.0 + 15.0 + 20.0 + 10.0 = 85.0
```

**Teacher Insight**: "Bob has perfect accuracy but slower pace. Consider strategies to improve speed while maintaining accuracy."

---

### Scenario 3: Fast but Inconsistent
```
Student: Charlie
Module: Fractions (20 problems)

Data:
- Correct: 14/20 (70%)
- Avg time: 30 seconds (cohort median: 90s)
- First-try: 8/20 (40%)
- Type scores: [90%, 50%, 70%] (std_dev: 20)

Calculation:
- Correctness: 70 × 0.40 = 28.0
- Speed: min(100, (90/30)×100) = 100 × 0.30 = 30.0
- FTS: 40 × 0.20 = 8.0
- Consistency: max(0, 100-(20×2)) = 60 × 0.10 = 6.0
TES = 28.0 + 30.0 + 8.0 + 6.0 = 72.0
```

**Teacher Insight**: "Charlie solves problems quickly but shows inconsistency. Focus on subtraction concepts where performance is weakest."

---

## 7. Privacy & Ethical Considerations

### 7.1 Data Privacy
- TES scores are visible to:
  - The student themselves
  - Their assigned teachers
  - Course administrators
- Cohort comparisons are **anonymized**
- Percentile rankings do not reveal individual identities

### 7.2 Fairness
- Accommodations for students with disabilities:
  - Time multipliers for IEP/504 students
  - Option to exclude speed component
- Cultural considerations:
  - Configurable per course/institution
  - Teachers can adjust weights

### 7.3 Transparency
- Students see breakdown of their TES components
- Clear explanations of what each metric measures
- Option to view historical trends

---

## 8. Future Enhancements

### Phase 2 (Months 6-12)
- **Adaptive Difficulty**: Adjust problem difficulty based on TES
- **Predictive Analytics**: Forecast final exam performance from TES trends
- **Peer Comparison Groups**: Compare within similar-ability cohorts

### Phase 3 (Year 2+)
- **Machine Learning**: Train models to identify optimal TES weights per subject
- **Multi-Module Aggregation**: Overall student TES across all courses
- **Teacher Effectiveness**: Correlate teaching strategies with student TES improvements

---

## 9. Validation Plan

### 9.1 Pilot Study
- Run with 50 students for 4 weeks
- Compare TES to traditional test scores
- Gather teacher feedback on insights quality

### 9.2 Success Criteria
- Correlation with final exam scores: r > 0.70
- Teacher satisfaction rating: > 4.0/5.0
- Student understanding of TES: > 80%

### 9.3 Iteration
- Adjust weights based on pilot data
- Refine insight generation algorithms
- Optimize calculation performance

---

## 10. Technical Specifications

### Performance Requirements
- TES calculation: < 100ms per student
- Dashboard load time: < 2 seconds for 100 students
- Real-time updates: < 500ms after submission

### Database Requirements
- Indexed queries for cohort statistics
- Partitioning for historical data (> 6 months)
- Caching for frequently accessed TES scores

### API Rate Limits
- Grade passback to Moodle: Max 10/second
- TES calculation requests: Max 100/second
- Dashboard analytics: Max 50/second

---

**Document Status**: Complete - Ready for Implementation
**Next Steps**: Create database schema and API specifications
**Dependencies**: Requires Moodle LTI 1.3 integration (see `lms-integration-architecture.md`)
