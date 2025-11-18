import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemsAPI, solutionsAPI, analysisAPI, usersAPI } from '../services/api';
import { Problem } from '../types';

export default function SolutionSubmitPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<Array<{ step: number; type: string; content: string; explanation: string }>>([
    { step: 1, type: 'GIVEN', content: '', explanation: '' }
  ]);
  const [rawInput, setRawInput] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchProblem();
    fetchOrCreateDemoUser();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await problemsAPI.get(problemId!);
      setProblem(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrCreateDemoUser = async () => {
    try {
      // Try to get demo user
      const response = await usersAPI.getByUsername('demo_student');
      setUserId(response.data.id);
    } catch {
      // Create demo user if doesn't exist
      try {
        const createResponse = await usersAPI.create({
          username: 'demo_student',
          email: 'demo@student.local',
          full_name: 'Demo Student',
          role: 'student'
        });
        setUserId(createResponse.data.id);
      } catch (err) {
        console.error('Failed to create demo user:', err);
      }
    }
  };

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, type: 'CALCULATION', content: '', explanation: '' }]);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.step = i + 1;
    });
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create solution
      const solutionResponse = await solutionsAPI.create({
        problem_id: problemId,
        user_id: userId,
        submitted_steps: steps,
        raw_input: rawInput,
        time_spent_seconds: 0 // TODO: implement timer
      });

      const solutionId = solutionResponse.data.id;

      // Submit solution
      await solutionsAPI.submit(solutionId);

      // Trigger analysis
      await analysisAPI.analyze(solutionId);

      // Navigate to analysis results
      navigate(`/analysis/${solutionId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{problem?.title}</h1>
        <p className="text-gray-600 mb-6">{problem?.description}</p>

        <form onSubmit={handleSubmit}>
          {/* Raw Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전체 풀이 과정 (선택사항)
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="여기에 전체 풀이 과정을 자유롭게 작성하세요..."
            />
          </div>

          {/* Steps Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                단계별 풀이
              </label>
              <button
                type="button"
                onClick={addStep}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + 단계 추가
              </button>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">단계 {step.step}</span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <select
                      value={step.type}
                      onChange={(e) => updateStep(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="GIVEN">주어진 정보</option>
                      <option value="ASSUMPTION">가정</option>
                      <option value="CALCULATION">계산</option>
                      <option value="REASONING">추론</option>
                      <option value="CONCLUSION">결론</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={step.content}
                      onChange={(e) => updateStep(index, 'content', e.target.value)}
                      placeholder="단계 내용 (예: 2x + 5 = 13)"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={step.explanation}
                      onChange={(e) => updateStep(index, 'explanation', e.target.value)}
                      placeholder="설명 (선택사항)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '제출 중...' : '제출 및 분석 시작'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
