import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '../hooks/useAppStore'
import { getCentroid, distance, isPointInTriangle } from '../utils/geometry'
import type { Point, Triangle } from '../types'
import './TriangleCanvas.css'

const TriangleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentProblem, currentTriangle, setCurrentTriangle, isDragging, setIsDragging } = useAppStore()

  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const height = Math.max(400, containerRef.current.clientHeight)
        setCanvasSize({ width, height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Draw triangles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentProblem) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid for reference
    drawGrid(ctx, canvas.width, canvas.height)

    // Draw target triangle (semi-transparent)
    drawTriangle(ctx, currentProblem.targetTriangle, true)

    // Draw current (student's) triangle
    drawTriangle(ctx, currentTriangle, false)

    // Draw labels
    drawLabels(ctx, currentProblem.targetTriangle, currentTriangle)
  }, [currentProblem, currentTriangle, canvasSize])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1

    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawTriangle = (ctx: CanvasRenderingContext2D, triangle: Triangle, isTarget: boolean) => {
    const [A, B, C] = triangle.vertices

    ctx.beginPath()
    ctx.moveTo(A.x, A.y)
    ctx.lineTo(B.x, B.y)
    ctx.lineTo(C.x, C.y)
    ctx.closePath()

    if (isTarget) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)' // Purple, semi-transparent
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
    } else {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)' // Blue, semi-transparent
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([])
    }

    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])

    // Draw vertices
    ;[A, B, C].forEach((vertex, index) => {
      ctx.beginPath()
      ctx.arc(vertex.x, vertex.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = isTarget ? '#8b5cf6' : '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label vertices
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(
        ['A', 'B', 'C'][index],
        vertex.x + 10,
        vertex.y - 10
      )
    })
  }

  const drawLabels = (ctx: CanvasRenderingContext2D, target: Triangle, current: Triangle) => {
    const targetCenter = getCentroid(target)
    const currentCenter = getCentroid(current)

    // Target triangle label
    ctx.fillStyle = '#8b5cf6'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('목표 삼각형', targetCenter.x - 40, targetCenter.y)

    // Current triangle label
    ctx.fillStyle = '#3b82f6'
    ctx.fillText('내 삼각형', currentCenter.x - 35, currentCenter.y)

    // Scale factor
    if (current.scaleFactor) {
      ctx.fillStyle = '#64748b'
      ctx.font = '14px sans-serif'
      ctx.fillText(
        `확대/축소: ${current.scaleFactor.toFixed(2)}x`,
        currentCenter.x - 45,
        currentCenter.y + 20
      )
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    if (isPointInTriangle(point, currentTriangle)) {
      const centroid = getCentroid(currentTriangle)
      setDragOffset({
        x: point.x - centroid.x,
        y: point.y - centroid.y
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const currentCentroid = getCentroid(currentTriangle)
    const offset: Point = {
      x: point.x - dragOffset.x - currentCentroid.x,
      y: point.y - dragOffset.y - currentCentroid.y
    }

    const newVertices = currentTriangle.vertices.map(v => ({
      x: v.x + offset.x,
      y: v.y + offset.y
    })) as [Point, Point, Point]

    setCurrentTriangle({
      ...currentTriangle,
      vertices: newVertices
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const point: Point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    if (isPointInTriangle(point, currentTriangle)) {
      const centroid = getCentroid(currentTriangle)
      setDragOffset({
        x: point.x - centroid.x,
        y: point.y - centroid.y
      })
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    e.preventDefault()

    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const point: Point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    const currentCentroid = getCentroid(currentTriangle)
    const offset: Point = {
      x: point.x - dragOffset.x - currentCentroid.x,
      y: point.y - dragOffset.y - currentCentroid.y
    }

    const newVertices = currentTriangle.vertices.map(v => ({
      x: v.x + offset.x,
      y: v.y + offset.y
    })) as [Point, Point, Point]

    setCurrentTriangle({
      ...currentTriangle,
      vertices: newVertices
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div ref={containerRef} className="triangle-canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="triangle-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="canvas-instructions">
        <p>💡 <strong>조작법:</strong></p>
        <ul>
          <li>파란색 삼각형을 드래그하여 이동</li>
          <li>슬라이더로 크기 조절</li>
          <li>보라색 점선 삼각형과 완전히 겹치도록 맞추세요!</li>
        </ul>
      </div>
    </div>
  )
}

export default TriangleCanvas
