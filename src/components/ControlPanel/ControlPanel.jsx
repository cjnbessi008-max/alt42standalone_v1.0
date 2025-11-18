import React, { useState } from 'react'
import './ControlPanel.css'

const ControlPanel = ({ onValueChange, problemData }) => {
  const [inputValue, setInputValue] = useState(0)
  const [selectedFunction, setSelectedFunction] = useState('x2')

  const presetValues = [1, 2, 5, 10, 15, 20, 25, 30]

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setInputValue(value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const calculatedValue = calculateFunction(inputValue, selectedFunction)
    onValueChange(calculatedValue)
  }

  const handlePresetClick = (value) => {
    setInputValue(value)
    const calculatedValue = calculateFunction(value, selectedFunction)
    onValueChange(calculatedValue)
  }

  const handleRandomValue = () => {
    const randomValue = Math.floor(Math.random() * 50)
    setInputValue(randomValue)
    const calculatedValue = calculateFunction(randomValue, selectedFunction)
    onValueChange(calculatedValue)
  }

  const calculateFunction = (x, funcType) => {
    switch (funcType) {
      case 'x2':
        return x * x
      case 'x':
        return x
      case '2x':
        return 2 * x
      case 'sqrt':
        return Math.sqrt(Math.abs(x))
      case 'abs':
        return Math.abs(x)
      default:
        return x
    }
  }

  const getFunctionLabel = (funcType) => {
    switch (funcType) {
      case 'x2':
        return 'f(x) = x²'
      case 'x':
        return 'f(x) = x'
      case '2x':
        return 'f(x) = 2x'
      case 'sqrt':
        return 'f(x) = √|x|'
      case 'abs':
        return 'f(x) = |x|'
      default:
        return 'f(x) = x'
    }
  }

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h2>함수 선택</h2>
        <div className="function-selector">
          {['x2', 'x', '2x', 'sqrt', 'abs'].map((func) => (
            <button
              key={func}
              className={`function-btn ${selectedFunction === func ? 'active' : ''}`}
              onClick={() => setSelectedFunction(func)}
            >
              {getFunctionLabel(func)}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h2>값 입력</h2>
        <form onSubmit={handleSubmit} className="value-input-form">
          <div className="input-group">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              className="value-input"
              placeholder="x 값을 입력하세요"
              step="0.1"
            />
            <button type="submit" className="submit-btn">
              계산하기
            </button>
          </div>
        </form>
      </div>

      <div className="panel-section">
        <h2>미리 설정된 값</h2>
        <div className="preset-values">
          {presetValues.map((value) => (
            <button
              key={value}
              className="preset-btn"
              onClick={() => handlePresetClick(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <button className="random-btn" onClick={handleRandomValue}>
          🎲 랜덤 값 생성
        </button>
      </div>

      <div className="panel-section info-section">
        <h3>💡 사용 방법</h3>
        <ul>
          <li>함수를 선택하세요</li>
          <li>x 값을 입력하거나 미리 설정된 값을 클릭하세요</li>
          <li>우측 하단 스마트폰 화면에서 공이 튀는 애니메이션을 확인하세요</li>
          <li>값이 클수록 공이 더 높이 튀고, 색상도 변합니다</li>
        </ul>
      </div>
    </div>
  )
}

export default ControlPanel
