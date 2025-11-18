/**
 * Drag and Drop Type Definitions
 * Types for drag interactions with touch and mouse support
 */

import { Vector2D } from './vector.types';

export interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  startPosition: Vector2D | null;
  currentPosition: Vector2D | null;
  offset: Vector2D | null;
}

export interface DragConstraints {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface DragHandlers {
  onDragStart?: (id: string, position: Vector2D) => void;
  onDrag?: (id: string, position: Vector2D, delta: Vector2D) => void;
  onDragEnd?: (id: string, position: Vector2D) => void;
}

export interface TouchDragEvent {
  type: 'touch' | 'mouse';
  position: Vector2D;
  identifier?: number; // for multi-touch support
  timestamp: number;
}

export interface DragConfig {
  enabled: boolean;
  constraints?: DragConstraints;
  handlers: DragHandlers;
  enableTouch?: boolean;
  enableMouse?: boolean;
  dragThreshold?: number; // minimum pixels to move before drag starts
}
