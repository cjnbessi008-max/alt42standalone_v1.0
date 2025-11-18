import { useEffect } from 'react'
import { useAppStore } from './hooks/useAppStore'
import TriangleCanvas from './components/TriangleCanvas'
import ControlPanel from './components/ControlPanel'
import FeedbackPanel from './components/FeedbackPanel'
import './styles/App.css'

function App() {
  const { loadProblem, currentProblem } = useAppStore()

  useEffect(() => {
    // Load problem from URL params or fetch from API
    const params = new URLSearchParams(window.location.search)
    const problemId = params.get('problemId')
    const moodleToken = params.get('token')

    if (problemId) {
      loadProblem(problemId, moodleToken || undefined)
    }
  }, [loadProblem])

  if (!currentProblem) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>삼각형 닮음 - 확대/축소</h1>
        <p className="problem-title">{currentProblem.title}</p>
      </header>

      <main className="app-main">
        <div className="canvas-section">
          <TriangleCanvas />
        </div>

        <div className="control-section">
          <ControlPanel />
          <FeedbackPanel />
        </div>
      </main>
    </div>
  )
}

export default App
