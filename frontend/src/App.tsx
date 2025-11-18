import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { PuzzleGame } from './components/PuzzleGame';
import { SmartphoneSimulator } from './components/SmartphoneSimulator';
import { Problem } from './types';

// 샘플 문제 데이터
const sampleProblem: Problem = {
  id: 1,
  title: '합성함수 만들기',
  description: 'f(g(x))를 만들어보세요. 여기서 f(x) = x + 2, g(x) = 2x 입니다.',
  availableFunctions: ['f1', 'g1', 'h1', 'k1'],
  targetComposition: 'f(g(x))',
  testCases: [
    { input: 0, expectedOutput: 2 }, // f(g(0)) = f(0) = 2
    { input: 1, expectedOutput: 4 }, // f(g(1)) = f(2) = 4
    { input: 2, expectedOutput: 6 }, // f(g(2)) = f(4) = 6
    { input: 3, expectedOutput: 8 }, // f(g(3)) = f(6) = 8
    { input: -1, expectedOutput: 0 }, // f(g(-1)) = f(-2) = 0
  ],
  maxAttempts: 5,
  timeLimit: 600, // 10분
};

function App() {
  const { setProblem, setLTISession } = useStore();

  useEffect(() => {
    // URL 파라미터에서 LTI 세션 정보 확인
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    const userName = params.get('user_name');
    const problemId = params.get('problem_id');

    if (userId && userName) {
      setLTISession({
        userId,
        userName,
        courseId: params.get('context_id') || '',
        resourceLinkId: params.get('resource_link_id') || '',
        lisOutcomeServiceUrl: params.get('lis_outcome_service_url') || undefined,
        lisResultSourcedId: params.get('lis_result_sourcedid') || undefined,
      });
    }

    // 문제 로드 (실제로는 API에서 가져옴)
    if (problemId) {
      // TODO: API에서 문제 가져오기
      fetch(`/api/problems/${problemId}`)
        .then((res) => res.json())
        .then((problem) => setProblem(problem))
        .catch(() => {
          // 실패시 샘플 문제 사용
          setProblem(sampleProblem);
        });
    } else {
      // 개발 모드: 샘플 문제 사용
      setProblem(sampleProblem);
    }
  }, [setProblem, setLTISession]);

  return (
    <>
      {/* 메인 화면 */}
      <PuzzleGame />

      {/* 스마트폰 시뮬레이터 (우측 하단) */}
      <SmartphoneSimulator>
        <div className="p-4">
          <PuzzleGame />
        </div>
      </SmartphoneSimulator>
    </>
  );
}

export default App;
