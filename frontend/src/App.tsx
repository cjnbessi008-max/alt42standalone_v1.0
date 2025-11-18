/**
 * Main App Component
 * Demonstrates Blend Difference Animation with LMS Integration
 */

import React, { useState } from 'react';
import { BlendDifferenceAnimator } from './components/BlendDifferenceAnimator';
import { VirtualSmartphone } from './components/VirtualSmartphone';
import { useLMSIntegration } from './hooks/useLMSIntegration';
import type { MathFunction, AnimationConfig, BlendMode, Problem } from './types';

// Demo problems
const DEMO_PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Linear vs Quadratic',
    description: 'Compare a linear function with a quadratic function',
    function1: 'x',
    function2: 'x^2',
    color1: '#3B82F6',
    color2: '#EC4899',
    difficulty: 'easy',
    category: 'Basic Functions',
    hints: ['Notice how the curves diverge', 'The difference increases as x grows']
  },
  {
    id: 2,
    title: 'Sine vs Cosine',
    description: 'Visualize the phase difference between sine and cosine',
    function1: 'sin(x)',
    function2: 'cos(x)',
    color1: '#10B981',
    color2: '#F59E0B',
    difficulty: 'medium',
    category: 'Trigonometric Functions',
    hints: ['They are 90 degrees out of phase', 'The maximum difference is √2']
  },
  {
    id: 3,
    title: 'Exponential Growth',
    description: 'Compare exponential and linear growth',
    function1: '2*x',
    function2: '2^x',
    color1: '#8B5CF6',
    color2: '#EF4444',
    difficulty: 'medium',
    category: 'Growth Functions',
    hints: ['Exponential growth eventually dominates', 'Notice the dramatic difference at larger x values']
  },
  {
    id: 4,
    title: 'Polynomial Comparison',
    description: 'Compare two polynomial functions',
    function1: 'x^2 - 2*x + 1',
    function2: 'x^3 - 3*x + 2',
    color1: '#06B6D4',
    color2: '#F97316',
    difficulty: 'hard',
    category: 'Polynomials',
    hints: ['Look for intersection points', 'Higher degree dominates at extremes']
  }
];

function App() {
  const [selectedProblem, setSelectedProblem] = useState<Problem>(DEMO_PROBLEMS[0]);
  const [blendMode, setBlendMode] = useState<BlendMode>('difference');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showSmartphone, setShowSmartphone] = useState(true);

  // LMS Integration (optional - can be configured via environment variables)
  const lmsConfig = {
    endpoint: import.meta.env.VITE_LMS_ENDPOINT || '/api',
    apiKey: import.meta.env.VITE_LMS_API_KEY,
    courseId: import.meta.env.VITE_LMS_COURSE_ID
  };

  const { problems, currentProblem, loading, error } = useLMSIntegration(lmsConfig);

  // Use LMS problem if available, otherwise use demo problems
  const activeProblem = currentProblem || selectedProblem;

  const function1: MathFunction = {
    id: 'f1',
    expression: activeProblem.function1,
    color: activeProblem.color1,
    label: 'f(x) = ' + activeProblem.function1
  };

  const function2: MathFunction = {
    id: 'f2',
    expression: activeProblem.function2,
    color: activeProblem.color2,
    label: 'g(x) = ' + activeProblem.function2
  };

  const animationConfig: AnimationConfig = {
    duration: 5,
    fps: 60,
    blendMode,
    showGrid,
    showAxes,
    xMin: -5,
    xMax: 5,
    yMin: -10,
    yMax: 10
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#333'
          }}>
            Blend Difference Animation
          </h1>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Visualize function differences using color blending
          </p>
        </header>

        {/* Problem Selector */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>
            Select Problem
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '10px'
          }}>
            {DEMO_PROBLEMS.map(problem => (
              <button
                key={problem.id}
                onClick={() => setSelectedProblem(problem)}
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  backgroundColor: selectedProblem.id === problem.id ? '#2196F3' : '#f9f9f9',
                  color: selectedProblem.id === problem.id ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {problem.title}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {problem.category} • {problem.difficulty}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>
            Animation Settings
          </h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Blend Mode
              </label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as BlendMode)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="difference">Difference</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                Show Grid
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showAxes}
                  onChange={(e) => setShowAxes(e.target.checked)}
                />
                Show Axes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showSmartphone}
                  onChange={(e) => setShowSmartphone(e.target.checked)}
                />
                Virtual Smartphone
              </label>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <BlendDifferenceAnimator
            function1={function1}
            function2={function2}
            config={animationConfig}
            width={800}
            height={500}
          />
        </div>

        {/* Problem Description */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>
            About This Problem
          </h2>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            {activeProblem.description}
          </p>
          {activeProblem.hints && activeProblem.hints.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>
                Hints:
              </h3>
              <ul style={{ paddingLeft: '20px', color: '#666' }}>
                {activeProblem.hints.map((hint, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Virtual Smartphone Display */}
      {showSmartphone && (
        <VirtualSmartphone
          title={activeProblem.title}
          onClose={() => setShowSmartphone(false)}
          minimizable={true}
          position="bottom-right"
        >
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#333'
            }}>
              Problem Details
            </h4>
            <div style={{
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              marginBottom: '15px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: function1.color }}>Function 1:</strong>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  marginTop: '5px',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px'
                }}>
                  {function1.expression}
                </div>
              </div>
              <div>
                <strong style={{ color: function2.color }}>Function 2:</strong>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  marginTop: '5px',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px'
                }}>
                  {function2.expression}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p><strong>Difficulty:</strong> {activeProblem.difficulty}</p>
              <p><strong>Category:</strong> {activeProblem.category}</p>
              <p><strong>Blend Mode:</strong> {blendMode}</p>
            </div>
          </div>
        </VirtualSmartphone>
      )}

      {/* LMS Integration Status */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ff5252',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          maxWidth: '300px'
        }}>
          <strong>LMS Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default App;
