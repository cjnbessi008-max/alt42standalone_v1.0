import { useEffect, useRef, useState } from 'react'
import './SpringVisualizer.css'

interface SpringVisualizerProps {
  distance: number
  isPositive: boolean
  number1: number
  number2: number
}

const SpringVisualizer: React.FC<SpringVisualizerProps> = ({
  distance,
  isPositive,
  number1,
  number2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [currentStretch, setCurrentStretch] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height

    // Animation parameters
    const targetStretch = Math.min(distance * 20, width * 0.6) // Scale distance to pixels
    const animationSpeed = 0.1

    let currentStretchLocal = currentStretch

    const animate = () => {
      // Smooth animation towards target
      const diff = targetStretch - currentStretchLocal
      if (Math.abs(diff) > 0.5) {
        currentStretchLocal += diff * animationSpeed
        setCurrentStretch(currentStretchLocal)
      } else {
        currentStretchLocal = targetStretch
        setCurrentStretch(targetStretch)
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Spring parameters
      const centerY = height / 2
      const leftX = width * 0.15
      const rightX = width * 0.85
      const springWidth = rightX - leftX
      const actualSpringLength = Math.min(currentStretchLocal, springWidth * 0.9)

      // Number of coils based on stretch
      const coils = Math.max(5, Math.floor(distance * 2))
      const coilHeight = 30

      // Draw left anchor point (number1)
      drawAnchor(ctx, leftX, centerY, number1, '#004098')

      // Draw spring
      drawSpring(ctx, leftX + 40, centerY, actualSpringLength, coilHeight, coils, distance)

      // Draw right anchor point (number2)
      const rightAnchorX = leftX + 40 + actualSpringLength + 40
      drawAnchor(ctx, rightAnchorX, centerY, number2, '#0066cc')

      // Draw force indicator
      drawForceIndicator(ctx, width / 2, centerY - 80, distance, isPositive)

      // Continue animation if not at target
      if (Math.abs(targetStretch - currentStretchLocal) > 0.5) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [distance, isPositive, number1, number2, currentStretch])

  return (
    <div className="spring-visualizer">
      <canvas
        ref={canvasRef}
        className="spring-canvas"
        aria-label={`${number1}와 ${number2} 사이의 거리 ${distance.toFixed(1)}를 표시하는 스프링`}
      />
    </div>
  )
}

// Helper function to draw anchor point with number
function drawAnchor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  color: string
) {
  // Draw circle
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw number
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value.toFixed(1), x, y)
}

// Helper function to draw spring
function drawSpring(
  ctx: CanvasRenderingContext2D,
  startX: number,
  centerY: number,
  length: number,
  coilHeight: number,
  coils: number,
  distance: number
) {
  const segmentLength = length / (coils * 2)

  ctx.beginPath()
  ctx.moveTo(startX, centerY)

  let currentX = startX
  let currentY = centerY
  let direction = 1

  for (let i = 0; i < coils * 2; i++) {
    currentX += segmentLength
    currentY = centerY + direction * coilHeight

    // Control points for smooth curves
    const cp1x = currentX - segmentLength / 2
    const cp1y = currentY
    const cp2x = currentX - segmentLength / 4
    const cp2y = currentY

    ctx.quadraticCurveTo(cp1x, cp1y, currentX, currentY)

    direction *= -1
  }

  // Final segment to end point
  ctx.lineTo(currentX + segmentLength / 2, centerY)

  // Spring styling based on tension
  const tension = Math.min(distance / 10, 1)
  const hue = 200 - tension * 80 // Blue to red gradient
  ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`
  ctx.lineWidth = 4 + tension * 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  // Add shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.stroke()

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}

// Helper function to draw force indicator
function drawForceIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  distance: number,
  isPositive: boolean
) {
  // Draw arrow
  const arrowLength = Math.min(distance * 15, 100)
  const arrowDirection = isPositive ? 1 : -1

  ctx.beginPath()
  ctx.moveTo(x - arrowLength / 2 * arrowDirection, y)
  ctx.lineTo(x + arrowLength / 2 * arrowDirection, y)

  // Arrow head
  ctx.lineTo(x + (arrowLength / 2 - 10) * arrowDirection, y - 8)
  ctx.moveTo(x + arrowLength / 2 * arrowDirection, y)
  ctx.lineTo(x + (arrowLength / 2 - 10) * arrowDirection, y + 8)

  ctx.strokeStyle = '#ff6b35'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  // Draw distance label
  ctx.fillStyle = '#ff6b35'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`거리: ${distance.toFixed(1)}`, x, y - 15)
}

export default SpringVisualizer
