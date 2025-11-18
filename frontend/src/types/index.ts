/**
 * Type definitions for Color Partition feature
 */

export interface Interval {
  start: number;
  end: number;
  property: IntervalProperty;
  color: string;
  description: string;
}

export type IntervalProperty =
  | 'increasing'
  | 'decreasing'
  | 'concave_up'
  | 'concave_down'
  | 'positive'
  | 'negative';

export interface PlotPoint {
  x: number;
  y: number;
}

export interface FunctionAnalysisRequest {
  expression: string;
  x_min: number;
  x_max: number;
  properties: IntervalProperty[];
}

export interface FunctionAnalysisResponse {
  expression: string;
  intervals: Interval[];
  plot_points: PlotPoint[];
  derivative?: string;
  second_derivative?: string;
}
