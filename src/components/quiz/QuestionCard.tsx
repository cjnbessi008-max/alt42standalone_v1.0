import React, { useState } from 'react';
import { Question } from '../../types';
import { Button } from '../common/Button';

interface QuestionCardProps {
  question: Question;
  onSubmit: (answer: string | number) => void;
  isAnswered: boolean;
  showExplanation: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSubmit,
  isAnswered,
  showExplanation
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    onSubmit(selectedAnswer);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  const renderOptions = () => {
    if (question.type === 'multiple-choice') {
      return (
        <div className="space-y-3">
          {question.options?.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrectness = isAnswered && showExplanation;

            return (
              <button
                key={index}
                onClick={() => !isAnswered && setSelectedAnswer(index)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected && !showCorrectness
                    ? 'border-primary-500 bg-primary-50'
                    : showCorrectness && isCorrect
                    ? 'border-green-500 bg-green-50'
                    : showCorrectness && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-primary-300'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      isSelected && !showCorrectness
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : showCorrectness && isCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : showCorrectness && isSelected && !isCorrect
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-400'
                    }`}
                  >
                    {showCorrectness && isCorrect && '✓'}
                    {showCorrectness && isSelected && !isCorrect && '✗'}
                    {!showCorrectness && isSelected && '●'}
                  </div>
                  <span className="flex-1 text-lg">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'true-false') {
      return (
        <div className="grid grid-cols-2 gap-4">
          {['맞음', '틀림'].map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrectness = isAnswered && showExplanation;

            return (
              <button
                key={index}
                onClick={() => !isAnswered && setSelectedAnswer(index)}
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 text-xl font-bold transition-all ${
                  isSelected && !showCorrectness
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : showCorrectness && isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : showCorrectness && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-primary-300'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-700">{question.title}</h3>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
              question.difficulty
            )}`}
          >
            {getDifficultyText(question.difficulty)}
          </span>
          {question.category && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {question.category}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="text-2xl font-medium text-gray-800 leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="mb-6">{renderOptions()}</div>

      {/* Submit Button */}
      {!isAnswered && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
        >
          답안 제출
        </Button>
      )}

      {/* Explanation */}
      {isAnswered && showExplanation && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            selectedAnswer === question.correctAnswer
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {selectedAnswer === question.correctAnswer ? '🎉' : '💡'}
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">
                {selectedAnswer === question.correctAnswer
                  ? '정답입니다!'
                  : '아쉽네요!'}
              </h4>
              {question.explanation && (
                <p className="text-gray-700">{question.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
