import { useQuizStore } from './stores/quizStore';
import { useFocusResetStore } from './stores/focusResetStore';
import { Dashboard } from './components/dashboard/Dashboard';
import { QuizContainer } from './components/quiz/QuizContainer';
import { Button } from './components/common/Button';

function App() {
  const { session, startQuiz, resetQuiz } = useQuizStore();
  const { resetQuestionCount } = useFocusResetStore();

  const handleStartQuiz = () => {
    resetQuestionCount();
    startQuiz();
  };

  const handleBackToDashboard = () => {
    resetQuiz();
    resetQuestionCount();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🧠</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Focus Reset
                </h1>
                <p className="text-sm text-gray-600">
                  머리정리 학습 웹앱
                </p>
              </div>
            </div>

            {session && !session.endTime && (
              <Button variant="outline" onClick={handleBackToDashboard}>
                대시보드로 돌아가기
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        {!session || session.endTime ? (
          <Dashboard onStartQuiz={handleStartQuiz} />
        ) : (
          <QuizContainer />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 Focus Reset - 독립형 학습 웹앱</p>
            <p className="mt-2">
              💡 규칙적인 휴식으로 학습 효율을 높여보세요
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
