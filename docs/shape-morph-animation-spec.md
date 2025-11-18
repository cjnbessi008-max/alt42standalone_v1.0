# Shape Morph Animation - 기술 사양서

## 1. 개요

### 1.1 목적
Moodle LMS와 연동하여 학습 개념의 전이(transition)를 시각적으로 표현하는 Shape Morph 애니메이션 시스템을 구현합니다. 우측 하단의 가상 스마트폰 화면에 표시되어 학생들의 학습 진행 상황과 개념 변화를 실시간으로 시각화합니다.

### 1.2 주요 기능
- **실시간 형상 변환**: 수학 개념(분수, 기하학, 대수 등)을 부드러운 애니메이션으로 표현
- **Moodle 연동**: 문제 정보 및 학생 진행 상황을 Moodle에서 가져오기
- **모바일 디스플레이**: 우측 하단 고정 위치에 스마트폰 프레임 형태로 표시
- **개념 전이 시각화**: 한 개념에서 다른 개념으로 점진적 변화 표현

### 1.3 대상 환경
- **LMS**: Moodle 3.7
- **데이터베이스**: MySQL 5.7
- **서버**: PHP 7.1.9
- **클라이언트**: 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

---

## 2. 시스템 아키텍처

### 2.1 전체 구조
```
┌─────────────────────────────────────────────────────────────┐
│                      Moodle LMS 3.7                          │
│                   (MySQL 5.7, PHP 7.1.9)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API / AJAX
┌────────────────────▼────────────────────────────────────────┐
│              Shape Morph Backend (PHP)                       │
│  - Moodle API Integration                                    │
│  - Problem Data Provider                                     │
│  - Student Progress Tracker                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON Response
┌────────────────────▼────────────────────────────────────────┐
│           Shape Morph Frontend (React + TypeScript)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Smartphone Frame Component                          │  │
│  │    └─ Canvas/SVG Animation Engine                    │  │
│  │         └─ Shape Morphing Algorithm                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 컴포넌트 구조
```
src/
├── backend/                    # PHP Backend
│   ├── moodle-integration/
│   │   ├── api/
│   │   │   ├── problem-provider.php      # 문제 정보 제공
│   │   │   ├── progress-tracker.php      # 진행 상황 추적
│   │   │   └── concept-mapper.php        # 개념 매핑
│   │   ├── db/
│   │   │   ├── schema.sql                # DB 스키마
│   │   │   └── connection.php            # MySQL 연결
│   │   └── config/
│   │       └── moodle-config.php         # Moodle 설정
│   └── shape-morph/
│       ├── concept-analyzer.php          # 개념 분석
│       └── transition-generator.php      # 전환 데이터 생성
│
├── frontend/                   # React Frontend
│   ├── components/
│   │   ├── SmartphoneFrame/
│   │   │   ├── SmartphoneFrame.tsx       # 스마트폰 프레임 UI
│   │   │   ├── SmartphoneFrame.css       # 스타일링
│   │   │   └── types.ts                  # 타입 정의
│   │   ├── ShapeMorphCanvas/
│   │   │   ├── ShapeMorphCanvas.tsx      # 메인 캔버스
│   │   │   ├── ShapeMorphEngine.ts       # 애니메이션 엔진
│   │   │   ├── MorphingAlgorithm.ts      # 모핑 알고리즘
│   │   │   └── ConceptShapes.ts          # 개념별 형상 정의
│   │   └── ConceptTransition/
│   │       ├── TransitionController.tsx  # 전환 제어
│   │       └── TransitionTimeline.ts     # 타임라인 관리
│   ├── services/
│   │   ├── moodle-api.ts                 # Moodle API 클라이언트
│   │   └── websocket-client.ts           # 실시간 업데이트
│   ├── utils/
│   │   ├── geometry.ts                   # 기하학 유틸리티
│   │   ├── bezier-interpolation.ts       # 베지어 보간
│   │   └── easing-functions.ts           # Easing 함수
│   └── types/
│       ├── shape.types.ts                # 형상 타입
│       └── concept.types.ts              # 개념 타입
│
└── docs/
    ├── api-documentation.md              # API 문서
    └── animation-guide.md                # 애니메이션 가이드
```

---

## 3. 데이터베이스 스키마 (MySQL 5.7)

### 3.1 Shape Morph 테이블

```sql
-- Shape Morph 설정 테이블
CREATE TABLE shape_morph_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_course_id INT NOT NULL,
    animation_speed DECIMAL(3,2) DEFAULT 1.00,
    transition_duration INT DEFAULT 2000, -- milliseconds
    shape_style VARCHAR(50) DEFAULT 'smooth',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moodle_course_id) REFERENCES mdl_course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 개념 형상 매핑 테이블
CREATE TABLE concept_shapes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    concept_name VARCHAR(100) NOT NULL,
    concept_category VARCHAR(50) NOT NULL, -- fraction, geometry, algebra 등
    shape_data JSON NOT NULL, -- 형상 정의 (SVG path, 좌표 등)
    color_primary VARCHAR(7) NOT NULL, -- HEX color
    color_secondary VARCHAR(7),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_concept_name (concept_name),
    INDEX idx_category (concept_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 전환 규칙 테이블
CREATE TABLE concept_transitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_concept_id INT NOT NULL,
    to_concept_id INT NOT NULL,
    transition_type VARCHAR(50) DEFAULT 'morph', -- morph, fade, slide 등
    duration_ms INT DEFAULT 2000,
    easing_function VARCHAR(50) DEFAULT 'ease-in-out',
    keyframes JSON, -- 중간 키프레임 정의
    FOREIGN KEY (from_concept_id) REFERENCES concept_shapes(id),
    FOREIGN KEY (to_concept_id) REFERENCES concept_shapes(id),
    UNIQUE KEY unique_transition (from_concept_id, to_concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 진행 상황 추적 테이블
CREATE TABLE student_shape_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    current_concept_id INT NOT NULL,
    previous_concept_id INT,
    transition_state ENUM('idle', 'transitioning', 'completed') DEFAULT 'idle',
    animation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moodle_user_id) REFERENCES mdl_user(id),
    FOREIGN KEY (moodle_course_id) REFERENCES mdl_course(id),
    FOREIGN KEY (current_concept_id) REFERENCES concept_shapes(id),
    FOREIGN KEY (previous_concept_id) REFERENCES concept_shapes(id),
    INDEX idx_user_course (moodle_user_id, moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 애니메이션 이벤트 로그
CREATE TABLE shape_morph_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- transition_start, transition_complete, interaction
    from_concept VARCHAR(100),
    to_concept VARCHAR(100),
    duration_ms INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON, -- 추가 정보
    FOREIGN KEY (user_id) REFERENCES mdl_user(id),
    FOREIGN KEY (course_id) REFERENCES mdl_course(id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.2 초기 데이터 시드

```sql
-- 기본 개념 형상 데이터
INSERT INTO concept_shapes (concept_name, concept_category, shape_data, color_primary, color_secondary, description) VALUES
('fraction_half', 'fraction', '{"type": "circle", "segments": 2, "filled": 1}', '#FF6B6B', '#FFA07A', '1/2 분수 - 반원'),
('fraction_third', 'fraction', '{"type": "circle", "segments": 3, "filled": 1}', '#4ECDC4', '#95E1D3', '1/3 분수 - 삼등분'),
('fraction_quarter', 'fraction', '{"type": "circle", "segments": 4, "filled": 1}', '#45B7D1', '#96CEB4', '1/4 분수 - 사등분'),
('square', 'geometry', '{"type": "polygon", "sides": 4, "rotation": 45}', '#F38181', '#AA96DA', '정사각형'),
('triangle', 'geometry', '{"type": "polygon", "sides": 3}', '#FCBAD3', '#FFFFD2', '삼각형'),
('circle', 'geometry', '{"type": "circle", "radius": 50}', '#A8D8EA', '#FFAAA6', '원'),
('rectangle', 'geometry', '{"type": "polygon", "sides": 4, "width": 80, "height": 40}', '#FF9FF3', '#FECA57', '직사각형');

-- 기본 전환 규칙
INSERT INTO concept_transitions (from_concept_id, to_concept_id, transition_type, duration_ms, easing_function) VALUES
(1, 2, 'morph', 2000, 'ease-in-out'),
(2, 3, 'morph', 2000, 'ease-in-out'),
(3, 1, 'morph', 2000, 'ease-in-out'),
(4, 5, 'morph', 1500, 'ease-in-out'),
(5, 6, 'morph', 1500, 'ease-in-out'),
(6, 4, 'morph', 1500, 'ease-in-out');
```

---

## 4. Moodle 연동 API (PHP 7.1.9)

### 4.1 문제 정보 제공 API

**파일**: `backend/moodle-integration/api/problem-provider.php`

```php
<?php
require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/lib/moodlelib.php');

/**
 * Shape Morph - 문제 정보 제공 API
 * Moodle quiz/assignment 문제에서 개념 정보를 추출
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

// 세션 및 사용자 인증 확인
require_login();

$action = optional_param('action', '', PARAM_ALPHA);
$questionid = optional_param('questionid', 0, PARAM_INT);
$courseid = optional_param('courseid', 0, PARAM_INT);
$userid = $USER->id;

switch ($action) {
    case 'get_problem_concept':
        echo json_encode(get_problem_concept($questionid));
        break;

    case 'get_current_concept':
        echo json_encode(get_current_concept($userid, $courseid));
        break;

    case 'update_progress':
        $conceptid = required_param('conceptid', PARAM_INT);
        echo json_encode(update_student_progress($userid, $courseid, $conceptid));
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

/**
 * 문제에서 개념 추출
 */
function get_problem_concept($questionid) {
    global $DB;

    $question = $DB->get_record('question', ['id' => $questionid], '*', MUST_EXIST);

    // 문제 텍스트에서 개념 키워드 추출
    $concept = extract_concept_from_question($question->questiontext);

    // 해당 개념의 형상 데이터 조회
    $shape = $DB->get_record('concept_shapes', ['concept_name' => $concept]);

    return [
        'success' => true,
        'question_id' => $questionid,
        'concept' => $concept,
        'shape_data' => json_decode($shape->shape_data),
        'colors' => [
            'primary' => $shape->color_primary,
            'secondary' => $shape->color_secondary
        ]
    ];
}

/**
 * 학생의 현재 개념 조회
 */
function get_current_concept($userid, $courseid) {
    global $DB;

    $progress = $DB->get_record('student_shape_progress', [
        'moodle_user_id' => $userid,
        'moodle_course_id' => $courseid
    ]);

    if (!$progress) {
        // 첫 접속 시 기본 개념으로 초기화
        return initialize_student_progress($userid, $courseid);
    }

    $current_shape = $DB->get_record('concept_shapes', ['id' => $progress->current_concept_id]);
    $previous_shape = $progress->previous_concept_id
        ? $DB->get_record('concept_shapes', ['id' => $progress->previous_concept_id])
        : null;

    return [
        'success' => true,
        'current_concept' => [
            'id' => $current_shape->id,
            'name' => $current_shape->concept_name,
            'shape_data' => json_decode($current_shape->shape_data),
            'colors' => [
                'primary' => $current_shape->color_primary,
                'secondary' => $current_shape->color_secondary
            ]
        ],
        'previous_concept' => $previous_shape ? [
            'id' => $previous_shape->id,
            'name' => $previous_shape->concept_name
        ] : null,
        'transition_state' => $progress->transition_state
    ];
}

/**
 * 학생 진행 상황 업데이트
 */
function update_student_progress($userid, $courseid, $conceptid) {
    global $DB;

    $existing = $DB->get_record('student_shape_progress', [
        'moodle_user_id' => $userid,
        'moodle_course_id' => $courseid
    ]);

    if ($existing) {
        // 기존 진행 상황 업데이트
        $update = new stdClass();
        $update->id = $existing->id;
        $update->previous_concept_id = $existing->current_concept_id;
        $update->current_concept_id = $conceptid;
        $update->transition_state = 'transitioning';
        $update->animation_timestamp = time();

        $DB->update_record('student_shape_progress', $update);

        // 전환 데이터 조회
        $transition = $DB->get_record('concept_transitions', [
            'from_concept_id' => $existing->current_concept_id,
            'to_concept_id' => $conceptid
        ]);

        // 이벤트 로그
        log_shape_event($userid, $courseid, 'transition_start',
            $existing->current_concept_id, $conceptid);

        return [
            'success' => true,
            'transition' => $transition ? [
                'type' => $transition->transition_type,
                'duration' => $transition->duration_ms,
                'easing' => $transition->easing_function,
                'keyframes' => json_decode($transition->keyframes)
            ] : get_default_transition()
        ];
    } else {
        return initialize_student_progress($userid, $courseid, $conceptid);
    }
}

/**
 * 학생 진행 상황 초기화
 */
function initialize_student_progress($userid, $courseid, $conceptid = null) {
    global $DB;

    if (!$conceptid) {
        // 기본 시작 개념 (첫 번째 개념)
        $first_concept = $DB->get_record_sql(
            "SELECT id FROM {concept_shapes} ORDER BY id ASC LIMIT 1"
        );
        $conceptid = $first_concept->id;
    }

    $record = new stdClass();
    $record->moodle_user_id = $userid;
    $record->moodle_course_id = $courseid;
    $record->current_concept_id = $conceptid;
    $record->transition_state = 'idle';
    $record->animation_timestamp = time();

    $DB->insert_record('student_shape_progress', $record);

    return get_current_concept($userid, $courseid);
}

/**
 * 문제 텍스트에서 개념 추출 (간단한 키워드 매칭)
 */
function extract_concept_from_question($questiontext) {
    $text = strip_tags($questiontext);
    $text = strtolower($text);

    // 키워드 매핑
    $keyword_map = [
        'fraction' => ['분수', '분자', '분모', 'fraction', 'numerator'],
        'square' => ['정사각형', '사각형', 'square'],
        'triangle' => ['삼각형', 'triangle'],
        'circle' => ['원', 'circle'],
        'rectangle' => ['직사각형', 'rectangle']
    ];

    foreach ($keyword_map as $concept => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($text, $keyword) !== false) {
                return $concept;
            }
        }
    }

    return 'circle'; // 기본값
}

/**
 * 기본 전환 설정
 */
function get_default_transition() {
    return [
        'type' => 'morph',
        'duration' => 2000,
        'easing' => 'ease-in-out',
        'keyframes' => []
    ];
}

/**
 * 형상 애니메이션 이벤트 로그
 */
function log_shape_event($userid, $courseid, $event_type, $from_concept = null, $to_concept = null) {
    global $DB;

    $event = new stdClass();
    $event->user_id = $userid;
    $event->course_id = $courseid;
    $event->event_type = $event_type;
    $event->from_concept = $from_concept;
    $event->to_concept = $to_concept;
    $event->timestamp = time();

    $DB->insert_record('shape_morph_events', $event);
}
```

---

## 5. 프론트엔드 구현 (React + TypeScript)

### 5.1 타입 정의

**파일**: `frontend/types/shape.types.ts`

```typescript
/**
 * Shape Morph 타입 정의
 */

export type ShapeType = 'circle' | 'polygon' | 'path' | 'bezier';

export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'bounce'
  | 'elastic';

export interface Point {
  x: number;
  y: number;
}

export interface ShapeData {
  type: ShapeType;
  points?: Point[];
  radius?: number;
  sides?: number;
  rotation?: number;
  width?: number;
  height?: number;
  segments?: number;
  filled?: number;
  paths?: string[];
}

export interface ConceptShape {
  id: number;
  name: string;
  category: string;
  shapeData: ShapeData;
  colors: {
    primary: string;
    secondary: string;
  };
  description?: string;
}

export interface TransitionConfig {
  type: 'morph' | 'fade' | 'slide' | 'scale';
  duration: number;
  easing: EasingFunction;
  keyframes?: ShapeData[];
}

export interface MorphState {
  fromShape: ConceptShape;
  toShape: ConceptShape;
  progress: number; // 0.0 - 1.0
  currentFrame: ShapeData;
}

export interface AnimationState {
  isAnimating: boolean;
  currentConcept: ConceptShape | null;
  previousConcept: ConceptShape | null;
  transition: TransitionConfig | null;
  morphState: MorphState | null;
}
```

### 5.2 스마트폰 프레임 컴포넌트

**파일**: `frontend/components/SmartphoneFrame/SmartphoneFrame.tsx`

```typescript
import React from 'react';
import './SmartphoneFrame.css';
import { ShapeMorphCanvas } from '../ShapeMorphCanvas/ShapeMorphCanvas';

export interface SmartphoneFrameProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  position = 'bottom-right',
  size = 'medium',
  theme = 'light'
}) => {
  return (
    <div className={`smartphone-frame ${position} ${size} ${theme}`}>
      {/* 스마트폰 하드웨어 프레임 */}
      <div className="smartphone-bezel">
        {/* 상단 노치 */}
        <div className="smartphone-notch">
          <div className="camera"></div>
          <div className="speaker"></div>
        </div>

        {/* 스크린 영역 */}
        <div className="smartphone-screen">
          {/* Shape Morph 캔버스 */}
          <ShapeMorphCanvas />

          {/* 하단 개념 레이블 */}
          <div className="concept-label">
            <span className="concept-name" id="current-concept-name"></span>
          </div>
        </div>

        {/* 하단 홈 버튼 (옵션) */}
        <div className="smartphone-home-button"></div>
      </div>
    </div>
  );
};
```

**파일**: `frontend/components/SmartphoneFrame/SmartphoneFrame.css`

```css
/**
 * Smartphone Frame Styling
 */

.smartphone-frame {
  position: fixed;
  z-index: 9999;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

/* Position variants */
.smartphone-frame.bottom-right {
  bottom: 20px;
  right: 20px;
}

.smartphone-frame.bottom-left {
  bottom: 20px;
  left: 20px;
}

.smartphone-frame.top-right {
  top: 20px;
  right: 20px;
}

.smartphone-frame.top-left {
  top: 20px;
  left: 20px;
}

/* Size variants */
.smartphone-frame.small {
  --frame-width: 180px;
  --frame-height: 360px;
}

.smartphone-frame.medium {
  --frame-width: 240px;
  --frame-height: 480px;
}

.smartphone-frame.large {
  --frame-width: 300px;
  --frame-height: 600px;
}

/* Smartphone bezel */
.smartphone-bezel {
  width: var(--frame-width, 240px);
  height: var(--frame-height, 480px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 30px;
  padding: 12px;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 0 6px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* Notch */
.smartphone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 24px;
  background: #000;
  border-radius: 0 0 20px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.smartphone-notch .camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;
}

.smartphone-notch .speaker {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #333;
}

/* Screen */
.smartphone-screen {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.smartphone-frame.dark .smartphone-screen {
  background: #1a1a2e;
}

/* Concept label */
.concept-label {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.smartphone-frame.dark .concept-label {
  background: rgba(255, 255, 255, 0.1);
}

/* Home button */
.smartphone-home-button {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .smartphone-frame {
    --frame-width: 160px;
    --frame-height: 320px;
  }

  .smartphone-frame.bottom-right,
  .smartphone-frame.bottom-left {
    bottom: 10px;
  }

  .smartphone-frame.bottom-right {
    right: 10px;
  }

  .smartphone-frame.bottom-left {
    left: 10px;
  }
}

/* Hover effects */
.smartphone-frame:hover {
  transform: scale(1.05);
}

.smartphone-frame:hover .concept-label {
  bottom: 25px;
  font-size: 15px;
}
```

### 5.3 Shape Morph 애니메이션 엔진

**파일**: `frontend/components/ShapeMorphCanvas/ShapeMorphEngine.ts`

```typescript
/**
 * Shape Morph Animation Engine
 * SVG 기반 형상 변환 애니메이션 엔진
 */

import { ConceptShape, ShapeData, Point, TransitionConfig, EasingFunction } from '../../types/shape.types';
import { interpolatePoints, interpolateNumber } from '../../utils/bezier-interpolation';
import { getEasingFunction } from '../../utils/easing-functions';

export class ShapeMorphEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  private currentShape: ConceptShape | null = null;
  private targetShape: ConceptShape | null = null;
  private transitionConfig: TransitionConfig | null = null;

  private startTime: number = 0;
  private isAnimating: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    this.setupCanvas();
  }

  private setupCanvas(): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  /**
   * 형상 변환 시작
   */
  public morphTo(targetShape: ConceptShape, transition: TransitionConfig): void {
    if (this.isAnimating) {
      this.stopAnimation();
    }

    this.targetShape = targetShape;
    this.transitionConfig = transition;
    this.startTime = Date.now();
    this.isAnimating = true;

    this.animate();
  }

  /**
   * 현재 형상 설정 (애니메이션 없이)
   */
  public setShape(shape: ConceptShape): void {
    this.currentShape = shape;
    this.drawShape(shape.shapeData, shape.colors.primary, shape.colors.secondary);
  }

  /**
   * 애니메이션 루프
   */
  private animate = (): void => {
    if (!this.isAnimating || !this.targetShape || !this.transitionConfig || !this.currentShape) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.transitionConfig.duration, 1.0);

    // Easing 함수 적용
    const easedProgress = this.applyEasing(progress, this.transitionConfig.easing);

    // 중간 형상 계산
    const intermediateShape = this.interpolateShapes(
      this.currentShape.shapeData,
      this.targetShape.shapeData,
      easedProgress
    );

    // 색상 보간
    const intermediateColor = this.interpolateColor(
      this.currentShape.colors.primary,
      this.targetShape.colors.primary,
      easedProgress
    );

    const intermediateSecondary = this.interpolateColor(
      this.currentShape.colors.secondary || this.currentShape.colors.primary,
      this.targetShape.colors.secondary || this.targetShape.colors.primary,
      easedProgress
    );

    // 렌더링
    this.clear();
    this.drawShape(intermediateShape, intermediateColor, intermediateSecondary);

    // 애니메이션 완료 확인
    if (progress >= 1.0) {
      this.isAnimating = false;
      this.currentShape = this.targetShape;
      this.onAnimationComplete();
    } else {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * 두 형상 사이 보간
   */
  private interpolateShapes(from: ShapeData, to: ShapeData, progress: number): ShapeData {
    // 타입이 다른 경우 처리
    if (from.type !== to.type) {
      return progress < 0.5 ? from : to;
    }

    const result: ShapeData = { ...from };

    // 수치 속성 보간
    if (from.radius !== undefined && to.radius !== undefined) {
      result.radius = interpolateNumber(from.radius, to.radius, progress);
    }

    if (from.rotation !== undefined && to.rotation !== undefined) {
      result.rotation = interpolateNumber(from.rotation, to.rotation, progress);
    }

    if (from.width !== undefined && to.width !== undefined) {
      result.width = interpolateNumber(from.width, to.width, progress);
    }

    if (from.height !== undefined && to.height !== undefined) {
      result.height = interpolateNumber(from.height, to.height, progress);
    }

    if (from.sides !== undefined && to.sides !== undefined) {
      // sides는 정수여야 하므로 특별 처리
      result.sides = Math.round(interpolateNumber(from.sides, to.sides, progress));
    }

    // 포인트 배열 보간
    if (from.points && to.points) {
      result.points = interpolatePoints(from.points, to.points, progress);
    }

    return result;
  }

  /**
   * 색상 보간 (HEX)
   */
  private interpolateColor(from: string, to: string, progress: number): string {
    const fromRGB = this.hexToRgb(from);
    const toRGB = this.hexToRgb(to);

    const r = Math.round(interpolateNumber(fromRGB.r, toRGB.r, progress));
    const g = Math.round(interpolateNumber(fromRGB.g, toRGB.g, progress));
    const b = Math.round(interpolateNumber(fromRGB.b, toRGB.b, progress));

    return this.rgbToHex(r, g, b);
  }

  /**
   * 형상 그리기
   */
  private drawShape(shape: ShapeData, primaryColor: string, secondaryColor: string): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.save();

    switch (shape.type) {
      case 'circle':
        this.drawCircle(centerX, centerY, shape, primaryColor, secondaryColor);
        break;
      case 'polygon':
        this.drawPolygon(centerX, centerY, shape, primaryColor);
        break;
      case 'path':
        this.drawPath(shape, primaryColor);
        break;
    }

    this.ctx.restore();
  }

  private drawCircle(cx: number, cy: number, shape: ShapeData, primary: string, secondary: string): void {
    if (!this.ctx) return;

    const radius = shape.radius || 50;

    // 분수 표현 (segments가 있는 경우)
    if (shape.segments && shape.segments > 1) {
      const anglePerSegment = (Math.PI * 2) / shape.segments;
      const filled = shape.filled || 0;

      for (let i = 0; i < shape.segments; i++) {
        const startAngle = i * anglePerSegment - Math.PI / 2;
        const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        this.ctx.closePath();

        this.ctx.fillStyle = i < filled ? primary : secondary;
        this.ctx.fill();

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    } else {
      // 일반 원
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = primary;
      this.ctx.fill();
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawPolygon(cx: number, cy: number, shape: ShapeData, color: string): void {
    if (!this.ctx) return;

    const sides = shape.sides || 3;
    const radius = shape.radius || 50;
    const rotation = (shape.rotation || 0) * Math.PI / 180;

    this.ctx.beginPath();

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + rotation - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawPath(shape: ShapeData, color: string): void {
    if (!this.ctx || !shape.paths) return;

    // SVG path 렌더링 (간단한 구현)
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;

    // 실제 구현에서는 SVG path parser 사용
  }

  /**
   * Easing 함수 적용
   */
  private applyEasing(t: number, easing: EasingFunction): number {
    const easingFunc = getEasingFunction(easing);
    return easingFunc(t);
  }

  /**
   * 캔버스 지우기
   */
  private clear(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 애니메이션 정지
   */
  public stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * 애니메이션 완료 콜백
   */
  private onAnimationComplete(): void {
    console.log('Animation completed:', this.currentShape?.name);

    // 이벤트 발생
    if (this.canvas) {
      this.canvas.dispatchEvent(new CustomEvent('morphComplete', {
        detail: { shape: this.currentShape }
      }));
    }
  }

  /**
   * HEX to RGB 변환
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * RGB to HEX 변환
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * 리소스 정리
   */
  public destroy(): void {
    this.stopAnimation();
    this.canvas = null;
    this.ctx = null;
  }
}
```

---

## 6. 통합 및 초기화

### 6.1 메인 초기화 스크립트

**파일**: `frontend/index.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SmartphoneFrame } from './components/SmartphoneFrame/SmartphoneFrame';
import './styles/global.css';

/**
 * Shape Morph 앱 초기화
 */
function initShapeMorphApp() {
  // DOM 준비 확인
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
}

function render() {
  // 컨테이너 생성 또는 확인
  let container = document.getElementById('shape-morph-root');

  if (!container) {
    container = document.createElement('div');
    container.id = 'shape-morph-root';
    document.body.appendChild(container);
  }

  // React 앱 렌더링
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <SmartphoneFrame
        position="bottom-right"
        size="medium"
        theme="light"
      />
    </React.StrictMode>
  );

  console.log('Shape Morph initialized successfully');
}

// 자동 초기화
initShapeMorphApp();
```

---

## 7. 개발 및 배포 가이드

### 7.1 개발 환경 설정

```bash
# 1. Node.js 및 npm 설치 확인
node --version  # v16 이상
npm --version   # v8 이상

# 2. 의존성 설치
cd frontend
npm install

# 3. 개발 서버 시작
npm run dev

# 4. 빌드
npm run build
```

### 7.2 Moodle 플러그인 설치

```bash
# 1. 플러그인 디렉토리 생성
cd /path/to/moodle
mkdir -p local/shape_morph

# 2. 백엔드 파일 복사
cp -r backend/moodle-integration/* local/shape_morph/

# 3. 데이터베이스 스키마 적용
mysql -u moodle_user -p moodle_db < backend/moodle-integration/db/schema.sql

# 4. Moodle 관리자 페이지에서 플러그인 활성화
# Site administration > Notifications
```

### 7.3 프론트엔드 통합

Moodle 테마에 Shape Morph 추가:

```php
// theme/yourtheme/layout/includes/footer.php
<script src="/local/shape_morph/frontend/dist/bundle.js"></script>
<link rel="stylesheet" href="/local/shape_morph/frontend/dist/styles.css">
```

---

## 8. 성능 최적화

- **애니메이션 프레임 레이트**: 60fps 타겟
- **Canvas 크기**: 스마트폰 프레임에 맞춰 최소화
- **API 호출 최적화**: WebSocket으로 실시간 업데이트
- **메모리 관리**: 애니메이션 종료 시 리소스 정리

---

## 9. 접근성 (Accessibility)

- **키보드 내비게이션**: 스마트폰 프레임 포커스 및 확대/축소
- **스크린 리더 지원**: ARIA 레이블 및 역할 정의
- **고대비 모드**: 색상 대비 4.5:1 이상 유지
- **애니메이션 제어**: `prefers-reduced-motion` 미디어 쿼리 지원

---

## 10. 테스트 계획

- **유닛 테스트**: Jest + React Testing Library
- **통합 테스트**: Cypress E2E 테스트
- **성능 테스트**: Lighthouse 스코어 90+ 목표
- **호환성 테스트**: 주요 브라우저 및 기기

---

## 11. 향후 개선 사항

1. **3D 형상 지원**: Three.js 통합
2. **음성 설명**: Web Speech API 활용
3. **햅틱 피드백**: Vibration API (모바일)
4. **다국어 지원**: i18n 확장
5. **AI 기반 형상 생성**: 자동 개념-형상 매핑

---

## 문서 정보

- **버전**: 1.0.0
- **작성일**: 2025-11-18
- **작성자**: AI Development Team
- **상태**: 구현 준비 완료
