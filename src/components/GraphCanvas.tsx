import React, { useRef, useState } from 'react'
import './GraphCanvas.css'
import { SequenceTerm } from './DragToGraphApp'

interface GraphCanvasProps {
  terms: SequenceTerm[]
  onDrop: (x: number, y: number) => void
  draggedTerm: SequenceTerm | null
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ terms, onDrop, draggedTerm }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)

  // 그래프 설정
  const width = 320
  const height = 280
  const padding = 40
  const graphWidth = width - 2 * padding
  const graphHeight = height - 2 * padding

  // 축 범위 (0부터 최대값+1까지)
  const maxX = 6
  const maxY = 12

  // 좌표 변환 함수
  const toPixelX = (x: number) => padding + (x / maxX) * graphWidth
  const toPixelY = (y: number) => height - padding - (y / maxY) * graphHeight

  const fromPixelX = (px: number) => ((px - padding) / graphWidth) * maxX
  const fromPixelY = (py: number) => ((height - padding - py) / graphHeight) * maxY

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)

    if (canvasRef.current && draggedTerm) {
      const rect = canvasRef.current.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top

      const x = fromPixelX(px)
      const y = fromPixelY(py)

      // 그래프 범위 내에 있을 때만 미리보기 표시
      if (x >= 0 && x <= maxX && y >= 0 && y <= maxY) {
        setPreviewPosition({ x, y })
      } else {
        setPreviewPosition(null)
      }
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
    setPreviewPosition(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setPreviewPosition(null)

    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const x = fromPixelX(px)
    const y = fromPixelY(py)

    // 그래프 범위 내에서만 드롭 허용
    if (x >= 0 && x <= maxX && y >= 0 && y <= maxY) {
      onDrop(Math.round(x * 2) / 2, Math.round(y * 2) / 2) // 0.5 단위로 반올림
    }
  }

  // 배치된 항들을 점으로 표시
  const placedTerms = terms.filter(term => term.placed && term.x !== undefined && term.y !== undefined)

  // 점들을 선으로 연결 (인덱스 순서대로)
  const sortedTerms = [...placedTerms].sort((a, b) => a.index - b.index)
  const pathData = sortedTerms.length > 0
    ? sortedTerms.map((term, i) =>
      `${i === 0 ? 'M' : 'L'} ${toPixelX(term.x!)} ${toPixelY(term.y!)}`
    ).join(' ')
    : ''

  return (
    <div className="graph-canvas-container">
      <h3 className="graph-title">그래프</h3>
      <div
        ref={canvasRef}
        className={`graph-canvas ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg width={width} height={height}>
          {/* 그리드 라인 */}
          <g className="grid">
            {/* 수직 그리드 */}
            {Array.from({ length: maxX + 1 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={toPixelX(i)}
                y1={padding}
                x2={toPixelX(i)}
                y2={height - padding}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
            {/* 수평 그리드 */}
            {Array.from({ length: maxY + 1 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={padding}
                y1={toPixelY(i)}
                x2={width - padding}
                y2={toPixelY(i)}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* X축 */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#333"
            strokeWidth="2"
            markerEnd="url(#arrowX)"
          />

          {/* Y축 */}
          <line
            x1={padding}
            y1={height - padding}
            x2={padding}
            y2={padding}
            stroke="#333"
            strokeWidth="2"
            markerEnd="url(#arrowY)"
          />

          {/* 화살표 마커 정의 */}
          <defs>
            <marker
              id="arrowX"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#333" />
            </marker>
            <marker
              id="arrowY"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#333" />
            </marker>
          </defs>

          {/* X축 레이블 */}
          {Array.from({ length: maxX + 1 }, (_, i) => (
            <text
              key={`x-label-${i}`}
              x={toPixelX(i)}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {i}
            </text>
          ))}

          {/* Y축 레이블 */}
          {Array.from({ length: maxY + 1 }, (_, i) => (
            i % 2 === 0 && (
              <text
                key={`y-label-${i}`}
                x={padding - 15}
                y={toPixelY(i) + 4}
                textAnchor="middle"
                fontSize="12"
                fill="#666"
              >
                {i}
              </text>
            )
          ))}

          {/* 축 이름 */}
          <text
            x={width - padding + 15}
            y={height - padding + 5}
            fontSize="14"
            fill="#333"
            fontWeight="600"
          >
            n
          </text>
          <text
            x={padding - 5}
            y={padding - 10}
            fontSize="14"
            fill="#333"
            fontWeight="600"
          >
            aₙ
          </text>

          {/* 점들을 연결하는 선 */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#667eea"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.5"
            />
          )}

          {/* 배치된 점들 */}
          {placedTerms.map(term => (
            <g key={term.id}>
              <circle
                cx={toPixelX(term.x!)}
                cy={toPixelY(term.y!)}
                r="8"
                fill="#667eea"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={toPixelX(term.x!)}
                y={toPixelY(term.y!) - 15}
                textAnchor="middle"
                fontSize="12"
                fill="#667eea"
                fontWeight="600"
              >
                {term.value}
              </text>
            </g>
          ))}

          {/* 드래그 중 미리보기 */}
          {previewPosition && draggedTerm && (
            <g opacity="0.5">
              <circle
                cx={toPixelX(previewPosition.x)}
                cy={toPixelY(previewPosition.y)}
                r="8"
                fill="#764ba2"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <text
                x={toPixelX(previewPosition.x)}
                y={toPixelY(previewPosition.y) - 15}
                textAnchor="middle"
                fontSize="12"
                fill="#764ba2"
                fontWeight="600"
              >
                {draggedTerm.value}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

export default GraphCanvas
