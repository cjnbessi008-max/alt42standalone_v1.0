import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useStore } from '../store/useStore';
import { FunctionBlock } from './FunctionBlock';
import { CompositionArea } from './CompositionArea';
import { Calculator } from './Calculator';
import { Send, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

export const PuzzleGame = () => {
  const {
    availableFunctions,
    composedFunctions,
    submissionResult,
    isLoading,
    error,
    addFunction,
    clearComposition,
    submitAnswer,
  } = useStore();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <header className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🧩 Composition Puzzle
            </h1>
            <p className="text-gray-600">
              함수를 조합하여 합성함수를 만들어보세요!
            </p>
          </header>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* 제출 결과 */}
          {submissionResult && (
            <div
              className={`border-2 rounded-lg p-6 ${
                submissionResult.success
                  ? 'bg-green-50 border-green-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {submissionResult.success ? (
                  <CheckCircle className="text-green-600" size={32} />
                ) : (
                  <XCircle className="text-yellow-600" size={32} />
                )}
                <h3 className="text-xl font-bold">
                  {submissionResult.success ? '정답입니다! 🎉' : '다시 시도해보세요'}
                </h3>
              </div>
              <div className="space-y-2">
                <p>
                  통과한 테스트:{' '}
                  <span className="font-bold">
                    {submissionResult.passedTests} / {submissionResult.totalTests}
                  </span>
                </p>
                <p>
                  점수: <span className="font-bold text-2xl">{submissionResult.score}점</span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 함수 팔레트 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">사용 가능한 함수</h3>
                <div className="space-y-3">
                  {availableFunctions.map((func) => (
                    <FunctionBlock
                      key={func.id}
                      func={func}
                      onAdd={() => addFunction(func.id)}
                    />
                  ))}
                </div>
              </div>

              <Calculator />
            </div>

            {/* 우측: 조립 영역 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <CompositionArea />

                {/* 버튼 */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => clearComposition()}
                    disabled={composedFunctions.length === 0}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    초기화
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={composedFunctions.length === 0 || isLoading}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        제출 중...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        답안 제출
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 도움말 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 사용 방법</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 함수를 클릭하거나 드래그하여 조립 영역에 추가하세요</li>
                  <li>• 조립된 함수는 드래그하여 순서를 바꿀 수 있습니다</li>
                  <li>• 계산기에서 입력값을 넣어 결과를 확인하세요</li>
                  <li>• 올바른 합성함수를 만들었다면 답안을 제출하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
