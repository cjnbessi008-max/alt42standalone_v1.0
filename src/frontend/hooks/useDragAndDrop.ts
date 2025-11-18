/**
 * useDragAndDrop Hook
 * Custom React hook for drag and drop functionality with touch and mouse support
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Vector2D } from '../types/vector.types';
import { DragState, DragConfig } from '../types/drag.types';
import { applyDragConstraints, exceedsDragThreshold } from '../utils/dragValidation';
import { subtractVectors } from '../utils/vectorMath';

export function useDragAndDrop(config: DragConfig) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItemId: null,
    startPosition: null,
    currentPosition: null,
    offset: null,
  });

  const dragThreshold = config.dragThreshold ?? 5;
  const hasExceededThreshold = useRef(false);

  /**
   * Get position from mouse or touch event
   */
  const getEventPosition = useCallback((
    event: MouseEvent | TouchEvent
  ): Vector2D => {
    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    } else if ('clientX' in event) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }
    return { x: 0, y: 0 };
  }, []);

  /**
   * Start dragging
   */
  const handleDragStart = useCallback(
    (itemId: string, event: MouseEvent | TouchEvent, offset?: Vector2D) => {
      if (!config.enabled) return;

      event.preventDefault();
      const position = getEventPosition(event);

      setDragState({
        isDragging: false, // Will become true after threshold
        draggedItemId: itemId,
        startPosition: position,
        currentPosition: position,
        offset: offset || { x: 0, y: 0 },
      });

      hasExceededThreshold.current = false;

      if (config.handlers.onDragStart) {
        config.handlers.onDragStart(itemId, position);
      }
    },
    [config, getEventPosition]
  );

  /**
   * Handle drag movement
   */
  const handleDragMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!dragState.draggedItemId || !dragState.startPosition) return;

      event.preventDefault();
      const currentPosition = getEventPosition(event);

      // Check if drag threshold is exceeded
      if (
        !hasExceededThreshold.current &&
        !exceedsDragThreshold(dragState.startPosition, currentPosition, dragThreshold)
      ) {
        return;
      }

      hasExceededThreshold.current = true;

      // Apply constraints
      const constrainedPosition = applyDragConstraints(
        currentPosition,
        config.constraints
      );

      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        currentPosition: constrainedPosition,
      }));

      if (config.handlers.onDrag && dragState.draggedItemId) {
        const delta = subtractVectors(
          constrainedPosition,
          dragState.currentPosition || dragState.startPosition
        );
        config.handlers.onDrag(dragState.draggedItemId, constrainedPosition, delta);
      }
    },
    [dragState, config, getEventPosition, dragThreshold]
  );

  /**
   * End dragging
   */
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!dragState.draggedItemId) return;

      event.preventDefault();
      const finalPosition = getEventPosition(event);
      const constrainedPosition = applyDragConstraints(
        finalPosition,
        config.constraints
      );

      if (config.handlers.onDragEnd && dragState.draggedItemId) {
        config.handlers.onDragEnd(dragState.draggedItemId, constrainedPosition);
      }

      setDragState({
        isDragging: false,
        draggedItemId: null,
        startPosition: null,
        currentPosition: null,
        offset: null,
      });

      hasExceededThreshold.current = false;
    },
    [dragState, config, getEventPosition]
  );

  /**
   * Set up event listeners for drag operations
   */
  useEffect(() => {
    if (!dragState.draggedItemId) return;

    const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
    const handleEnd = (e: MouseEvent | TouchEvent) => handleDragEnd(e);

    if (config.enableMouse !== false) {
      window.addEventListener('mousemove', handleMove as any);
      window.addEventListener('mouseup', handleEnd as any);
    }

    if (config.enableTouch !== false) {
      window.addEventListener('touchmove', handleMove as any, { passive: false });
      window.addEventListener('touchend', handleEnd as any);
      window.addEventListener('touchcancel', handleEnd as any);
    }

    return () => {
      if (config.enableMouse !== false) {
        window.removeEventListener('mousemove', handleMove as any);
        window.removeEventListener('mouseup', handleEnd as any);
      }

      if (config.enableTouch !== false) {
        window.removeEventListener('touchmove', handleMove as any);
        window.removeEventListener('touchend', handleEnd as any);
        window.removeEventListener('touchcancel', handleEnd as any);
      }
    };
  }, [dragState.draggedItemId, handleDragMove, handleDragEnd, config.enableMouse, config.enableTouch]);

  return {
    dragState,
    handleDragStart,
    isDragging: dragState.isDragging,
  };
}
