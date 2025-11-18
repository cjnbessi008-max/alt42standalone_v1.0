/**
 * Vector2D represents a 2-dimensional vector with x and y components
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * VectorLayer represents a vector with associated color and opacity for visualization
 */
export interface VectorLayer {
  id: string;
  vector: Vector2D;
  color: string;
  opacity: number;
  label: string;
}

/**
 * LinearCombination represents the coefficients and vectors in a linear combination
 */
export interface LinearCombination {
  coefficients: number[];
  vectors: Vector2D[];
}

/**
 * ComboLayerConfig defines the configuration for the Linear Combo Layer visualization
 */
export interface ComboLayerConfig {
  width: number;
  height: number;
  scale: number;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  gridSpacing: number;
}
