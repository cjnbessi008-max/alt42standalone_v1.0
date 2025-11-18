import { useState, useCallback } from 'react'
import SpringVisualizer from './components/SpringVisualizer'
import './styles/App.css'

function App() {
  const [number1, setNumber1] = useState<number>(5)
  const [number2, setNumber2] = useState<number>(8)
  const [showSpring, setShowSpring] = useState<boolean>(true)

  const handleNumber1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setNumber1(value)
      setShowSpring(false)
      setTimeout(() => setShowSpring(true), 50)
    }
  }, [])

  const handleNumber2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setNumber2(value)
      setShowSpring(false)
      setTimeout(() => setShowSpring(true), 50)
    }
  }, [])

  const distance = Math.abs(number2 - number1)
  const isPositive = number2 > number1

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Distance Spring</h1>
        <p className="subtitle">숫자 간 거리를 스프링으로 느껴보세요</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="number1">첫 번째 숫자</label>
            <input
              id="number1"
              type="number"
              value={number1}
              onChange={handleNumber1Change}
              step="0.1"
              aria-label="첫 번째 숫자 입력"
            />
          </div>

          <div className="arrow-indicator">
            <span className="arrow">{isPositive ? '→' : '←'}</span>
          </div>

          <div className="input-group">
            <label htmlFor="number2">두 번째 숫자</label>
            <input
              id="number2"
              type="number"
              value={number2}
              onChange={handleNumber2Change}
              step="0.1"
              aria-label="두 번째 숫자 입력"
            />
          </div>
        </div>

        <div className="result-section">
          <div className="distance-info">
            <span className="label">거리:</span>
            <span className="value">{distance.toFixed(1)}</span>
          </div>
        </div>

        <div className="visualizer-section">
          {showSpring && (
            <SpringVisualizer
              distance={distance}
              isPositive={isPositive}
              number1={number1}
              number2={number2}
            />
          )}
        </div>

        <div className="help-section">
          <p className="help-text">
            💡 두 숫자를 입력하면 그 차이만큼 스프링이 늘어나거나 줄어듭니다.
            <br />
            스프링의 길이로 숫자의 거리를 느껴보세요!
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>KAIST Touch Math Academy</p>
      </footer>
    </div>
  )
}

export default App
