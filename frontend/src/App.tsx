import { useState } from 'react'
import SlopeDragGraph from './components/SlopeDragGraph'
import MobileFrame from './components/MobileFrame'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📐 Slope Drag - 기울기 학습</h1>
        <p>그래프의 점을 드래그하여 기울기를 실시간으로 확인하세요</p>
      </header>

      <div className="content-layout">
        <div className="desktop-view">
          <div className="instructions">
            <h2>사용 방법</h2>
            <ul>
              <li>🔴 빨간 점 또는 🔵 파란 점을 드래그하세요</li>
              <li>실시간으로 기울기가 계산됩니다</li>
              <li>기울기 = (y₂ - y₁) / (x₂ - x₁)</li>
            </ul>
          </div>
          <SlopeDragGraph />
        </div>

        <div className="mobile-preview">
          <h3>📱 모바일 미리보기</h3>
          <MobileFrame>
            <SlopeDragGraph isMobile={true} />
          </MobileFrame>
        </div>
      </div>
    </div>
  )
}

export default App
