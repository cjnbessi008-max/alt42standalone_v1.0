# Product Requirements Document: Emotional Stability Color Mode System

## 1. Introduction/Overview

### Background
Students in educational environments experience varying emotional states during learning sessions—from calm and focused to stressed and frustrated. Visual elements, particularly color schemes, have been scientifically proven to influence mood, concentration, and cognitive performance. The KAIST Touch Math Academy LMS needs an intelligent, adaptive color mode system that automatically adjusts the interface based on detected student emotional states to optimize learning outcomes and emotional wellbeing.

### Problem Statement
Currently, educational web applications use static color schemes that:
- Do not adapt to individual student emotional states
- Fail to provide calming visual cues when students are stressed
- Miss opportunities to enhance focus during engaged learning periods
- Cannot leverage real-time behavioral data to improve user experience

### Solution
An intelligent, LMS-integrated emotional stability color mode system that:
1. **Detects** student emotional states through behavioral pattern analysis
2. **Analyzes** interaction metrics in real-time (click patterns, time spent, error rates)
3. **Classifies** emotional states into categories (calm, stressed, engaged, frustrated)
4. **Applies** scientifically-backed color modes to promote emotional stability
5. **Transitions** smoothly between color schemes without disrupting learning flow
6. **Learns** from individual student patterns to personalize color mode selection
7. **Respects** user preferences with manual override options

### Goal
Enhance student learning experience and emotional wellbeing by providing an adaptive visual environment that automatically responds to emotional states, reducing stress and improving focus during educational activities.

---

## 2. Goals

### Primary Goals
1. **Improve Student Wellbeing**: Reduce learning-related stress through adaptive color therapy
2. **Enhance Focus**: Apply color modes that promote concentration during engaged learning
3. **Real-time Adaptation**: Detect emotional state changes within 30 seconds and respond accordingly
4. **Seamless Integration**: Integrate with existing LMS behavioral tracking without disrupting current functionality
5. **User Autonomy**: Provide manual controls while maintaining intelligent automation

### Secondary Goals
1. Build emotional state classification model based on interaction patterns
2. Create accessible color palettes that maintain WCAG 2.1 AA compliance across all modes
3. Collect data on color mode effectiveness for continuous improvement
4. Enable teacher dashboard for monitoring student emotional wellbeing trends
5. Support multiple color theory frameworks (color psychology, chromotherapy principles)

### Success Metrics
- **Student Stress Reduction**: 30% decrease in frustration indicators during learning sessions
- **Engagement Improvement**: 20% increase in sustained focus time
- **Adoption Rate**: 80% of students keep auto-mode enabled after first week
- **Response Time**: Emotional state detection and color mode switch < 30 seconds
- **Accessibility**: 100% WCAG 2.1 AA compliance maintained across all color modes
- **User Satisfaction**: NPS score > 8.0 for the adaptive color feature

---

## 3. Emotional State Classification

### Behavioral Indicators

#### 1. **Calm/Focused State**
**Behavioral Patterns:**
- Steady, consistent click intervals (2-5 seconds between interactions)
- Progressive completion of tasks without backtracking
- Low error rate (< 10%)
- Appropriate time spent per task (within expected range)
- Minimal mouse movement or idle time

**Color Mode Response:** **Neutral/Productivity Mode**
- Balanced color temperature
- Clear contrast for readability
- Professional, focused aesthetic

#### 2. **Stressed/Frustrated State**
**Behavioral Patterns:**
- Rapid, erratic clicking (< 1 second intervals)
- High error rate (> 30%)
- Repeated attempts on same task (> 3 retries)
- Extended idle periods (> 2 minutes)
- Backtracking or navigation away from difficult tasks

**Color Mode Response:** **Calming Mode**
- Cool color palette (blues, soft greens, lavenders)
- Reduced saturation and brightness
- Gentle, soothing gradients
- Increased whitespace perception

#### 3. **Engaged/Energetic State**
**Behavioral Patterns:**
- Rapid but accurate interactions
- High completion rate
- Exploration of optional content
- Consistent progression through materials
- Short task completion times with high accuracy

**Color Mode Response:** **Energetic/Vibrant Mode**
- Warm, vibrant colors (oranges, yellows, energetic greens)
- Higher saturation
- Dynamic, motivating aesthetic
- Reward-oriented visual feedback

#### 4. **Tired/Disengaged State**
**Behavioral Patterns:**
- Slow response times (> 10 seconds between interactions)
- Minimal interaction with content
- Short session duration
- High bounce rate from tasks
- Extended idle periods

**Color Mode Response:** **Refresh/Wake Mode**
- High contrast combinations
- Energizing color palette
- Attention-grabbing accents
- Visual stimulation to re-engage

---

## 4. Color Mode Specifications

### 4.1 Neutral/Productivity Mode (Default)
**Use Case:** Calm, focused learning state

**Color Palette:**
```javascript
{
  primary: '#2196F3',      // Professional blue
  secondary: '#455A64',    // Neutral grey-blue
  background: '#FFFFFF',   // Clean white
  surface: '#F5F5F5',      // Light grey
  text: '#212121',         // Dark grey (primary)
  textSecondary: '#757575' // Medium grey
}
```

**Characteristics:**
- Balanced color temperature (neutral)
- High contrast ratio (7:1 minimum)
- Professional appearance
- Minimal visual distraction

### 4.2 Calming Mode
**Use Case:** Stressed, frustrated, or anxious state

**Color Palette:**
```javascript
{
  primary: '#81C784',      // Soft green (nature, growth)
  secondary: '#90CAF9',    // Gentle blue (calm, trust)
  background: '#F1F8F4',   // Very light green-tinted white
  surface: '#E8F5E9',      // Pale green
  text: '#2E7D32',         // Forest green (grounding)
  textSecondary: '#66BB6A' // Medium green
}
```

**Characteristics:**
- Cool color temperature
- Reduced saturation (60-70%)
- Nature-inspired palette
- Soft edges and gentle transitions
- Lower brightness (contrast ratio: 4.5:1 minimum)

**Psychological Benefits:**
- Green: Reduces anxiety, promotes balance
- Blue: Lowers heart rate, induces calm
- Soft tones: Minimizes visual stress

### 4.3 Energetic/Vibrant Mode
**Use Case:** Engaged, motivated learning state

**Color Palette:**
```javascript
{
  primary: '#FF9800',      // Energizing orange
  secondary: '#FFC107',    // Optimistic yellow
  background: '#FFFBF0',   // Warm white
  surface: '#FFF3E0',      // Light orange tint
  text: '#E65100',         // Deep orange
  textSecondary: '#F57C00' // Vibrant orange
}
```

**Characteristics:**
- Warm color temperature
- Higher saturation (80-90%)
- Dynamic, motivating aesthetic
- Clear contrast (6:1 ratio)

**Psychological Benefits:**
- Orange: Stimulates creativity and enthusiasm
- Yellow: Enhances optimism and energy
- Warm tones: Promotes active engagement

### 4.4 Refresh/Wake Mode
**Use Case:** Tired, disengaged state

**Color Palette:**
```javascript
{
  primary: '#E91E63',      // Vibrant pink (attention)
  secondary: '#00BCD4',    // Bright cyan (alertness)
  background: '#FFFFFF',   // Pure white (clarity)
  surface: '#FCE4EC',      // Light pink tint
  text: '#880E4F',         // Deep magenta
  textSecondary: '#C2185B' // Rich pink
}
```

**Characteristics:**
- High contrast (8:1 ratio)
- Complementary color pairings
- Attention-grabbing accents
- Sharp, clear boundaries

**Psychological Benefits:**
- Pink: Stimulates energy and attention
- Cyan: Increases alertness
- High contrast: Re-engages visual focus

---

## 5. Technical Architecture

### 5.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 18+)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ Behavior Tracker│───>│ Theme Provider (MUI/Ant)     │   │
│  │  Component      │    │  - Dynamic color modes       │   │
│  └─────────────────┘    │  - Smooth transitions        │   │
│         │               └──────────────────────────────┘   │
│         │                          │                       │
│         v                          v                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         State Management (Redux/Zustand)            │   │
│  │  - emotionalState                                   │   │
│  │  - currentColorMode                                 │   │
│  │  - behaviorMetrics                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                 │
└──────────────────────────┼─────────────────────────────────┘
                           │ WebSocket (Socket.io)
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                Backend (Python FastAPI + Node.js)          │
├──────────────────────────┼─────────────────────────────────┤
│  ┌──────────────────────v──────────────────────────────┐   │
│  │      Emotion Analysis Service (Python)             │   │
│  │  - Behavior pattern analyzer                       │   │
│  │  - ML classification model                         │   │
│  │  - Real-time metric processing                     │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                    │
│                       v                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                          │  │
│  │  - student_emotional_states (time-series)           │  │
│  │  - behavior_metrics (interaction logs)              │  │
│  │  - color_mode_history                               │  │
│  │  - student_preferences                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Redis Cache                               │  │
│  │  - Real-time behavior metrics                       │  │
│  │  - Current emotional states                         │  │
│  │  - Color mode change events                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema

#### Table: `student_emotional_states`
```sql
CREATE TABLE student_emotional_states (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Emotional classification
    detected_emotion VARCHAR(50) NOT NULL,
        -- Values: 'calm', 'stressed', 'engaged', 'tired'
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00

    -- Applied color mode
    color_mode_applied VARCHAR(50) NOT NULL,
        -- Values: 'neutral', 'calming', 'energetic', 'refresh'

    -- Behavioral indicators (JSONB for flexibility)
    interaction_metrics JSONB NOT NULL,
    /*
    {
        "avg_click_interval": 3.2,
        "error_rate": 0.12,
        "task_completion_rate": 0.85,
        "idle_time_seconds": 45,
        "retry_count": 2,
        "session_duration_minutes": 23
    }
    */

    -- User override
    user_override BOOLEAN DEFAULT FALSE,
    manual_mode_selected VARCHAR(50),

    INDEX idx_student_session (student_id, session_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_emotion (detected_emotion)
);
```

#### Table: `behavior_metrics`
```sql
CREATE TABLE behavior_metrics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Interaction details
    event_type VARCHAR(50) NOT NULL,
        -- Values: 'click', 'scroll', 'input', 'submit', 'error', 'idle'
    element_id VARCHAR(255),
    task_id INTEGER,

    -- Timing metrics
    time_since_last_event DECIMAL(10,2), -- seconds
    time_on_element DECIMAL(10,2),

    -- Accuracy metrics
    is_error BOOLEAN DEFAULT FALSE,
    retry_number INTEGER,

    -- Context
    page_url TEXT,
    metadata JSONB,

    INDEX idx_student_session_time (student_id, session_id, timestamp)
);
```

#### Table: `color_mode_history`
```sql
CREATE TABLE color_mode_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    session_id VARCHAR(255) NOT NULL,

    -- Mode change details
    previous_mode VARCHAR(50),
    new_mode VARCHAR(50) NOT NULL,
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Change reason
    trigger_reason VARCHAR(100),
        -- Values: 'auto_emotion_detection', 'user_manual', 'session_start', 'preference_load'
    emotional_state_at_change VARCHAR(50),

    -- Effectiveness tracking
    duration_in_mode INTEGER, -- seconds in previous mode before change
    interactions_during_mode INTEGER,

    INDEX idx_student_session (student_id, session_id),
    INDEX idx_timestamp (change_timestamp)
);
```

#### Table: `student_color_preferences`
```sql
CREATE TABLE student_color_preferences (
    student_id INTEGER PRIMARY KEY REFERENCES students(id),

    -- Preference settings
    auto_mode_enabled BOOLEAN DEFAULT TRUE,
    preferred_default_mode VARCHAR(50) DEFAULT 'neutral',

    -- Sensitivity settings
    emotion_detection_sensitivity VARCHAR(20) DEFAULT 'medium',
        -- Values: 'low', 'medium', 'high'

    -- Disabled modes (array)
    disabled_modes TEXT[], -- e.g., {'energetic', 'refresh'}

    -- Learning preferences
    allow_data_collection BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 API Endpoints

#### Emotion Analysis Service (Python FastAPI)

**POST `/api/v1/emotion/analyze`**
```json
Request:
{
  "student_id": 12345,
  "session_id": "sess_abc123",
  "behavior_metrics": {
    "avg_click_interval": 2.8,
    "error_rate": 0.25,
    "task_completion_rate": 0.70,
    "idle_time_seconds": 120,
    "retry_count": 4,
    "session_duration_minutes": 15
  },
  "current_mode": "neutral"
}

Response:
{
  "student_id": 12345,
  "detected_emotion": "stressed",
  "confidence": 0.87,
  "recommended_mode": "calming",
  "should_switch": true,
  "reason": "High error rate and retry count indicate frustration"
}
```

**GET `/api/v1/emotion/student/{student_id}/current`**
```json
Response:
{
  "student_id": 12345,
  "current_emotion": "stressed",
  "current_mode": "calming",
  "last_updated": "2025-11-18T10:23:45Z",
  "auto_mode_enabled": true
}
```

**POST `/api/v1/emotion/student/{student_id}/preferences`**
```json
Request:
{
  "auto_mode_enabled": false,
  "preferred_default_mode": "calming",
  "emotion_detection_sensitivity": "low",
  "disabled_modes": ["energetic"]
}

Response:
{
  "success": true,
  "preferences_updated": true
}
```

#### Real-time WebSocket Events

**Event: `emotion_detected`**
```json
{
  "event": "emotion_detected",
  "data": {
    "student_id": 12345,
    "detected_emotion": "stressed",
    "confidence": 0.87,
    "timestamp": "2025-11-18T10:23:45Z"
  }
}
```

**Event: `color_mode_change`**
```json
{
  "event": "color_mode_change",
  "data": {
    "student_id": 12345,
    "previous_mode": "neutral",
    "new_mode": "calming",
    "reason": "auto_emotion_detection",
    "transition_duration_ms": 800
  }
}
```

### 5.4 Frontend Integration (React)

#### Theme Provider Implementation

```typescript
// src/contexts/EmotionalThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { io, Socket } from 'socket.io-client';

type ColorMode = 'neutral' | 'calming' | 'energetic' | 'refresh';
type EmotionalState = 'calm' | 'stressed' | 'engaged' | 'tired';

interface EmotionalThemeContextType {
  currentMode: ColorMode;
  emotionalState: EmotionalState | null;
  autoModeEnabled: boolean;
  setManualMode: (mode: ColorMode) => void;
  toggleAutoMode: (enabled: boolean) => void;
}

const EmotionalThemeContext = createContext<EmotionalThemeContextType | undefined>(undefined);

export const EmotionalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<ColorMode>('neutral');
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socketConnection = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8000');

    socketConnection.on('color_mode_change', (data) => {
      if (autoModeEnabled && !data.isManual) {
        setCurrentMode(data.new_mode);
        setEmotionalState(data.emotional_state);
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [autoModeEnabled]);

  const setManualMode = (mode: ColorMode) => {
    setAutoModeEnabled(false);
    setCurrentMode(mode);
    // Send manual override to backend
    socket?.emit('manual_mode_selected', { mode });
  };

  const toggleAutoMode = (enabled: boolean) => {
    setAutoModeEnabled(enabled);
    socket?.emit('auto_mode_toggled', { enabled });
  };

  const theme = getThemeForMode(currentMode);

  return (
    <EmotionalThemeContext.Provider
      value={{ currentMode, emotionalState, autoModeEnabled, setManualMode, toggleAutoMode }}
    >
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </EmotionalThemeContext.Provider>
  );
};

export const useEmotionalTheme = () => {
  const context = useContext(EmotionalThemeContext);
  if (!context) throw new Error('useEmotionalTheme must be used within EmotionalThemeProvider');
  return context;
};
```

#### Behavior Tracking Component

```typescript
// src/components/BehaviorTracker.tsx
import React, { useEffect, useRef } from 'react';
import { useStudentSession } from '../hooks/useStudentSession';

export const BehaviorTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { studentId, sessionId } = useStudentSession();
  const lastInteractionRef = useRef<number>(Date.now());
  const metricsBufferRef = useRef<any[]>([]);

  useEffect(() => {
    const trackInteraction = (event: MouseEvent | KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastEvent = (now - lastInteractionRef.current) / 1000;

      const metric = {
        student_id: studentId,
        session_id: sessionId,
        event_type: event.type,
        timestamp: new Date().toISOString(),
        time_since_last_event: timeSinceLastEvent,
        element_id: (event.target as HTMLElement)?.id,
      };

      metricsBufferRef.current.push(metric);
      lastInteractionRef.current = now;

      // Send metrics in batches every 5 seconds
      if (metricsBufferRef.current.length >= 10) {
        sendMetricsToBackend(metricsBufferRef.current);
        metricsBufferRef.current = [];
      }
    };

    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    // Send metrics every 5 seconds
    const interval = setInterval(() => {
      if (metricsBufferRef.current.length > 0) {
        sendMetricsToBackend(metricsBufferRef.current);
        metricsBufferRef.current = [];
      }
    }, 5000);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
      clearInterval(interval);
    };
  }, [studentId, sessionId]);

  return <>{children}</>;
};

async function sendMetricsToBackend(metrics: any[]) {
  await fetch('/api/v1/behavior/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  });
}
```

---

## 6. Emotion Detection Algorithm

### 6.1 Classification Model

**Approach:** Rule-based system with ML enhancement (Phase 2)

#### Phase 1: Rule-Based Classification

```python
# Python implementation
from dataclasses import dataclass
from typing import Dict, Literal

EmotionType = Literal['calm', 'stressed', 'engaged', 'tired']

@dataclass
class BehaviorMetrics:
    avg_click_interval: float  # seconds
    error_rate: float  # 0.0 to 1.0
    task_completion_rate: float  # 0.0 to 1.0
    idle_time_seconds: float
    retry_count: int
    session_duration_minutes: float

def classify_emotion(metrics: BehaviorMetrics) -> tuple[EmotionType, float]:
    """
    Classify emotional state based on behavioral metrics.
    Returns (emotion, confidence_score)
    """

    # Stressed/Frustrated indicators
    stressed_score = 0.0
    if metrics.error_rate > 0.3:
        stressed_score += 0.4
    if metrics.retry_count > 3:
        stressed_score += 0.3
    if metrics.avg_click_interval < 1.5:
        stressed_score += 0.2
    if metrics.task_completion_rate < 0.5:
        stressed_score += 0.1

    # Engaged indicators
    engaged_score = 0.0
    if 1.5 <= metrics.avg_click_interval <= 4.0:
        engaged_score += 0.3
    if metrics.task_completion_rate > 0.8:
        engaged_score += 0.3
    if metrics.error_rate < 0.15:
        engaged_score += 0.2
    if metrics.session_duration_minutes > 10 and metrics.idle_time_seconds < 60:
        engaged_score += 0.2

    # Tired/Disengaged indicators
    tired_score = 0.0
    if metrics.avg_click_interval > 10.0:
        tired_score += 0.4
    if metrics.idle_time_seconds > 120:
        tired_score += 0.3
    if metrics.task_completion_rate < 0.4:
        tired_score += 0.2
    if metrics.session_duration_minutes < 5:
        tired_score += 0.1

    # Calm/Focused indicators (default if no strong signals)
    calm_score = 0.0
    if 2.0 <= metrics.avg_click_interval <= 5.0:
        calm_score += 0.3
    if 0.5 <= metrics.task_completion_rate <= 0.8:
        calm_score += 0.3
    if 0.1 <= metrics.error_rate <= 0.2:
        calm_score += 0.2
    if 30 <= metrics.idle_time_seconds <= 90:
        calm_score += 0.2

    # Determine dominant emotion
    scores = {
        'stressed': stressed_score,
        'engaged': engaged_score,
        'tired': tired_score,
        'calm': calm_score
    }

    dominant_emotion = max(scores, key=scores.get)
    confidence = scores[dominant_emotion]

    # If no strong signal, default to calm
    if confidence < 0.4:
        return 'calm', 0.5

    return dominant_emotion, min(confidence, 1.0)
```

#### Phase 2: Machine Learning Enhancement (Future)

**Approach:** Supervised learning with historical data
- **Algorithm:** Random Forest or Gradient Boosting (XGBoost)
- **Features:**
  - Time-series behavioral metrics
  - Student demographic data (age, grade level)
  - Task difficulty indicators
  - Historical emotion patterns
- **Training Data:** Labeled data from Phase 1 rule-based system + teacher feedback
- **Validation:** Cross-validation with student-level splits

### 6.2 Color Mode Mapping

```python
EMOTION_TO_COLOR_MODE = {
    'calm': 'neutral',
    'stressed': 'calming',
    'engaged': 'energetic',
    'tired': 'refresh'
}

def recommend_color_mode(emotion: EmotionType, confidence: float, current_mode: str) -> tuple[str, bool]:
    """
    Recommend color mode based on detected emotion.
    Returns (recommended_mode, should_switch)
    """
    recommended_mode = EMOTION_TO_COLOR_MODE[emotion]

    # Only switch if confidence is high enough and mode is different
    should_switch = (
        confidence >= 0.6 and
        recommended_mode != current_mode
    )

    return recommended_mode, should_switch
```

---

## 7. User Experience Features

### 7.1 Manual Override Controls

**UI Component:** Color Mode Selector (Bottom-right corner overlay)

```typescript
// Color Mode Selector UI
interface ColorModeSelectorProps {
  currentMode: ColorMode;
  autoModeEnabled: boolean;
  onModeChange: (mode: ColorMode) => void;
  onAutoToggle: (enabled: boolean) => void;
}

// Visual representation:
┌─────────────────────────────┐
│  🎨 Color Mode              │
├─────────────────────────────┤
│  ○ Neutral (Productivity)   │
│  ● Calming (Active)         │
│  ○ Energetic                │
│  ○ Refresh                  │
├─────────────────────────────┤
│  ☑ Auto Mode               │
│      Detected: Stressed     │
└─────────────────────────────┘
```

### 7.2 Transition Effects

**Smooth Color Transitions:**
- Duration: 800ms
- Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
- Properties animated: background-color, color, border-color
- Notification: Subtle toast message ("Switching to Calming mode...")

```css
/* CSS Transition */
* {
  transition:
    background-color 800ms cubic-bezier(0.4, 0.0, 0.2, 1),
    color 800ms cubic-bezier(0.4, 0.0, 0.2, 1),
    border-color 800ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 7.3 Notification System

**Mode Change Notification:**
- **Type:** Non-intrusive toast (bottom-center)
- **Duration:** 3 seconds
- **Content:** "Switching to [Mode Name] - [Reason]"
- **Examples:**
  - "Switching to Calming mode - High stress detected"
  - "Switching to Energetic mode - Great progress!"
  - "Switching to Neutral mode - Steady learning"

### 7.4 Teacher Dashboard

**Dashboard Metrics:**
1. **Class Emotional Trends**
   - Line graph showing emotion distribution over time
   - Heatmap of peak stress periods

2. **Individual Student Monitoring**
   - Current emotional state indicators
   - Color mode usage statistics
   - Alert system for prolonged stress periods

3. **Color Mode Effectiveness**
   - Task completion rates by color mode
   - Student preference statistics
   - A/B testing results (if enabled)

---

## 8. Accessibility and Ethics

### 8.1 Accessibility Compliance

**WCAG 2.1 AA Requirements:**
- All color modes maintain minimum contrast ratio 4.5:1 (normal text)
- Large text (18pt+ or 14pt+ bold): 3:1 minimum
- Focus indicators visible across all modes
- Keyboard navigation fully supported
- Screen reader announcements for mode changes

**Color Blindness Support:**
- All modes tested with Deuteranopia, Protanopia, Tritanopia filters
- Reliance on contrast and saturation, not color alone
- Alternative visual indicators (icons, patterns) for critical information

### 8.2 Privacy and Data Ethics

**Data Collection:**
- **Opt-in:** Students/parents can disable emotion detection
- **Transparency:** Clear explanation of what data is collected and why
- **Minimal Data:** Only collect metrics necessary for emotion detection
- **No Sharing:** Emotional state data never shared with third parties
- **Data Retention:** Behavioral metrics deleted after 90 days (configurable)

**Ethical Considerations:**
- **No Surveillance:** System designed to help, not monitor or judge
- **Student Autonomy:** Manual override always available
- **No Punitive Use:** Data cannot be used for grading or discipline
- **Teacher Guidelines:** Training on appropriate use of emotional insights

---

## 9. Implementation Phases

### Phase 1: MVP (Weeks 1-4)
**Scope:**
- Rule-based emotion detection
- 4 core color modes (Neutral, Calming, Energetic, Refresh)
- Basic behavioral tracking (clicks, errors, timing)
- Manual override controls
- PostgreSQL database setup
- WebSocket real-time updates

**Deliverables:**
- Functional emotion detection service (Python)
- React theme provider with mode switching
- Behavior tracking component
- Database schema and migrations
- Basic API endpoints

### Phase 2: Enhancement (Weeks 5-8)
**Scope:**
- ML-based emotion classification model
- Personalization (learning individual student patterns)
- Teacher dashboard (view-only)
- Advanced behavioral metrics (mouse movement, scroll patterns)
- A/B testing framework for color effectiveness

**Deliverables:**
- Trained ML model deployed
- Personalization algorithm
- Teacher dashboard UI
- Analytics and reporting system

### Phase 3: Optimization (Weeks 9-12)
**Scope:**
- Performance optimization (reduce latency < 30s)
- Advanced accessibility features
- Mobile responsive color modes
- Integration with additional LMS modules
- Comprehensive user documentation

**Deliverables:**
- Optimized detection latency
- Mobile-friendly implementation
- User guides and training materials
- Performance monitoring dashboard

---

## 10. Success Criteria and KPIs

### Primary KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Student Stress Reduction | 30% decrease in frustration indicators | Compare error rates and retry counts before/after calming mode |
| Engagement Improvement | 20% increase in sustained focus | Session duration and task completion rates |
| Detection Accuracy | 85% agreement with self-reported emotion | Weekly student surveys asking current emotional state |
| Response Time | < 30 seconds from state change to mode switch | Server-side latency logs |
| Adoption Rate | 80% keep auto-mode enabled after 1 week | User preference analytics |
| WCAG Compliance | 100% AA compliance | Automated accessibility testing |

### Secondary KPIs

- **Color Mode Distribution:** Track which modes are most commonly applied
- **Manual Override Rate:** % of time students manually change mode (target: < 20%)
- **Session Duration:** Average increase in learning session length
- **Teacher Satisfaction:** NPS score from teachers using dashboard
- **Performance Impact:** Frontend rendering time increase < 50ms

---

## 11. Risks and Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket connection instability | High | Medium | Implement fallback polling, connection retry logic |
| Color mode transitions cause layout shift | Medium | High | Use CSS containment, test extensively |
| Emotion detection false positives | High | High | Require high confidence threshold (0.6+), easy manual override |
| Database performance with high-frequency writes | High | Medium | Use Redis for real-time data, batch writes to PostgreSQL |
| Frontend state management complexity | Medium | Medium | Comprehensive state documentation, TypeScript strict mode |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Frequent mode changes distract students | High | Medium | Implement debouncing (5-minute minimum between auto-switches) |
| Students feel "watched" or surveilled | High | Low | Clear privacy messaging, emphasize helpfulness over monitoring |
| Color modes not suitable for all students | Medium | Medium | Manual override, preference customization, opt-out option |
| Accessibility issues for color-blind users | High | Low | Extensive testing with color blindness filters, alternative indicators |

### Data and Privacy Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Emotional data misused for grading | Critical | Low | Technical restrictions preventing grade integration, policy enforcement |
| Data breach exposes sensitive emotional info | Critical | Low | Encryption at rest and in transit, minimal data retention, GDPR compliance |
| Parents/students unaware of data collection | High | Medium | Prominent consent flow, detailed privacy policy, opt-in requirement |

---

## 12. Future Enhancements (Post-MVP)

### Advanced Features

1. **Biometric Integration (Phase 3)**
   - Heart rate variability (wearable device integration)
   - Eye tracking for focus measurement
   - Facial expression analysis (with explicit consent)

2. **Contextual Adaptation**
   - Time of day adjustments (e.g., energizing colors in morning)
   - Task difficulty-based pre-emptive mode switching
   - Weather/season-based color adjustments

3. **Gamification**
   - Achievements for maintaining calm state
   - Progress visualization with emotional journey map
   - "Emotional mastery" metrics and badges

4. **Multi-Language Support**
   - Emotion detection across cultural contexts
   - Localized color preferences (cultural color psychology)

5. **Integration with Other Wellbeing Features**
   - Break reminders when stress detected
   - Breathing exercise prompts
   - Connection to school counseling resources

---

## 13. Appendices

### A. Color Psychology Research References

1. **Blue:** Reduces blood pressure and heart rate, promotes calm (Küller et al., 2009)
2. **Green:** Reduces anxiety, enhances concentration (Lee et al., 2015)
3. **Orange:** Stimulates mental activity and enthusiasm (Gorn et al., 2004)
4. **Pink:** Calming effect, reduces aggression (Schauss, 1985)

### B. WCAG 2.1 AA Contrast Requirements

- **Normal text (< 18pt):** 4.5:1 minimum contrast ratio
- **Large text (≥ 18pt or ≥ 14pt bold):** 3:1 minimum contrast ratio
- **UI components and graphics:** 3:1 minimum contrast ratio

### C. Glossary

- **Emotional State:** Detected psychological condition (calm, stressed, engaged, tired)
- **Color Mode:** Visual theme applied to interface (neutral, calming, energetic, refresh)
- **Behavioral Metrics:** Quantitative measurements of user interactions (click rate, error rate, etc.)
- **Confidence Score:** Probability (0.0-1.0) that detected emotion is correct
- **Auto Mode:** System automatically switches color modes based on detected emotion
- **Manual Override:** User-initiated color mode selection, disables auto mode

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-18 | AI System | Initial PRD creation |

---

**End of Document**
