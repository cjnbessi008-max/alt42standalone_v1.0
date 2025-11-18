import { useState, useEffect } from 'react'
import SmartphoneSimulator from './components/SmartphoneSimulator'
import FluidGeometry from './components/FluidGeometry'
import './App.css'

interface ProblemData {
  id: number
  title: string
  description: string
  shapeType: 'triangle' | 'rectangle' | 'circle' | 'polygon'
}

function App() {
  const [currentProblem, setCurrentProblem] = useState<ProblemData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching problem from Moodle LMS
    // In production, this would call the Moodle API
    const fetchProblemFromLMS = async () => {
      try {
        // Simulated API call to Moodle
        setTimeout(() => {
          setCurrentProblem({
            id: 1,
            title: '도형의 성질 이해하기',
            description: '도형이 변형되어도 유지되는 성질을 관찰하세요',
            shapeType: 'triangle'
          })
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Failed to fetch problem from LMS:', error)
        setIsLoading(false)
      }
    }

    fetchProblemFromLMS()
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🧮 KAIST Touch Math Academy</h1>
        <p>AI 교육 시스템 - Fluid Geometry</p>
      </header>

      <main className="app-main">
        <div className="desktop-view">
          <div className="info-panel">
            <h2>Fluid Geometry 시뮬레이션</h2>
            <p>도형이 물처럼 흐르면서도 기하학적 성질을 유지하는 것을 관찰하세요.</p>

            {currentProblem && (
              <div className="problem-info">
                <h3>{currentProblem.title}</h3>
                <p>{currentProblem.description}</p>
              </div>
            )}

            <div className="controls-info">
              <h4>📱 조작 방법:</h4>
              <ul>
                <li>클릭/터치: 도형과 상호작용</li>
                <li>드래그: 도형 이동</li>
                <li>흔들기: 유체 효과 활성화</li>
              </ul>
            </div>

            <div className="educational-content">
              <h4>🎓 학습 목표:</h4>
              <ul>
                <li>도형의 불변 성질 이해</li>
                <li>기하학적 변환 관찰</li>
                <li>면적, 둘레, 각도 보존 확인</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Smartphone Simulator - Bottom Right */}
        <SmartphoneSimulator>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#666'
            }}>
              <p>문제 불러오는 중...</p>
            </div>
          ) : (
            <FluidGeometry problemData={currentProblem} />
          )}
        </SmartphoneSimulator>
      </main>
    </div>
  )
}

export default App
