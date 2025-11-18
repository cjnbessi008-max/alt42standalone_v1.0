import { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { RecurrenceWave } from './components/RecurrenceWave';
import { ControlPanel } from './components/ControlPanel';
import { RecurrenceProblem, RecurrenceTree } from './types/recurrence';
import { recurrenceProblems } from './utils/recurrenceProblems';
import './App.css';

function App() {
  const [selectedProblem, setSelectedProblem] = useState<RecurrenceProblem>(recurrenceProblems[0]);
  const [inputValue, setInputValue] = useState(5);
  const [tree, setTree] = useState<RecurrenceTree | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [speed, setSpeed] = useState(0.05);

  // 문제나 입력값이 변경되면 트리 재계산
  useEffect(() => {
    const newTree = selectedProblem.calculate(inputValue);
    setTree(newTree);
  }, [selectedProblem, inputValue]);

  const handleProblemChange = (problem: RecurrenceProblem) => {
    setSelectedProblem(problem);
    setIsAnimating(true);
  };

  const handleInputChange = (value: number) => {
    setInputValue(value);
    setIsAnimating(true);
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  return (
    <div className="app">
      <div className="main-content">
        <ControlPanel
          selectedProblem={selectedProblem}
          onProblemChange={handleProblemChange}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          isAnimating={isAnimating}
          onToggleAnimation={toggleAnimation}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      <SmartphoneFrame>
        {tree && (
          <RecurrenceWave
            tree={tree}
            isAnimating={isAnimating}
            speed={speed}
          />
        )}
      </SmartphoneFrame>
    </div>
  );
}

export default App;
