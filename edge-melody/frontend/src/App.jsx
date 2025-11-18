import React, { useState, useEffect } from 'react'
import PhoneFrame from './components/PhoneFrame'
import EdgeMelodyViewer from './components/EdgeMelodyViewer'
import QuestionPanel from './components/QuestionPanel'
import { getQuestions, getQuestionEdgeMelody } from './services/api'
import './App.css'

function App() {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [edgeMelodyData, setEdgeMelodyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 문제 목록 로드
  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await getQuestions()
      setQuestions(data)

      // 첫 번째 문제 자동 선택
      if (data.length > 0) {
        loadQuestion(data[0].id)
      }
    } catch (err) {
      setError('문제를 불러오는데 실패했습니다: ' + err.message)
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestion = async (questionId) => {
    try {
      const data = await getQuestionEdgeMelody(questionId)
      setCurrentQuestion(data.question)
      setEdgeMelodyData(data.visualization)
    } catch (err) {
      setError('문제 상세 정보를 불러오는데 실패했습니다: ' + err.message)
      console.error('Failed to load question:', err)
    }
  }

  const handleQuestionSelect = (questionId) => {
    loadQuestion(questionId)
  }

  if (loading) {
    return (
      <div className="app loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-message">
          <h2>⚠️ 오류 발생</h2>
          <p>{error}</p>
          <button onClick={loadQuestions}>다시 시도</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Edge Melody</h1>
        <p>3D 시각화 학습 시스템</p>
      </header>

      <div className="app-content">
        {/* 문제 선택 패널 */}
        <QuestionPanel
          questions={questions}
          currentQuestion={currentQuestion}
          onSelectQuestion={handleQuestionSelect}
        />

        {/* 우측 하단 스마트폰 화면 */}
        <PhoneFrame>
          <EdgeMelodyViewer
            questionData={currentQuestion}
            visualizationData={edgeMelodyData}
          />
        </PhoneFrame>
      </div>
    </div>
  )
}

export default App
