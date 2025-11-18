# Reading Time & Comprehension Summary Feature - Critical Decisions

## Overview
This document captures the key business and technical decisions that need to be made BEFORE development begins on the reading time tracking and comprehension summary feature.

---

## 1. COMPREHENSION SCORING ALGORITHM

### Decision: How do we calculate "comprehension"?

**Option A: Multi-Factor Weighted Average (RECOMMENDED)**
```
comprehension_score = 0.3 * reading_accuracy + 
                      0.4 * speed_efficiency + 
                      0.3 * first_attempt_success

Where:
- reading_accuracy = (first_attempt_correct ? 100 : 50 - attempts * 10)
- speed_efficiency = (avg_speed / baseline_speed) * 100 (capped at 100)
- first_attempt_success = (1 if correct on 1st attempt else 0) * 100
```

**Option B: Rule-Based Thresholds (SIMPLER)**
```
IF reading_time < 1/2 baseline AND first_attempt_correct THEN "excellent"
IF reading_time < baseline AND first_attempt_correct THEN "good"
IF reading_time > 2 * baseline AND NOT first_attempt_correct THEN "needs_help"
... etc
```

**Option C: Machine Learning Model (COMPLEX)**
```
Train model on labeled data:
- Input: reading_time, speed, attempts, problem_type, difficulty
- Output: comprehension_score (0-100)
- Would need annotated training data
```

**RECOMMENDATION**: Start with **Option A** - it's data-driven, explainable, and can be refined based on real data.

**DECISION NEEDED**: Which algorithm? Or hybrid approach?

---

## 2. READING SPEED BASELINES

### Decision: What reading speeds are "normal" by grade level?

**Baseline Framework Needed**:
```
Grade Level | Target WPM | Min WPM | Max WPM | Notes
3-4         | 100-120    | 80      | 140     |
5-6         | 130-150    | 110     | 170     |
7-8         | 160-180    | 140     | 200     |
```

**Additional Dimensions**:
- Should baselines differ by problem type? (narrative vs. math)
- Should baselines differ by problem difficulty? (1-5)
- Should we track individual student baselines or use grade-level only?

**DECISION NEEDED**: 
1. Baseline WPM values for each grade?
2. Should baselines be dynamic (improve over time)?
3. Per-student personalization or grade-level only?

---

## 3. COMPREHENSION INTERVENTION THRESHOLDS

### Decision: When do we flag a student as "needing help"?

**Possible Trigger Scenarios**:

```
IMMEDIATE INTERVENTION (Red Alert):
- Comprehension score < 40 for 3+ consecutive problems
- Reading speed > 3x baseline (not processing content)
- Reading speed < 0.5x baseline (severe struggle)
- 5+ attempts before getting problem correct
- Student abandons problem (gives up)

MONITOR INTERVENTION (Yellow Alert):
- Comprehension score 40-60 consistently
- Reading speed trending downward
- Accuracy declining over time

POSITIVE FEEDBACK (Green):
- Comprehension score improving
- Reading speed trending toward baseline
- First-attempt success rate increasing
```

**DECISION NEEDED**:
1. Specific threshold values for each grade?
2. Lookback window (last 3 problems? last day? last week)?
3. Who gets alerted? (Student, Teacher, Both)
4. What actions are suggested?

---

## 4. SUMMARY GENERATION FREQUENCY

### Decision: When should AI-generated summaries be created?

**Option A: On-Demand (Teacher-Triggered)**
- Pro: No wasted API calls, teacher controls timing
- Con: Teachers might forget to request, delayed insights
- Cost: ~$0.002-0.005 per summary

**Option B: Scheduled Batch (Nightly)**
- Pro: Consistent, predictable, batch-friendly
- Con: Delayed insights (generated at night, seen next morning)
- Cost: Lower per-student cost due to batching

**Option C: Real-Time (Immediate)**
- Pro: Instant feedback and insights
- Con: High API costs, storage requirements
- Cost: High volume of API calls

**Option D: Hybrid (Recommended)**
- Scheduled summaries generated nightly (background)
- On-demand summaries available but cached (with refresh button)
- Real-time feedback alerts generated when thresholds exceeded

**DECISION NEEDED**: Chosen approach and rationale?

---

## 5. SUMMARY PERSONALIZATION BY AUDIENCE

### Decision: Different summaries for different users?

**Student Summary** (Age-Appropriate):
```
"Great job! You read that problem at a good pace (165 words per 
minute). You solved it correctly on the first try! Keep up the 
excellent work."

vs.

"That problem took you 3 minutes - that's slower than usual. Did 
you find it confusing? Next time, try reading it once first before 
solving."
```

**Teacher Summary** (Diagnostic):
```
"Sarah's reading speed (158 WPM) is 15% below class average (186 WPM). 
However, her comprehension is strong (87/100). Recommend: monitor for 
reading support needs. Current trajectory: improving."
```

**Admin Summary** (Analytical):
```
"Module: Fractions - Class comprehension trend: +5% this week
Struggling students: 3 (10% of class). Primary issue: problem notation
Recommendation: Review notation before complex problems."
```

**DECISION NEEDED**:
1. Should summaries be grade-level appropriate for students?
2. What technical jargon is appropriate for teachers?
3. What level of detail for admin dashboards?

---

## 6. DATA RETENTION & ARCHIVAL POLICY

### Decision: How long do we keep reading data?

**Retention Strategy Options**:

**Option A: Keep Everything**
- Pro: Complete historical analysis
- Con: Storage costs increase over time
- Risk: Student privacy (too much historical data)

**Option B: Archive After Period**
- Keep raw events 6 months (active analysis)
- Archive to cold storage after 6 months
- Keep summaries indefinitely
- Delete on student withdrawal

**Option C: Aggregate-Only**
- Keep only daily/weekly/monthly summaries
- Delete raw event data after 7 days
- Pro: Minimal storage, privacy-friendly
- Con: No ability to drill into specifics later

**DECISION NEEDED**:
1. Retention period for raw events?
2. Archive strategy?
3. Deletion policy for graduated/withdrawn students?

---

## 7. FEEDBACK TRIGGER STRATEGY

### Decision: When/how do we show real-time feedback to students?

**Option A: Always Show**
- "You're reading at 95 WPM (target: 100-120)"
- Shown constantly while reading
- Pro: Maximum feedback
- Con: Can be distracting/anxiety-inducing

**Option B: Only When Threshold Exceeded**
- Only show if reading too fast/slow (>2 sigma from normal)
- Pro: Focuses on problems only
- Con: Students miss learning opportunity during good reads

**Option C: Summary After Problem**
- Show feedback only after submitting answer
- Pro: Not distracting during reading
- Con: Feedback less timely

**Option D: Teacher-Configurable**
- Teachers choose feedback level per module
- Pro: Maximum flexibility
- Con: More configuration burden

**DECISION NEEDED**: Feedback strategy and trigger approach?

---

## 8. PROBLEM WORD COUNT TRACKING

### Decision: How do we determine "words in problem"?

**Consideration**: For reading speed calculation, we need word count.

**Option A: Count at Problem Generation**
- Include word_count in problem metadata when created
- Use that value for all students
- Pro: Efficient
- Con: Doesn't account for problem content changes

**Option B: Calculate on Frontend**
- Count words in problem text when student loads it
- Send with reading metrics
- Pro: Accurate to what student sees
- Con: Requires frontend logic, potential accuracy issues

**Option C: Calculate on Backend**
- Receive text, calculate word count on server
- Store in reading_analytics
- Pro: Centralized, consistent
- Con: One more backend operation

**DECISION NEEDED**: Which approach and implementation method?

---

## 9. REREADING DETECTION

### Decision: How do we detect and measure rereading?

**Current Approach**:
- Track DOM blur/focus events
- Track scroll position changes
- If scroll goes backward = rereading

**Edge Cases**:
- Scrolling up to see image? (Not true rereading)
- Scrolling up to review before submitting? (Different from rereading)
- Multiple reads of same text? (Can't distinguish)

**DECISION NEEDED**:
1. What constitutes "rereading" for measurement?
2. Should we distinguish types of rereading?
3. How much does rereading affect comprehension score?

---

## 10. MOBILE VS DESKTOP READING METRICS

### Decision: Different baselines/algorithms for mobile?

**Considerations**:
- Mobile reading is typically slower (smaller screens)
- Mobile users may read differently (one-handed, distracted)
- Might need separate baselines
- Might need different feedback

**DECISION NEEDED**:
1. Track device type with reading metrics?
2. Different baselines for mobile vs desktop?
3. Different feedback messages?

---

## 11. SUPPORT FOR MULTIPLE LANGUAGES

### Decision: Reading metrics for non-English content?

**Considerations**:
- Reading speed differs significantly by language
- Korean: ~100-120 WPM (more complex characters)
- English: ~150-180 WPM
- Need language-specific baselines

**DECISION NEEDED**:
1. Support multiple languages from day 1?
2. Separate baselines per language?
3. Which languages to support initially?

---

## 12. ACCESSIBILITY FOR STUDENTS WITH DISABILITIES

### Decision: How to handle reading difficulties?

**Considerations**:
- Students with dyslexia may read slowly (but understand well)
- Standard baselines may flag false positives
- May need text-to-speech support
- May need alternative assessment methods

**DECISION NEEDED**:
1. How to identify and support students with reading disabilities?
2. Should comprehension score be different for these students?
3. Should feedback be different?
4. Need assistant/teacher notifications?

---

## Summary of Critical Decisions

| Decision | Options | Impact | Urgency |
|----------|---------|--------|---------|
| Comprehension Algorithm | A/B/C | Core feature | CRITICAL |
| Reading Speed Baselines | Grade-level values | Accuracy | CRITICAL |
| Intervention Thresholds | Specific scores | Student support | CRITICAL |
| Summary Frequency | On-demand/Scheduled/Hybrid | UX & costs | HIGH |
| Data Retention | 6mo/Archive/Aggregate | Storage & privacy | HIGH |
| Real-time Feedback | Always/OnThreshold/AfterSubmit | Student experience | HIGH |
| Mobile Metrics | Same/Different | Accuracy | MEDIUM |
| Multi-language | Support from start? | Scope | MEDIUM |
| Accessibility | Special handling? | Inclusion | MEDIUM |

---

## Recommended Decision Meeting Agenda

1. **Comprehension Scoring** (30 min)
   - Present Option A (multi-factor)
   - Discuss formula weights
   - Decide: approve, modify, or choose different option

2. **Baselines & Thresholds** (20 min)
   - Present research on grade-level reading speeds
   - Define WPM baselines per grade
   - Define intervention thresholds

3. **Summary & Feedback Strategy** (20 min)
   - Present on-demand + scheduled hybrid model
   - Decide on feedback trigger timing
   - Confirm audience-specific summary requirements

4. **Data & Compliance** (15 min)
   - Review retention and privacy requirements
   - Confirm FERPA/COPPA compliance approach
   - Decide on data lifecycle

5. **Scope & Extensions** (15 min)
   - Multi-language support requirements?
   - Accessibility considerations?
   - Mobile-specific adjustments?

**Total Time**: 100 minutes

---

## Decision Record Template

When decisions are made, document as:

```markdown
## Decision: [Name]
**Date**: [Date]
**Decision**: [Chosen option]
**Rationale**: [Why this choice]
**Implementation Details**: [How it will work]
**Assumptions**: [Underlying assumptions]
**Risks**: [Potential issues]
**Review Date**: [When to revisit]
```

---

## Related Documentation

For more context on these decisions, see:
- `/tasks/0004-reading-feature-architecture-deep-dive.md` - Technical implementation details
- `/tasks/0003-quick-reference-reading-feature.md` - Quick API/database reference
- `/tasks/0001-prd-ai-education-pipeline.md` - Section 8 (Success Metrics)

---

**Document Created**: November 18, 2025
**Next Review**: Before development sprint planning
**Owner**: Product & Engineering Teams

