import { useState } from 'react'
import SmartphoneScreen from './components/SmartphoneScreen'
import { ProblemData } from './types'

// Mock Moodle data
const mockProblemData: ProblemData = {
  id: 1,
  title: '함수의 변곡점 찾기',
  description: '주어진 3차 함수의 변곡점을 찾으세요',
  equation: 'f(x) = x³ - 3x² + 2',
  inflectionPoints: [{ x: 1, y: 0 }]
}

function App() {
  const [problemData] = useState<ProblemData>(mockProblemData)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎓 수학 학습 시스템</h1>
        <p>Moodle LMS 연동 - 변곡점 학습</p>
      </header>

      <main className="app-main">
        <div className="content-area">
          <div className="problem-info">
            <h2>{problemData.title}</h2>
            <p>{problemData.description}</p>
            <div className="equation">
              <strong>함수:</strong> {problemData.equation}
            </div>
          </div>
        </div>

        {/* Virtual smartphone screen - bottom right */}
        <SmartphoneScreen problemData={problemData} />
      </main>
    </div>
  )
}

export default App
