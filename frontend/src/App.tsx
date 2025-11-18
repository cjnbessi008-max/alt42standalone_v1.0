import React from 'react'
import BranchCountingModule from './features/TreeAnimations/BranchCountingModule'
import MobilePreview from './components/MobilePreview/MobilePreview'
import './styles/App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Alt42 - Branch Counting</h1>
        <p>나뭇가지를 세어보세요!</p>
      </header>

      <main className="app-main">
        <MobilePreview>
          <BranchCountingModule />
        </MobilePreview>
      </main>
    </div>
  )
}

export default App
