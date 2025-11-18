export interface NumberRange {
  start: number;
  end: number;
}

export interface VerticalNumberLineProps {
  min: number;
  max: number;
  selectedRange?: NumberRange;
  onRangeSelect?: (range: NumberRange) => void;
  showGlow?: boolean;
  glowIntensity?: number;
  tickInterval?: number;
  height?: number;
  width?: number;
}

export interface RangeGlowProps {
  range: NumberRange;
  min: number;
  max: number;
  height: number;
  intensity?: number;
  color?: string;
  animated?: boolean;
}
