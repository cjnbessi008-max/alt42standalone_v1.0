import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import './ValueBounce.css'

const ValueBounce = ({ value }) => {
  const controls = useAnimation()
  const [ballColor, setBallColor] = useState('#667eea')
  const [previousValue, setPreviousValue] = useState(value)

  useEffect(() => {
    // 값이 변경될 때마다 바운스 애니메이션 실행
    const valueDiff = Math.abs(value - previousValue)

    if (valueDiff > 0) {
      // 값 변화량에 따라 바운스 높이 결정 (최대 60%, 최소 10%)
      const bounceHeight = Math.min(60, Math.max(10, valueDiff * 5))

      // 값 변화량에 따라 바운스 횟수 결정 (1-4회)
      const bounceCount = Math.min(4, Math.max(1, Math.floor(valueDiff / 5) + 1))

      // 값에 따라 공 색상 변경
      const hue = (value * 3) % 360
      setBallColor(`hsl(${hue}, 70%, 60%)`)

      // 바운스 애니메이션 실행
      performBounce(bounceHeight, bounceCount)
    }

    setPreviousValue(value)
  }, [value])

  const performBounce = async (maxHeight, bounceCount) => {
    const keyframes = []

    // 바운스 키프레임 생성 (점점 낮아지는 바운스)
    for (let i = 0; i < bounceCount; i++) {
      const heightRatio = Math.pow(0.6, i) // 각 바운스마다 60%씩 감소
      const currentHeight = maxHeight * heightRatio

      keyframes.push(
        { y: `${-currentHeight}%`, transition: { duration: 0.3, ease: 'easeOut' } },
        { y: '0%', transition: { duration: 0.3, ease: 'easeIn' } }
      )
    }

    // 애니메이션 실행
    await controls.start({
      y: keyframes.map(kf => kf.y),
      transition: {
        duration: 0.6 * bounceCount,
        times: Array.from({ length: keyframes.length }, (_, i) => i / (keyframes.length - 1)),
      }
    })

    // 애니메이션 종료 후 원위치
    controls.start({ y: '0%' })
  }

  // 값의 크기에 따라 공의 크기 조정 (최소 30px, 최대 80px)
  const ballSize = Math.min(80, Math.max(30, 40 + Math.abs(value) * 2))

  return (
    <div className="value-bounce-container">
      {/* 바닥 라인 */}
      <div className="ground-line"></div>

      {/* 바운스하는 공 */}
      <motion.div
        className="bounce-ball"
        animate={controls}
        style={{
          width: `${ballSize}px`,
          height: `${ballSize}px`,
          backgroundColor: ballColor,
        }}
        initial={{ y: '0%' }}
      >
        {/* 공 내부 하이라이트 */}
        <div className="ball-highlight"></div>

        {/* 공 내부 값 표시 */}
        <div className="ball-value">{value}</div>
      </motion.div>

      {/* 그림자 */}
      <motion.div
        className="ball-shadow"
        animate={controls}
        style={{
          width: `${ballSize}px`,
          height: `${ballSize * 0.3}px`,
        }}
      />

      {/* 값 변화 시각적 피드백 (파동 효과) */}
      {value !== previousValue && (
        <motion.div
          className="value-ripple"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            borderColor: ballColor,
          }}
        />
      )}
    </div>
  )
}

export default ValueBounce
