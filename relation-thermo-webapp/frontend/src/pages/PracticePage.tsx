import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { problemApi, responseApi } from '../services/api';
import { usePracticeStore } from '../store/practice.store';
import { useAuthStore } from '../store/auth.store';
import SmartphoneFrame from '../components/SmartphoneFrame';
import Thermometer from '../components/Thermometer';
import ProblemCard from '../components/ProblemCard';
import ResultCard from '../components/ResultCard';
import FinalResults from '../components/FinalResults';

type ViewState = 'loading' | 'problem' | 'result' | 'final';

const PracticePage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    problems,
    currentIndex,
    selectedRelation,
    confidenceLevel,
    responses,
    setProblems,
    selectRelation,
    setConfidenceLevel,
    startProblem,
    nextProblem,
    addResponse,
    reset,
    getTimeSpent,
  } = usePracticeStore();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Fetch problems
  const { data: problemsData, isLoading } = useQuery({
    queryKey: ['problems'],
    queryFn: async () => {
      const response = await problemApi.getProblems({ limit: 10 });
      return response.data.data;
    },
  });

  // Submit response mutation
  const submitMutation = useMutation({
    mutationFn: responseApi.submitResponse,
    onSuccess: (response) => {
      const data = response.data.data;
      setLastResponse(data);
      addResponse({
        problemId: problems[currentIndex].id,
        isCorrect: data.isCorrect,
        selectedRelation: data.selectedAnswer,
        correctAnswer: data.correctAnswer,
      });
      setViewState('result');
    },
  });

  // Initialize problems
  useEffect(() => {
    if (problemsData?.problems) {
      setProblems(problemsData.problems);
      startProblem();
      setViewState('problem');
    }
  }, [problemsData, setProblems, startProblem]);

  const handleSubmit = () => {
    if (!selectedRelation || !user) return;

    const timeSpent = getTimeSpent();
    submitMutation.mutate({
      problemId: problems[currentIndex].id,
      selectedRelation,
      confidenceLevel,
      timeSpent,
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < problems.length) {
      nextProblem();
      setViewState('problem');
    } else {
      setViewState('final');
    }
  };

  const handleRestart = () => {
    reset();
    window.location.reload();
  };

  if (isLoading || viewState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  const currentProblem = problems[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100 p-8">
      {/* 메인 화면 (왼쪽) */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          집합 관계 학습
        </h1>

        {viewState === 'problem' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              온도계로 확신도를 표현하세요
            </h2>
            <Thermometer
              value={confidenceLevel}
              onChange={setConfidenceLevel}
              showSlider
            />
          </div>
        )}

        {viewState === 'result' && lastResponse && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              결과 분석
            </h2>
            <div className="space-y-4">
              <div className="text-lg">
                <span className="text-gray-600">정답 여부: </span>
                <span
                  className={`font-bold ${
                    lastResponse.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {lastResponse.isCorrect ? '정답' : '오답'}
                </span>
              </div>
              <div className="text-lg">
                <span className="text-gray-600">확신도: </span>
                <span className="font-bold">{lastResponse.confidenceLevel}%</span>
              </div>
              <div className="text-lg">
                <span className="text-gray-600">소요 시간: </span>
                <span className="font-bold">{lastResponse.timeSpent}초</span>
              </div>
            </div>
          </div>
        )}

        {viewState === 'final' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              전체 결과
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary-50 rounded-lg p-6">
                <div className="text-gray-600 mb-2">총 문제</div>
                <div className="text-4xl font-bold text-primary-600">
                  {problems.length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-gray-600 mb-2">정답 수</div>
                <div className="text-4xl font-bold text-green-600">
                  {responses.filter((r) => r.isCorrect).length}
                </div>
              </div>
            </div>
            <Thermometer
              value={
                (responses.filter((r) => r.isCorrect).length / problems.length) *
                100
              }
              showSlider={false}
            />
          </div>
        )}
      </div>

      {/* 스마트폰 프레임 (우측 하단) */}
      <SmartphoneFrame>
        {viewState === 'problem' && currentProblem && (
          <ProblemCard
            problem={currentProblem}
            selectedRelation={selectedRelation}
            onSelectRelation={selectRelation}
            confidenceLevel={confidenceLevel}
            onConfidenceChange={setConfidenceLevel}
            onSubmit={handleSubmit}
            currentIndex={currentIndex}
            totalProblems={problems.length}
          />
        )}

        {viewState === 'result' && lastResponse && (
          <ResultCard
            isCorrect={lastResponse.isCorrect}
            selectedAnswer={lastResponse.selectedAnswer}
            correctAnswer={lastResponse.correctAnswer}
            confidenceLevel={lastResponse.confidenceLevel}
            onNext={handleNext}
          />
        )}

        {viewState === 'final' && (
          <FinalResults
            totalProblems={problems.length}
            correctAnswers={responses.filter((r) => r.isCorrect).length}
            averageConfidence={
              responses.reduce((sum, r) => sum + confidenceLevel, 0) /
              responses.length
            }
            onRestart={handleRestart}
          />
        )}
      </SmartphoneFrame>
    </div>
  );
};

export default PracticePage;
