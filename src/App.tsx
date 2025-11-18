import { useState } from 'react'
import './App.css'
import SmartphoneSimulator from './components/SmartphoneSimulator'
import DragToGraphApp from './components/DragToGraphApp'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📱 Drag to Graph - Interactive Learning</h1>
        <p>수열의 항을 드래그하여 그래프를 완성하세요</p>
      </header>

      <main className="app-main">
        <div className="instruction-panel">
          <h2>학습 안내</h2>
          <ol>
            <li>왼쪽의 수열 항들을 확인하세요</li>
            <li>각 항을 그래프의 올바른 위치로 드래그하세요</li>
            <li>모든 점을 올바르게 배치하면 성공!</li>
          </ol>
        </div>

        {/* 우측 하단 스마트폰 시뮬레이터 */}
        <SmartphoneSimulator>
          <DragToGraphApp />
        </SmartphoneSimulator>
      </main>
    </div>
  )
}

export default App
