import { format } from 'date-fns';

interface Alert {
  user_id: number;
  full_name: string;
  email: string;
  session_id: number;
  started_at: string;
  fatigue_level: string;
  mental_stamina_score: string;
  break_urgency: string;
}

interface Props {
  alerts: Alert[];
  onStudentClick: (userId: number) => void;
}

export default function FatigueAlerts({ alerts, onStudentClick }: Props) {
  if (alerts.length === 0) {
    return null;
  }

  const getAlertColor = (level: string) => {
    if (level === 'critical' || level === 'required') return 'bg-red-50 border-red-300';
    if (level === 'high' || level === 'recommended') return 'bg-yellow-50 border-yellow-300';
    return 'bg-blue-50 border-blue-300';
  };

  const getAlertIcon = (level: string) => {
    if (level === 'critical' || level === 'required') return '🔴';
    if (level === 'high' || level === 'recommended') return '🟡';
    return '🔵';
  };

  return (
    <div className="card border-2 border-orange-300">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">⚠️</span>
        <h2 className="text-xl font-bold">피로도 경고</h2>
      </div>

      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <button
            key={`${alert.session_id}-${alert.user_id}`}
            onClick={() => onStudentClick(alert.user_id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${getAlertColor(
              alert.fatigue_level
            )}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start">
                <span className="text-2xl mr-3">{getAlertIcon(alert.fatigue_level)}</span>
                <div>
                  <div className="font-bold text-gray-900">{alert.full_name}</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(alert.started_at), 'yyyy-MM-dd HH:mm')}
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-medium">피로도: </span>
                    <span className="text-gray-700">
                      {alert.fatigue_level === 'critical'
                        ? '매우 높음'
                        : alert.fatigue_level === 'high'
                        ? '높음'
                        : '보통'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {parseFloat(alert.mental_stamina_score).toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">사고 체력</div>
              </div>
            </div>

            {alert.break_urgency && (
              <div className="mt-2 text-sm text-gray-700">
                💡{' '}
                {alert.break_urgency === 'required'
                  ? '즉시 휴식 필요'
                  : alert.break_urgency === 'recommended'
                  ? '휴식 권장'
                  : '휴식 제안'}
              </div>
            )}
          </button>
        ))}
      </div>

      {alerts.length > 5 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          그 외 {alerts.length - 5}명의 학생이 더 있습니다.
        </div>
      )}
    </div>
  );
}
