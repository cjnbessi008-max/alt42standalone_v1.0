# KAIST AI Education System - Architecture Summary

## Project Overview

This is a **greenfield project** building an AI-powered platform that automatically generates complete educational modules from teacher requests.

**Status**: PRD complete (50KB doc), ready for implementation  
**Technology Stack**: React | Node.js/Express | Python/FastAPI | PostgreSQL | Redis  
**Feature Being Built**: Calming Messages for difficult problems  

---

## System Architecture at a Glance

```
┌─────────────────────────────────────┐
│    Teacher Dashboard (React)         │  <- Teacher creates modules
│  - Module request form               │     in natural language
│  - Configuration editor              │
│  - Analytics dashboard               │
└────────────────┬────────────────────┘
                 │ REST API
         ┌───────▼────────┐
         │ API Gateway    │
         │ (Node.js)      │
         └───────┬────────┘
                 │ Internal API
         ┌───────▼──────────────────────┐
         │  AI Pipeline Orchestrator    │
         │  (Python/FastAPI)            │
         │  6-Phase Generation:         │
         │  1. World Model ────┐        │
         │  2. Rules           │        │
         │  3. Database ───────┼──→ Generated Module
         │  4. Input Strategy  │        │
         │  5. UI Components ──┤        │
         │  6. Deployment ─────┘        │
         └──────────────────────────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
┌────▼──┐  ┌─────▼──┐  ┌────▼──┐
│Claude │  │PostgreSQL │  │Redis │
│API    │  │(Auto DB) │  │Cache │
└───────┘  └──────────┘  └───────┘
                 │
         ┌───────▼────────────┐
         │ Student Interface  │
         │    (React)         │
         │ - Problem display  │
         │ - Audio playback   │
         │ - Progress track   │
         └────────────────────┘
```

---

## The 6-Phase Pipeline

### Phase 1: World Model Reconstruction
**Input**: "Create fractions module for 3rd graders"  
**Output**: Concept hierarchy, relationships, operations  
**Example**: 
```json
{
  "concepts": ["Fraction", "Numerator", "Denominator"],
  "operations": ["add_fractions", "simplify"],
  "difficulty_levels": [
    "visualization_only",
    "simple_arithmetic",
    "multi_step",
    "complex_scenarios",
    "edge_cases"
  ]
}
```

### Phase 2: Rule Generation
**Input**: World model  
**Output**: Business logic rules  
**Example**:
```
IF student_correct_rate >= 85% THEN allow_progression
IF failed_attempts >= 3 THEN show_hint
```

### Phase 3: Data Management
**Input**: Rules + world model  
**Output**: Database schema  
**Generated Tables**:
- `problems` (with difficulty_level)
- `student_progress` (tracks attempts)
- `problem_metadata` (concept tags, hints)

### Phase 4: Input Strategy
**Input**: Database schema  
**Output**: Plan for data collection  
**Example**: "Use form for numerator/denominator, track time-on-task"

### Phase 5: UI Auto-Generation
**Input**: Input strategy  
**Output**: React components  
**Generated Components**:
- `ProblemDisplay` 
- `AnswerInput`
- `ProgressBar`
- `FeedbackPanel`

**KEY POINT**: This is where `CalmingMessageOverlay` component fits!

### Phase 6: Deployment
**Input**: All artifacts  
**Output**: Deployable module  
**Includes**: API endpoints, Docker config, tests

---

## Problem Display Architecture

```
Generated Module
│
├─ ProblemDisplay Page
│  │
│  ├─ CalmingMessageOverlay (NEW FEATURE)
│  │  ├─ Breathing animation
│  │  ├─ Encouraging text
│  │  ├─ Audio player (calming message)
│  │  └─ Auto-advance button
│  │
│  └─ ProblemContent
│     ├─ Problem text (with difficulty_level >= 4)
│     ├─ Visual representation
│     └─ Answer input form
│
└─ Backend API
   ├─ GET /problems/:id
   ├─ GET /audio/calming_message_4
   ├─ POST /submit (answer)
   └─ GET /progress
```

---

## Difficulty Levels (1-5 Scale)

```
Level 1 (Easy): Single concept, minimal steps
  └─ No calming message shown

Level 2: Single concept, multiple steps
  └─ No calming message shown

Level 3 (Medium): Multiple concepts, moderate complexity
  └─ No calming message shown

Level 4 (Hard): Complex problem, multiple concepts
  └─ CALMING MESSAGE TRIGGERED ✓

Level 5 (Very Hard): Multiple complex steps, edge cases
  └─ CALMING MESSAGE TRIGGERED ✓
```

---

## Calming Message Feature Flow

```
Student views problem
    │
    ├─ Check: difficulty_level >= 4?
    │
    ├─ YES → Check: calming messages enabled?
    │           │
    │           ├─ YES → Show CalmingMessageOverlay
    │           │         ├─ Play audio (0-3s)
    │           │         ├─ Display breathing animation
    │           │         ├─ Show encouraging text
    │           │         └─ Wait for skip/timeout (10s max)
    │           │             │
    │           │             └─ Log interaction to database
    │           │
    │           └─ NO → Proceed directly to problem
    │
    └─ NO → Proceed directly to problem

Then: Display actual problem
```

---

## Database Schema for Calming Messages

### Table 1: module_calming_config
Stores configuration per module (teacher-editable)

```
id (UUID)
module_id (FK) ←─── Links to which module
is_enabled (bool) ─── Feature on/off toggle
difficulty_threshold (1-5) ─── When to trigger (default: 4)
message_templates ─── JSON: {"4": "...", "5": "..."}
audio_enabled (bool)
text_enabled (bool)
animation_type ─── 'breathing_circle', 'pulse', etc.
timeout_seconds ─── Auto-advance delay (default: 10s)
created_at / updated_at
```

### Table 2: calming_message_interactions
Audit log (for analytics)

```
id (UUID)
module_id (FK)
student_id (FK)
problem_id
difficulty_level (1-5)
message_type ('audio', 'visual', 'combined')
shown_at (timestamp)
duration_viewed_seconds (float)
student_feedback (true/false/null) ← "Did this help?"
feedback_at (timestamp)
```

---

## Frontend Components to Build

### 1. CalmingMessageOverlay.tsx (Main Component)
```typescript
<CalmingMessageOverlay
  problem_id={string}
  student_id={string}
  module_id={string}
  difficulty_level={1-5}
  on_complete={callback}
  config={CalmingMessageConfig}
/>
```

### 2. BreathingAnimation.tsx (Visual)
```typescript
<BreathingAnimation animation_type="breathing_circle|pulse|wave" />
```

### 3. AudioPlayer.tsx (Audio Playback)
```typescript
<AudioPlayer
  src={audioUrl}
  autoPlay={true}
  onComplete={callback}
/>
```

### 4. CalmingMessageSettings.tsx (Teacher Config)
```typescript
<CalmingMessageSettings
  module_id={string}
  config={CalmingMessageConfig}
  onSave={async (config) => {...}}
/>
```

---

## Backend API Endpoints Needed

### Audio Serving
```
GET /api/modules/:moduleId/audio/calming_message_4
→ Returns: MP3 audio file (pre-recorded or TTS)
→ Status: 200 OK + audio data
```

### Configuration
```
GET /api/modules/:moduleId/calming-config
→ Returns: { is_enabled, difficulty_threshold, message_templates, ... }

POST /api/modules/:moduleId/calming-config
→ Body: { is_enabled, difficulty_threshold, message_templates }
→ Returns: { success: true }
```

### Logging
```
POST /api/modules/:moduleId/interactions/calming_message
→ Body: { student_id, problem_id, difficulty_level, message_type }
→ Returns: { success: true }

PUT /api/modules/:moduleId/interactions/:id
→ Body: { duration_viewed_seconds, student_feedback }
→ Returns: { success: true }
```

### Analytics
```
GET /api/modules/:moduleId/analytics/calming_messages
→ Returns: {
     total_shown: 142,
     avg_view_duration: 7.3,
     helpful_count: 95,
     by_difficulty: [...]
   }
```

---

## Audio Implementation Options

### Option A: Pre-recorded (RECOMMENDED)
- Teacher records 2 messages (for difficulty 4 & 5)
- Store in S3 or cloud storage
- Serve via CDN
- **Pros**: No latency, personal touch, clear quality
- **Cons**: Recording effort, static messages

### Option B: Text-to-Speech (TTS)
- Generate audio on-demand from message template
- Use Google Cloud, Azure, or ElevenLabs API
- Cache in Redis
- **Pros**: Dynamic, scalable
- **Cons**: 300-500ms latency, per-request cost

### Option C: Hybrid (Future)
- Pre-recorded defaults + TTS for custom messages
- Teachers can upload their own audio

---

## Implementation Checklist

### Database
- [ ] Create `module_calming_config` table
- [ ] Create `calming_message_interactions` table
- [ ] Ensure `problems.difficulty_level` column exists

### Backend (Node.js/Express)
- [ ] Audio serving endpoint (`GET /audio/...`)
- [ ] Configuration CRUD endpoints
- [ ] Interaction logging endpoint
- [ ] Analytics aggregation endpoint
- [ ] Authentication middleware

### Frontend (React)
- [ ] CalmingMessageOverlay component
- [ ] BreathingAnimation component
- [ ] AudioPlayer component
- [ ] CalmingMessageSettings component
- [ ] CSS animations
- [ ] Integration with ProblemDisplay
- [ ] Accessibility features (ARIA labels, keyboard nav)

### Testing
- [ ] Unit tests for components
- [ ] Integration tests (API + DB)
- [ ] Accessibility audit
- [ ] Analytics verification

### Deployment
- [ ] Pre-generate or setup TTS for audio files
- [ ] Set default message templates
- [ ] Configure S3/cloud storage
- [ ] Setup CDN distribution (optional)
- [ ] Create monitoring dashboard

---

## Key Integration Points

### With Phase 3 (Data Manager)
When generating database schema, include:
```sql
CREATE TABLE problems (
    ...
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    ...
);

CREATE TABLE module_calming_config (
    module_id UUID UNIQUE REFERENCES modules(id),
    ...
);
```

### With Phase 5 (UI Generator)
When generating React components:
```typescript
// Wrap ProblemDisplay with calming message support
<CalmingMessageContainer>
  <CalmingMessageOverlay
    difficulty_level={problem.difficulty_level}
    config={config}
  />
  <ProblemDisplay problem={problem} />
</CalmingMessageContainer>
```

### With Phase 6 (Deployer)
Deployment includes:
- Pre-generate audio files
- Setup audio serving route
- Initialize default calming config
- Enable analytics endpoints

---

## Success Metrics

### Quantitative
- 30%+ of students encounter difficulty >= 4 (requiring calming message)
- Average message view time: 5-8 seconds
- 60%+ of students mark message as helpful
- 10%+ reduction in problem abandonment after message shown

### Qualitative
- Teacher feedback: "Messages help students persist"
- Student feedback: "Messages made me feel supported"
- Observation: Less frustration visible with hard problems

---

## Timeline Estimate

| Week | Task | Owner |
|------|------|-------|
| 1-2 | Database schema + migrations | Backend |
| 2-3 | Audio serving + config API | Backend |
| 3-4 | Components + styling | Frontend |
| 4-5 | Integration + testing | Full team |
| 5-6 | Teacher UI + analytics | Frontend |
| 6-7 | Accessibility + refinement | QA |
| 7-8 | Deployment + monitoring | DevOps |

**Total**: ~8 weeks start-to-finish

---

## File Locations (When Built)

```
/home/user/alt42standalone_v1.0/
├── frontend/src/components/
│   ├── CalmingMessageOverlay.tsx
│   ├── CalmingMessageOverlay.css
│   ├── BreathingAnimation.tsx
│   ├── AudioPlayer.tsx
│   └── CalmingMessageSettings.tsx
│
├── backend/src/routes/
│   ├── audio.ts (serving)
│   ├── calming-config.ts (CRUD)
│   ├── interactions.ts (logging)
│   └── analytics.ts (reporting)
│
├── database/migrations/
│   ├── 003_calming_config.sql
│   └── 004_calming_interactions.sql
│
└── docs/
    ├── CODEBASE_ANALYSIS.md
    ├── CALMING_MESSAGE_FEATURE_GUIDE.md
    └── ARCHITECTURE_SUMMARY.md (this file)
```

---

## Quick Reference: Component Inputs/Outputs

### CalmingMessageOverlay
**Input**: Problem difficulty level, student ID, module config  
**Output**: Rendered overlay modal or nothing (if below threshold)  
**Side Effects**: Logs to database, plays audio  

### Backend API
**Input**: Problem difficulty_level, module_id  
**Output**: Audio file + config data  

### Database
**Input**: Calming message shown event  
**Output**: Analytics queries return aggregated data  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Audio latency | Pre-generate files, cache in Redis/CDN |
| Teacher adoption | Make messages easy to customize, disable if needed |
| Audio for deaf students | Always provide text alternative + visual animation |
| Message effectiveness | A/B test different messages, collect feedback |
| Cost (if TTS) | Use pre-recorded, setup caching, rate limits |

---

## Related Documentation

- **Main PRD**: `/tasks/0001-prd-ai-education-pipeline.md` (50KB)
- **Codebase Analysis**: `/CODEBASE_ANALYSIS.md` (full architecture)
- **Implementation Guide**: `/CALMING_MESSAGE_FEATURE_GUIDE.md` (detailed specs)
- **This File**: `/ARCHITECTURE_SUMMARY.md` (quick reference)

---

## Questions & Next Steps

1. **Audio Generation**: Pre-recorded or TTS? → **Recommend: Pre-recorded**
2. **Message Personalization**: Same for all students or adaptive? → **Recommend: Start with same, add personalization in Phase 2**
3. **Accessibility**: Required features beyond text/visual? → **Recommend: WCAG 2.1 AA minimum**
4. **Analytics**: What metrics matter most? → **Recommend: Helpfulness feedback + view duration**

**Ready to start implementation?** → Refer to `/CALMING_MESSAGE_FEATURE_GUIDE.md` for detailed specs

