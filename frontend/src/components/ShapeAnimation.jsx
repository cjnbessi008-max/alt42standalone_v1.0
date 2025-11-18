import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const ShapeAnimation = ({ problem }) => {
  const canvasRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!problem || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 3초 애니메이션 함수
    const animate = () => {
      const startTime = Date.now()
      const duration = 3000 // 3초

      const draw = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 캔버스 초기화
        ctx.clearRect(0, 0, width, height)

        // 배경 그라디언트
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, '#f0f9ff')
        gradient.addColorStop(1, '#e0f2fe')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // 도형 타입에 따라 다른 애니메이션
        switch (problem.shapeType) {
          case 'circle':
            drawCircleAnimation(ctx, width, height, progress, problem)
            break
          case 'triangle':
            drawTriangleAnimation(ctx, width, height, progress, problem)
            break
          case 'rectangle':
            drawRectangleAnimation(ctx, width, height, progress, problem)
            break
          default:
            drawDefaultAnimation(ctx, width, height, progress, problem)
        }

        // 문제 핵심 텍스트
        drawProblemText(ctx, width, height, progress, problem)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(draw)
        } else {
          setIsAnimating(false)
        }
      }

      setIsAnimating(true)
      draw()
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [problem])

  // 원 애니메이션
  const drawCircleAnimation = (ctx, width, height, progress, problem) => {
    const centerX = width / 2
    const centerY = height / 2 - 40
    const maxRadius = 80
    const radius = maxRadius * easeOutElastic(progress)

    // 원 그리기
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(59, 130, 246, ${0.2 + progress * 0.3})`
    ctx.fill()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.stroke()

    // 반지름 표시
    if (progress > 0.5) {
      const lineProgress = (progress - 0.5) * 2
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + radius * lineProgress, centerY)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.stroke()

      // 반지름 값
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`r = ${problem.radius || '?'}`, centerX + radius / 2, centerY - 10)
    }
  }

  // 삼각형 애니메이션
  const drawTriangleAnimation = (ctx, width, height, progress, problem) => {
    const centerX = width / 2
    const centerY = height / 2 - 20
    const size = 100

    const p1 = { x: centerX, y: centerY - size }
    const p2 = { x: centerX - size, y: centerY + size }
    const p3 = { x: centerX + size, y: centerY + size }

    // 삼각형 그리기 (점진적으로)
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)

    if (progress > 0.33) {
      ctx.lineTo(p2.x, p2.y)
    } else {
      const t = progress / 0.33
      ctx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t)
    }

    if (progress > 0.66) {
      ctx.lineTo(p3.x, p3.y)
      ctx.closePath()
    } else if (progress > 0.33) {
      const t = (progress - 0.33) / 0.33
      ctx.lineTo(p2.x + (p3.x - p2.x) * t, p2.y + (p3.y - p2.y) * t)
    }

    ctx.fillStyle = `rgba(16, 185, 129, ${0.2 + progress * 0.3})`
    ctx.fill()
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // 사각형 애니메이션
  const drawRectangleAnimation = (ctx, width, height, progress, problem) => {
    const centerX = width / 2
    const centerY = height / 2 - 20
    const w = 120 * easeOutBack(progress)
    const h = 80 * easeOutBack(progress)

    ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + progress * 0.3})`
    ctx.fillRect(centerX - w / 2, centerY - h / 2, w, h)

    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 3
    ctx.strokeRect(centerX - w / 2, centerY - h / 2, w, h)

    // 가로, 세로 표시
    if (progress > 0.6) {
      ctx.fillStyle = '#a855f7'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${problem.width || '?'}cm`, centerX, centerY + h / 2 + 20)

      ctx.save()
      ctx.translate(centerX - w / 2 - 20, centerY)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(`${problem.height || '?'}cm`, 0, 0)
      ctx.restore()
    }
  }

  // 기본 애니메이션
  const drawDefaultAnimation = (ctx, width, height, progress, problem) => {
    drawCircleAnimation(ctx, width, height, progress, problem)
  }

  // 문제 핵심 텍스트
  const drawProblemText = (ctx, width, height, progress, problem) => {
    if (progress > 0.7) {
      const textAlpha = (progress - 0.7) / 0.3

      ctx.fillStyle = `rgba(31, 41, 55, ${textAlpha})`
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'

      const summary = problem.summary || problem.title || '도형 문제'
      const lines = wrapText(ctx, summary, width - 40)

      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, height - 80 + i * 25)
      })
    }
  }

  // 텍스트 줄바꿈
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ')
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const width = ctx.measureText(currentLine + ' ' + word).width
      if (width < maxWidth) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    lines.push(currentLine)
    return lines
  }

  // Easing 함수들
  const easeOutElastic = (t) => {
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
  }

  const easeOutBack = (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-white shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">3초 도형 요약</h2>
        <p className="text-xs text-gray-500">Shape Summary</p>
      </div>

      {/* 캔버스 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.canvas
          ref={canvasRef}
          width={250}
          height={400}
          className="rounded-lg shadow-lg bg-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 재생 버튼 */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            // 애니메이션 재시작
            if (canvasRef.current) {
              const event = new Event('reload')
              canvasRef.current.dispatchEvent(event)
            }
          }}
          disabled={isAnimating}
          className={`w-full py-3 rounded-full font-bold text-white shadow-lg transition-all ${
            isAnimating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:scale-95'
          }`}
        >
          {isAnimating ? '재생 중...' : '다시 보기'}
        </button>
      </div>
    </div>
  )
}

export default ShapeAnimation
