import React, { useState, useEffect } from 'react'
import PhoneFrame from './components/PhoneFrame'
import EquaMap from './components/EquaMap'
import { fetchEquationFromMoodle } from './services/moodleApi'
import './App.css'

function App() {
  const [equation, setEquation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 데모용 샘플 방정식
  const demoEquation = {
    id: 1,
    expression: '2x + 5 = 3x - 7',
    type: 'linear',
    title: '일차방정식 풀이'
  }

  useEffect(() => {
    // 초기 로드 시 데모 방정식 사용
    setEquation(demoEquation)
  }, [])

  const loadEquationFromMoodle = async (questionId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEquationFromMoodle(questionId)
      setEquation(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>EquaMap</h1>
        <p>방정식 구조 시각화 도구</p>
      </div>

      <div className="app-content">
        <PhoneFrame>
          {loading && <div className="loading">로딩 중...</div>}
          {error && <div className="error">{error}</div>}
          {equation && <EquaMap equation={equation} />}
        </PhoneFrame>
      </div>
    </div>
  )
}

export default App
