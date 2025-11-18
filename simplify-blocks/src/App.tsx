import { SimplifyBlocks } from './components/SimplifyBlocks';
import { PhoneSimulator } from './components/PhoneSimulator';
import './App.css';

function App() {
  return (
    <div className="app">
      <main className="main-content">
        <SimplifyBlocks />
      </main>

      {/* 우측 하단 스마트폰 시뮬레이터 */}
      <PhoneSimulator>
        <SimplifyBlocks />
      </PhoneSimulator>
    </div>
  );
}

export default App;
