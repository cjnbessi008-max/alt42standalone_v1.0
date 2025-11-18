# 해설 애니메이션 컴포넌트 아키텍처
# Explanation Animations Component Architecture

## 목차 / Table of Contents
1. [개요](#overview)
2. [컴포넌트 구조](#component-structure)
3. [TypeScript 인터페이스](#typescript-interfaces)
4. [상태 관리](#state-management)
5. [애니메이션 엔진](#animation-engine)
6. [구현 가이드](#implementation-guide)

---

## 1. 개요 / Overview

### 아키텍처 원칙 / Architecture Principles

1. **모듈성 (Modularity)**: 각 애니메이션 타입은 독립적인 컴포넌트
2. **확장성 (Extensibility)**: 새로운 애니메이션 타입 추가 용이
3. **재사용성 (Reusability)**: 공통 로직은 Hook과 Context로 분리
4. **성능 (Performance)**: Code splitting, Lazy loading, Memoization
5. **접근성 (Accessibility)**: WCAG 2.1 AA 준수

### 기술 스택 / Tech Stack

```json
{
  "frontend": {
    "framework": "React 18+",
    "language": "TypeScript 5+",
    "animation": "Framer Motion 11+",
    "state": "Zustand or Context API",
    "styling": "CSS Modules + Tailwind CSS",
    "testing": "Jest + React Testing Library"
  },
  "build": {
    "bundler": "Vite",
    "code_splitting": "Dynamic imports"
  }
}
```

---

## 2. 컴포넌트 구조 / Component Structure

### 2.1 디렉토리 구조 / Directory Structure

```
/frontend/src/components/explanations/
│
├── index.ts                           # 공용 export
│
├── ExplanationPlayer/                 # 📦 메인 플레이어
│   ├── ExplanationPlayer.tsx          # 플레이어 컨테이너
│   ├── ExplanationPlayer.module.css
│   ├── ExplanationPlayer.test.tsx
│   │
│   ├── components/
│   │   ├── PlayerControls.tsx         # 재생/일시정지/속도 조절
│   │   ├── ProgressIndicator.tsx      # 진행 상황 표시
│   │   ├── StepNavigator.tsx          # 단계 이동 버튼
│   │   ├── SubtitleDisplay.tsx        # 자막 표시
│   │   └── FeedbackPanel.tsx          # 피드백 입력 UI
│   │
│   ├── hooks/
│   │   ├── useExplanationPlayer.ts    # 플레이어 로직 Hook
│   │   ├── useKeyboardControls.ts     # 키보드 단축키
│   │   └── usePlayerAnalytics.ts      # 시청 데이터 추적
│   │
│   └── types.ts
│
├── AnimationEngine/                   # 🎬 애니메이션 엔진
│   ├── AnimationRenderer.tsx          # 애니메이션 렌더러
│   ├── AnimationContext.tsx           # 전역 상태 관리
│   ├── AnimationRegistry.ts           # 애니메이션 타입 레지스트리
│   │
│   ├── hooks/
│   │   ├── useAnimationController.ts  # 애니메이션 제어
│   │   ├── useAnimationState.ts       # 애니메이션 상태
│   │   └── useAnimationTiming.ts      # 타이밍 제어
│   │
│   └── utils/
│       ├── animationHelpers.ts        # 유틸리티 함수
│       └── configValidator.ts         # 설정 검증
│
├── AnimationTypes/                    # 🎨 애니메이션 타입별 컴포넌트
│   │
│   ├── FractionAnimations/            # 분수 애니메이션
│   │   ├── index.ts
│   │   ├── FractionVisualizer.tsx
│   │   ├── FractionAddition.tsx
│   │   ├── FractionSubtraction.tsx
│   │   ├── CommonDenominator.tsx
│   │   ├── FractionSimplification.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── PizzaSlice.tsx
│   │   │   ├── CakeSlice.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── FractionLabel.tsx
│   │   │
│   │   └── utils/
│   │       ├── fractionMath.ts
│   │       └── visualHelpers.ts
│   │
│   ├── GeometryAnimations/            # 기하학 애니메이션
│   │   ├── index.ts
│   │   ├── ShapeTransformation.tsx
│   │   ├── AreaCalculation.tsx
│   │   ├── PerimeterCalculation.tsx
│   │   ├── AngleVisualization.tsx
│   │   │
│   │   └── components/
│   │       ├── Shape.tsx
│   │       ├── Grid.tsx
│   │       └── Ruler.tsx
│   │
│   ├── AlgebraAnimations/             # 대수 애니메이션
│   │   ├── index.ts
│   │   ├── EquationSolving.tsx
│   │   ├── VariableSubstitution.tsx
│   │   ├── NumberLine.tsx
│   │   │
│   │   └── components/
│   │       ├── NumberLineAxis.tsx
│   │       └── EquationStep.tsx
│   │
│   └── index.ts                       # 모든 애니메이션 타입 export
│
├── ExplanationModal/                  # 📋 모달 컨테이너
│   ├── ExplanationModal.tsx
│   ├── ExplanationModal.module.css
│   ├── ExplanationHeader.tsx          # 제목, 닫기 버튼
│   └── ExplanationFooter.tsx          # 다시 풀기, 다음 문제 버튼
│
├── TeacherTools/                      # 👨‍🏫 교사용 도구
│   ├── ExplanationEditor/
│   │   ├── ExplanationEditor.tsx      # 해설 편집기
│   │   ├── StepEditor.tsx             # 단계 편집
│   │   ├── AnimationConfigEditor.tsx  # 애니메이션 설정 편집
│   │   └── PreviewPanel.tsx           # 미리보기
│   │
│   └── ExplanationAnalytics/
│       ├── AnalyticsDashboard.tsx     # 분석 대시보드
│       ├── ViewsChart.tsx             # 시청 통계 차트
│       └── EffectivenessReport.tsx    # 효과성 리포트
│
└── shared/                            # 🔧 공유 유틸리티
    ├── hooks/
    │   ├── useExplanationData.ts      # 데이터 페칭
    │   └── useViewTracking.ts         # 시청 추적
    │
    ├── utils/
    │   ├── api.ts                     # API 클라이언트
    │   ├── storage.ts                 # LocalStorage 관리
    │   └── accessibility.ts           # 접근성 유틸리티
    │
    └── types/
        ├── explanation.types.ts       # 해설 관련 타입
        ├── animation.types.ts         # 애니메이션 타입
        └── api.types.ts               # API 응답 타입
```

---

## 3. TypeScript 인터페이스 / TypeScript Interfaces

### 3.1 핵심 타입 정의

```typescript
// /shared/types/explanation.types.ts

/**
 * 애니메이션 타입 열거형
 */
export enum AnimationType {
  // 분수
  FRACTION_VISUALIZER = 'fraction_visualizer',
  FRACTION_ADDITION = 'fraction_addition',
  FRACTION_SUBTRACTION = 'fraction_subtraction',
  FRACTION_SIMPLIFICATION = 'fraction_simplification',
  COMMON_DENOMINATOR = 'common_denominator',

  // 기하학
  SHAPE_TRANSFORMATION = 'shape_transformation',
  AREA_CALCULATION = 'area_calculation',
  PERIMETER_CALCULATION = 'perimeter_calculation',
  ANGLE_VISUALIZATION = 'angle_visualization',

  // 대수
  EQUATION_SOLVING = 'equation_solving',
  VARIABLE_SUBSTITUTION = 'variable_substitution',
  NUMBER_LINE = 'number_line',
}

/**
 * 해설 단계
 */
export interface ExplanationStep {
  step_number: number;
  title: string;
  description: string;
  animation_type: AnimationType;
  duration_ms: number;
  animation_config: AnimationConfig;
  narration_text?: string;
  subtitle_text?: string;
}

/**
 * 애니메이션 설정 (각 타입마다 다름)
 */
export type AnimationConfig =
  | FractionVisualizerConfig
  | FractionAdditionConfig
  | ShapeTransformationConfig
  | NumberLineConfig
  | Record<string, unknown>; // 기타

/**
 * 해설 데이터
 */
export interface ExplanationData {
  id: string;
  problem_id: string;
  module_id: string;
  title: string;
  description?: string;
  steps: ExplanationStep[];
  total_duration_ms: number;
  difficulty_level: number;
  is_ai_generated: boolean;
  language: 'ko' | 'en';
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * 플레이어 상태
 */
export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  playbackSpeed: PlaybackSpeed;
  isMuted: boolean;
  showSubtitles: boolean;
  loop: boolean;
  isFullscreen: boolean;
}

export type PlaybackSpeed = 0.5 | 1 | 1.5;

/**
 * 시청 이력
 */
export interface ExplanationView {
  id: string;
  student_id: string;
  explanation_id: string;
  problem_attempt_id?: string;
  viewed_at: string;
  completed_viewing: boolean;
  steps_viewed: number[];
  playback_speed: number;
  total_watch_time_ms: number;
  retried_after_viewing?: boolean;
  correct_after_viewing?: boolean;
  was_helpful?: boolean;
  feedback_text?: string;
}
```

### 3.2 애니메이션 설정 타입

```typescript
// /shared/types/animation.types.ts

/**
 * 분수 시각화 설정
 */
export interface FractionVisualizerConfig {
  visual_type: 'pizza' | 'cake' | 'bar' | 'circle';
  fractions: Fraction[];
  show_labels?: boolean;
  animate_fill?: boolean;
}

export interface Fraction {
  numerator: number;
  denominator: number;
  color?: string;
  label?: string;
}

/**
 * 분수 덧셈 설정
 */
export interface FractionAdditionConfig {
  fraction1: Fraction;
  fraction2: Fraction;
  show_process?: boolean;
  visual_type?: 'pizza' | 'bar';
}

/**
 * 도형 변환 설정
 */
export interface ShapeTransformationConfig {
  shape_type: 'triangle' | 'rectangle' | 'circle' | 'polygon';
  transformation_type: 'rotate' | 'translate' | 'scale' | 'reflect';
  from_position?: Position;
  to_position?: Position;
  show_grid?: boolean;
}

export interface Position {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

/**
 * 수직선 설정
 */
export interface NumberLineConfig {
  min_value: number;
  max_value: number;
  operation: 'addition' | 'subtraction' | 'multiplication';
  operand1: number;
  operand2: number;
  show_steps?: boolean;
}

/**
 * 애니메이션 컴포넌트 Props
 */
export interface AnimationComponentProps<T = AnimationConfig> {
  config: T;
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: PlaybackSpeed;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}
```

### 3.3 API 응답 타입

```typescript
// /shared/types/api.types.ts

export interface GetExplanationResponse {
  explanation: ExplanationData;
}

export interface ListExplanationsResponse {
  explanations: ExplanationData[];
  total: number;
}

export interface CreateExplanationRequest {
  problem_id: string;
  language?: 'ko' | 'en';
  difficulty_level?: number;
}

export interface CreateExplanationResponse {
  explanation: ExplanationData;
  generation_time_ms: number;
}

export interface RecordViewRequest {
  student_id: string;
  explanation_id: string;
  problem_attempt_id?: string;
  steps_viewed: number[];
  completed_viewing: boolean;
  total_watch_time_ms: number;
  playback_speed: number;
}

export interface RecordViewResponse {
  view_id: string;
  success: boolean;
}

export interface SubmitFeedbackRequest {
  student_id: string;
  explanation_id: string;
  was_helpful: boolean;
  feedback_text?: string;
}

export interface ExplanationAnalytics {
  total_explanations: number;
  total_views: number;
  avg_completion_rate: number;
  top_viewed: Array<{
    explanation_id: string;
    title: string;
    view_count: number;
  }>;
  effectiveness: {
    helpful_rate: number;
    success_rate_after_viewing: number;
  };
}
```

---

## 4. 상태 관리 / State Management

### 4.1 Zustand Store (추천)

```typescript
// /components/explanations/AnimationEngine/store.ts

import { create } from 'zustand';
import { PlayerState } from '@/types/explanation.types';

interface ExplanationPlayerStore extends PlayerState {
  // State
  explanationData: ExplanationData | null;
  error: string | null;
  isLoading: boolean;

  // Actions
  setExplanationData: (data: ExplanationData) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  toggleSubtitles: () => void;
  toggleMute: () => void;
  reset: () => void;
}

export const useExplanationPlayerStore = create<ExplanationPlayerStore>(
  (set, get) => ({
    // Initial state
    isPlaying: false,
    isPaused: false,
    currentStepIndex: 0,
    playbackSpeed: 1,
    isMuted: false,
    showSubtitles: true,
    loop: false,
    isFullscreen: false,
    explanationData: null,
    error: null,
    isLoading: false,

    // Actions
    setExplanationData: (data) => set({ explanationData: data }),

    play: () => set({ isPlaying: true, isPaused: false }),

    pause: () => set({ isPlaying: false, isPaused: true }),

    stop: () => set({ isPlaying: false, isPaused: false, currentStepIndex: 0 }),

    nextStep: () => {
      const { currentStepIndex, explanationData } = get();
      if (
        explanationData &&
        currentStepIndex < explanationData.steps.length - 1
      ) {
        set({ currentStepIndex: currentStepIndex + 1 });
      }
    },

    prevStep: () => {
      const { currentStepIndex } = get();
      if (currentStepIndex > 0) {
        set({ currentStepIndex: currentStepIndex - 1 });
      }
    },

    goToStep: (index) => {
      const { explanationData } = get();
      if (explanationData && index >= 0 && index < explanationData.steps.length) {
        set({ currentStepIndex: index });
      }
    },

    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    toggleSubtitles: () => set((state) => ({ showSubtitles: !state.showSubtitles })),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    reset: () =>
      set({
        isPlaying: false,
        isPaused: false,
        currentStepIndex: 0,
        playbackSpeed: 1,
        explanationData: null,
        error: null,
      }),
  })
);
```

### 4.2 Context API (대안)

```typescript
// /components/explanations/AnimationEngine/AnimationContext.tsx

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

type Action =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'SET_SPEED'; payload: PlaybackSpeed };

interface AnimationContextType {
  state: PlayerState;
  dispatch: React.Dispatch<Action>;
}

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);

const animationReducer = (state: PlayerState, action: Action): PlayerState => {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true, isPaused: false };
    case 'PAUSE':
      return { ...state, isPlaying: false, isPaused: true };
    case 'NEXT_STEP':
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };
    case 'PREV_STEP':
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1) };
    case 'GO_TO_STEP':
      return { ...state, currentStepIndex: action.payload };
    case 'SET_SPEED':
      return { ...state, playbackSpeed: action.payload };
    default:
      return state;
  }
};

export const AnimationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(animationReducer, {
    isPlaying: false,
    isPaused: false,
    currentStepIndex: 0,
    playbackSpeed: 1,
    isMuted: false,
    showSubtitles: true,
    loop: false,
    isFullscreen: false,
  });

  return (
    <AnimationContext.Provider value={{ state, dispatch }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return context;
};
```

---

## 5. 애니메이션 엔진 / Animation Engine

### 5.1 애니메이션 레지스트리

```typescript
// /components/explanations/AnimationEngine/AnimationRegistry.ts

import { lazy, ComponentType } from 'react';
import { AnimationType, AnimationComponentProps } from '@/types';

type AnimationComponent = ComponentType<AnimationComponentProps>;

class AnimationRegistry {
  private registry = new Map<AnimationType, () => Promise<{ default: AnimationComponent }>>();

  /**
   * 애니메이션 타입 등록 (lazy loading)
   */
  register(
    type: AnimationType,
    loader: () => Promise<{ default: AnimationComponent }>
  ) {
    this.registry.set(type, loader);
  }

  /**
   * 애니메이션 컴포넌트 가져오기
   */
  get(type: AnimationType) {
    const loader = this.registry.get(type);
    if (!loader) {
      throw new Error(`Animation type "${type}" not registered`);
    }
    return lazy(loader);
  }

  /**
   * 등록된 타입 확인
   */
  has(type: AnimationType): boolean {
    return this.registry.has(type);
  }

  /**
   * 모든 등록된 타입 목록
   */
  getAll(): AnimationType[] {
    return Array.from(this.registry.keys());
  }
}

export const animationRegistry = new AnimationRegistry();

// 애니메이션 타입 등록
animationRegistry.register(
  AnimationType.FRACTION_VISUALIZER,
  () => import('@/components/explanations/AnimationTypes/FractionAnimations/FractionVisualizer')
);

animationRegistry.register(
  AnimationType.FRACTION_ADDITION,
  () => import('@/components/explanations/AnimationTypes/FractionAnimations/FractionAddition')
);

animationRegistry.register(
  AnimationType.COMMON_DENOMINATOR,
  () => import('@/components/explanations/AnimationTypes/FractionAnimations/CommonDenominator')
);

// ... 기타 애니메이션 타입 등록
```

### 5.2 애니메이션 렌더러

```typescript
// /components/explanations/AnimationEngine/AnimationRenderer.tsx

import React, { Suspense } from 'react';
import { AnimationType, AnimationConfig, AnimationComponentProps } from '@/types';
import { animationRegistry } from './AnimationRegistry';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AnimationRendererProps {
  animationType: AnimationType;
  config: AnimationConfig;
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: PlaybackSpeed;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export const AnimationRenderer: React.FC<AnimationRendererProps> = ({
  animationType,
  config,
  isPlaying,
  isPaused,
  playbackSpeed,
  onComplete,
  onProgress,
}) => {
  if (!animationRegistry.has(animationType)) {
    return (
      <div className="animation-error">
        <p>Unknown animation type: {animationType}</p>
      </div>
    );
  }

  const AnimationComponent = animationRegistry.get(animationType);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnimationComponent
        config={config}
        isPlaying={isPlaying}
        isPaused={isPaused}
        playbackSpeed={playbackSpeed}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    </Suspense>
  );
};
```

---

## 6. 구현 가이드 / Implementation Guide

### 6.1 ExplanationPlayer 메인 컴포넌트

```typescript
// /components/explanations/ExplanationPlayer/ExplanationPlayer.tsx

import React, { useEffect } from 'react';
import { AnimationRenderer } from '../AnimationEngine/AnimationRenderer';
import { useExplanationPlayer } from './hooks/useExplanationPlayer';
import { PlayerControls } from './components/PlayerControls';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SubtitleDisplay } from './components/SubtitleDisplay';
import styles from './ExplanationPlayer.module.css';

interface ExplanationPlayerProps {
  explanationId: string;
  studentId: string;
  problemAttemptId?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  onRetry?: () => void;
}

export const ExplanationPlayer: React.FC<ExplanationPlayerProps> = ({
  explanationId,
  studentId,
  problemAttemptId,
  autoPlay = true,
  onClose,
  onRetry,
}) => {
  const {
    explanationData,
    playerState,
    currentStep,
    isLoading,
    error,
    play,
    pause,
    nextStep,
    prevStep,
    setPlaybackSpeed,
    toggleSubtitles,
  } = useExplanationPlayer({
    explanationId,
    studentId,
    problemAttemptId,
    autoPlay,
  });

  if (isLoading) {
    return <div className={styles.loading}>Loading explanation...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!explanationData || !currentStep) {
    return null;
  }

  return (
    <div className={styles.player}>
      <div className={styles.header}>
        <h2>{explanationData.title}</h2>
        <button onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className={styles.animationContainer}>
        <AnimationRenderer
          animationType={currentStep.animation_type}
          config={currentStep.animation_config}
          isPlaying={playerState.isPlaying}
          isPaused={playerState.isPaused}
          playbackSpeed={playerState.playbackSpeed}
          onComplete={nextStep}
        />
      </div>

      {playerState.showSubtitles && currentStep.subtitle_text && (
        <SubtitleDisplay text={currentStep.subtitle_text} />
      )}

      <ProgressIndicator
        currentStep={playerState.currentStepIndex + 1}
        totalSteps={explanationData.steps.length}
        stepTitle={currentStep.title}
      />

      <PlayerControls
        isPlaying={playerState.isPlaying}
        isPaused={playerState.isPaused}
        playbackSpeed={playerState.playbackSpeed}
        showSubtitles={playerState.showSubtitles}
        canGoPrev={playerState.currentStepIndex > 0}
        canGoNext={playerState.currentStepIndex < explanationData.steps.length - 1}
        onPlay={play}
        onPause={pause}
        onPrev={prevStep}
        onNext={nextStep}
        onSpeedChange={setPlaybackSpeed}
        onToggleSubtitles={toggleSubtitles}
      />

      <div className={styles.footer}>
        <button onClick={onRetry}>다시 풀기</button>
        <button onClick={onClose}>다음 문제</button>
      </div>
    </div>
  );
};
```

### 6.2 useExplanationPlayer Hook

```typescript
// /components/explanations/ExplanationPlayer/hooks/useExplanationPlayer.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useExplanationPlayerStore } from '../../AnimationEngine/store';
import { getExplanation, recordView } from '@/api/explanations';

interface UseExplanationPlayerOptions {
  explanationId: string;
  studentId: string;
  problemAttemptId?: string;
  autoPlay?: boolean;
}

export const useExplanationPlayer = ({
  explanationId,
  studentId,
  problemAttemptId,
  autoPlay = true,
}: UseExplanationPlayerOptions) => {
  const store = useExplanationPlayerStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const viewStartTimeRef = useRef<number>(Date.now());
  const stepsViewedRef = useRef<Set<number>>(new Set());

  // 해설 데이터 로드
  useEffect(() => {
    const loadExplanation = async () => {
      try {
        setIsLoading(true);
        const data = await getExplanation(explanationId);
        store.setExplanationData(data.explanation);

        if (autoPlay) {
          store.play();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load explanation');
      } finally {
        setIsLoading(false);
      }
    };

    loadExplanation();
  }, [explanationId]);

  // 시청한 단계 추적
  useEffect(() => {
    stepsViewedRef.current.add(store.currentStepIndex + 1);
  }, [store.currentStepIndex]);

  // 컴포넌트 언마운트 시 시청 데이터 저장
  useEffect(() => {
    return () => {
      const watchTime = Date.now() - viewStartTimeRef.current;
      const completedViewing =
        stepsViewedRef.current.size === store.explanationData?.steps.length;

      recordView({
        student_id: studentId,
        explanation_id: explanationId,
        problem_attempt_id: problemAttemptId,
        steps_viewed: Array.from(stepsViewedRef.current),
        completed_viewing: completedViewing,
        total_watch_time_ms: watchTime,
        playback_speed: store.playbackSpeed,
      });
    };
  }, []);

  const currentStep = store.explanationData?.steps[store.currentStepIndex];

  return {
    explanationData: store.explanationData,
    playerState: {
      isPlaying: store.isPlaying,
      isPaused: store.isPaused,
      currentStepIndex: store.currentStepIndex,
      playbackSpeed: store.playbackSpeed,
      showSubtitles: store.showSubtitles,
      isMuted: store.isMuted,
    },
    currentStep,
    isLoading,
    error,
    play: store.play,
    pause: store.pause,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    goToStep: store.goToStep,
    setPlaybackSpeed: store.setPlaybackSpeed,
    toggleSubtitles: store.toggleSubtitles,
    toggleMute: store.toggleMute,
  };
};
```

### 6.3 애니메이션 컴포넌트 예시: FractionVisualizer

```typescript
// /components/explanations/AnimationTypes/FractionAnimations/FractionVisualizer.tsx

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnimationComponentProps,
  FractionVisualizerConfig,
} from '@/types/animation.types';
import { PizzaSlice } from './components/PizzaSlice';
import styles from './FractionVisualizer.module.css';

const FractionVisualizer: React.FC<
  AnimationComponentProps<FractionVisualizerConfig>
> = ({ config, isPlaying, playbackSpeed, onComplete, onProgress }) => {
  const { visual_type, fractions, show_labels = true, animate_fill = true } = config;

  useEffect(() => {
    if (isPlaying && onComplete) {
      const duration = 3000 / playbackSpeed; // 3초 기본
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, playbackSpeed, onComplete]);

  const renderVisual = () => {
    switch (visual_type) {
      case 'pizza':
        return fractions.map((fraction, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5 / playbackSpeed,
              delay: (index * 0.3) / playbackSpeed,
            }}
            className={styles.fractionContainer}
          >
            <PizzaSlice
              numerator={fraction.numerator}
              denominator={fraction.denominator}
              color={fraction.color || '#FF6B6B'}
              animate={animate_fill && isPlaying}
              speed={playbackSpeed}
            />
            {show_labels && (
              <motion.div
                className={styles.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: (0.5 + index * 0.3) / playbackSpeed,
                }}
              >
                {fraction.label || `${fraction.numerator}/${fraction.denominator}`}
              </motion.div>
            )}
          </motion.div>
        ));

      // case 'cake':
      // case 'bar':
      // 추가 visual_type 구현...

      default:
        return <div>Unknown visual type</div>;
    }
  };

  return (
    <div className={styles.visualizer} role="img" aria-label="Fraction visualization">
      <AnimatePresence>{renderVisual()}</AnimatePresence>
    </div>
  );
};

export default FractionVisualizer;
```

### 6.4 PizzaSlice 하위 컴포넌트

```typescript
// /components/explanations/AnimationTypes/FractionAnimations/components/PizzaSlice.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface PizzaSliceProps {
  numerator: number;
  denominator: number;
  color: string;
  animate: boolean;
  speed: number;
}

export const PizzaSlice: React.FC<PizzaSliceProps> = ({
  numerator,
  denominator,
  color,
  animate,
  speed,
}) => {
  const sliceAngle = 360 / denominator;
  const filledSlices = numerator;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <g transform="translate(100, 100)">
        {Array.from({ length: denominator }).map((_, index) => {
          const isFilled = index < filledSlices;
          const rotation = index * sliceAngle;

          return (
            <motion.g
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: rotation,
              }}
              transition={{
                duration: 0.3 / speed,
                delay: animate ? (index * 0.1) / speed : 0,
              }}
            >
              <path
                d={createSlicePath(sliceAngle)}
                fill={isFilled ? color : '#f0f0f0'}
                stroke="#333"
                strokeWidth="2"
              />
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
};

function createSlicePath(angle: number): string {
  const radius = 80;
  const angleRad = (angle * Math.PI) / 180;

  const x1 = radius * Math.cos(0);
  const y1 = radius * Math.sin(0);
  const x2 = radius * Math.cos(angleRad);
  const y2 = radius * Math.sin(angleRad);

  const largeArcFlag = angle > 180 ? 1 : 0;

  return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}
```

---

## 7. API 클라이언트 / API Client

```typescript
// /shared/utils/api.ts

import axios from 'axios';
import type {
  GetExplanationResponse,
  CreateExplanationRequest,
  CreateExplanationResponse,
  RecordViewRequest,
  RecordViewResponse,
  SubmitFeedbackRequest,
  ExplanationAnalytics,
} from '@/types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터: 인증 토큰 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 해설 조회
 */
export async function getExplanation(
  explanationId: string
): Promise<GetExplanationResponse> {
  const response = await apiClient.get(`/explanations/${explanationId}`);
  return response.data;
}

/**
 * 문제의 해설 목록 조회
 */
export async function getProblemExplanations(
  problemId: string,
  language: 'ko' | 'en' = 'ko'
) {
  const response = await apiClient.get(`/problems/${problemId}/explanations`, {
    params: { language },
  });
  return response.data;
}

/**
 * 해설 생성 (AI)
 */
export async function generateExplanation(
  data: CreateExplanationRequest
): Promise<CreateExplanationResponse> {
  const response = await apiClient.post('/explanations/generate', data);
  return response.data;
}

/**
 * 시청 이력 기록
 */
export async function recordView(
  data: RecordViewRequest
): Promise<RecordViewResponse> {
  const response = await apiClient.post(
    `/explanations/${data.explanation_id}/view`,
    data
  );
  return response.data;
}

/**
 * 피드백 제출
 */
export async function submitFeedback(data: SubmitFeedbackRequest): Promise<void> {
  await apiClient.post(`/explanations/${data.explanation_id}/feedback`, data);
}

/**
 * 모듈별 분석 데이터 조회
 */
export async function getExplanationAnalytics(
  moduleId: string
): Promise<ExplanationAnalytics> {
  const response = await apiClient.get(`/modules/${moduleId}/explanations/analytics`);
  return response.data;
}
```

---

## 8. 테스트 예시 / Testing Examples

```typescript
// /components/explanations/ExplanationPlayer/ExplanationPlayer.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplanationPlayer } from './ExplanationPlayer';
import { getExplanation } from '@/api/explanations';

jest.mock('@/api/explanations');

const mockExplanation = {
  id: 'exp-123',
  title: 'Test Explanation',
  steps: [
    {
      step_number: 1,
      title: 'Step 1',
      animation_type: 'fraction_visualizer',
      animation_config: {},
      duration_ms: 3000,
    },
  ],
  // ... 기타 필드
};

describe('ExplanationPlayer', () => {
  beforeEach(() => {
    (getExplanation as jest.Mock).mockResolvedValue({
      explanation: mockExplanation,
    });
  });

  it('loads and displays explanation', async () => {
    render(
      <ExplanationPlayer
        explanationId="exp-123"
        studentId="student-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Explanation')).toBeInTheDocument();
    });
  });

  it('plays animation when play button clicked', async () => {
    const user = userEvent.setup();

    render(
      <ExplanationPlayer
        explanationId="exp-123"
        studentId="student-1"
        autoPlay={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Explanation')).toBeInTheDocument();
    });

    const playButton = screen.getByLabelText('Play');
    await user.click(playButton);

    // 재생 상태 확인
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();

    render(
      <ExplanationPlayer
        explanationId="exp-123"
        studentId="student-1"
      />
    );

    const nextButton = screen.getByLabelText('Next step');
    await user.click(nextButton);

    // 다음 단계로 이동 확인
    // expect(...)
  });
});
```

---

## 9. 성능 최적화 체크리스트

- [ ] **Code Splitting**: 각 애니메이션 타입 lazy loading
- [ ] **Memoization**: React.memo, useMemo, useCallback 활용
- [ ] **Virtual Rendering**: 긴 단계 목록 가상화
- [ ] **Bundle Size**: Framer Motion tree-shaking
- [ ] **Image Optimization**: WebP 포맷, lazy loading
- [ ] **API Caching**: React Query or SWR 사용
- [ ] **Prefetching**: 다음 단계 애니메이션 미리 로드

---

## 다음 단계 / Next Steps

1. ✅ 아키텍처 설계 완료
2. 🔄 컴포넌트 구현 시작
3. 🔄 애니메이션 라이브러리 개발
4. ⏳ 통합 테스트
5. ⏳ 성능 최적화
6. ⏳ 배포

---

**작성자**: AI Agent
**최종 수정**: 2025-11-18
**버전**: 1.0
