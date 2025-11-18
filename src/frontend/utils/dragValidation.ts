/**
 * Drag Validation Utilities
 * Constraint validation and position adjustment for drag operations
 */

import { Vector2D } from '../types/vector.types';
import { DragConstraints } from '../types/drag.types';
import { clampVector, snapToGrid } from './vectorMath';

/**
 * Apply drag constraints to a position
 */
export function applyDragConstraints(
  position: Vector2D,
  constraints?: DragConstraints
): Vector2D {
  if (!constraints) return position;

  let result = { ...position };

  // Apply bounds constraints
  if (
    constraints.minX !== undefined ||
    constraints.maxX !== undefined ||
    constraints.minY !== undefined ||
    constraints.maxY !== undefined
  ) {
    result = clampVector(
      result,
      {
        x: constraints.minX ?? -Infinity,
        y: constraints.minY ?? -Infinity,
      },
      {
        x: constraints.maxX ?? Infinity,
        y: constraints.maxY ?? Infinity,
      }
    );
  }

  // Apply grid snapping
  if (constraints.snapToGrid && constraints.gridSize) {
    result = snapToGrid(result, constraints.gridSize);
  }

  return result;
}

/**
 * Check if a position is within valid drag bounds
 */
export function isWithinBounds(
  position: Vector2D,
  constraints?: DragConstraints
): boolean {
  if (!constraints) return true;

  if (constraints.minX !== undefined && position.x < constraints.minX)
    return false;
  if (constraints.maxX !== undefined && position.x > constraints.maxX)
    return false;
  if (constraints.minY !== undefined && position.y < constraints.minY)
    return false;
  if (constraints.maxY !== undefined && position.y > constraints.maxY)
    return false;

  return true;
}

/**
 * Get the nearest valid position within constraints
 */
export function getNearestValidPosition(
  position: Vector2D,
  constraints?: DragConstraints
): Vector2D {
  return applyDragConstraints(position, constraints);
}

/**
 * Calculate drag threshold - returns true if movement exceeds threshold
 */
export function exceedsDragThreshold(
  start: Vector2D,
  current: Vector2D,
  threshold: number = 5
): boolean {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance >= threshold;
}
