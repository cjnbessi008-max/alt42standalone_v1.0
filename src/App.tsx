import { useState, useEffect } from 'react';
import { Formula } from './types';
import { FormulaUpload } from './components/FormulaUpload';
import { LearningFlow } from './components/LearningFlow';
import { StatsDashboard } from './components/StatsDashboard';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // 다크 모드 초기화 (localStorage에서 불러오기)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 다크 모드 토글
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFormulaSelect = (formula: Formula) => {
    setSelectedFormula(formula);
  };

  const handleRestart = () => {
    setSelectedFormula(null);
  };

  const handleComplete = () => {
    console.log('학습 완료');
  };

  const handleViewStats = () => {
    setShowStats(true);
  };

  const handleCloseStats = () => {
    setShowStats(false);
  };

  return (
    <div className="relative">
      {/* 다크 모드 토글 버튼 (고정) */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
        aria-label="다크 모드 토글"
      >
        {darkMode ? '🌙' : '☀️'}
      </button>

      {/* 메인 컨텐츠 */}
      {!selectedFormula ? (
        <FormulaUpload onFormulaSelect={handleFormulaSelect} onViewStats={handleViewStats} />
      ) : (
        <LearningFlow
          formula={selectedFormula}
          onComplete={handleComplete}
          onRestart={handleRestart}
        />
      )}

      {/* 통계 대시보드 (모달) */}
      <AnimatePresence>
        {showStats && <StatsDashboard onClose={handleCloseStats} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
