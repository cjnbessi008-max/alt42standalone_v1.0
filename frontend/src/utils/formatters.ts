export const formatTimeSpent = (seconds: number | null): string => {
  if (!seconds) return '0초';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) return `${secs}초`;
  if (secs === 0) return `${mins}분`;
  return `${mins}분 ${secs}초`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy': return 'success';
    case 'medium': return 'warning';
    case 'hard': return 'error';
    default: return 'default';
  }
};

export const getStatusColor = (
  status: 'pending' | 'validated' | 'submitted' | 'graded'
): string => {
  switch (status) {
    case 'pending': return 'default';
    case 'validated': return 'info';
    case 'submitted': return 'primary';
    case 'graded': return 'success';
    default: return 'default';
  }
};
