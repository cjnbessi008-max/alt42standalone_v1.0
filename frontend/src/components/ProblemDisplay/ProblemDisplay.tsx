import React from 'react';
import { ParsedProblem } from '../../types';
import { InlineMath, BlockMath } from 'react-katex';

interface Props {
  problem: ParsedProblem;
}

export const ProblemDisplay: React.FC<Props> = ({ problem }) => {
  // Render text with LaTeX equations
  const renderTextWithMath = (text: string) => {
    // Simple parser for inline and display math
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Match $...$ or $$...$$
    const mathRegex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let match;

    while ((match = mathRegex.exec(text)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add math (display or inline)
      if (match[1]) {
        // Display math $$...$$
        parts.push(<BlockMath key={match.index} math={match[1]} />);
      } else if (match[2]) {
        // Inline math $...$
        parts.push(<InlineMath key={match.index} math={match[2]} />);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multichoice: '객관식',
      truefalse: '참/거짓',
      numerical: '수치형',
      essay: '서술형',
      shortanswer: '단답형',
      calculated: '계산형',
      custom: '사용자 정의',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      multichoice: 'bg-blue-100 text-blue-700',
      truefalse: 'bg-green-100 text-green-700',
      numerical: 'bg-purple-100 text-purple-700',
      essay: 'bg-yellow-100 text-yellow-700',
      shortanswer: 'bg-pink-100 text-pink-700',
      calculated: 'bg-indigo-100 text-indigo-700',
      custom: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Problem Type Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
            problem.type
          )}`}
        >
          {getTypeLabel(problem.type)}
        </span>
        {problem.id > 0 && (
          <span className="text-xs text-gray-500">ID: {problem.id}</span>
        )}
      </div>

      {/* Question Text */}
      <div className="prose prose-sm max-w-none">
        <div
          className="text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: problem.questionText }}
        />
      </div>

      {/* Equations (if any) */}
      {problem.equations && problem.equations.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">주요 수식:</h4>
          <div className="space-y-2">
            {problem.equations.map((eq, idx) => (
              <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                <BlockMath math={eq} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Choices (if multiple choice) */}
      {problem.choices && problem.choices.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-600">선택지:</h4>
          {problem.choices.map((choice, idx) => (
            <div
              key={choice.id}
              className={`p-3 rounded-lg border ${
                choice.isCorrect
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold mr-2">
                  {String.fromCharCode(65 + idx)}
                </span>
                <p className="text-sm text-gray-700 flex-1">
                  {renderTextWithMath(choice.text)}
                </p>
                {choice.isCorrect && (
                  <span className="ml-2 text-green-600 text-xs font-semibold">
                    ✓ 정답
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
