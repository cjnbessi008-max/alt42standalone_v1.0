import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MathGraph from './MathGraph'
import { ProblemData, Point } from '../types'
import './SmartphoneScreen.css'

interface SmartphoneScreenProps {
  problemData: ProblemData
}

const SmartphoneScreen = ({ problemData }: SmartphoneScreenProps) => {
  const [tiltAngle, setTiltAngle] = useState(0)
  const [isAtInflection, setIsAtInflection] = useState(false)

  const handleInflectionDetected = (point: Point) => {
    console.log('Inflection point detected:', point)
    setIsAtInflection(true)

    // Calculate tilt angle based on position (-5 to 5 degrees)
    const angle = (point.x % 2 === 0) ? 3 : -3
    setTiltAngle(angle)

    // Reset tilt after animation
    setTimeout(() => {
      setTiltAngle(0)
      setIsAtInflection(false)
    }, 1500)
  }

  return (
    <motion.div
      className="smartphone-container"
      animate={{
        rotateZ: tiltAngle,
        scale: isAtInflection ? 1.05 : 1
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: 0.6
      }}
    >
      <div className="smartphone-frame">
        {/* Phone notch */}
        <div className="phone-notch"></div>

        {/* Screen content */}
        <div className="phone-screen">
          <div className="screen-header">
            <div className="status-bar">
              <span>9:41</span>
              <span>📶 🔋</span>
            </div>
            <h3>수학 그래프</h3>
          </div>

          <div className="screen-content">
            <MathGraph
              problemData={problemData}
              onInflectionDetected={handleInflectionDetected}
            />
          </div>

          {isAtInflection && (
            <motion.div
              className="inflection-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ⚡ 변곡점 발견!
            </motion.div>
          )}
        </div>

        {/* Home indicator */}
        <div className="phone-home-indicator"></div>
      </div>
    </motion.div>
  )
}

export default SmartphoneScreen
