# Technical Implementation Plan: Brain Science-Based Concept Learning Game

## Document Information
- **Version**: 1.0.0
- **Created**: 2025-11-20
- **Target Audience**: Elementary 5th-6th Grade Students
- **Language**: Korean + English Support
- **Status**: Implementation Planning

---

## 1. Executive Summary

### Overview
This document provides a comprehensive technical implementation plan for a neuroscience-based concept learning game designed for elementary 5th-6th grade students. Unlike traditional gamification approaches, this system leverages cognitive science principles (attention loops, chunking, dopamine prediction error, cognitive load management) to create intrinsically motivating learning experiences.

### Core Philosophy
- **NOT**: Maps, levels, characters, points, badges
- **YES**: Brain-based engagement, internal rewards, cognitive progression
- **Metaphor**: Student as "Light Finder", App as "Guide Mentor"

### Key Differentiators
1. No superficial gamification (avoiding "childish" elements)
2. 20-40 second attention loop cycles (neuroscience-optimized)
3. Automatic difficulty adjustment based on cognitive load
4. Dopamine prediction error engineering
5. Concept chunking (3-5 semantic units per concept)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Brain Prep   │  │ Concept      │  │ Simulation Engine   │  │
│  │ Module       │  │ Pebble UI    │  │ (20-sec cycles)     │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Feedback     │  │ Concept      │  │ Depth Score         │  │
│  │ System       │  │ Merge UI     │  │ Visualization       │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│              API Layer (Node.js + Express/Fastify)              │
│  Authentication │ Rate Limiting │ Real-time Events              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│           Cognitive Engine (Python + FastAPI)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Adaptive Difficulty Algorithm (Cognitive Load Tracker)   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Attention Loop Manager (20-40s cycle orchestration)      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Dopamine Prediction Error Engine                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Concept Chunking Service (semantic decomposition)        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Metacognition Tracker (reflection analysis)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Data Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL   │  │ Redis Cache  │  │ TimescaleDB         │  │
│  │ (Core Data)  │  │ (Sessions)   │  │ (Time-series data)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

#### Frontend Components (React)

**Core Modules:**

1. **BrainPrepModule** (`/src/components/BrainPrep`)
   - Purpose: 10-second brain activation phase
   - Features: Mood/condition selection, personalization initialization
   - State management: User condition, time of day, energy level

2. **ConceptPebbleUI** (`/src/components/ConceptPebble`)
   - Purpose: Display concept fragments (3-5 pebbles per concept)
   - Features: Interactive pebble selection, visual representation
   - State: Pebble completion status, depth understanding

3. **SimulationEngine** (`/src/components/SimulationEngine`)
   - Purpose: 20-second interactive learning cycles
   - Features: Real-time interaction, immediate feedback, gesture recognition
   - Technology: Canvas API, React Spring for animations

4. **FeedbackSystem** (`/src/components/Feedback`)
   - Purpose: Deliver success experiences (5-second mini celebrations)
   - Design: Subtle light animations, warm tones, gentle sounds
   - Constraint: NO "childish" effects (no bouncing stars, loud sounds)

5. **ConceptMergeUI** (`/src/components/ConceptMerge`)
   - Purpose: Allow students to connect learned pebbles
   - Features: Drag-to-connect interface, relationship visualization
   - Memory enhancement: Visual connection = stronger encoding

6. **DepthScoreVisual** (`/src/components/DepthScore`)
   - Purpose: Show understanding depth (NOT traditional leveling)
   - Design: Single-color circular gauge, minimalist
   - Psychology: Internal motivation, self-efficacy building

7. **ReflectionFlick** (`/src/components/Reflection`)
   - Purpose: 15-second metacognitive review
   - Interaction: Swipe/tap cards of learned concepts
   - Outcome: Self-assessment, metacognitive training

#### Backend Services (Python)

**Cognitive Engine Components:**

1. **AdaptiveDifficultyService** (`/services/cognitive/adaptive_difficulty.py`)
   - Input: Student interaction patterns, error rates, response times
   - Algorithm: Bayesian Knowledge Tracing + Cognitive Load estimation
   - Output: Real-time difficulty adjustments

2. **AttentionLoopManager** (`/services/cognitive/attention_loop.py`)
   - Function: Ensure 20-40 second micro-feedback cycles
   - Mechanism: Timer-based event triggers, engagement monitoring
   - Fallback: If attention drops, simplify task immediately

3. **DopaminePredictionEngine** (`/services/cognitive/dopamine_engine.py`)
   - Function: Engineer optimal prediction errors
   - Pattern:
     - Easy task → Success → Small dopamine
     - Slightly harder → Surprise success → Large dopamine spike
   - Implementation: Challenge progression algorithm

4. **ConceptChunkingService** (`/services/cognitive/chunking.py`)
   - Input: Complex concept (e.g., "fractions")
   - Output: 3-5 semantic pebbles with dependency graph
   - Method: LLM-based decomposition + educational taxonomy

5. **MetacognitionTracker** (`/services/cognitive/metacognition.py`)
   - Input: Student reflection choices (which cards they select)
   - Analysis: Confidence calibration, self-awareness patterns
   - Output: Metacognitive skill metrics

---

## 3. Database Schema Design

### 3.1 Core Tables

```sql
-- =====================================================
-- Student Profile & Session Management
-- =====================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    grade_level INTEGER CHECK (grade_level IN (5, 6)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    brain_condition VARCHAR(50), -- mood/energy selected at start
    total_pebbles_completed INTEGER DEFAULT 0,
    session_depth_score DECIMAL(5,2) -- cumulative understanding depth
);

-- =====================================================
-- Concept & Pebble Structure
-- =====================================================

CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g., "분수 (Fractions)"
    subject VARCHAR(50) DEFAULT 'mathematics',
    target_grade INTEGER CHECK (target_grade IN (5, 6)),
    description TEXT,
    total_pebbles INTEGER CHECK (total_pebbles BETWEEN 3 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE concept_pebbles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(id),
    pebble_number INTEGER CHECK (pebble_number BETWEEN 1 AND 5),
    name VARCHAR(100) NOT NULL, -- e.g., "Pebble 1: 전체를 나누는 감각"
    semantic_content JSONB NOT NULL, -- detailed learning content
    dependency_pebbles INTEGER[], -- array of prerequisite pebble numbers
    base_difficulty DECIMAL(3,2) CHECK (base_difficulty BETWEEN 0 AND 1),
    estimated_duration_seconds INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(concept_id, pebble_number)
);

-- =====================================================
-- Simulation Interactions (20-second cycles)
-- =====================================================

CREATE TABLE simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_session_id UUID NOT NULL REFERENCES learning_sessions(id),
    pebble_id UUID NOT NULL REFERENCES concept_pebbles(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    actual_duration_seconds INTEGER,
    interaction_count INTEGER DEFAULT 0, -- number of student actions
    success_achieved BOOLEAN DEFAULT FALSE,
    difficulty_level DECIMAL(3,2), -- adjusted difficulty for this attempt
    cognitive_load_estimate DECIMAL(3,2) -- 0.0 = easy, 1.0 = overload
);

CREATE TABLE simulation_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID NOT NULL REFERENCES simulation_sessions(id),
    interaction_type VARCHAR(50) NOT NULL, -- 'drag', 'tap', 'swipe', 'input'
    timestamp_offset_ms INTEGER NOT NULL, -- milliseconds from simulation start
    interaction_data JSONB, -- gesture details, coordinates, values
    is_correct BOOLEAN,
    feedback_delivered VARCHAR(200) -- what feedback was shown
);

-- =====================================================
-- Cognitive Load & Attention Tracking
-- =====================================================

CREATE TABLE cognitive_load_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID NOT NULL REFERENCES simulation_sessions(id),
    snapshot_time TIMESTAMP DEFAULT NOW(),
    load_estimate DECIMAL(3,2) CHECK (load_estimate BETWEEN 0 AND 1),
    indicators JSONB, -- {response_time, error_rate, hesitation_count, etc.}
    automatic_adjustment_triggered BOOLEAN DEFAULT FALSE,
    adjustment_action VARCHAR(100) -- 'simplify', 'maintain', 'increase'
);

-- =====================================================
-- Dopamine Prediction Error Events
-- =====================================================

CREATE TABLE dopamine_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID NOT NULL REFERENCES simulation_sessions(id),
    event_timestamp TIMESTAMP DEFAULT NOW(),
    event_type VARCHAR(50), -- 'easy_success', 'surprising_success', 'expected_fail', 'unexpected_fail'
    prediction_error_magnitude DECIMAL(3,2), -- how surprising was the outcome
    difficulty_before DECIMAL(3,2),
    difficulty_after DECIMAL(3,2), -- adjusted based on prediction error
    engagement_score DECIMAL(3,2) -- estimated engagement boost
);

-- =====================================================
-- Concept Merging (Connection Building)
-- =====================================================

CREATE TABLE concept_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    pebble_from_id UUID NOT NULL REFERENCES concept_pebbles(id),
    pebble_to_id UUID NOT NULL REFERENCES concept_pebbles(id),
    connection_strength DECIMAL(3,2) DEFAULT 0.5, -- how well understood
    created_at TIMESTAMP DEFAULT NOW(),
    last_reinforced_at TIMESTAMP,
    UNIQUE(student_id, pebble_from_id, pebble_to_id)
);

-- =====================================================
-- Depth Score (Replaces Traditional Leveling)
-- =====================================================

CREATE TABLE depth_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    concept_id UUID NOT NULL REFERENCES concepts(id),
    current_depth DECIMAL(5,2) DEFAULT 0, -- 0-100 scale
    pebbles_mastered INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    depth_history JSONB, -- [{timestamp, depth, trigger}]
    UNIQUE(student_id, concept_id)
);

-- =====================================================
-- Metacognition & Reflection
-- =====================================================

CREATE TABLE reflection_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_session_id UUID NOT NULL REFERENCES learning_sessions(id),
    started_at TIMESTAMP DEFAULT NOW(),
    pebbles_reviewed INTEGER, -- how many cards shown
    pebbles_confirmed INTEGER, -- how many student said "I understand"
    confidence_accuracy DECIMAL(3,2), -- calibration score
    reflection_duration_seconds INTEGER
);

CREATE TABLE reflection_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_session_id UUID NOT NULL REFERENCES reflection_sessions(id),
    pebble_id UUID NOT NULL REFERENCES concept_pebbles(id),
    student_confidence VARCHAR(20), -- 'fully_understand', 'partially', 'need_review'
    actual_mastery DECIMAL(3,2), -- system's assessment of actual understanding
    confidence_gap DECIMAL(3,2) -- difference between confidence and mastery
);

-- =====================================================
-- Time-Series Data (Using TimescaleDB extension)
-- =====================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Attention metrics time-series
CREATE TABLE attention_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,
    attention_level DECIMAL(3,2), -- 0.0 = distracted, 1.0 = fully engaged
    interaction_frequency DECIMAL(5,2), -- actions per minute
    response_time_avg_ms INTEGER,
    sustained_attention_seconds INTEGER
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('attention_metrics', 'timestamp');

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_simulation_sessions_learning ON simulation_sessions(learning_session_id);
CREATE INDEX idx_simulation_sessions_pebble ON simulation_sessions(pebble_id);
CREATE INDEX idx_cognitive_load_simulation ON cognitive_load_snapshots(simulation_session_id);
CREATE INDEX idx_dopamine_events_simulation ON dopamine_events(simulation_session_id);
CREATE INDEX idx_concept_connections_student ON concept_connections(student_id);
CREATE INDEX idx_depth_scores_student_concept ON depth_scores(student_id, concept_id);
CREATE INDEX idx_attention_metrics_student_time ON attention_metrics(student_id, timestamp DESC);
```

---

## 4. API Specification

### 4.1 RESTful Endpoints

#### Session Management

```
POST   /api/v1/sessions/start
Request:
{
  "student_id": "uuid",
  "brain_condition": "focused" | "tired" | "energetic" | "neutral",
  "time_of_day": "morning" | "afternoon" | "evening"
}
Response:
{
  "session_id": "uuid",
  "recommended_concept_id": "uuid",
  "personalized_message": "오늘 뇌가 가장 궁금해하는 건 뭘까?"
}
```

```
PUT    /api/v1/sessions/{session_id}/end
Request:
{
  "session_id": "uuid"
}
Response:
{
  "total_duration_seconds": 1200,
  "pebbles_completed": 4,
  "depth_gained": 12.5,
  "summary": "Great session! You explored 4 concept pebbles."
}
```

#### Concept & Pebble Retrieval

```
GET    /api/v1/concepts/{concept_id}
Response:
{
  "concept_id": "uuid",
  "name": "분수 (Fractions)",
  "pebbles": [
    {
      "pebble_id": "uuid",
      "pebble_number": 1,
      "name": "전체를 나누는 감각",
      "is_unlocked": true,
      "dependency_met": true
    },
    ...
  ]
}
```

```
GET    /api/v1/pebbles/{pebble_id}
Response:
{
  "pebble_id": "uuid",
  "concept_id": "uuid",
  "name": "분자·분모 의미",
  "semantic_content": {
    "explanation": "...",
    "examples": [...],
    "interaction_type": "drag_and_divide"
  },
  "estimated_duration": 20,
  "current_difficulty": 0.3
}
```

#### Simulation Execution

```
POST   /api/v1/simulations/start
Request:
{
  "session_id": "uuid",
  "pebble_id": "uuid",
  "initial_difficulty": 0.3
}
Response:
{
  "simulation_id": "uuid",
  "simulation_config": {
    "type": "interactive_fraction_division",
    "parameters": {...},
    "expected_duration_seconds": 20
  }
}
```

```
POST   /api/v1/simulations/{simulation_id}/interact
Request:
{
  "interaction_type": "drag",
  "timestamp_offset_ms": 1234,
  "data": {
    "from": {"x": 100, "y": 200},
    "to": {"x": 150, "y": 250},
    "object_id": "fraction_piece_1"
  }
}
Response:
{
  "is_correct": true,
  "feedback": "좋아, 이건 완벽하게 이해했어!",
  "cognitive_load": 0.25,
  "continue": true
}
```

```
PUT    /api/v1/simulations/{simulation_id}/complete
Request:
{
  "success_achieved": true,
  "actual_duration_seconds": 22
}
Response:
{
  "success": true,
  "depth_gained": 2.5,
  "next_difficulty": 0.4,
  "celebration_type": "gentle_glow"
}
```

#### Adaptive Difficulty

```
GET    /api/v1/cognitive/difficulty-adjustment
Query Parameters:
  - student_id: uuid
  - pebble_id: uuid
  - recent_performance: JSON array of recent attempts
Response:
{
  "recommended_difficulty": 0.35,
  "reasoning": "Student showing consistent success, slight increase warranted",
  "cognitive_load_estimate": 0.4,
  "adjustment_type": "gradual_increase"
}
```

#### Concept Merging

```
POST   /api/v1/connections/create
Request:
{
  "student_id": "uuid",
  "pebble_from_id": "uuid",
  "pebble_to_id": "uuid",
  "student_description": "분수와 소수는 똑같이 전체를 나눈 것"
}
Response:
{
  "connection_id": "uuid",
  "connection_strength": 0.6,
  "validation": "좋아, 이 둘은 이런 원리로 이어져 있어: ...",
  "depth_bonus": 3.0
}
```

```
GET    /api/v1/students/{student_id}/connections
Response:
{
  "connections": [
    {
      "from_pebble": "분수",
      "to_pebble": "소수",
      "strength": 0.6,
      "created_at": "2025-11-20T10:00:00Z"
    },
    ...
  ],
  "connection_map": {...} // graph structure for visualization
}
```

#### Depth Score

```
GET    /api/v1/students/{student_id}/depth-score
Query Parameters:
  - concept_id: uuid (optional, if omitted returns all concepts)
Response:
{
  "concept_id": "uuid",
  "current_depth": 45.5,
  "pebbles_mastered": 3,
  "connections_made": 2,
  "depth_trajectory": [
    {"timestamp": "...", "depth": 10.0},
    {"timestamp": "...", "depth": 25.0},
    {"timestamp": "...", "depth": 45.5}
  ]
}
```

#### Reflection

```
POST   /api/v1/reflection/start
Request:
{
  "session_id": "uuid",
  "pebbles_to_review": ["uuid1", "uuid2", "uuid3", "uuid4"]
}
Response:
{
  "reflection_session_id": "uuid",
  "pebble_cards": [
    {
      "pebble_id": "uuid",
      "name": "전체를 나누는 감각",
      "summary": "..."
    },
    ...
  ]
}
```

```
POST   /api/v1/reflection/{reflection_id}/confirm
Request:
{
  "pebble_id": "uuid",
  "confidence": "fully_understand" | "partially" | "need_review"
}
Response:
{
  "confidence_recorded": true,
  "actual_mastery_estimate": 0.85,
  "calibration_feedback": "Your confidence matches your understanding well!"
}
```

### 4.2 WebSocket Events (Real-time)

```
// Connection
ws://api.example.com/ws/session/{session_id}

// Events from Server to Client

{
  "event": "attention_check",
  "data": {
    "message": "Still with me?",
    "require_response": true
  }
}

{
  "event": "cognitive_load_high",
  "data": {
    "current_load": 0.85,
    "action": "simplifying_task",
    "message": "다시 조각을 하나만 더 느껴볼까?"
  }
}

{
  "event": "dopamine_moment",
  "data": {
    "type": "surprising_success",
    "magnitude": 0.8,
    "celebration": "gentle_glow_animation"
  }
}

{
  "event": "depth_milestone",
  "data": {
    "new_depth": 50.0,
    "milestone": "halfway_mastery",
    "message": "Concept understanding is growing strong!"
  }
}

// Events from Client to Server

{
  "event": "interaction",
  "data": {
    "type": "drag",
    "timestamp": 1234567890,
    "details": {...}
  }
}

{
  "event": "attention_response",
  "data": {
    "response_time_ms": 450,
    "still_engaged": true
  }
}
```

---

## 5. Adaptive Difficulty Algorithm

### 5.1 Algorithm Overview

**Goal**: Automatically adjust difficulty to maintain optimal cognitive load (0.4-0.6 range) and maximize dopamine prediction error.

**Inputs**:
- Recent performance metrics (success rate, response time, error patterns)
- Cognitive load estimates (real-time)
- Attention level (from interaction frequency)
- Student historical data

**Output**:
- Adjusted difficulty level (0.0 - 1.0 scale)
- Task modification parameters

### 5.2 Algorithm Implementation

```python
# /services/cognitive/adaptive_difficulty.py

from typing import List, Dict, Tuple
from dataclasses import dataclass
import numpy as np

@dataclass
class PerformanceSnapshot:
    timestamp: float
    success: bool
    response_time_ms: int
    cognitive_load: float
    difficulty_level: float

class AdaptiveDifficultyEngine:
    """
    Implements adaptive difficulty based on:
    1. Bayesian Knowledge Tracing (BKT)
    2. Cognitive Load Theory
    3. Dopamine Prediction Error optimization
    """

    # Cognitive load thresholds
    OPTIMAL_LOAD_MIN = 0.4
    OPTIMAL_LOAD_MAX = 0.6
    OVERLOAD_THRESHOLD = 0.8
    UNDERLOAD_THRESHOLD = 0.3

    # Difficulty adjustment parameters
    INCREASE_RATE = 0.05  # gradual increase
    DECREASE_RATE = 0.15  # faster decrease to prevent frustration

    def __init__(self):
        self.knowledge_estimate = 0.5  # initial mastery estimate

    def estimate_cognitive_load(
        self,
        response_time_ms: int,
        error_count: int,
        hesitation_indicators: int,
        difficulty: float
    ) -> float:
        """
        Estimate current cognitive load based on behavioral indicators.

        Returns: Load estimate (0.0 = no load, 1.0 = overload)
        """
        # Normalize response time (assuming 5000ms = high load)
        time_factor = min(response_time_ms / 5000.0, 1.0)

        # Error factor (more than 3 errors = high load)
        error_factor = min(error_count / 3.0, 1.0)

        # Hesitation factor (pauses, backtracking)
        hesitation_factor = min(hesitation_indicators / 5.0, 1.0)

        # Difficulty amplifies other factors
        difficulty_multiplier = 1.0 + (difficulty * 0.5)

        # Weighted combination
        load = (
            0.3 * time_factor +
            0.4 * error_factor +
            0.3 * hesitation_factor
        ) * difficulty_multiplier

        return min(load, 1.0)

    def update_knowledge_estimate(
        self,
        performance_history: List[PerformanceSnapshot]
    ) -> float:
        """
        Bayesian Knowledge Tracing to estimate student's understanding.

        Returns: Knowledge estimate (0.0 = no knowledge, 1.0 = mastery)
        """
        if not performance_history:
            return 0.5

        # Simple BKT parameters
        p_learn = 0.3  # probability of learning from correct attempt
        p_forget = 0.1  # probability of forgetting
        p_slip = 0.1   # probability of mistake when knowing
        p_guess = 0.2  # probability of correct guess when not knowing

        knowledge = self.knowledge_estimate

        for snapshot in performance_history[-10:]:  # last 10 attempts
            if snapshot.success:
                # Update based on correct answer
                knowledge = (knowledge * (1 - p_slip)) / (
                    knowledge * (1 - p_slip) + (1 - knowledge) * p_guess
                )
                knowledge = min(knowledge + p_learn, 1.0)
            else:
                # Update based on incorrect answer
                knowledge = (knowledge * p_slip) / (
                    knowledge * p_slip + (1 - knowledge) * (1 - p_guess)
                )
                knowledge = max(knowledge - p_forget, 0.0)

        self.knowledge_estimate = knowledge
        return knowledge

    def calculate_dopamine_prediction_error(
        self,
        expected_difficulty: float,
        actual_success: bool,
        response_time_ms: int
    ) -> Tuple[float, str]:
        """
        Calculate dopamine prediction error magnitude.

        Returns: (prediction_error_magnitude, event_type)
        """
        # Expected success probability based on difficulty
        expected_success_prob = 1.0 - expected_difficulty

        if actual_success:
            if expected_difficulty < 0.3:
                # Easy task succeeded (expected)
                return 0.2, "easy_success"
            elif expected_difficulty < 0.6:
                # Medium task succeeded (moderately surprising)
                return 0.6, "surprising_success"
            else:
                # Hard task succeeded (very surprising - big dopamine spike!)
                return 0.9, "very_surprising_success"
        else:
            if expected_difficulty > 0.7:
                # Hard task failed (expected)
                return 0.1, "expected_fail"
            else:
                # Easy/medium task failed (disappointing)
                return 0.4, "unexpected_fail"

    def adjust_difficulty(
        self,
        current_difficulty: float,
        recent_performance: List[PerformanceSnapshot],
        current_cognitive_load: float
    ) -> Dict:
        """
        Main difficulty adjustment logic.

        Returns: {
            "new_difficulty": float,
            "adjustment_type": str,
            "reasoning": str
        }
        """
        # Update knowledge estimate
        knowledge = self.update_knowledge_estimate(recent_performance)

        # Check cognitive load first (immediate safety)
        if current_cognitive_load > self.OVERLOAD_THRESHOLD:
            new_difficulty = max(current_difficulty - self.DECREASE_RATE * 2, 0.1)
            return {
                "new_difficulty": new_difficulty,
                "adjustment_type": "emergency_decrease",
                "reasoning": "Cognitive overload detected, reducing difficulty significantly"
            }

        # Calculate recent success rate
        recent_successes = [p.success for p in recent_performance[-5:]]
        success_rate = sum(recent_successes) / len(recent_successes) if recent_successes else 0.5

        # Decision tree for adjustment
        if current_cognitive_load < self.UNDERLOAD_THRESHOLD and success_rate > 0.8:
            # Understimulated - increase difficulty
            new_difficulty = min(current_difficulty + self.INCREASE_RATE, 0.9)
            adjustment_type = "gradual_increase"
            reasoning = "Student showing mastery, increasing challenge"

        elif current_cognitive_load > self.OPTIMAL_LOAD_MAX and success_rate < 0.5:
            # Struggling - decrease difficulty
            new_difficulty = max(current_difficulty - self.DECREASE_RATE, 0.1)
            adjustment_type = "decrease"
            reasoning = "Student struggling, reducing cognitive load"

        elif self.OPTIMAL_LOAD_MIN <= current_cognitive_load <= self.OPTIMAL_LOAD_MAX:
            # Optimal zone - maintain with tiny random variations
            variation = np.random.uniform(-0.02, 0.02)
            new_difficulty = np.clip(current_difficulty + variation, 0.1, 0.9)
            adjustment_type = "maintain_optimal"
            reasoning = "Student in optimal learning zone"

        else:
            # Default: gradual approach to optimal
            target_difficulty = 0.5  # middle of optimal range
            adjustment = (target_difficulty - current_difficulty) * 0.1
            new_difficulty = np.clip(current_difficulty + adjustment, 0.1, 0.9)
            adjustment_type = "gradual_adjustment"
            reasoning = "Gradually moving toward optimal difficulty"

        return {
            "new_difficulty": round(new_difficulty, 2),
            "adjustment_type": adjustment_type,
            "reasoning": reasoning,
            "knowledge_estimate": round(knowledge, 2),
            "cognitive_load": round(current_cognitive_load, 2)
        }

# Example usage
if __name__ == "__main__":
    engine = AdaptiveDifficultyEngine()

    # Simulate some performance history
    performance = [
        PerformanceSnapshot(
            timestamp=1.0,
            success=True,
            response_time_ms=2000,
            cognitive_load=0.4,
            difficulty_level=0.3
        ),
        PerformanceSnapshot(
            timestamp=2.0,
            success=True,
            response_time_ms=1500,
            cognitive_load=0.3,
            difficulty_level=0.3
        ),
        # ... more snapshots
    ]

    result = engine.adjust_difficulty(
        current_difficulty=0.3,
        recent_performance=performance,
        current_cognitive_load=0.35
    )

    print(f"Adjustment: {result}")
```

### 5.3 Load Recovery Strategy

When cognitive load exceeds threshold (>0.8):

**Immediate Actions**:
1. **Pause current simulation** (gently, not abruptly)
2. **Reduce task complexity**:
   - Fewer choices/options
   - Simpler visual presentation
   - More explicit guidance
3. **Return to previous pebble** if necessary
4. **Provide encouragement** (not punishment): "다시 조각을 하나만 더 느껴볼까?"

**Prevention**:
- Monitor cognitive load every 5 seconds during simulation
- Predictive model: if load trending upward rapidly, intervene early
- Keep difficulty increases conservative (max +0.05 per success)

---

## 6. Attention Loop Management

### 6.1 20-40 Second Cycle Design

**Neuroscience Basis**: Brain attention naturally wanes after 20-40 seconds without new stimuli or feedback.

**Implementation Strategy**:

```python
# /services/cognitive/attention_loop.py

import asyncio
from typing import Callable
from datetime import datetime, timedelta

class AttentionLoopManager:
    """
    Ensures micro-feedback every 20-40 seconds to maintain engagement.
    """

    MINIMUM_CYCLE = 20  # seconds
    MAXIMUM_CYCLE = 40  # seconds
    OPTIMAL_CYCLE = 25  # sweet spot

    def __init__(self, feedback_callback: Callable):
        self.feedback_callback = feedback_callback
        self.last_feedback_time = None
        self.cycle_active = False

    async def start_attention_cycle(self, simulation_id: str):
        """
        Start attention monitoring for a simulation session.
        """
        self.cycle_active = True
        self.last_feedback_time = datetime.now()

        while self.cycle_active:
            await asyncio.sleep(1)  # check every second

            elapsed = (datetime.now() - self.last_feedback_time).total_seconds()

            if elapsed >= self.OPTIMAL_CYCLE:
                # Time to provide feedback
                await self.trigger_micro_feedback(simulation_id)
                self.last_feedback_time = datetime.now()

    async def trigger_micro_feedback(self, simulation_id: str):
        """
        Deliver a micro-feedback event to keep brain engaged.
        """
        feedback_types = [
            "progress_indicator",  # "You're halfway through!"
            "encouragement",       # "좋아, 계속 해봐!"
            "subtle_hint",         # "이 부분을 주목해봐"
            "micro_celebration"    # Gentle visual feedback
        ]

        # Call the registered feedback callback
        await self.feedback_callback(simulation_id, feedback_types)

    def stop_attention_cycle(self):
        """
        Stop the attention loop (simulation completed).
        """
        self.cycle_active = False

    def record_interaction(self):
        """
        Student interacted - this counts as engagement, reset timer partially.
        """
        elapsed = (datetime.now() - self.last_feedback_time).total_seconds()

        # If interaction happens before optimal cycle, extend the next cycle slightly
        if elapsed < self.OPTIMAL_CYCLE:
            # Reward sustained engagement by not resetting timer completely
            # This allows for flow state
            pass
        else:
            # Reset timer since we're approaching feedback need
            self.last_feedback_time = datetime.now()
```

### 6.2 Micro-Feedback Types

| Feedback Type | Description | Visual | Audio | Frequency |
|---------------|-------------|--------|-------|-----------|
| **Progress Indicator** | Show how far through the pebble | Subtle progress bar fill | None | Every 25s |
| **Encouragement** | Brief text affirmation | "좋아, 계속해봐!" | Soft chime | Every 30s if struggling |
| **Gentle Hint** | Non-intrusive guidance | Highlight relevant area | None | When stuck >40s |
| **Micro Celebration** | Success acknowledgment | Gentle glow pulse | Warm tone | Upon each correct action |
| **Curiosity Spark** | "What if..." prompts | Question mark fade-in | None | Every 35s if inactive |

---

## 7. User Interface Specifications

### 7.1 Visual Design Principles

**Color Palette** (Warm, Non-Childish):
- Primary: `#F4E8D0` (Warm cream)
- Secondary: `#C9A063` (Golden brown)
- Accent: `#E8C29A` (Soft peach)
- Success: `#A8C5A0` (Muted sage green)
- Depth Gauge: `#8B7355` (Deep brown - single color)

**Typography**:
- Headings: Noto Sans KR Medium, 24-32px
- Body: Noto Sans KR Regular, 16-18px
- UI Elements: Noto Sans KR Light, 14-16px

**Animation Principles**:
- Duration: 200-400ms (never instant, never slow)
- Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` (material design standard)
- Micro-interactions: Spring animations for organic feel

### 7.2 Component Specifications

#### Brain Prep Screen (10 seconds)

```tsx
// /src/components/BrainPrep/BrainPrepScreen.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BrainPrepProps {
  onComplete: (condition: BrainCondition) => void;
}

type BrainCondition = 'focused' | 'tired' | 'energetic' | 'neutral';

export const BrainPrepScreen: React.FC<BrainPrepProps> = ({ onComplete }) => {
  const [selected, setSelected] = useState<BrainCondition | null>(null);

  const conditions: { value: BrainCondition; label: string; emoji: string }[] = [
    { value: 'focused', label: '집중 모드', emoji: '🎯' },
    { value: 'energetic', label: '활발한 상태', emoji: '⚡' },
    { value: 'neutral', label: '보통', emoji: '😊' },
    { value: 'tired', label: '좀 피곤해', emoji: '😌' },
  ];

  const handleSelect = (condition: BrainCondition) => {
    setSelected(condition);
    // Wait 500ms then proceed
    setTimeout(() => onComplete(condition), 500);
  };

  return (
    <motion.div
      className="brain-prep-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundColor: '#F4E8D0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '28px', marginBottom: '1rem', color: '#5A4A3A' }}>
        오늘 뇌가 가장 궁금해하는 건 뭘까?
      </h1>

      <p style={{ fontSize: '16px', marginBottom: '2rem', color: '#8B7355' }}>
        지금 너의 컨디션을 알려줘
      </p>

      <div className="condition-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {conditions.map((condition) => (
          <motion.button
            key={condition.value}
            onClick={() => handleSelect(condition.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: selected === condition.value ? '3px solid #C9A063' : '1px solid #E0D5C7',
              backgroundColor: selected === condition.value ? '#FFF9F0' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>{condition.emoji}</div>
            <div style={{ fontSize: '16px', color: '#5A4A3A' }}>{condition.label}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
```

#### Concept Pebble Display

```tsx
// /src/components/ConceptPebble/PebbleDisplay.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface Pebble {
  id: string;
  number: number;
  name: string;
  isCompleted: boolean;
  isLocked: boolean;
  depthContribution: number;
}

interface PebbleDisplayProps {
  pebbles: Pebble[];
  onPebbleSelect: (pebbleId: string) => void;
}

export const PebbleDisplay: React.FC<PebbleDisplayProps> = ({ pebbles, onPebbleSelect }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '1.5rem', color: '#5A4A3A' }}>
        개념 조각 (Concept Pebbles)
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pebbles.map((pebble, index) => (
          <motion.div
            key={pebble.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PebbleCard pebble={pebble} onSelect={() => onPebbleSelect(pebble.id)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const PebbleCard: React.FC<{ pebble: Pebble; onSelect: () => void }> = ({ pebble, onSelect }) => {
  const isAvailable = !pebble.isLocked;

  return (
    <motion.button
      onClick={isAvailable ? onSelect : undefined}
      disabled={!isAvailable}
      whileHover={isAvailable ? { scale: 1.02, x: 10 } : {}}
      whileTap={isAvailable ? { scale: 0.98 } : {}}
      style={{
        width: '100%',
        padding: '1.5rem',
        borderRadius: '16px',
        border: 'none',
        backgroundColor: pebble.isCompleted ? '#E8F5E8' : isAvailable ? '#FFFFFF' : '#F0F0F0',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        textAlign: 'left',
        boxShadow: isAvailable ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        opacity: isAvailable ? 1 : 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: pebble.isCompleted ? '#A8C5A0' : '#C9A063',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#FFFFFF',
        }}
      >
        {pebble.isCompleted ? '✓' : pebble.number}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#5A4A3A', marginBottom: '0.25rem' }}>
          {pebble.name}
        </div>
        {pebble.isCompleted && (
          <div style={{ fontSize: '14px', color: '#6B8068' }}>
            깊이 +{pebble.depthContribution}
          </div>
        )}
      </div>

      {!isAvailable && (
        <div style={{ fontSize: '24px' }}>🔒</div>
      )}
    </motion.button>
  );
};
```

#### 20-Second Simulation Interface (Example: Fraction Division)

```tsx
// /src/components/SimulationEngine/FractionSimulation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface FractionSimulationProps {
  simulationId: string;
  difficulty: number;
  onComplete: (success: boolean, duration: number) => void;
  onInteraction: (interactionData: any) => void;
}

export const FractionSimulation: React.FC<FractionSimulationProps> = ({
  simulationId,
  difficulty,
  onComplete,
  onInteraction,
}) => {
  const [startTime] = useState(Date.now());
  const [selectedPieces, setSelectedPieces] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  const targetNumerator = 1;
  const targetDenominator = 4; // "1/4를 찾아봐"

  useEffect(() => {
    // Auto-complete after reasonable time or on success
    const timer = setTimeout(() => {
      const duration = (Date.now() - startTime) / 1000;
      onComplete(selectedPieces.length === 1, duration);
    }, 20000); // 20 seconds max

    return () => clearTimeout(timer);
  }, []);

  const handlePieceSelect = (pieceIndex: number) => {
    const newSelection = [...selectedPieces, pieceIndex];
    setSelectedPieces(newSelection);

    // Record interaction
    onInteraction({
      type: 'tap',
      timestamp: Date.now() - startTime,
      data: { pieceIndex, totalSelected: newSelection.length }
    });

    // Immediate feedback
    if (newSelection.length === 1) {
      setFeedback('좋아, 이건 완벽하게 이해했어!');
      setTimeout(() => {
        const duration = (Date.now() - startTime) / 1000;
        onComplete(true, duration);
      }, 1500);
    } else if (newSelection.length > 1) {
      setFeedback('조금 줄여봐!');
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#F4E8D0', minHeight: '100vh' }}>
      <h3 style={{ fontSize: '20px', marginBottom: '1rem', color: '#5A4A3A' }}>
        전체를 4등분 했을 때, 1조각은 어떤 느낌일까?
      </h3>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Circle divided into 4 pieces */}
          {[0, 1, 2, 3].map((index) => {
            const angle = (index * 90) - 90; // Start from top
            const isSelected = selectedPieces.includes(index);

            return (
              <motion.path
                key={index}
                d={describeArc(150, 150, 100, angle, angle + 90)}
                fill={isSelected ? '#C9A063' : '#E8C29A'}
                stroke="#FFFFFF"
                strokeWidth="3"
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePieceSelect(index)}
              />
            );
          })}
        </svg>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#FFF9F0',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '18px',
            color: '#5A4A3A',
          }}
        >
          {feedback}
        </motion.div>
      )}
    </div>
  );
};

// Helper function to draw arc paths
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
```

#### Depth Score Gauge

```tsx
// /src/components/DepthScore/DepthGauge.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface DepthGaugeProps {
  currentDepth: number; // 0-100
  conceptName: string;
}

export const DepthGauge: React.FC<DepthGaugeProps> = ({ currentDepth, conceptName }) => {
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentDepth / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div style={{ position: 'relative' }}>
        <svg height={radius * 2} width={radius * 2}>
          {/* Background circle */}
          <circle
            stroke="#E0D5C7"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          {/* Progress circle */}
          <motion.circle
            stroke="#8B7355"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B7355' }}>
            {Math.round(currentDepth)}
          </div>
          <div style={{ fontSize: '14px', color: '#A0907D' }}>깊이</div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '18px', color: '#5A4A3A' }}>
        {conceptName}
      </div>
    </div>
  );
};
```

---

## 8. Implementation Phases & Timeline

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Project Setup & Architecture**
- [ ] Initialize React + TypeScript project
- [ ] Set up Python FastAPI backend
- [ ] Configure PostgreSQL + TimescaleDB
- [ ] Set up Redis for session management
- [ ] Establish CI/CD pipeline

**Week 2: Core Data Models**
- [ ] Implement database schema (students, concepts, pebbles, sessions)
- [ ] Create migration scripts
- [ ] Seed initial concept data (fractions as pilot)
- [ ] Build basic API endpoints (CRUD operations)

**Week 3: Authentication & Session Management**
- [ ] Implement student authentication
- [ ] Session start/end logic
- [ ] WebSocket connection setup
- [ ] Brain condition tracking

**Deliverable**: Basic infrastructure with student login and session tracking

---

### Phase 2: Cognitive Engine (Weeks 4-6)

**Week 4: Adaptive Difficulty Algorithm**
- [ ] Implement `AdaptiveDifficultyEngine` class
- [ ] Cognitive load estimation logic
- [ ] Bayesian Knowledge Tracing
- [ ] Unit tests for difficulty adjustment

**Week 5: Attention Loop & Dopamine Engine**
- [ ] Build `AttentionLoopManager`
- [ ] Implement 20-40 second cycle monitoring
- [ ] Dopamine prediction error calculation
- [ ] Micro-feedback trigger system

**Week 6: Integration & Testing**
- [ ] Connect cognitive engine to API layer
- [ ] Real-time difficulty adjustment via WebSocket
- [ ] Performance testing (latency, throughput)
- [ ] Algorithm tuning based on simulated data

**Deliverable**: Working cognitive engine with adaptive difficulty

---

### Phase 3: Frontend Core Components (Weeks 7-10)

**Week 7: Brain Prep & Pebble Display**
- [ ] Build `BrainPrepScreen` component
- [ ] Create `PebbleDisplay` and `PebbleCard` components
- [ ] State management setup (Zustand/Redux)
- [ ] Navigation flow

**Week 8: Simulation Engine**
- [ ] Build reusable simulation framework
- [ ] Implement fraction division simulation (pilot)
- [ ] Interaction tracking (drag, tap, swipe)
- [ ] Real-time feedback rendering

**Week 9: Feedback & Celebration System**
- [ ] Design micro-feedback animations (Framer Motion)
- [ ] Success experience visual effects (subtle glow)
- [ ] Audio feedback system (gentle tones)
- [ ] A/B test celebration styles

**Week 10: Depth Score & Reflection**
- [ ] Build `DepthGauge` component
- [ ] Implement reflection card swipe interface
- [ ] Metacognition tracking integration
- [ ] Summary screen design

**Deliverable**: Complete frontend UX flow for single concept

---

### Phase 4: Concept Merging & Advanced Features (Weeks 11-13)

**Week 11: Concept Connection UI**
- [ ] Drag-to-connect interface for pebbles
- [ ] Graph visualization of connections
- [ ] Connection strength indicators
- [ ] Backend integration for saving connections

**Week 12: Content Expansion**
- [ ] Add 3-5 additional math concepts (decimals, ratios, area, etc.)
- [ ] Create pebble decompositions for each concept
- [ ] Design concept-specific simulations
- [ ] Dependency mapping between pebbles

**Week 13: Polish & Accessibility**
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Keyboard navigation support
- [ ] Screen reader optimization
- [ ] Responsive design refinement (tablet, desktop)

**Deliverable**: Multi-concept system with connection building

---

### Phase 5: Analytics & Optimization (Weeks 14-15)

**Week 14: Analytics Dashboard**
- [ ] Teacher/admin dashboard (view student progress)
- [ ] Cognitive load heatmaps
- [ ] Depth score trajectories
- [ ] Attention pattern analysis

**Week 15: Performance Optimization**
- [ ] Frontend bundle optimization
- [ ] API response time improvements
- [ ] Database query optimization
- [ ] Caching strategy implementation

**Deliverable**: Production-ready system with monitoring

---

### Phase 6: User Testing & Iteration (Weeks 16-18)

**Week 16: Pilot Testing**
- [ ] Recruit 10-15 students (5th-6th grade)
- [ ] Supervised testing sessions
- [ ] Collect qualitative feedback
- [ ] Observe cognitive load indicators

**Week 17: Data Analysis & Refinement**
- [ ] Analyze usage patterns
- [ ] Identify UX friction points
- [ ] Algorithm tuning based on real data
- [ ] Bug fixes and edge cases

**Week 18: Final Polish**
- [ ] Implement feedback-driven improvements
- [ ] Final accessibility review
- [ ] Performance benchmarking
- [ ] Documentation completion

**Deliverable**: Validated MVP ready for broader deployment

---

## 9. Technical Risks & Mitigation

### Risk 1: Cognitive Load Estimation Inaccuracy
**Impact**: High - Core feature depends on accurate estimation
**Likelihood**: Medium
**Mitigation**:
- Start with conservative estimates, tune with real data
- Implement manual override for teachers to adjust sensitivity
- A/B test different estimation algorithms
- Collect ground truth via post-session surveys

### Risk 2: 20-Second Simulations Too Short/Long
**Impact**: Medium - Affects engagement
**Likelihood**: Medium
**Mitigation**:
- Make duration configurable per pebble
- Track actual completion times in pilot
- Allow student-paced progression (no hard cutoff)
- Design simulations with natural 15-25 second arc

### Risk 3: "Non-Childish" Design Alienates Students
**Impact**: Medium - Could reduce engagement if too dry
**Likelihood**: Low-Medium
**Mitigation**:
- User testing with target age group (5th-6th graders)
- Balance sophistication with approachability
- Add subtle playful elements (without being "cute")
- Iterate based on student preferences

### Risk 4: WebSocket Scalability
**Impact**: Medium - Real-time features depend on stable connections
**Likelihood**: Low
**Mitigation**:
- Implement reconnection logic
- Fallback to polling if WebSocket unavailable
- Load testing with 100+ concurrent students
- Use managed WebSocket service (AWS API Gateway, Pusher)

### Risk 5: Content Creation Bottleneck
**Impact**: High - Limited concepts = limited value
**Likelihood**: Medium
**Mitigation**:
- Start with AI-assisted pebble decomposition (use Claude API)
- Create reusable simulation templates
- Build content authoring tools for educators
- Prioritize 10-15 core concepts for MVP

---

## 10. Success Metrics

### Primary KPIs

1. **Engagement Duration**
   - Target: Average session length > 15 minutes
   - Measurement: `session.ended_at - session.started_at`
   - Success: Students voluntarily continue beyond single pebble

2. **Concept Mastery**
   - Target: Average depth score > 60 after 3 sessions
   - Measurement: `depth_scores.current_depth`
   - Success: Demonstrates actual understanding growth

3. **Cognitive Load Optimization**
   - Target: 70% of simulation time in optimal load zone (0.4-0.6)
   - Measurement: `cognitive_load_snapshots.load_estimate`
   - Success: Algorithm effectively maintaining engagement

4. **Metacognitive Accuracy**
   - Target: Confidence-mastery gap < 0.2
   - Measurement: `reflection_choices.confidence_gap`
   - Success: Students accurately self-assess understanding

5. **Student Satisfaction**
   - Target: Post-session rating > 4.0/5.0
   - Measurement: Survey after each session
   - Success: Students find it engaging and not "childish"

### Secondary Metrics

6. **Pebble Completion Rate**: % of started pebbles completed
7. **Connection Creation**: Average connections made per concept
8. **Dopamine Events**: Frequency of "surprising success" moments
9. **Attention Maintenance**: % of sessions without attention drops
10. **Teacher Satisfaction**: Net Promoter Score from educators

---

## 11. Future Enhancements (Post-MVP)

### Phase 2 Features
1. **AI-Powered Pebble Generation**: Automatic concept decomposition using LLMs
2. **Peer Connection Sharing**: Students can see how others connected concepts
3. **Multi-Subject Expansion**: Science, language arts, social studies
4. **Voice Interaction**: Speech input for reflection and explanations
5. **Adaptive Content Sequencing**: AI determines optimal pebble order per student

### Phase 3 Features
6. **Collaborative Learning**: Multi-student simulations
7. **Teacher Analytics Dashboard**: Detailed insights into class progress
8. **Parent Portal**: Progress reports and home practice suggestions
9. **Integration with School LMS**: Canvas, Google Classroom, etc.
10. **Mobile Native Apps**: iOS and Android with offline support

---

## 12. Appendices

### Appendix A: Technology Stack Summary

**Frontend**:
- React 18+ with TypeScript
- Framer Motion (animations)
- Zustand (state management)
- Socket.io-client (WebSocket)
- Recharts (data visualization)
- TailwindCSS (styling)

**Backend**:
- Python 3.11+ with FastAPI
- SQLAlchemy (ORM)
- Alembic (migrations)
- Pydantic (data validation)
- Celery + Redis (task queue)
- Socket.io (WebSocket server)

**Database**:
- PostgreSQL 15+
- TimescaleDB extension
- Redis 7+

**DevOps**:
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Pytest (Python testing)
- Jest + React Testing Library (Frontend testing)

**AI/ML**:
- Claude API (concept decomposition, future features)
- NumPy, SciPy (algorithm implementation)

### Appendix B: Sample Concept Data

```json
{
  "concept_id": "fraction-basics",
  "name": "분수 기초 (Fraction Basics)",
  "target_grade": 5,
  "pebbles": [
    {
      "pebble_number": 1,
      "name": "전체를 나누는 감각",
      "semantic_content": {
        "core_idea": "Whole objects can be divided into equal parts",
        "simulation_type": "visual_division",
        "examples": ["pizza", "cake", "rectangle"],
        "key_insight": "Each part is equal in size"
      },
      "base_difficulty": 0.2,
      "dependencies": []
    },
    {
      "pebble_number": 2,
      "name": "분자·분모 의미",
      "semantic_content": {
        "core_idea": "Numerator = parts you have, Denominator = total parts",
        "simulation_type": "fraction_builder",
        "key_insight": "Denominator determines piece size"
      },
      "base_difficulty": 0.3,
      "dependencies": [1]
    },
    {
      "pebble_number": 3,
      "name": "크기 비교의 직관",
      "semantic_content": {
        "core_idea": "Comparing fractions by visualizing",
        "simulation_type": "fraction_comparison",
        "key_insight": "Same denominator = easy comparison"
      },
      "base_difficulty": 0.4,
      "dependencies": [1, 2]
    },
    {
      "pebble_number": 4,
      "name": "연산 연결",
      "semantic_content": {
        "core_idea": "Adding/subtracting fractions with same denominator",
        "simulation_type": "fraction_arithmetic",
        "key_insight": "Denominators stay same, numerators combine"
      },
      "base_difficulty": 0.5,
      "dependencies": [2, 3]
    }
  ]
}
```

### Appendix C: Dopamine Event Examples

**Event Type: Easy Success**
- **Scenario**: Student completes 0.2 difficulty task successfully
- **Prediction Error**: 0.2 (low)
- **System Response**: Gentle confirmation, increase difficulty slightly

**Event Type: Surprising Success**
- **Scenario**: Student completes 0.6 difficulty task on first try
- **Prediction Error**: 0.7 (high)
- **System Response**: Warm celebration, significant depth increase, maintain/slightly increase difficulty

**Event Type: Expected Fail**
- **Scenario**: Student fails 0.8 difficulty task after 3 attempts
- **Prediction Error**: 0.1 (very low, expected)
- **System Response**: Supportive message, return to previous pebble, reduce difficulty

**Event Type: Unexpected Fail**
- **Scenario**: Student fails 0.3 difficulty task repeatedly
- **Prediction Error**: 0.4 (moderate)
- **System Response**: Immediate difficulty reduction, check for conceptual gap, offer hint

---

## Document Control

- **Version**: 1.0.0
- **Created**: 2025-11-20
- **Author**: Claude (Technical Implementation Specialist)
- **Status**: Ready for Development
- **Next Steps**:
  1. Development team review and timeline validation
  2. Designer review of UI specifications
  3. Educator review of cognitive principles
  4. Budget approval for infrastructure
- **Estimated Development Time**: 18 weeks (4.5 months)
- **Estimated Team Size**:
  - 2 Frontend Developers
  - 2 Backend Developers
  - 1 UX Designer
  - 1 Data Scientist (cognitive algorithms)
  - 1 Educational Consultant

---

## Questions & Feedback

For questions about this implementation plan:
- **Technical Architecture**: Contact backend team lead
- **Cognitive Science Approach**: Contact educational psychology consultant
- **UI/UX Design**: Contact design team lead
- **Timeline/Resources**: Contact project manager

**Review Checklist**:
- [ ] Are technical stack choices appropriate?
- [ ] Is the database schema comprehensive?
- [ ] Are cognitive algorithms feasible to implement?
- [ ] Is the timeline realistic?
- [ ] Are success metrics well-defined?
- [ ] Are risks adequately addressed?
- [ ] Is the API design RESTful and scalable?
