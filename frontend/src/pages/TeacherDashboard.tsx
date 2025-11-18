import { useState, useEffect } from 'react';
import { Users, BarChart3, Activity } from 'lucide-react';
import { studentsApi, activitiesApi, insightsApi } from '../services/api';
import type { Student, LearningActivity, GrowthInsight } from '../types';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [insights, setInsights] = useState<GrowthInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.list({ is_teacher: false });
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async (studentId: string) => {
    try {
      const [activitiesRes, insightsRes] = await Promise.all([
        activitiesApi.getByStudent(studentId, { limit: 10 }),
        insightsApi.getRecent(studentId, 7)
      ]);
      setActivities(activitiesRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error('Failed to load student data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-700 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Users className="w-8 h-8 mr-3" />
          교사 분석 대시보드
        </h1>
        <p className="text-purple-100">학생들의 메타인지 성장을 추적하고 분석합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            학생 목록
          </h2>
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">등록된 학생이 없습니다</p>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li key={student.id}>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'bg-primary-100 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{student.name}</p>
                    {student.grade_level && (
                      <p className="text-sm text-gray-500">{student.grade_level}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Student Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              {/* Recent Activities */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  최근 학습 활동
                </h2>
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">학습 활동 기록이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{activity.topic || activity.subject}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(activity.session_start).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            정확도: {activity.total_problems > 0
                              ? Math.round((activity.correct_answers / activity.total_problems) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">문제 수</p>
                            <p className="font-medium">{activity.total_problems}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">힌트 사용</p>
                            <p className="font-medium">{activity.hints_used}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">학습 시간</p>
                            <p className="font-medium">{activity.duration_minutes?.toFixed(0) || '-'}분</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Insights */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  최근 성장 포인트
                </h2>
                {insights.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">분석된 성장 포인트가 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div key={insight.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{insight.title}</h3>
                          {insight.improvement_percentage && (
                            <span className="text-green-600 font-bold">
                              +{insight.improvement_percentage}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(insight.insight_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">학생을 선택하여 상세 정보를 확인하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
