export interface ProblemConfig {
  id?: string;
  baseNumber: number;
  xMin: number;
  xMax: number;
  showReflectionLine: boolean;
  showGrid: boolean;
  showAxes: boolean;
  difficulty?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ViewportState {
  centerX: number;
  centerY: number;
  scale: number;
}

export interface CanvasColors {
  exponential: string;
  logarithmic: string;
  reflectionLine: string;
  axes: string;
  grid: string;
  background: string;
}

export interface InteractionEvent {
  type: 'view' | 'zoom' | 'pan' | 'toggle';
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface ReflectionPairStore {
  config: ProblemConfig;
  viewport: ViewportState;
  interactions: InteractionEvent[];
  updateConfig: (config: Partial<ProblemConfig>) => void;
  updateViewport: (viewport: Partial<ViewportState>) => void;
  resetViewport: () => void;
  addInteraction: (interaction: Omit<InteractionEvent, 'timestamp'>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleReflectionLine: () => void;
}

export type BasePreset = 'e' | '2' | '10' | 'custom';

export interface BasePresetOption {
  label: string;
  value: BasePreset;
  baseNumber: number;
  description: string;
}
