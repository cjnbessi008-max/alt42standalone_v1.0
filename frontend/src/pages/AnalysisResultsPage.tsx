import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI, solutionsAPI, problemsAPI } from '../services/api';
import { GapAnalysis, Solution, Problem } from '../types';

export default function AnalysisResultsPage() {
  const { solutionId } = useParams<{ solutionId: string }>();

  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchData();

    // Poll for analysis results every 3 seconds
    const interval = setInterval(() => {
      if (polling) {
        fetchAnalysis();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [solutionId, polling]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSolution(), fetchAnalysis()]);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSolution = async () => {
    const response = await solutionsAPI.get(solutionId!);
    setSolution(response.data);

    // Fetch problem
    const problemResponse = await problemsAPI.get(response.data.problem_id);
    setProblem(problemResponse.data);
  };

  const fetchAnalysis = async () => {
    try {
      const response = await analysisAPI.getResults(solutionId!, true);
      setAnalysis(response.data);
      setPolling(false); // Stop polling once we have results
      setError(null);
    } catch (err: any) {
      if (!analysis) {
        // Still waiting for analysis
        console.log('Analysis not ready yet...');
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!analysis && polling) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">AI가 풀이를 분석하고 있습니다...</p>
        <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">분석 결과를 아직 가져올 수 없습니다. 잠시 후 새로고침 해주세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/problems" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">
          ← 문제 목록으로
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">분석 결과</h1>
        <p className="text-gray-600">{problem?.title}</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">종합 점수</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
            {analysis.overall_score.toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">완성도</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.completeness_score)}`}>
            {analysis.completeness_score.toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">논리 연속성</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.logic_continuity_score)}`}>
            {analysis.logic_continuity_score.toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">정확성</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.correctness_score)}`}>
            {analysis.correctness_score.toFixed(1)}
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {analysis.ai_feedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">AI 종합 피드백</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{analysis.ai_feedback}</p>
        </div>
      )}

      {/* Gap Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">탐지된 간격</div>
          <div className="text-2xl font-bold text-gray-900">{analysis.total_gaps_detected}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">누락된 단계</div>
          <div className="text-2xl font-bold text-gray-900">{analysis.missing_steps_count}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">논리적 오류</div>
          <div className="text-2xl font-bold text-gray-900">{analysis.logical_errors_count}</div>
        </div>
      </div>

      {/* Detected Gaps */}
      {analysis.detected_gaps && analysis.detected_gaps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">발견된 논리적 간격</h2>
          <div className="space-y-4">
            {analysis.detected_gaps.map((gap) => (
              <div key={gap.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                    {gap.severity}
                  </span>
                  <span className="text-sm text-gray-500">
                    단계 {gap.after_step_number} ~ {gap.before_step_number}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{gap.gap_type}</h3>
                <p className="text-gray-700 mb-2">{gap.description}</p>
                {gap.suggestion && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-2">
                    <p className="text-sm text-green-700">
                      <strong>제안:</strong> {gap.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Items */}
      {analysis.feedback_items && analysis.feedback_items.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 피드백</h2>
          <div className="space-y-3">
            {analysis.feedback_items.map((feedback) => (
              <div key={feedback.id} className="flex items-start">
                <div className="flex-shrink-0">
                  {feedback.feedback_type === 'encouragement' && (
                    <span className="text-green-500">✅</span>
                  )}
                  {feedback.feedback_type === 'hint' && (
                    <span className="text-blue-500">💡</span>
                  )}
                  {feedback.feedback_type === 'correction' && (
                    <span className="text-orange-500">⚠️</span>
                  )}
                  {feedback.feedback_type === 'explanation' && (
                    <span className="text-purple-500">📝</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-gray-700">{feedback.content}</p>
                  {feedback.related_step_number && (
                    <p className="text-xs text-gray-500 mt-1">단계 {feedback.related_step_number}와 관련</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          to={`/problems/${problem?.id}/solve`}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
        >
          다시 풀어보기
        </Link>
        <Link
          to="/problems"
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
        >
          다른 문제 풀기
        </Link>
      </div>
    </div>
  );
}
