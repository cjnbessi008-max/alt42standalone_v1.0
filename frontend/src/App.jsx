import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import StudentPracticeView from './pages/StudentPracticeView';
import './App.css';

/**
 * Main App Component
 */
function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <h1>🎓 AI 교육 시스템</h1>
              <p className="tagline">살짝만 더 해보자!</p>
            </div>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/practice/:moduleId" element={<StudentPracticeView />} />
              <Route
                path="/"
                element={
                  <div className="welcome-screen">
                    <h2>환영합니다!</h2>
                    <p>학습 모듈을 선택하여 연습을 시작하세요.</p>
                  </div>
                }
              />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>© 2025 KAIST Touch Math Academy - AI Education System</p>
          </footer>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
