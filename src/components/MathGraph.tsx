import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ScatterChart, ZAxis } from 'recharts'
import { ProblemData, Point } from '../types'
import './MathGraph.css'

interface MathGraphProps {
  problemData: ProblemData
  onInflectionDetected: (point: Point) => void
}

const MathGraph = ({ problemData, onInflectionDetected }: MathGraphProps) => {
  const [graphData, setGraphData] = useState<any[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  // Calculate function values
  const calculateFunction = useCallback((x: number): number => {
    // f(x) = x³ - 3x² + 2
    return Math.pow(x, 3) - 3 * Math.pow(x, 2) + 2
  }, [])

  // Generate graph data
  useEffect(() => {
    const data = []
    const step = 0.1
    for (let x = -2; x <= 4; x += step) {
      const y = calculateFunction(x)
      data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
    }
    setGraphData(data)
  }, [calculateFunction])

  // Animation to gradually reveal inflection points
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animationProgress < 100) {
        setAnimationProgress(prev => Math.min(prev + 2, 100))
      } else {
        // Trigger inflection detection after full graph is shown
        if (problemData.inflectionPoints.length > 0) {
          setTimeout(() => {
            onInflectionDetected(problemData.inflectionPoints[0])
          }, 500)
        }
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [animationProgress, problemData.inflectionPoints, onInflectionDetected])

  // Check if point is near inflection
  const isNearInflection = (point: Point): boolean => {
    return problemData.inflectionPoints.some(
      inflection => Math.abs(point.x - inflection.x) < 0.3
    )
  }

  const handleMouseMove = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const point = data.activePayload[0].payload
      setHoveredPoint(point)

      if (isNearInflection(point)) {
        onInflectionDetected(point)
      }
    }
  }

  const handleClick = () => {
    if (hoveredPoint && isNearInflection(hoveredPoint)) {
      onInflectionDetected(hoveredPoint)
    }
  }

  // Prepare inflection point markers
  const inflectionMarkers = problemData.inflectionPoints.map(point => ({
    x: point.x,
    y: point.y,
    z: 100
  }))

  return (
    <div className="math-graph-container">
      <div className="graph-info">
        <p className="equation-display">{problemData.equation}</p>
        <p className="instruction">그래프를 탐색하여 변곡점을 찾아보세요</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={graphData.slice(0, Math.floor(graphData.length * animationProgress / 100))}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[-2, 4]}
            label={{ value: 'x', position: 'insideBottomRight', offset: -5 }}
            stroke="#666"
          />
          <YAxis
            type="number"
            domain={[-6, 6]}
            label={{ value: 'y', angle: -90, position: 'insideLeft' }}
            stroke="#666"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const nearInflection = isNearInflection(data)
                return (
                  <div className={`custom-tooltip ${nearInflection ? 'near-inflection' : ''}`}>
                    <p>x: {data.x}</p>
                    <p>y: {data.y}</p>
                    {nearInflection && <p className="inflection-hint">⚡ 변곡점 근처!</p>}
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#667eea"
            strokeWidth={3}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Inflection point markers */}
      <ResponsiveContainer width="100%" height={300} style={{ position: 'absolute', top: '60px', pointerEvents: 'none' }}>
        <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis dataKey="x" type="number" domain={[-2, 4]} hide />
          <YAxis dataKey="y" type="number" domain={[-6, 6]} hide />
          <ZAxis dataKey="z" range={[400, 400]} />
          <Scatter
            data={animationProgress === 100 ? inflectionMarkers : []}
            fill="#ff6b6b"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${animationProgress}%` }}
        />
      </div>
    </div>
  )
}

export default MathGraph
