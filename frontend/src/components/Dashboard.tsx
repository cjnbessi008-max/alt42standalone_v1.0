import { useState, useEffect } from 'react';
import { analyticsApi, problemsApi } from '../services/api';
import type { Summary, Problem, LearningPattern } from '../types';
import SummaryCard from './SummaryCard';
import ProblemList from './ProblemList';
import LearningInsights from './LearningInsights';
import TrendChart from './TrendChart';

interface DashboardProps {
  studentId: string;
  moodleUserId?: number;
}

export default function Dashboard({ studentId, moodleUserId }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pattern, setPattern] = useState<LearningPattern | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, problemsData, patternData] = await Promise.all([
        analyticsApi.getSummary(studentId),
        problemsApi.getTodayProblems(studentId),
        analyticsApi.getLearningPattern(studentId),
      ]);

      setSummary(summaryData);
      setProblems(problemsData);
      setPattern(patternData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!moodleUserId) {
      alert('Moodle 사용자 ID가 필요합니다');
      return;
    }

    try {
      setSyncing(true);
      setError(null);

      await problemsApi.syncTodayProblems(moodleUserId);

      // 동기화 후 데이터 다시 로드
      await loadData();

      alert('동기화가 완료되었습니다!');
    } catch (err: any) {
      console.error('Sync failed:', err);
      setError(err.message || '동기화에 실패했습니다');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>오늘의 학습 현황</h1>
        {moodleUserId && (
          <button
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? '동기화 중...' : 'Moodle 동기화'}
          </button>
        )}
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* 요약 카드 */}
      {summary && <SummaryCard summary={summary} />}

      <div className="grid grid-cols-1" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* 학습 인사이트 */}
        {pattern && <LearningInsights pattern={pattern} />}

        {/* 문제 목록 */}
        {problems.length > 0 ? (
          <ProblemList problems={problems} />
        ) : (
          <div className="card">
            <div className="info">
              아직 오늘 푼 문제가 없습니다. Moodle 동기화를 실행하거나 문제를 풀어보세요!
            </div>
          </div>
        )}

        {/* 추세 차트 */}
        <TrendChart studentId={studentId} />
      </div>
    </div>
  );
}
