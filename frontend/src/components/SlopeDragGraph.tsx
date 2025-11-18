import { useEffect, useRef, useState } from 'react'
import './SlopeDragGraph.css'

interface Point {
  x: number
  y: number
}

interface SlopeDragGraphProps {
  isMobile?: boolean
}

const SlopeDragGraph = ({ isMobile = false }: SlopeDragGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [point1, setPoint1] = useState<Point>({ x: -3, y: 2 })
  const [point2, setPoint2] = useState<Point>({ x: 3, y: -2 })
  const [draggingPoint, setDraggingPoint] = useState<1 | 2 | null>(null)
  const [slope, setSlope] = useState<number | string>(0)

  // Canvas 설정
  const canvasWidth = isMobile ? 320 : 600
  const canvasHeight = isMobile ? 320 : 600
  const padding = 40
  const gridSize = 1
  const gridRange = 10

  // 좌표 변환 함수: 수학 좌표 -> 캔버스 픽셀
  const toCanvasX = (x: number): number => {
    return padding + ((x + gridRange) / (2 * gridRange)) * (canvasWidth - 2 * padding)
  }

  const toCanvasY = (y: number): number => {
    return canvasHeight - padding - ((y + gridRange) / (2 * gridRange)) * (canvasHeight - 2 * padding)
  }

  // 캔버스 픽셀 -> 수학 좌표
  const toMathX = (canvasX: number): number => {
    return ((canvasX - padding) / (canvasWidth - 2 * padding)) * (2 * gridRange) - gridRange
  }

  const toMathY = (canvasY: number): number => {
    return -(((canvasY - (canvasHeight - padding)) / (canvasHeight - 2 * padding)) * (2 * gridRange) - gridRange)
  }

  // 기울기 계산
  useEffect(() => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y

    if (Math.abs(dx) < 0.01) {
      setSlope('∞ (수직)')
    } else {
      const calculatedSlope = dy / dx
      setSlope(calculatedSlope.toFixed(3))
    }
  }, [point1, point2])

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 배경
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 그리드 그리기
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1

    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      // 세로선
      ctx.beginPath()
      ctx.moveTo(toCanvasX(i), toCanvasY(gridRange))
      ctx.lineTo(toCanvasX(i), toCanvasY(-gridRange))
      ctx.stroke()

      // 가로선
      ctx.beginPath()
      ctx.moveTo(toCanvasX(-gridRange), toCanvasY(i))
      ctx.lineTo(toCanvasX(gridRange), toCanvasY(i))
      ctx.stroke()
    }

    // X축, Y축 (진하게)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2

    // X축
    ctx.beginPath()
    ctx.moveTo(toCanvasX(-gridRange), toCanvasY(0))
    ctx.lineTo(toCanvasX(gridRange), toCanvasY(0))
    ctx.stroke()

    // Y축
    ctx.beginPath()
    ctx.moveTo(toCanvasX(0), toCanvasY(-gridRange))
    ctx.lineTo(toCanvasX(0), toCanvasY(gridRange))
    ctx.stroke()

    // 축 레이블
    ctx.fillStyle = '#333'
    ctx.font = isMobile ? '12px Arial' : '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // X축 숫자
    for (let i = -gridRange; i <= gridRange; i += 2) {
      if (i !== 0) {
        ctx.fillText(i.toString(), toCanvasX(i), toCanvasY(0) + 20)
      }
    }

    // Y축 숫자
    ctx.textAlign = 'right'
    for (let i = -gridRange; i <= gridRange; i += 2) {
      if (i !== 0) {
        ctx.fillText(i.toString(), toCanvasX(0) - 10, toCanvasY(i))
      }
    }

    // 원점 0
    ctx.textAlign = 'right'
    ctx.fillText('0', toCanvasX(0) - 10, toCanvasY(0) + 20)

    // 두 점을 잇는 선
    ctx.strokeStyle = '#667eea'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(toCanvasX(point1.x), toCanvasY(point1.y))
    ctx.lineTo(toCanvasX(point2.x), toCanvasY(point2.y))
    ctx.stroke()

    // 점 1 (빨강)
    ctx.fillStyle = '#ff4757'
    ctx.beginPath()
    ctx.arc(toCanvasX(point1.x), toCanvasY(point1.y), isMobile ? 10 : 12, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // 점 2 (파랑)
    ctx.fillStyle = '#3742fa'
    ctx.beginPath()
    ctx.arc(toCanvasX(point2.x), toCanvasY(point2.y), isMobile ? 10 : 12, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // 좌표 레이블
    ctx.font = isMobile ? 'bold 11px Arial' : 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff4757'
    ctx.fillText(
      `P1(${point1.x.toFixed(1)}, ${point1.y.toFixed(1)})`,
      toCanvasX(point1.x),
      toCanvasY(point1.y) - (isMobile ? 18 : 22)
    )

    ctx.fillStyle = '#3742fa'
    ctx.fillText(
      `P2(${point2.x.toFixed(1)}, ${point2.y.toFixed(1)})`,
      toCanvasX(point2.x),
      toCanvasY(point2.y) - (isMobile ? 18 : 22)
    )
  }, [point1, point2, canvasWidth, canvasHeight, isMobile])

  // 마우스/터치 이벤트 핸들러
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    const mathX = toMathX(canvasX)
    const mathY = toMathY(canvasY)

    // 점 1 클릭 확인
    const dist1 = Math.sqrt((mathX - point1.x) ** 2 + (mathY - point1.y) ** 2)
    if (dist1 < 0.8) {
      setDraggingPoint(1)
      return
    }

    // 점 2 클릭 확인
    const dist2 = Math.sqrt((mathX - point2.x) ** 2 + (mathY - point2.y) ** 2)
    if (dist2 < 0.8) {
      setDraggingPoint(2)
      return
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingPoint === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    const mathX = Math.max(-gridRange, Math.min(gridRange, toMathX(canvasX)))
    const mathY = Math.max(-gridRange, Math.min(gridRange, toMathY(canvasY)))

    if (draggingPoint === 1) {
      setPoint1({ x: mathX, y: mathY })
    } else if (draggingPoint === 2) {
      setPoint2({ x: mathX, y: mathY })
    }
  }

  const handlePointerUp = () => {
    setDraggingPoint(null)
  }

  return (
    <div className={`slope-graph-container ${isMobile ? 'mobile' : ''}`}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none', cursor: draggingPoint ? 'grabbing' : 'grab' }}
      />

      <div className="slope-display">
        <div className="slope-label">기울기 (Slope)</div>
        <div className="slope-value">{slope}</div>
        <div className="slope-formula">
          m = (y₂ - y₁) / (x₂ - x₁)
        </div>
        {typeof slope === 'number' && (
          <div className="slope-calculation">
            = ({point2.y.toFixed(1)} - {point1.y.toFixed(1)}) / ({point2.x.toFixed(1)} - {point1.x.toFixed(1)})
          </div>
        )}
      </div>
    </div>
  )
}

export default SlopeDragGraph
