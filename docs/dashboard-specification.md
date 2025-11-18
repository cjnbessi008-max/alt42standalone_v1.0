# Analytics Dashboard Specification

**Version**: 1.0
**Date**: 2025-11-18
**Purpose**: Teacher and Student Efficiency Analytics Dashboards

---

## 1. Overview

This document specifies the user interface and user experience for two analytics dashboards:

1. **Teacher Dashboard**: Cohort-level analytics, student performance tracking, insights
2. **Student Dashboard**: Individual TES scores, personal trends, peer comparisons

---

## 2. Teacher Dashboard

### 2.1 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  AI Education System - Teacher Dashboard                      │
│  Module: Fractions Module                     Teacher: Kim Lee │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Cohort Overview    │  │  Performance Dist.  │            │
│  │                     │  │                     │            │
│  │  50 Students        │  │  ████░░░░░░ A (8)   │            │
│  │  Avg TES: 72.0      │  │  ██████░░░░ B (12)  │            │
│  │  Median: 70.0       │  │  █████████░ C (18)  │            │
│  │  Range: 45-98       │  │  ███░░░░░░░ D (7)   │            │
│  └─────────────────────┘  │  ██░░░░░░░░ F (5)   │            │
│                            └─────────────────────┘            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Component Breakdown (Cohort Averages)                    ││
│  │                                                            ││
│  │  Correctness:    ████████░░ 78.5%                         ││
│  │  Speed:          ███████░░░ 72.3%                         ││
│  │  First-Try:      ██████░░░░ 65.2%  ← Weakest area        ││
│  │  Consistency:    ████████░░ 80.1%                         ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  🔴 Urgent Insights (2)                                   ││
│  │                                                            ││
│  │  • Charlie Park: TES dropped 13 points (78→65)            ││
│  │    Actions: [Schedule Tutoring] [View Details]            ││
│  │                                                            ││
│  │  • Overall speed declining 15% in 2 weeks                 ││
│  │    Actions: [Review Difficulty] [Check Engagement]        ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Student List (Sort by: TES ▼ | Name | Last Activity)    ││
│  ├────┬────────────────┬──────┬───────┬──────────┬──────────┤│
│  │ #  │ Name           │ TES  │ Grade │ Trend    │ Actions  ││
│  ├────┼────────────────┼──────┼───────┼──────────┼──────────┤│
│  │ 1  │ Alice Kim      │ 96   │ A     │ ↗ +3     │ [View]   ││
│  │ 2  │ Bob Lee        │ 94   │ A     │ → ±0     │ [View]   ││
│  │ 3  │ Carol Song     │ 88   │ B     │ ↗ +5     │ [View]   ││
│  │... │ ...            │ ...  │ ...   │ ...      │ ...      ││
│  │48  │ Charlie Park   │ 65   │ D     │ ↘ -13 🔴 │ [View]   ││
│  │49  │ David Jung     │ 52   │ F     │ ↘ -8  🔴 │ [View]   ││
│  │50  │ Emma Han       │ 48   │ F     │ ↘ -5  🔴 │ [View]   ││
│  └────┴────────────────┴──────┴───────┴──────────┴──────────┘│
└────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Cohort Overview Card

**Data Displayed**:
- Total number of students
- Average TES score
- Median TES score
- TES range (min-max)

**Visual Elements**:
- Large numbers with trend indicators
- Color coding:
  - Green: Avg TES > 80
  - Yellow: Avg TES 70-80
  - Red: Avg TES < 70

**API Endpoint**: `GET /api/efficiency/dashboard/{module_id}`

---

### 2.3 Performance Distribution Chart

**Chart Type**: Horizontal bar chart

**Data Displayed**:
- Number of students in each grade band (A, B, C, D, F)
- Percentage of total in each band

**Interactions**:
- Click on a bar → Filter student list to that grade band
- Hover → Show exact numbers and percentages

**Color Scheme**:
- A (90-100): Dark green
- B (80-89): Light green
- C (70-79): Yellow
- D (60-69): Orange
- F (0-59): Red

---

### 2.4 Component Breakdown

**Chart Type**: Horizontal progress bars

**Data Displayed**:
- Cohort average for each TES component:
  - Correctness (target: 40% weight)
  - Speed (target: 30% weight)
  - First-Try Success (target: 20% weight)
  - Consistency (target: 10% weight)

**Interactions**:
- Hover → Show detailed stats (min, max, std dev)
- Highlight weakest component with warning icon

---

### 2.5 Urgent Insights Panel

**Purpose**: Alert teachers to students needing intervention

**Data Displayed**:
- Priority level (🔴 High, 🟡 Medium)
- Insight title (brief description)
- Recommended actions (clickable buttons)

**Insight Types**:
1. **Student at-risk**: TES < 60 or declined > 10 points
2. **Cohort trend alert**: Avg TES declining > 5% week-over-week
3. **Bottleneck detected**: > 50% students struggling with same problem type

**Actions**:
- **Schedule Tutoring**: Opens calendar/email template
- **View Details**: Navigate to student detail page
- **Dismiss**: Hide insight (mark as acknowledged)

**API Endpoint**: `GET /api/efficiency/insights/{teacher_id}`

---

### 2.6 Student List Table

**Columns**:
1. **Rank**: Position by TES score
2. **Name**: Student name (linked to detail page)
3. **TES**: Current TES score (colored by grade)
4. **Grade**: Letter grade (A-F)
5. **Trend**: Week-over-week change with arrow (↗↘→)
6. **Actions**: [View] button to detail page

**Sorting**:
- Default: TES descending
- Options: Name (A-Z), Last Activity (recent first)

**Filtering**:
- Grade band (A, B, C, D, F)
- At-risk only (TES < 70)
- Active in last 7 days

**Pagination**: 20 students per page

**API Endpoint**: `GET /api/efficiency/dashboard/{module_id}`

---

### 2.7 Student Detail Modal/Page

**Triggered by**: Clicking [View] in student list

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Student: Charlie Park                               [X] Close │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │  TES Score          │  │  Trend (Last 30 Days)           │ │
│  │                     │  │                                 │ │
│  │       65            │  │   90 ┤                         │ │
│  │    D Grade          │  │   80 ┤        ╱╲               │ │
│  │  35th Percentile    │  │   70 ┤      ╱╯  ╲              │ │
│  │                     │  │   60 ┤    ╱      ╲╲            │ │
│  └─────────────────────┘  │   50 ┤   ╱         ╲           │ │
│                            │      └─────────────────────────│ │
│  ┌─────────────────────┐  │     Nov 1        Nov 18         │ │
│  │  Components         │  └─────────────────────────────────┘ │
│  │  Correctness:  70%  │                                      │
│  │  Speed:        85%  │  ┌───────────────────────────────┐  │
│  │  First-Try:    40%  │← │  🔴 Recommended Actions       │  │
│  │  Consistency:  60%  │  │                               │  │
│  └─────────────────────┘  │  • Review subtraction concepts│  │
│                            │  • Increase practice on       │  │
│  ┌─────────────────────┐  │    first-try success          │  │
│  │  Problem Type Perf. │  │  • Schedule 1-on-1 tutoring   │  │
│  │  Visualization: 90% │  │                               │  │
│  │  Addition:      75% │  └───────────────────────────────┘  │
│  │  Subtraction:   50% │← Weak area                          │
│  └─────────────────────┘                                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Recent Activity                                          ││
│  │  • Solved 3 problems today (2 correct, 1 incorrect)       ││
│  │  • Last active: 2 hours ago                               ││
│  │  • Total time spent: 8 hours 32 minutes                   ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Send Message] [Export Report] [Schedule Tutoring]           │
└────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- TES score: `GET /api/efficiency/scores/{student_id}/{module_id}`
- Trend: `GET /api/efficiency/trends/{student_id}/{module_id}`
- Insights: `GET /api/efficiency/insights/{teacher_id}?student_id={student_id}`

---

## 3. Student Dashboard

### 3.1 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  My Learning Progress - Fractions Module                      │
│  Student: Alice Kim                       Last Updated: 2 hrs │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🎯 Your Efficiency Score                               │  │
│  │                                                          │  │
│  │            96 / 100                                      │  │
│  │            ★★★★★                                        │  │
│  │         Grade A - Excellent!                             │  │
│  │                                                          │  │
│  │  You're performing better than 95% of your classmates   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Your Strengths                                           ││
│  │  ✅ Speed: 100/100 - You solve problems quickly!         ││
│  │  ✅ Correctness: 95/100 - High accuracy!                 ││
│  │  ✅ Consistency: 100/100 - Solid across all topics!      ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Areas to Improve                                         ││
│  │  💡 First-Try Success: 90/100                            ││
│  │     Try to solve problems on your first attempt!          ││
│  │     Tip: Take your time to think before answering.        ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Progress Over Time                                       ││
│  │                                                            ││
│  │  100 ┤                                            ●        ││
│  │   90 ┤                              ●                      ││
│  │   80 ┤                ●                                    ││
│  │   70 ┤      ●                                              ││
│  │   60 ┤●                                                    ││
│  │      └────────────────────────────────────────────────    ││
│  │      Nov 1     Nov 5    Nov 10    Nov 15    Nov 18        ││
│  │                                                            ││
│  │  🎉 You've improved 31 points since you started!          ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Topic Performance                                        ││
│  │                                                            ││
│  │  Visualization    ████████████████████ 95%               ││
│  │  Addition         ████████████████████ 95%               ││
│  │  Subtraction      ████████████████████ 95%               ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Keep Up the Great Work! 🌟                              ││
│  │                                                            ││
│  │  • You've solved 20 problems                              ││
│  │  • 19 correct answers                                     ││
│  │  • 18 solved on first try                                 ││
│  │  • Average time: 45 seconds per problem                   ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Continue Learning] [View All Modules]                       │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Efficiency Score Card

**Purpose**: Display student's current TES in an encouraging way

**Elements**:
- **Large number**: TES score (e.g., 96/100)
- **Visual indicator**: 5-star rating or progress circle
- **Letter grade**: With positive descriptor
- **Percentile rank**: Phrased positively

**Messaging**:
- **TES 90-100**: "Excellent! / Outstanding!"
- **TES 80-89**: "Great work! / Well done!"
- **TES 70-79**: "Good job! / Keep it up!"
- **TES 60-69**: "You're making progress!"
- **TES < 60**: "Keep practicing - you can do it!"

**Design Notes**:
- Use bright, encouraging colors
- Avoid negative language
- Focus on growth, not comparison

---

### 3.3 Strengths Panel

**Purpose**: Highlight what the student is doing well

**Data Displayed**:
- Components with scores > 80
- Brief positive message for each

**Examples**:
- ✅ Speed: 100/100 - "You solve problems quickly!"
- ✅ Correctness: 95/100 - "High accuracy!"
- ✅ Consistency: 100/100 - "Solid across all topics!"

---

### 3.4 Areas to Improve Panel

**Purpose**: Gently suggest improvement areas with actionable tips

**Data Displayed**:
- Components with scores < 80
- Specific, actionable tips

**Examples**:
- 💡 First-Try Success: 65/100
  - "Try to solve problems on your first attempt!"
  - Tip: "Take your time to think before answering."

- 💡 Speed: 60/100
  - "You're being careful - that's great! With practice, you'll get faster."
  - Tip: "Try timing yourself to build speed gradually."

---

### 3.5 Progress Over Time Chart

**Chart Type**: Line chart with data points

**Data Displayed**:
- TES score snapshots over last 30 days
- Clear upward/downward/stable trend

**Interactions**:
- Hover on data point → Show exact score and date
- Celebration message if improved > 10 points

**Celebration Examples**:
- 🎉 "You've improved 31 points since you started!"
- 🚀 "Your score increased 12 points this week!"
- 📈 "You're on a 3-week improvement streak!"

**API Endpoint**: `GET /api/efficiency/trends/{student_id}/{module_id}`

---

### 3.6 Topic Performance Breakdown

**Chart Type**: Horizontal progress bars

**Data Displayed**:
- Correctness percentage for each problem type
- Color-coded by performance

**Color Scheme**:
- 90-100%: Green
- 80-89%: Light green
- 70-79%: Yellow
- < 70%: Orange (with encouragement, not red)

---

### 3.7 Statistics Card

**Purpose**: Show raw accomplishments

**Data Displayed**:
- Total problems solved
- Total correct answers
- First-try successes
- Average time per problem

**Messaging**:
- Use encouraging header: "Keep Up the Great Work! 🌟"
- Present facts positively: "You've solved 20 problems" (not "Only 20 problems")

---

## 4. Responsive Design

### 4.1 Desktop (> 1024px)
- Full dashboard with all panels visible
- Side-by-side cards where applicable
- Wide charts with detailed axis labels

### 4.2 Tablet (768px - 1024px)
- Stack cards vertically
- Simplified charts with key data points
- Collapsible panels for insights

### 4.3 Mobile (< 768px)
- Single column layout
- Swipeable cards
- Simplified charts (mobile-optimized)
- Bottom navigation bar

---

## 5. Accessibility

### 5.1 Color Blindness
- Use patterns in addition to colors
- High contrast mode available
- Text labels on all chart elements

### 5.2 Screen Readers
- All charts have text alternatives
- ARIA labels on interactive elements
- Keyboard navigation support

### 5.3 Language Support
- Korean (primary)
- English (secondary)
- Translatable strings via i18n

---

## 6. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Dashboard Load Time | < 2 seconds | For 100 students |
| Chart Render Time | < 500ms | Smooth animations |
| Real-Time Updates | Every 30 seconds | Using WebSocket or polling |
| Mobile Load Time | < 3 seconds | On 4G connection |

---

## 7. Implementation Stack

### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI) or Ant Design
- **Charts**: Recharts or Chart.js
- **State Management**: React Context or Redux
- **Internationalization**: react-i18next

### Backend
- **API**: FastAPI (Python)
- **WebSocket**: Socket.io or FastAPI WebSocket
- **Caching**: Redis for dashboard data

---

## 8. Future Enhancements

### Phase 2 (Months 6-12)
- **Gamification**: Badges for achievements
- **Peer Comparison**: Anonymized leaderboard
- **Goal Setting**: Students set personal TES targets

### Phase 3 (Year 2+)
- **Predictive Analytics**: Forecast final exam performance
- **Adaptive Learning**: Recommend problems based on TES
- **Parent Portal**: View child's TES and progress

---

**Document Status**: Complete - Ready for Implementation
**Next Steps**: Create UI mockups and implement dashboard components
**Dependencies**:
- API endpoints (see `api-specification.md`)
- TES calculation service (see `efficiency_calculator.py`)
