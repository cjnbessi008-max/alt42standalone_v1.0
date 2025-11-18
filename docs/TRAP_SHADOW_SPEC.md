# Trap Shadow Feature Specification

## Overview

Trap Shadow is a visual learning aid that highlights common mistake areas (trap points) in quiz problems displayed on a virtual smartphone interface.

## Concept: Trap Points (함정 포인트)

### Definition
Trap points are specific areas in a quiz problem that commonly lead to student errors:
- Misleading keywords
- Confusing numerical values
- Deceptive diagram elements
- Common calculation pitfalls

### Data Structure
```typescript
interface TrapPoint {
  id: string;
  problemId: string;
  type: 'text' | 'number' | 'diagram' | 'option';
  position: {
    x: number;        // X coordinate (%)
    y: number;        // Y coordinate (%)
    width: number;    // Width (%)
    height: number;   // Height (%)
  };
  severity: 'low' | 'medium' | 'high';
  description: string;
  errorRate: number;  // 0-100 percentage
}
```

## Visual Design

### Shadow Effect

**Low Severity** (errorRate 0-33%)
- Color: `rgba(255, 165, 0, 0.15)` (light orange)
- Border: `1px dashed orange`
- Pulse animation: slow

**Medium Severity** (errorRate 34-66%)
- Color: `rgba(255, 140, 0, 0.25)` (medium orange)
- Border: `2px dashed darkorange`
- Pulse animation: medium

**High Severity** (errorRate 67-100%)
- Color: `rgba(255, 69, 0, 0.35)` (dark orange-red)
- Border: `2px solid orangered`
- Pulse animation: fast

### Virtual Smartphone

**Position**: Fixed bottom-right corner
**Size**: 375px × 667px (iPhone 8 dimensions)
**Style**:
- Border radius: 30px
- Box shadow: `0 10px 40px rgba(0,0,0,0.3)`
- Background: white
- Screen border: 10px black bezel

**Layout**:
```
┌─────────────────┐
│   Status Bar    │ 20px
├─────────────────┤
│                 │
│   Problem       │
│   Content       │
│   Area          │
│                 │
│  (with trap     │
│   shadows)      │
│                 │
├─────────────────┤
│ Navigation Bar  │ 50px
└─────────────────┘
```

## Moodle Integration

### Quiz Data Fetch

**Moodle Web Service Functions**:
- `mod_quiz_get_quizzes_by_courses` - Get quiz list
- `mod_quiz_get_quiz_access_information` - Check access
- `mod_quiz_get_attempt_data` - Get question data
- `core_question_get_random_question_summaries` - Get questions

### Database Schema (Moodle tables used)

**Read from Moodle DB**:
- `mdl_quiz` - Quiz metadata
- `mdl_quiz_slots` - Question assignments
- `mdl_question` - Question content
- `mdl_question_answers` - Answer options

**Custom tables** (for trap points):
```sql
CREATE TABLE alt42_trap_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  trap_type ENUM('text', 'number', 'diagram', 'option'),
  position_x DECIMAL(5,2),
  position_y DECIMAL(5,2),
  position_width DECIMAL(5,2),
  position_height DECIMAL(5,2),
  severity ENUM('low', 'medium', 'high'),
  description TEXT,
  error_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES mdl_question(id)
);
```

## User Experience Flow

1. **Load Quiz**
   - System fetches quiz from Moodle
   - Backend retrieves trap point data
   - Frontend renders virtual phone

2. **Display Problem**
   - Question content rendered in phone screen
   - Trap points positioned over content
   - Shadows animate with pulse effect

3. **Interaction**
   - Hover over trap shadow → tooltip shows description
   - Click trap shadow → detailed explanation modal
   - Student can toggle trap shadows on/off

4. **Analytics**
   - Track which trap shadows are viewed
   - Measure if trap awareness reduces errors
   - Report to teacher dashboard

## Implementation Phases

### Phase 1: Core Structure (Current)
- [x] Project setup
- [x] Virtual phone component
- [x] Basic trap shadow visualization
- [x] Moodle API integration

### Phase 2: Data Integration
- [ ] Moodle web service client
- [ ] Trap point database schema
- [ ] API endpoints for trap data
- [ ] Admin interface for trap point definition

### Phase 3: Advanced Features
- [ ] AI-powered trap point detection
- [ ] Analytics dashboard
- [ ] Teacher configuration panel
- [ ] Student performance tracking

## Technical Constraints

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance
- Virtual phone renders at 60fps
- Trap shadows use CSS transforms (GPU accelerated)
- Problem load time < 500ms

### Accessibility
- Trap shadows have ARIA labels
- Keyboard navigation supported
- Screen reader descriptions
- High contrast mode compatible

## Security Considerations

- Moodle token stored securely (environment variables)
- API requests authenticated
- XSS prevention on problem content
- SQL injection protection
- Rate limiting on API endpoints

## Future Enhancements

1. **AI Trap Detection**
   - Analyze student answer patterns
   - Automatically identify trap points
   - Machine learning model for error prediction

2. **Adaptive Learning**
   - Hide trap shadows for advanced students
   - Increase visibility for struggling students
   - Personalized difficulty adjustment

3. **Multi-language Support**
   - Korean, English, Japanese
   - RTL language support

4. **Mobile Native App**
   - React Native version
   - Offline problem caching
   - Push notifications for new quizzes
