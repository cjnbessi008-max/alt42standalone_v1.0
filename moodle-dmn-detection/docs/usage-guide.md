# Usage Guide

DMN Dropout Detection System - User Guide for Teachers

## Overview

The DMN (Default Mode Network) Dropout Detection System monitors student engagement in real-time and alerts teachers when students show signs of losing focus during learning activities.

## For Teachers

### Accessing the Dashboard

1. Login to your Moodle course
2. Navigate to the DMN Detection dashboard (link in course menu)
3. View real-time engagement data for all students

### Understanding Engagement Scores

**Engagement Score** ranges from 0 to 1:
- **0.8 - 1.0**: Highly engaged (green)
- **0.5 - 0.79**: Moderately engaged (yellow)
- **0.0 - 0.49**: Low engagement / At risk (red)

The score is calculated based on:
- Active time vs. total time (40%)
- Answer accuracy (30%)
- Response patterns (20%)
- Dropout events (10% penalty)

### Dropout Signal Types

The system detects 9 types of dropout signals:

#### 1. Inactivity Signals

**5-Minute Inactivity** (Medium Severity)
- No mouse or keyboard activity for 5+ minutes
- May indicate: distraction, thinking, or stepped away

**10-Minute Inactivity** (High Severity)
- No activity for 10+ minutes
- May indicate: student left, device issues, or complete disengagement

**Action**: Check on student, send message, or approach in classroom

#### 2. Page Visibility Signals

**Prolonged Page Hidden** (Medium Severity)
- Learning page hidden/minimized for 2+ minutes
- May indicate: checking other tabs, social media, or other distractions

**Frequent Page Switching** (Medium Severity)
- Switching tabs 5+ times per hour
- May indicate: multitasking or distraction

**Action**: Remind students to focus on learning activity

#### 3. Response Pattern Signals

**Response Too Fast** (Medium Severity)
- Answering questions in 20% of average time or less
- May indicate: random guessing, not reading questions

**Response Too Slow** (Low Severity)
- Answering questions 3x slower than average
- May indicate: confusion, difficulty, or distraction

**Action**: Review question difficulty, provide hints, or offer help

#### 4. Accuracy Signals

**Accuracy Drop** (High Severity)
- Recent accuracy drops below 50% of historical performance
- May indicate: fatigue, frustration, or lack of understanding

**Action**: Provide additional support, review concepts, or suggest break

#### 5. Clicking Pattern Signals

**Random Clicking** (Medium Severity)
- 20+ clicks in random locations within 30 seconds
- May indicate: frustration, boredom, or trying to skip ahead

**Repetitive Clicking** (Low Severity)
- 10+ clicks in same location within 60 seconds
- May indicate: stuck, confused, or impatient

**Action**: Check for technical issues or student confusion

### Receiving Alerts

#### Real-time Alerts

When a dropout signal is detected, you'll receive:

1. **Visual Alert**: Red notification badge on dashboard
2. **Sound Alert** (optional): Audio notification
3. **Desktop Notification** (if enabled): Browser notification

#### Alert Contents

Each alert shows:
- Student name
- Dropout type
- Severity level
- Time detected
- Current engagement score
- Recommended action

### Configuring Alert Preferences

Navigate to **Settings** > **Alert Configuration**

#### Alert Types

Choose which signals to monitor:
- ☑ Inactivity
- ☑ Page switching
- ☑ Accuracy drops
- ☑ Random behavior
- ☑ All (recommended)

#### Severity Threshold

Choose minimum severity to alert:
- **Low**: All signals (may be noisy)
- **Medium**: Moderate and high severity (recommended)
- **High**: Only critical signals

#### Notification Methods

- **WebSocket**: Real-time dashboard alerts (default)
- **Email**: Email notifications (for offline monitoring)
- **Both**: Maximum awareness (recommended for large classes)

### Viewing Student Engagement

#### Individual Student View

1. Click on student name in dashboard
2. View detailed engagement data:
   - Current session engagement score
   - Session start time and duration
   - Recent dropout events
   - Problem-solving statistics
   - Historical engagement trends

#### Class Overview

Dashboard shows:
- Active students count
- Average class engagement
- Students at risk (engagement < 0.5)
- Total dropout events today
- Trending patterns

### Taking Action on Alerts

#### Immediate Actions

**In Classroom**:
1. Approach student discreetly
2. Check if they need help
3. Verify no technical issues

**Online/Remote**:
1. Send private message via Moodle
2. Initiate video call if available
3. Provide additional resources

#### Follow-up Actions

1. **Log the incident**: Add notes to student record
2. **Adjust difficulty**: If multiple students struggling
3. **Schedule check-in**: For persistent issues
4. **Contact parents**: For repeated disengagement (if applicable)

### Best Practices

#### Do's

✅ Use as early warning system, not punishment
✅ Combine with qualitative observations
✅ Adjust thresholds based on activity type
✅ Provide positive reinforcement for engagement
✅ Review weekly trends, not just real-time data

#### Don'ts

❌ Don't publicly call out students based on alerts
❌ Don't rely solely on automated data
❌ Don't ignore persistent patterns
❌ Don't use data for grading (privacy concern)
❌ Don't assume guilt - always verify

## For Students

### What is Being Tracked?

The system monitors:
- ✅ Mouse and keyboard activity timing
- ✅ Page visibility (tab switching)
- ✅ Problem-solving time and accuracy
- ✅ Click patterns

The system does NOT track:
- ❌ Specific keystrokes or content typed
- ❌ Screenshots or screen recordings
- ❌ Browser history outside learning pages
- ❌ Personal data or communications

### Privacy

All tracking:
- Only occurs during active learning sessions
- Is limited to course-related pages
- Is used only to improve learning support
- Complies with educational privacy regulations

### How to Stay Engaged

Tips to maintain high engagement:
1. Minimize distractions (close other tabs)
2. Take breaks when needed (logout properly)
3. Read questions carefully
4. Ask for help when stuck
5. Stay focused on learning activity

## API Usage (For Developers)

### Track Custom Events

```javascript
// Start a problem
DMNTracker.startProblem('problem-123', {
  type: 'multiple_choice',
  difficulty: 'medium'
});

// Submit answer
DMNTracker.submitProblem('problem-123', userAnswer, isCorrect);

// Get current stats
const stats = DMNTracker.getStats();
console.log(stats);
```

### Query Engagement Data

```bash
# Get student engagement
curl "http://api-server:5000/api/students/123/engagement-score?courseId=456"

# Get dropout events
curl "http://api-server:5000/api/dropout-events?student_id=123&course_id=456"

# Get teacher dashboard
curl "http://api-server:5000/api/dashboard/teacher/999?courseId=456"
```

### Configure Alerts

```bash
# Get current config
curl "http://api-server:5000/api/alerts/config?teacherId=999&courseId=456"

# Update config
curl -X POST "http://api-server:5000/api/alerts/config" \
  -H "Content-Type: application/json" \
  -d '{
    "teacher_id": 999,
    "course_id": 456,
    "alert_type": "all",
    "severity_threshold": "medium",
    "notification_method": "both",
    "is_enabled": true
  }'
```

## Troubleshooting

### Tracker Not Working

**Check:**
1. JavaScript console for errors
2. Tracker initialized: `DMNTracker.getStats()`
3. API endpoint accessible
4. User logged into Moodle

### No Alerts Received

**Check:**
1. Alert configuration enabled
2. Severity threshold not too high
3. WebSocket connection active
4. Browser notifications enabled

### Inaccurate Engagement Scores

**Possible causes:**
1. Activity type not suitable for tracking (e.g., video watching)
2. Students working offline then submitting
3. Technical issues causing false inactivity

**Solutions:**
- Adjust thresholds for specific activities
- Disable tracking for unsuitable activity types
- Review logs for technical errors

## Support

For technical issues:
- Check `/docs/installation.md`
- Review API logs: `/logs/dmn_api.log`
- Database logs: MySQL error log

For questions:
- Email: support@example.com
- Documentation: https://docs.example.com
- GitHub Issues: https://github.com/example/dmn-detection
