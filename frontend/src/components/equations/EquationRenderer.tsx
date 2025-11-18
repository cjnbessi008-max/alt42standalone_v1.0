/**
 * EquationRenderer Component
 * Renders mathematical equations using KaTeX
 * Part of KAIST Touch Math Academy AI Education System
 */

import React, { useEffect, useRef, useState } from 'react';
import { EquationRendererProps } from '../../types/equation.types';
import '../../styles/equation-renderer.css';

/**
 * Component for rendering LaTeX equations with KaTeX
 * Supports highlighting of specific elements and error handling
 */
export const EquationRenderer: React.FC<EquationRendererProps> = ({
  equation,
  displayMode = true,
  className = '',
  onError,
  highlightElements = [],
  highlightColor = '#FFA726',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Import KaTeX dynamically
      import('katex').then((katex) => {
        if (!containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Render equation
        katex.default.render(equation, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: false, // Security: don't trust user input
          macros: {
            '\\highlight': '\\colorbox{#FFA726}{#1}',
          },
        });

        // Apply highlights if specified
        if (highlightElements.length > 0) {
          applyHighlights(containerRef.current, highlightElements, highlightColor);
        }

        setRenderError(null);
      }).catch((error) => {
        const errorMessage = `Failed to load KaTeX: ${error.message}`;
        setRenderError(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRenderError(errorMessage);
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [equation, displayMode, highlightElements, highlightColor, onError]);

  /**
   * Apply highlights to specific elements in the rendered equation
   */
  const applyHighlights = (
    container: HTMLElement,
    elements: string[],
    color: string
  ) => {
    elements.forEach((elementText) => {
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        if (text.includes(elementText)) {
          const parent = node.parentElement;
          if (parent && !parent.classList.contains('highlight')) {
            parent.style.backgroundColor = color;
            parent.style.padding = '2px 4px';
            parent.style.borderRadius = '3px';
            parent.style.transition = 'background-color 0.3s ease';
            parent.classList.add('highlight');
          }
        }
      }
    });
  };

  if (renderError) {
    return (
      <div
        className={`equation-renderer equation-error ${className}`}
        role="alert"
        aria-live="polite"
      >
        <span className="error-icon">⚠️</span>
        <span className="error-message">Error rendering equation: {renderError}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`equation-renderer ${displayMode ? 'display-mode' : 'inline-mode'} ${className}`}
      role="math"
      aria-label={`Equation: ${equation}`}
    />
  );
};

export default EquationRenderer;
