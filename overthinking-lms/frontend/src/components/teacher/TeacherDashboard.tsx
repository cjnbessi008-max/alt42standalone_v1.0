import { useState, useEffect } from 'react';
import { teachersAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import type { User, OverthinkingEvent } from '../../types';
import RealTimeMonitor from './RealTimeMonitor';
import AnalyticsDashboard from './AnalyticsDashboard';
import { LogOut, Users, BarChart3, Bell } from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'monitor' | 'analytics';

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('monitor');
  const [alerts, setAlerts] = useState<OverthinkingEvent[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    loadAlerts();
    setupSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await teachersAPI.getAlerts(user.id, false, 20);
      setAlerts(data);
      setUnreadAlerts(data.filter((a) => !a.resolvedAt).length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const setupSocket = () => {
    const socket = socketService.connect();
    socketService.teacherJoin(user.id);

    socketService.onStudentStruggling((data) => {
      console.log('Student struggling:', data);

      // Add to alerts
      setAlerts((prev) => [data, ...prev]);
      setUnreadAlerts((prev) => prev + 1);

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('학생이 어려움을 겪고 있습니다', {
          body: `${data.studentName}님이 "${data.problemTitle}" 문제에서 어려움을 겪고 있습니다.`,
          icon: '/icon.png',
        });
      }
    });
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
              <p className="text-sm text-gray-600 mt-1">{user.name} 선생님</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </button>
            </div>
          </div>

          <nav className="mt-6 flex space-x-4">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'monitor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              실시간 모니터링
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'analytics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              분석
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'monitor' && <RealTimeMonitor teacherId={user.id} alerts={alerts} />}
        {activeTab === 'analytics' && <AnalyticsDashboard teacherId={user.id} />}
      </main>
    </div>
  );
}
