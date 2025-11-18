import React, { useState } from 'react'
import VirtualSmartphone from './components/VirtualSmartphone/VirtualSmartphone'
import ControlPanel from './components/ControlPanel/ControlPanel'
import './App.css'

function App() {
  const [functionValue, setFunctionValue] = useState(0)
  const [problemData, setProblemData] = useState({
    title: '함수 값 변화 관찰',
    description: 'f(x) = x² 함수의 값 변화를 공의 튀김으로 표현합니다.',
    functionName: 'f(x) = x²'
  })

  const handleValueChange = (newValue) => {
    setFunctionValue(newValue)
  }

  return (
    <div className="app">
      <div className="main-content">
        <h1>Alt42 - Value Bounce Demo</h1>
        <ControlPanel
          onValueChange={handleValueChange}
          problemData={problemData}
        />
      </div>

      <VirtualSmartphone
        value={functionValue}
        problemData={problemData}
      />
    </div>
  )
}

export default App
