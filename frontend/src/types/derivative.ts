/**
 * Type definitions for Higher Derivative Lines
 */

export interface DerivativeStyle {
  color: string;
  line_style: 'solid' | 'dashed' | 'dotted' | 'dashdot' | 'longdash' | 'dashdotdot';
  line_width: number;
  dash_pattern?: number[] | null;
  svg_dasharray: string;
}

export interface DerivativeDataset {
  label: string;
  symbol: string;
  order: number;
  data: number[];
  expression: string;
  style: DerivativeStyle;
}

export interface GridAxisConfig {
  min: number;
  max: number;
  interval: number;
  label: string;
}

export interface GridConfig {
  x_axis: GridAxisConfig;
  y_axis: GridAxisConfig;
  show_grid: boolean;
  show_axes: boolean;
  grid_color: string;
  axis_color: string;
}

export interface LegendEntry {
  label: string;
  symbol: string;
  color: string;
  line_style: string;
  line_width: number;
}

export interface GraphMetadata {
  function: string;
  max_order: number;
  domain: [number, number];
  num_points: number;
  color_scheme: string;
  visible_orders: number[];
  critical_points: number[];
  inflection_points: number[];
}

export interface GraphData {
  datasets: DerivativeDataset[];
  x_values: number[];
  grid: GridConfig;
  legend: LegendEntry[];
  metadata: GraphMetadata;
  styles: Record<number, any>;
}

export interface GraphRequest {
  function: string;
  max_order?: number;
  domain_min?: number;
  domain_max?: number;
  num_points?: number;
  color_scheme?: string;
  visible_orders?: number[] | null;
}

export interface MoodleQuestionRequest {
  question_id: number;
  user_id: number;
  function: string;
  required_orders: number[];
}

export interface MoodleResponse {
  question_id: number;
  user_id: number;
  graph_data: GraphData;
  display_config: {
    show_legend: boolean;
    show_grid: boolean;
    interactive: boolean;
    virtual_screen_position: string;
  };
}
