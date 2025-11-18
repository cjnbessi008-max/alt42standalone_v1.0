export type ShapeType = 'circle' | 'square' | 'triangle' | 'rectangle' | 'pentagon' | 'hexagon';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  position: Position;
  size: Size;
  fill: string;          // Hex color
  opacity: number;       // 0 to 1
  blendMode: BlendMode;
  rotation: number;      // Degrees
  zIndex: number;
}

export interface ViewportConfig {
  width: number;
  height: number;
  scale: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  showFrame: boolean;
  backgroundColor: string;
}
