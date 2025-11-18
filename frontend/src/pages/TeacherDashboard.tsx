import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { dashboardAPI } from '../services/api';
import StudentList from '../components/StudentList';
import ClassStats from '../components/ClassStats';
import StaminaTrends from '../components/StaminaTrends';
import FatigueAlerts from '../components/FatigueAlerts';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [classStats, setClassStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statsRes, alertsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getClassStats(),
        dashboardAPI.getAlerts(),
      ]);

      if (overviewRes.data.success) {
        setStudents(overviewRes.data.students);
      }

      if (statsRes.data.success) {
        setClassStats(statsRes.data.stats);
      }

      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.alerts);
      }

      // Log access
      await dashboardAPI.logAccess();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (studentId: number) => {
    try {
      const response = await dashboardAPI.getStudentAnalysis(studentId);
      if (response.data.success) {
        setSelectedStudent(response.data);
      }
    } catch (error) {
      console.error('Failed to load student details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                교사 대시보드
              </h1>
              <p className="text-gray-600 mt-1">
                환영합니다, {user?.fullName} 선생님
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="btn btn-primary"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Fatigue Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <FatigueAlerts alerts={alerts} onStudentClick={handleStudentSelect} />
          </div>
        )}

        {/* Class Stats */}
        <div className="mb-8">
          <ClassStats stats={classStats} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student List */}
          <div className="lg:col-span-1">
            <StudentList
              students={students}
              onStudentSelect={handleStudentSelect}
              selectedStudent={selectedStudent?.student}
            />
          </div>

          {/* Student Details */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="card">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedStudent.student.full_name}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {selectedStudent.stats.total_sessions}
                      </div>
                      <div className="text-sm text-gray-600">총 세션</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {parseFloat(selectedStudent.stats.avg_stamina).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">평균 사고 체력</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedStudent.stats.questions_per_minute?.toFixed(1) || 0}
                      </div>
                      <div className="text-sm text-gray-600">분당 문제 수</div>
                    </div>
                  </div>
                </div>

                {/* Stamina Trends */}
                <StaminaTrends trends={selectedStudent.staminaTrends} />

                {/* Recent Sessions */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4">최근 세션</h3>
                  <div className="space-y-3">
                    {selectedStudent.recentSessions.map((session: any) => (
                      <div
                        key={session.id}
                        className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">
                            세션 #{session.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(session.started_at).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">
                            {session.mental_stamina_score || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {session.correct_answers}/{session.total_questions}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">👈</div>
                  <p>학생을 선택하여 상세 정보를 확인하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
