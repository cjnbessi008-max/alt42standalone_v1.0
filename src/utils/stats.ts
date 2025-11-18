import { LearningStats, LearningSession } from '../types';

const STORAGE_KEY = 'math-formula-learning-stats';

/**
 * localStorage에서 학습 통계 가져오기
 */
export function getStats(): LearningStats {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }

  // 기본값 반환
  return {
    totalSessions: 0,
    totalFormulasLearned: 0,
    totalTimeSpent: 0,
    formulasCompleted: [],
    recentSessions: []
  };
}

/**
 * localStorage에 학습 통계 저장
 */
export function saveStats(stats: LearningStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

/**
 * 새 학습 세션 시작
 */
export function startSession(formulaId: string, formulaText: string): LearningSession {
  return {
    formulaId,
    formulaText,
    startedAt: Date.now(),
    cyclesCompleted: 0,
    questionsAnswered: 0
  };
}

/**
 * 학습 세션 완료
 */
export function completeSession(session: LearningSession): void {
  const stats = getStats();

  // 세션 완료 시간 설정
  session.completedAt = Date.now();

  // 통계 업데이트
  stats.totalSessions += 1;
  stats.totalTimeSpent += session.completedAt - session.startedAt;

  // 공식 완료 목록에 추가 (중복 제거)
  if (!stats.formulasCompleted.includes(session.formulaId)) {
    stats.formulasCompleted.push(session.formulaId);
    stats.totalFormulasLearned += 1;
  }

  // 최근 세션에 추가 (최대 10개 유지)
  stats.recentSessions.unshift(session);
  if (stats.recentSessions.length > 10) {
    stats.recentSessions = stats.recentSessions.slice(0, 10);
  }

  // 마지막 활동 날짜 업데이트
  stats.lastActiveDate = Date.now();

  // 저장
  saveStats(stats);
}

/**
 * 세션 업데이트 (질문 답변 시)
 */
export function updateSession(session: LearningSession, questionsAnswered: number, cyclesCompleted: number): LearningSession {
  return {
    ...session,
    questionsAnswered,
    cyclesCompleted
  };
}

/**
 * 통계 초기화
 */
export function resetStats(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 특정 공식이 완료되었는지 확인
 */
export function isFormulaCompleted(formulaId: string): boolean {
  const stats = getStats();
  return stats.formulasCompleted.includes(formulaId);
}

/**
 * 시간을 읽기 쉬운 형식으로 변환
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
}

/**
 * 날짜를 읽기 쉬운 형식으로 변환
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
