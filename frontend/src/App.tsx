import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileFrame from './components/MobileFrame';
import ProblemView from './components/ProblemView';
import ProblemList from './components/ProblemList';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Routes>
          <Route path="/" element={<ProblemList />} />
          <Route path="/problem/:problemId" element={
            <MobileFrame>
              <ProblemView />
            </MobileFrame>
          } />
          <Route path="/embed/:problemId" element={<ProblemView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
