import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import type { OverthinkingEvent } from '../../types';

interface RealTimeMonitorProps {
  teacherId: string;
  alerts: OverthinkingEvent[];
}

export default function RealTimeMonitor({ teacherId, alerts }: RealTimeMonitorProps) {
  const unresolvedAlerts = alerts.filter((a) => !a.resolvedAt);
  const resolvedAlerts = alerts.filter((a) => a.resolvedAt);

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'border-red-500 bg-red-50';
    if (score >= 40) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-white';
  };

  const getSeverityBadge = (confidence: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
  };

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            현재 도움이 필요한 학생 ({unresolvedAlerts.length})
          </h2>
        </div>

        {unresolvedAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-2">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600">현재 도움이 필요한 학생이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {unresolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border-l-4 shadow-md p-5 ${getSeverityColor(
                  alert.score
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.student?.name || '학생'}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(
                          alert.confidence
                        )}`}
                      >
                        {alert.confidence === 'high'
                          ? '긴급'
                          : alert.confidence === 'medium'
                          ? '주의'
                          : '관찰'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        점수: {alert.score}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">
                      문제: <span className="font-medium">{alert.problem?.title}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (난이도 {alert.problem?.difficultyLevel})
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {alert.triggers.map((trigger, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                        >
                          {trigger.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTimeAgo(alert.detectedAt)}
                      {alert.attempt?.timeSpentSeconds && (
                        <span className="ml-3">
                          문제 풀이 시간: {Math.floor(alert.attempt.timeSpentSeconds / 60)}분
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {alert.interventionTaken === 'hint_shown' && (
                      <span className="text-sm text-green-600">힌트 제공됨</span>
                    )}
                    {alert.interventionTaken === 'teacher_alerted' && (
                      <span className="text-sm text-red-600">교사 알림</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-green-500" />
            최근 해결된 알림
          </h2>

          <div className="grid gap-3">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{alert.student?.name}</span>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-gray-700">{alert.problem?.title}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatTimeAgo(alert.detectedAt)}</span>
                </div>
                {alert.studentResponse && (
                  <p className="text-sm text-gray-600 mt-1">
                    학생 응답: {alert.studentResponse.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
