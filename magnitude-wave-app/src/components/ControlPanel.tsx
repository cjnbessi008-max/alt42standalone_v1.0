import React, { useState } from 'react';

interface ControlPanelProps {
  magnitude: number;
  onMagnitudeChange: (value: number) => void;
}

interface Problem {
  id: number;
  question: string;
  answer: number;
  subject: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  magnitude,
  onMagnitudeChange,
}) => {
  const [inputValue, setInputValue] = useState(magnitude.toString());
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Simulate LMS/Moodle problems data
  const mockProblems: Problem[] = [
    { id: 1, question: '5 + 3 = ?', answer: 8, subject: '덧셈' },
    { id: 2, question: '12 - 7 = ?', answer: 5, subject: '뺄셈' },
    { id: 3, question: '6 × 4 = ?', answer: 24, subject: '곱셈' },
    { id: 4, question: '20 ÷ 2 = ?', answer: 10, subject: '나눗셈' },
    { id: 5, question: '15 + 25 = ?', answer: 40, subject: '덧셈' },
    { id: 6, question: '100 - 37 = ?', answer: 63, subject: '뺄셈' },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onMagnitudeChange(value);
    setInputValue(value.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onMagnitudeChange(numValue);
    }
  };

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    onMagnitudeChange(problem.answer);
    setInputValue(problem.answer.toString());
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Manual Input Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          수동 입력
        </h3>

        <div className="space-y-4">
          {/* Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              크기 조절 (슬라이더)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={magnitude}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              직접 입력 (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* LMS Data Simulation Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          LMS 연동 시뮬레이션 (Moodle)
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>📚 LMS 정보:</strong> 아래 문제 목록은 Moodle에서 가져온
            데이터를 시뮬레이션합니다.
          </p>
        </div>

        {selectedProblem && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800">
              선택된 문제: {selectedProblem.question}
            </p>
            <p className="text-sm text-green-700">
              답: {selectedProblem.answer} ({selectedProblem.subject})
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mockProblems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleProblemSelect(problem)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                selectedProblem?.id === problem.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    {problem.question}
                  </p>
                  <p className="text-xs text-gray-500">{problem.subject}</p>
                </div>
                <span className="text-lg font-bold text-indigo-600">
                  {problem.answer}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Value Display */}
      <div className="border-t pt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">현재 표시 중인 크기</p>
          <p className="text-4xl font-bold text-indigo-600">
            {magnitude.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};
