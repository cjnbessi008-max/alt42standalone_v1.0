import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { StudentProgress, SessionSummary } from '../types/timeline';
import { timelineApi } from '../services/api';

interface StudentProgressDashboardProps {
  studentId: string;
  moduleId?: string;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  studentId,
  moduleId
}) => {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [studentId, moduleId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressData, sessionsData] = await Promise.all([
        timelineApi.getStudentProgress(studentId, moduleId),
        timelineApi.getStudentSessions(studentId, {
          moduleId: moduleId
        })
      ]);

      setProgress(progressData);
      setSessions(sessionsData);
    } catch (err) {
      setError('Failed to load progress data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading progress data...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (progress.length === 0) {
    return <div className="dashboard-empty">No progress data available</div>;
  }

  const totalProgress = progress[0];

  return (
    <div className="student-progress-dashboard">
      <ProgressOverview progress={totalProgress} />
      <RecentSessions sessions={sessions.slice(0, 10)} />
    </div>
  );
};

interface ProgressOverviewProps {
  progress: StudentProgress;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({ progress }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="progress-overview">
      <h2>Progress Overview</h2>
      <div className="progress-grid">
        <div className="progress-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{progress.total_sessions}</div>
            <div className="card-label">Total Sessions</div>
          </div>
        </div>

        <div className="progress-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <div className="card-value">{formatTime(progress.total_time_seconds)}</div>
            <div className="card-label">Total Time</div>
          </div>
        </div>

        <div className="progress-card">
          <div className="card-icon">✓</div>
          <div className="card-content">
            <div className="card-value">{progress.completion_rate.toFixed(0)}%</div>
            <div className="card-label">Completion Rate</div>
            <div className="card-progress">
              <div
                className="progress-bar"
                style={{ width: `${progress.completion_rate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="progress-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="card-value">{progress.accuracy_rate.toFixed(0)}%</div>
            <div className="card-label">Accuracy Rate</div>
            <div className="card-progress">
              <div
                className="progress-bar success"
                style={{ width: `${progress.accuracy_rate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="progress-card">
          <div className="card-icon">🔄</div>
          <div className="card-content">
            <div className="card-value">{progress.avg_attempts_per_problem.toFixed(1)}</div>
            <div className="card-label">Avg Attempts</div>
          </div>
        </div>

        <div className="progress-card">
          <div className="card-icon">💡</div>
          <div className="card-content">
            <div className="card-value">{progress.avg_hints_per_problem.toFixed(1)}</div>
            <div className="card-label">Avg Hints Used</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RecentSessionsProps {
  sessions: SessionSummary[];
}

const RecentSessions: React.FC<RecentSessionsProps> = ({ sessions }) => {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recent-sessions">
      <h3>Recent Sessions</h3>
      <div className="sessions-table">
        <div className="table-header">
          <div className="col">Date</div>
          <div className="col">Duration</div>
          <div className="col">Attempts</div>
          <div className="col">Hints</div>
          <div className="col">Status</div>
        </div>
        {sessions.map((session) => (
          <div key={session.session_id} className="table-row">
            <div className="col">
              {format(new Date(session.started_at), 'MMM dd, HH:mm')}
            </div>
            <div className="col">{formatDuration(session.duration_seconds)}</div>
            <div className="col">{session.answer_attempts}</div>
            <div className="col">{session.hints_used}</div>
            <div className="col">
              <span className={`status-badge ${getStatusClass(session)}`}>
                {getStatusText(session)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getStatusClass(session: SessionSummary): string {
  if (!session.is_completed) return 'incomplete';
  return session.is_correct ? 'correct' : 'incorrect';
}

function getStatusText(session: SessionSummary): string {
  if (!session.is_completed) return 'In Progress';
  return session.is_correct ? 'Correct' : 'Incorrect';
}

export default StudentProgressDashboard;
