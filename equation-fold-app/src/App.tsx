import { useState, useEffect } from 'react'
import EquationFold from './components/EquationFold/EquationFold'
import MobileView from './components/MobileView/MobileView'
import { EquationParser, exampleEquations } from './services/equationParser'
import { MoodleAPI } from './services/moodleAPI'
import { ProblemData } from './types/equation'
import './App.css'

function App() {
  const [problemData, setProblemData] = useState<ProblemData>({
    equation: '3(x + 2) + 2(x + 3)',
    steps: []
  })
  const [customEquation, setCustomEquation] = useState('')
  const [selectedExample, setSelectedExample] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // URL 파라미터에서 Moodle 연동 정보 확인
    const { problemId } = MoodleAPI.extractMoodleParams()

    if (problemId) {
      // Moodle에서 문제 가져오기 (실제 구현 시)
      // 현재는 모의 데이터 사용
      const mockProblem = MoodleAPI.getMockProblem(problemId)
      loadProblem(mockProblem.equation)
    } else {
      // 기본 예제 로드
      loadProblem(exampleEquations[0].equation)
    }
  }, [])

  const loadProblem = (equation: string) => {
    setIsLoading(true)
    try {
      const steps = EquationParser.parseAndSimplify(equation)
      setProblemData({
        equation,
        steps
      })
    } catch (error) {
      console.error('수식 처리 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleSelect = (index: number) => {
    setSelectedExample(index)
    loadProblem(exampleEquations[index].equation)
    setCustomEquation('')
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customEquation.trim()) {
      loadProblem(customEquation.trim())
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📐 Equation Fold</h1>
        <p>복잡한 수식을 층층이 접어 단순화하는 학습 도구</p>
      </header>

      <div className="app-controls">
        <div className="example-selector">
          <h3>예제 선택</h3>
          <div className="example-buttons">
            {exampleEquations.map((example, index) => (
              <button
                key={index}
                className={`example-btn ${selectedExample === index ? 'active' : ''}`}
                onClick={() => handleExampleSelect(index)}
              >
                <div className="example-title">{example.description}</div>
                <div className="example-equation">{example.equation}</div>
                <div className="example-difficulty">
                  난이도: {'⭐'.repeat(example.difficulty)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="custom-input">
          <h3>직접 입력하기</h3>
          <form onSubmit={handleCustomSubmit}>
            <input
              type="text"
              value={customEquation}
              onChange={(e) => setCustomEquation(e.target.value)}
              placeholder="예: 2(x + 3) + 4(x - 1)"
              className="equation-input"
            />
            <button type="submit" className="submit-btn">
              분석하기
            </button>
          </form>
          <div className="input-hint">
            💡 팁: 괄호와 사칙연산(+, -, *, /)을 사용할 수 있습니다
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">수식을 분석하는 중...</div>
      ) : (
        <div className="app-container">
          <div className="main-content">
            <EquationFold
              equation={problemData.equation}
              steps={problemData.steps}
            />
          </div>

          <div className="mobile-preview">
            <MobileView>
              <EquationFold
                equation={problemData.equation}
                steps={problemData.steps}
              />
            </MobileView>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>사용 방법</h4>
            <ul>
              <li>예제를 선택하거나 직접 수식을 입력하세요</li>
              <li>각 단계를 클릭하여 펼치거나 접을 수 있습니다</li>
              <li>화살표 버튼으로 단계별로 진행할 수 있습니다</li>
              <li>우측 스마트폰 화면에서 모바일 버전을 확인하세요</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Moodle LMS 연동</h4>
            <p>
              URL 파라미터로 문제를 받아올 수 있습니다:<br />
              <code>?problemid=123&studentid=456&token=xxx</code>
            </p>
          </div>
          <div className="footer-section">
            <h4>기술 스택</h4>
            <p>React 18 • TypeScript • Vite • Math.js</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
