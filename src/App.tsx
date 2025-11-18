import { useState } from 'react';
import { Formula } from './types';
import { FormulaUpload } from './components/FormulaUpload';
import { LearningFlow } from './components/LearningFlow';

function App() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  const handleFormulaSelect = (formula: Formula) => {
    setSelectedFormula(formula);
  };

  const handleRestart = () => {
    setSelectedFormula(null);
  };

  const handleComplete = () => {
    // 학습 완료 시 추가 로직 (예: 통계 저장)
    console.log('학습 완료');
  };

  return (
    <>
      {!selectedFormula ? (
        <FormulaUpload onFormulaSelect={handleFormulaSelect} />
      ) : (
        <LearningFlow
          formula={selectedFormula}
          onComplete={handleComplete}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

export default App;
