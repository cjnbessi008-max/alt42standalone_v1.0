import { useState } from 'react'
import './ControlPanel.css'
import { ProblemData } from '../types'

interface ControlPanelProps {
  problemData: ProblemData
  onValueChange: (value: number) => void
}

/**
 * 제어 패널 컴포넌트
 * LMS 데이터 시뮬레이션 및 값 조정
 */
const ControlPanel = ({ problemData, onValueChange }: ControlPanelProps) => {
  const [inputValue, setInputValue] = useState(problemData.currentValue.toString())

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    onValueChange(value)
    setInputValue(value.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const value = parseInt(inputValue)
    if (!isNaN(value)) {
      const clampedValue = Math.max(
        problemData.minValue,
        Math.min(problemData.maxValue, value)
      )
      onValueChange(clampedValue)
      setInputValue(clampedValue.toString())
    } else {
      setInputValue(problemData.currentValue.toString())
    }
  }

  const handlePreset = (preset: 'min' | 'low' | 'mid' | 'high' | 'max') => {
    const range = problemData.maxValue - problemData.minValue
    let value: number

    switch (preset) {
      case 'min':
        value = problemData.minValue
        break
      case 'low':
        value = problemData.minValue + Math.floor(range * 0.25)
        break
      case 'mid':
        value = problemData.minValue + Math.floor(range * 0.5)
        break
      case 'high':
        value = problemData.minValue + Math.floor(range * 0.75)
        break
      case 'max':
        value = problemData.maxValue
        break
    }

    onValueChange(value)
    setInputValue(value.toString())
  }

  return (
    <div className="control-panel">
      <h2>LMS 데이터 시뮬레이션</h2>
      <p className="description">
        Moodle에서 받아온 문제 정보를 시뮬레이션합니다.
        값을 조정하여 Value Heat 기능을 테스트하세요.
      </p>

      <div className="control-section">
        <label htmlFor="value-slider">현재 값 조정</label>
        <div className="slider-container">
          <input
            id="value-slider"
            type="range"
            min={problemData.minValue}
            max={problemData.maxValue}
            value={problemData.currentValue}
            onChange={handleSliderChange}
            className="value-slider"
          />
          <div className="slider-labels">
            <span>{problemData.minValue}</span>
            <span>{problemData.maxValue}</span>
          </div>
        </div>
      </div>

      <div className="control-section">
        <label htmlFor="value-input">직접 입력</label>
        <input
          id="value-input"
          type="number"
          min={problemData.minValue}
          max={problemData.maxValue}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="value-input"
        />
      </div>

      <div className="control-section">
        <label>빠른 설정</label>
        <div className="preset-buttons">
          <button onClick={() => handlePreset('min')} className="preset-btn min">
            최소
          </button>
          <button onClick={() => handlePreset('low')} className="preset-btn low">
            낮음
          </button>
          <button onClick={() => handlePreset('mid')} className="preset-btn mid">
            중간
          </button>
          <button onClick={() => handlePreset('high')} className="preset-btn high">
            높음
          </button>
          <button onClick={() => handlePreset('max')} className="preset-btn max">
            최대
          </button>
        </div>
      </div>

      <div className="info-section">
        <h3>문제 정보</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-key">문제 ID:</span>
            <span className="info-val">{problemData.id}</span>
          </div>
          <div className="info-item">
            <span className="info-key">제목:</span>
            <span className="info-val">{problemData.title}</span>
          </div>
          <div className="info-item">
            <span className="info-key">유형:</span>
            <span className="info-val">{problemData.type}</span>
          </div>
          <div className="info-item">
            <span className="info-key">현재 값:</span>
            <span className="info-val">{problemData.currentValue}</span>
          </div>
          {problemData.targetValue && (
            <div className="info-item">
              <span className="info-key">목표 값:</span>
              <span className="info-val">{problemData.targetValue}</span>
            </div>
          )}
        </div>
      </div>

      <div className="api-info">
        <h4>Moodle API 연동 정보</h4>
        <code className="api-endpoint">
          GET /webservice/rest/server.php
          <br />
          wsfunction=mod_quiz_get_attempt_data
        </code>
        <p className="api-note">
          실제 환경에서는 Moodle REST API를 통해 실시간으로 데이터를 받아옵니다.
        </p>
      </div>
    </div>
  )
}

export default ControlPanel
