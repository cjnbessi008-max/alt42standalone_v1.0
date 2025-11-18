import React, { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from 'reactflow'
import 'reactflow/dist/style.css'
import { parseEquationToGraph } from '../utils/equationParser'
import './EquaMap.css'

/**
 * EquaMap - 방정식 구조를 마인드맵으로 시각화
 */
function EquaMap({ equation }) {
  const { nodes, edges } = useMemo(() => {
    if (!equation) return { nodes: [], edges: [] }
    return parseEquationToGraph(equation)
  }, [equation])

  return (
    <div className="equamap-container">
      <div className="equamap-header">
        <h2>{equation?.title || '방정식 분석'}</h2>
        <div className="equation-display">
          {equation?.expression}
        </div>
      </div>

      <div className="equamap-visualization">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'equation': return '#667eea'
                case 'term': return '#48bb78'
                case 'factor': return '#ed8936'
                case 'variable': return '#4299e1'
                case 'constant': return '#9f7aea'
                default: return '#718096'
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <div className="equamap-legend">
        <h3>범례</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color equation"></span>
            <span>방정식</span>
          </div>
          <div className="legend-item">
            <span className="legend-color term"></span>
            <span>항</span>
          </div>
          <div className="legend-item">
            <span className="legend-color factor"></span>
            <span>인수</span>
          </div>
          <div className="legend-item">
            <span className="legend-color variable"></span>
            <span>변수</span>
          </div>
          <div className="legend-item">
            <span className="legend-color constant"></span>
            <span>상수</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EquaMap
