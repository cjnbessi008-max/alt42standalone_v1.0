import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import CardAlbumPage from './pages/CardAlbumPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/album" element={<CardAlbumPage />} />
      </Routes>
    </Router>
  );
}

export default App;
