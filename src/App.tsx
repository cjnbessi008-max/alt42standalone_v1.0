import { useState } from 'react'
import VirtualSmartphone from './components/VirtualSmartphone'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="main-content">
        <h1 className="title">벡터 연산 학습 모듈</h1>
        <p className="subtitle">Vector Operation Learning Module</p>
      </div>
      <VirtualSmartphone />
    </div>
  )
}

export default App
