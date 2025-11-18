import { ParabolaCanvas } from './components/ParabolaCanvas';
import { ControlPanel } from './components/ControlPanel';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Visual Quadratic</h1>
        <p>이차방정식의 포물선을 움직이며 근의 의미를 체감하세요</p>
      </header>

      <main className="app-main">
        <div className="desktop-view">
          <div className="canvas-section">
            <ParabolaCanvas width={600} height={600} />
          </div>
          <div className="controls-section">
            <ControlPanel />
          </div>
        </div>
      </main>

      {/* Smartphone view in bottom right */}
      <SmartphoneFrame>
        <div className="mobile-content">
          <h2 style={{ color: '#00ff88', fontSize: '18px', marginBottom: '10px' }}>
            Visual Quadratic
          </h2>
          <ParabolaCanvas width={280} height={280} />
          <div style={{ marginTop: '10px', color: '#fff', fontSize: '12px' }}>
            <ControlPanel />
          </div>
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
