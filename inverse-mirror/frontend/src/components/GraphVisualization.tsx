import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import {
  generateFunctionPoints,
  calculateInversePoints,
  generateMirrorLine,
  calculateDerivative,
  generateTangentLine,
} from '../services/mathUtils';
import type { Point } from '../types';

interface GraphVisualizationProps {
  functionExpression: string;
  domain: [number, number];
  selectedPoint: number;
  showInverse: boolean;
  showDerivative: boolean;
  showMirrorLine: boolean;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  functionExpression,
  domain,
  selectedPoint,
  showInverse,
  showDerivative,
  showMirrorLine,
}) => {
  const [traces, setTraces] = useState<any[]>([]);

  useEffect(() => {
    const newTraces: any[] = [];

    try {
      // Original function
      const functionPoints = generateFunctionPoints(functionExpression, domain);
      newTraces.push({
        x: functionPoints.map(p => p.x),
        y: functionPoints.map(p => p.y),
        type: 'scatter',
        mode: 'lines',
        name: 'f(x)',
        line: { color: '#2196F3', width: 3 },
      });

      // Inverse function (reflection over y=x)
      if (showInverse) {
        const inversePoints = calculateInversePoints(functionPoints);
        newTraces.push({
          x: inversePoints.map(p => p.x),
          y: inversePoints.map(p => p.y),
          type: 'scatter',
          mode: 'lines',
          name: 'f⁻¹(x)',
          line: { color: '#FF5722', width: 3 },
        });
      }

      // Mirror line y=x
      if (showMirrorLine) {
        const mirrorPoints = generateMirrorLine(domain);
        newTraces.push({
          x: mirrorPoints.map(p => p.x),
          y: mirrorPoints.map(p => p.y),
          type: 'scatter',
          mode: 'lines',
          name: 'y = x (거울선)',
          line: { color: '#9E9E9E', width: 2, dash: 'dash' },
        });
      }

      // Selected point and tangent line
      if (showDerivative && selectedPoint >= domain[0] && selectedPoint <= domain[1]) {
        const yValue = functionPoints.find(p => Math.abs(p.x - selectedPoint) < 0.1)?.y;

        if (yValue !== undefined) {
          // Point on original function
          newTraces.push({
            x: [selectedPoint],
            y: [yValue],
            type: 'scatter',
            mode: 'markers',
            name: '점 P',
            marker: { color: '#2196F3', size: 12 },
          });

          // Tangent line at selected point
          const derivative = calculateDerivative(functionExpression, selectedPoint);
          const tangentPoints = generateTangentLine({ x: selectedPoint, y: yValue }, derivative, 1.5);

          newTraces.push({
            x: tangentPoints.map(p => p.x),
            y: tangentPoints.map(p => p.y),
            type: 'scatter',
            mode: 'lines',
            name: `접선 (기울기: ${derivative.toFixed(3)})`,
            line: { color: '#4CAF50', width: 2, dash: 'dot' },
          });

          // Inverse point and tangent
          if (showInverse) {
            newTraces.push({
              x: [yValue],
              y: [selectedPoint],
              type: 'scatter',
              mode: 'markers',
              name: '점 P\'',
              marker: { color: '#FF5722', size: 12 },
            });

            // Tangent line on inverse (slope is reciprocal)
            const inverseDerivative = derivative !== 0 ? 1 / derivative : Infinity;
            if (isFinite(inverseDerivative)) {
              const inverseTangentPoints = generateTangentLine(
                { x: yValue, y: selectedPoint },
                inverseDerivative,
                1.5
              );

              newTraces.push({
                x: inverseTangentPoints.map(p => p.x),
                y: inverseTangentPoints.map(p => p.y),
                type: 'scatter',
                mode: 'lines',
                name: `역함수 접선 (기울기: ${inverseDerivative.toFixed(3)})`,
                line: { color: '#FF9800', width: 2, dash: 'dot' },
              });
            }
          }
        }
      }

      setTraces(newTraces);
    } catch (error) {
      console.error('Error generating graph:', error);
    }
  }, [functionExpression, domain, selectedPoint, showInverse, showDerivative, showMirrorLine]);

  const layout = {
    title: 'Inverse Mirror - 역함수 미분 시각화',
    xaxis: {
      title: 'x',
      zeroline: true,
      gridcolor: '#e0e0e0',
    },
    yaxis: {
      title: 'y',
      zeroline: true,
      gridcolor: '#e0e0e0',
      scaleanchor: 'x',
      scaleratio: 1,
    },
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
    },
    hovermode: 'closest',
    autosize: true,
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  return (
    <div className="graph-container">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};

export default GraphVisualization;
