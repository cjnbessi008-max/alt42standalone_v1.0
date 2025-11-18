# Calming Message Feature Implementation Guide

## Overview

The "Calming Message" feature plays reassuring audio/visual messages when students encounter difficult problems (difficulty level 4-5). This document provides implementation guidance based on the system architecture outlined in the PRD.

---

## 1. Feature Requirements Summary

### User Story
> As a student, I want to receive calming, encouraging messages when I encounter difficult problems, so that I feel supported and motivated to persist through challenging tasks.

### Trigger Conditions
- Problem difficulty_level >= 4 (Hard or Very Hard)
- Student hasn't seen this type of message in last 30 seconds (prevent spam)
- Student hasn't disabled calming messages for this module

### Deliverables
- Overlay modal with calming message + audio
- Visual calming animation (breathing circle)
- Teacher configuration options
- Analytics tracking
- Accessibility features (text alternative for hearing-impaired)

---

## 2. Data Model Changes

### New Database Tables

```sql
-- Configuration for calming messages per module
CREATE TABLE module_calming_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    difficulty_threshold INTEGER DEFAULT 4 CHECK (difficulty_threshold BETWEEN 1 AND 5),
    -- JSON structure: { "4": "message_text", "5": "message_text" }
    message_templates JSONB DEFAULT '{"4": "...", "5": "..."}',
    audio_enabled BOOLEAN DEFAULT TRUE,
    text_enabled BOOLEAN DEFAULT TRUE,
    animation_type VARCHAR(50) DEFAULT 'breathing_circle', -- breathing_circle, pulse, wave, etc.
    timeout_seconds INTEGER DEFAULT 10, -- How long to show before auto-advance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log of when messages are shown (for analytics)
CREATE TABLE calming_message_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    message_type VARCHAR(50), -- 'audio', 'visual', 'combined'
    shown_at TIMESTAMP DEFAULT NOW(),
    duration_viewed_seconds FLOAT,
    student_continued_immediately BOOLEAN DEFAULT FALSE,
    -- Student feedback (optional): did this help?
    student_feedback BOOLEAN NULL, -- true=helpful, false=not helpful, NULL=no feedback
    feedback_at TIMESTAMP NULL,
    INDEX idx_module_student (module_id, student_id),
    INDEX idx_shown_at (shown_at)
);
```

### Modified Problem Metadata Schema

The existing `problem_metadata` table (from Phase 3) should have difficulty_level if not already present:

```sql
-- This table is already part of Phase 3 schema generation
-- But ensure these columns exist:
ALTER TABLE problem_metadata ADD COLUMN IF NOT EXISTS
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5);
    
ALTER TABLE problem_metadata ADD COLUMN IF NOT EXISTS
    requires_calming_support BOOLEAN DEFAULT FALSE;
```

---

## 3. Frontend Component Architecture

### Component Hierarchy

```
ProblemDisplayPage
├── ProblemMetadataLoader (fetches problem + difficulty)
├── CalmingMessageContainer
│   ├── CalmingMessageOverlay (conditional rendering)
│   │   ├── CalmingMessageVisual (breathing animation)
│   │   ├── CalmingMessageText (encouraging text)
│   │   ├── AudioPlayerComponent (HTML5 audio)
│   │   └── ContinueButton (or auto-advance)
│   └── ProblemDisplay (shown after calming message)
│       ├── ProblemContent
│       ├── AnswerInput
│       └── SubmitButton
└── ProgressTracker
```

### Core Component: CalmingMessageOverlay.tsx

```typescript
import React, { useState, useEffect } from 'react';

interface CalmingMessageOverlayProps {
  problem_id: string;
  student_id: string;
  module_id: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  on_complete: () => void;
  config: CalmingMessageConfig;
}

interface CalmingMessageConfig {
  is_enabled: boolean;
  difficulty_threshold: number;
  message_templates: Record<string, string>;
  audio_enabled: boolean;
  text_enabled: boolean;
  animation_type: string;
  timeout_seconds: number;
}

export const CalmingMessageOverlay: React.FC<CalmingMessageOverlayProps> = ({
  problem_id,
  student_id,
  module_id,
  difficulty_level,
  on_complete,
  config
}) => {
  const [audioFinished, setAudioFinished] = useState(false);
  const [remainingTime, setRemainingTime] = useState(config.timeout_seconds);
  const [userSkipped, setUserSkipped] = useState(false);

  // Should not show if disabled or below threshold
  if (!config.is_enabled || difficulty_level < config.difficulty_threshold) {
    on_complete();
    return null;
  }

  const message = config.message_templates[difficulty_level] || 
                 'You can do this! Take your time.';
  
  const audioUrl = `/api/modules/${module_id}/audio/calming_message_${difficulty_level}`;

  // Auto-advance timer
  useEffect(() => {
    if (audioFinished || userSkipped) {
      const timer = setTimeout(() => on_complete(), 1000);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setRemainingTime(t => {
        if (t <= 1) {
          on_complete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [audioFinished, userSkipped, on_complete]);

  // Log interaction
  useEffect(() => {
    const logInteraction = async () => {
      try {
        await fetch(`/api/modules/${module_id}/interactions/calming_message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id,
            problem_id,
            difficulty_level,
            message_type: config.audio_enabled ? 'audio' : 'text',
            shown_at: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to log calming message interaction:', error);
      }
    };

    logInteraction();
  }, []);

  return (
    <div className="calming-message-overlay" role="dialog" aria-label="Calming message">
      <div className="overlay-background" />
      <div className="message-container">
        {/* Animation based on config */}
        <BreathingAnimation animation_type={config.animation_type} />

        {/* Message text */}
        {config.text_enabled && (
          <p className="calming-message-text">{message}</p>
        )}

        {/* Audio player */}
        {config.audio_enabled && (
          <audio
            autoPlay
            onEnded={() => setAudioFinished(true)}
            style={{ display: 'none' }}
            aria-label="Calming message audio"
          >
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}

        {/* Skip button (accessible) */}
        <button
          onClick={() => setUserSkipped(true)}
          className="skip-button"
          aria-label="Skip calming message"
        >
          Continue ({remainingTime}s)
        </button>

        {/* Accessibility: Text alternative always shown */}
        <details className="accessibility-details">
          <summary>Read message (for assistive technology)</summary>
          <p>{message}</p>
        </details>
      </div>
    </div>
  );
};

// Breathing animation component
const BreathingAnimation: React.FC<{ animation_type: string }> = ({ animation_type }) => {
  return (
    <svg className={`breathing-animation ${animation_type}`} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" className="breathing-circle" />
    </svg>
  );
};
```

### CSS for Animations

```css
/* Breathing circle animation */
.breathing-animation.breathing_circle {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
}

.breathing-circle {
  fill: rgba(66, 165, 245, 0.3);
  stroke: #42a5f5;
  stroke-width: 2;
  animation: breathing 4s ease-in-out infinite;
}

@keyframes breathing {
  0% {
    r: 35px;
    opacity: 0.4;
  }
  50% {
    r: 45px;
    opacity: 0.2;
  }
  100% {
    r: 35px;
    opacity: 0.4;
  }
}

/* Pulse animation alternative */
.breathing-animation.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* Overlay styling */
.calming-message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.overlay-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.message-container {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
}

.calming-message-text {
  font-size: 18px;
  line-height: 1.5;
  margin: 20px 0;
  color: #333;
}

.skip-button {
  background: #42a5f5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.3s;
}

.skip-button:hover {
  background: #1e88e5;
}

.skip-button:focus {
  outline: 2px solid #42a5f5;
  outline-offset: 2px;
}
```

---

## 4. Backend API Endpoints

### Audio Serving

```typescript
// GET /api/modules/:module_id/audio/calming_message_:difficulty_level
// Purpose: Serve pre-generated calming message audio file
// Response: MP3 audio file
// Example: GET /api/modules/abc123/audio/calming_message_4

router.get('/modules/:moduleId/audio/calming_message_:level', (req, res) => {
  const { moduleId, level } = req.params;
  const audioPath = `/audio/calming_messages/difficulty_${level}.mp3`;
  
  // Stream audio file from S3/local storage
  res.download(audioPath);
});
```

### Configuration Endpoints

```typescript
// GET /api/modules/:module_id/calming-config
// Purpose: Get calming message config for a module
router.get('/modules/:moduleId/calming-config', async (req, res) => {
  const config = await db.query(
    'SELECT * FROM module_calming_config WHERE module_id = $1',
    [req.params.moduleId]
  );
  res.json(config.rows[0]);
});

// POST /api/modules/:module_id/calming-config
// Purpose: Update calming message configuration (teacher only)
// Requires: Teacher authentication
router.post('/modules/:moduleId/calming-config', 
  authenticateToken, 
  async (req, res) => {
    const { is_enabled, difficulty_threshold, message_templates } = req.body;
    
    await db.query(
      `INSERT INTO module_calming_config 
       (module_id, is_enabled, difficulty_threshold, message_templates)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (module_id) DO UPDATE SET
       is_enabled = $2, difficulty_threshold = $3, message_templates = $4`,
      [req.params.moduleId, is_enabled, difficulty_threshold, message_templates]
    );
    
    res.json({ success: true });
  }
);
```

### Interaction Logging

```typescript
// POST /api/modules/:module_id/interactions/calming_message
// Purpose: Log when a calming message is shown to a student
router.post('/modules/:moduleId/interactions/calming_message', async (req, res) => {
  const { student_id, problem_id, difficulty_level, message_type } = req.body;
  
  await db.query(
    `INSERT INTO calming_message_interactions 
     (module_id, student_id, problem_id, difficulty_level, message_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.params.moduleId, student_id, problem_id, difficulty_level, message_type]
  );
  
  res.json({ success: true });
});

// PUT /api/modules/:module_id/interactions/calming_message/:interaction_id
// Purpose: Update interaction (e.g., log view duration, student feedback)
router.put('/modules/:moduleId/interactions/calming_message/:id', async (req, res) => {
  const { duration_viewed_seconds, student_feedback } = req.body;
  
  await db.query(
    `UPDATE calming_message_interactions 
     SET duration_viewed_seconds = $1, student_feedback = $2, feedback_at = NOW()
     WHERE id = $3`,
    [duration_viewed_seconds, student_feedback, req.params.id]
  );
  
  res.json({ success: true });
});
```

### Analytics Endpoints

```typescript
// GET /api/modules/:module_id/analytics/calming_messages
// Purpose: Show analytics dashboard for teachers
router.get('/modules/:moduleId/analytics/calming_messages', 
  authenticateToken,
  async (req, res) => {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_shown,
        AVG(duration_viewed_seconds) as avg_view_duration,
        SUM(CASE WHEN student_feedback = true THEN 1 ELSE 0 END) as helpful_count,
        SUM(CASE WHEN student_feedback = false THEN 1 ELSE 0 END) as not_helpful_count,
        difficulty_level,
        COUNT(DISTINCT student_id) as unique_students
      FROM calming_message_interactions
      WHERE module_id = $1
      GROUP BY difficulty_level
    `, [req.params.moduleId]);
    
    res.json(stats.rows);
  }
);
```

---

## 5. Integration Points with Pipeline Phases

### Phase 3: Data Manager
Include in generated schema:
- problem_metadata with difficulty_level column
- module_calming_config table
- calming_message_interactions table

### Phase 5: UI Generator
When generating ProblemDisplay component:
- Wrap in CalmingMessageContainer
- Conditionally render CalmingMessageOverlay based on difficulty
- Fetch config from API on component mount

### Phase 6: Deployer
Deployment checklist:
- Pre-generate audio files (or setup TTS endpoint)
- Create default calming message templates
- Set up S3/cloud storage for audio assets
- Create monitoring dashboard

---

## 6. Audio Generation Strategy

### Option 1: Pre-recorded Audio (Recommended for MVP)
- Teachers record 2 messages (difficulty 4 & 5)
- Store in S3 / cloud storage
- Serve via CDN
- Pros: Low latency, clear quality, personalizable
- Cons: Recording effort, static messages

### Option 2: Text-to-Speech (TTS)
- Use Google Cloud Speech, Azure, or Elevenlabs API
- Generate audio from message template on first request
- Cache in Redis or S3
- Pros: Dynamic, scalable, multiple voices
- Cons: API latency (300-500ms), cost per request

### Option 3: Hybrid (Future)
- Pre-recorded primary messages
- TTS fallback for custom messages
- Allow teachers to upload their own audio

**Recommended Implementation**:
```typescript
// Audio serving logic
const getCalmmingMessageAudio = async (moduleId, difficulty) => {
  const cacheKey = `audio:calming:${moduleId}:${difficulty}`;
  
  // Check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Get config to decide how to generate
  const config = await getModuleConfig(moduleId);
  let audioUrl;
  
  if (config.custom_audio_url) {
    // Teacher uploaded custom audio
    audioUrl = config.custom_audio_url;
  } else {
    // Use default pre-recorded or TTS
    audioUrl = `/audio/calming_messages/default_${difficulty}.mp3`;
  }
  
  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, audioUrl);
  return audioUrl;
};
```

---

## 7. Teacher Configuration Interface

### Teacher Dashboard Component

```typescript
interface CalmingMessageSettingsProps {
  module_id: string;
  config: CalmingMessageConfig;
  onSave: (config: CalmingMessageConfig) => Promise<void>;
}

export const CalmingMessageSettings: React.FC<CalmingMessageSettingsProps> = ({
  module_id,
  config,
  onSave
}) => {
  const [settings, setSettings] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="calming-message-settings">
      <h3>Calming Message Configuration</h3>
      
      <label>
        <input
          type="checkbox"
          checked={settings.is_enabled}
          onChange={(e) => setSettings({...settings, is_enabled: e.target.checked})}
        />
        Enable calming messages
      </label>

      <label>
        Trigger at difficulty level:
        <select value={settings.difficulty_threshold} onChange={(e) => 
          setSettings({...settings, difficulty_threshold: parseInt(e.target.value)})
        }>
          <option value={1}>Level 1 (Easy)</option>
          <option value={2}>Level 2</option>
          <option value={3}>Level 3 (Medium)</option>
          <option value={4}>Level 4 (Hard)</option>
          <option value={5}>Level 5 (Very Hard)</option>
        </select>
      </label>

      <fieldset>
        <legend>Message for Level 4:</legend>
        <textarea
          value={settings.message_templates["4"]}
          onChange={(e) => setSettings({
            ...settings,
            message_templates: {
              ...settings.message_templates,
              "4": e.target.value
            }
          })}
          maxLength={200}
        />
      </fieldset>

      <fieldset>
        <legend>Message for Level 5:</legend>
        <textarea
          value={settings.message_templates["5"]}
          onChange={(e) => setSettings({
            ...settings,
            message_templates: {
              ...settings.message_templates,
              "5": e.target.value
            }
          })}
          maxLength={200}
        />
      </fieldset>

      <button onClick={() => onSave(settings)} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};
```

---

## 8. Testing Strategy

### Unit Tests

```typescript
describe('CalmingMessageOverlay', () => {
  it('should not render if disabled', () => {
    const config = { is_enabled: false, ... };
    const { queryByRole } = render(
      <CalmingMessageOverlay {...props} config={config} />
    );
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render if difficulty below threshold', () => {
    const config = { difficulty_threshold: 4, ... };
    const { queryByRole } = render(
      <CalmingMessageOverlay {...props} difficulty_level={3} config={config} />
    );
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render and auto-advance after timeout', async () => {
    const onComplete = jest.fn();
    render(<CalmingMessageOverlay {...props} on_complete={onComplete} />);
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 12000 }); // 10s timeout + buffer
  });

  it('should be keyboard accessible', () => {
    const { getByRole } = render(<CalmingMessageOverlay {...props} />);
    const button = getByRole('button', { name: /continue/i });
    expect(button).toHaveFocus(); // Or allow tab navigation
  });
});
```

### Integration Tests

- Verify calming message shows when problem difficulty >= threshold
- Verify interaction is logged to database
- Verify analytics endpoint returns correct aggregations
- Verify teacher can configure messages

### Accessibility Testing

- Screen reader announces message content
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast ratio >= 4.5:1
- Text resize doesn't break layout

---

## 9. Success Metrics

### Quantitative Metrics
- % of students who see a calming message (should be >30% for level 4+ problems)
- Average view duration (target: 5-8 seconds)
- % of students who mark message as helpful (target: >60%)
- Reduction in problem abandonment rate after seeing message (if measurable)

### Qualitative Metrics
- Teacher feedback on effectiveness
- Student survey: "Did the message help you?"
- Observation: Do students seem less frustrated with hard problems?

---

## 10. Implementation Timeline

1. **Week 1**: Database schema + migrations
2. **Week 2**: Backend API endpoints + audio serving
3. **Week 3**: Frontend component development + styling
4. **Week 4**: Integration with ProblemDisplay component
5. **Week 5**: Teacher configuration UI
6. **Week 6**: Analytics dashboard
7. **Week 7**: Testing + accessibility audit
8. **Week 8**: Deployment + monitoring

---

## 11. Future Enhancements

- Personalized messages based on student preferences
- Student feedback loop to improve message effectiveness
- Adaptive difficulty suggestions after calming message
- Multi-language support (Korean/English/others)
- Voice recording by teachers for custom audio
- Animated avatar delivering the message
- Integration with robot avatar system (Phase 2)
