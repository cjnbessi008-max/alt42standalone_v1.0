import React, { useState, useEffect } from 'react'
import VirtualDevice from './components/VirtualDevice/VirtualDevice'
import DivisionProblem from './components/DivisionProblem/DivisionProblem'
import './styles/App.css'

function App() {
  const [problem, setProblem] = useState(null)
  const [problems, setProblems] = useState([])

  useEffect(() => {
    // Fetch initial problem from LMS/API
    fetchProblem()
  }, [])

  const fetchProblem = async () => {
    try {
      // This will connect to Moodle/LMS API
      const response = await fetch('/api/problems/next')
      const data = await response.json()
      setProblem(data)
    } catch (error) {
      // Fallback to demo problem if API not available
      setProblem({
        id: 1,
        dividend: 10,
        divisor: 3,
        type: 'division',
        showShadow: true // Indivisible case
      })
    }
  }

  const handleAnswer = (answer) => {
    console.log('Student answer:', answer)
    // Send answer to LMS/API
    // Fetch next problem
    fetchProblem()
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Impossible Shadow - Division Learning</h1>
        <p>나눌 수 없는 경우는 그림자 효과로 표시됩니다</p>
      </header>

      <main className="app-main">
        <VirtualDevice>
          {problem && (
            <DivisionProblem
              problem={problem}
              onAnswer={handleAnswer}
            />
          )}
        </VirtualDevice>
      </main>

      <footer className="app-footer">
        <p>Moodle 3.7 Integration | MySQL 5.7 | PHP 7.1.9</p>
      </footer>
    </div>
  )
}

export default App
