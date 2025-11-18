import { useState } from 'react'
import './App.css'
import VirtualPhone from './components/VirtualPhone'
import ControlPanel from './components/ControlPanel'
import { ProblemData } from './types'

function App() {
  // 데모 데이터: LMS에서 받아올 문제 정보
  const [problemData, setProblemData] = useState<ProblemData>({
    id: '1',
    title: '분수 덧셈 문제',
    currentValue: 50,
    minValue: 0,
    maxValue: 100,
    targetValue: 80,
    type: 'score'
  })

  const handleValueChange = (newValue: number) => {
    setProblemData(prev => ({
      ...prev,
      currentValue: newValue
    }))
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Alt42 - LMS Value Heat System</h1>
        <p>Moodle 3.7 연동 | MySQL 5.7 | PHP 7.1.9</p>
      </header>

      <main className="app-main">
        <div className="content-area">
          <ControlPanel
            problemData={problemData}
            onValueChange={handleValueChange}
          />
        </div>

        {/* 우측 하단 가상 스마트폰 화면 */}
        <VirtualPhone problemData={problemData} />
      </main>
    </div>
  )
}

export default App
