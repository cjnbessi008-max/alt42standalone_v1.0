/**
 * Main App Component
 * Demo application showcasing the MisconceptionsPopup feature
 */
import React, { useState, useEffect } from 'react';
import { MisconceptionsPopup } from './components/misconceptions/MisconceptionsPopup';
import { apiService } from './services/api';
import { StudentInfo, ModuleInfo } from './types';
import './App.css';

function App() {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [popupOpen, setPopupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentModules(selectedStudent);
    } else {
      setModules([]);
      setSelectedModule('');
    }
  }, [selectedStudent]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const studentsData = await apiService.getAllStudents();
      setStudents(studentsData);

      // Auto-select first student if available
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('학생 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentModules = async (studentId: string) => {
    try {
      const modulesData = await apiService.getStudentModules(studentId);
      setModules(modulesData);

      // Auto-select first module if available
      if (modulesData.length > 0) {
        setSelectedModule(modulesData[0].id);
      } else {
        setSelectedModule('');
      }
    } catch (err) {
      console.error('Failed to load modules:', err);
      setError('모듈 데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleShowPopup = () => {
    if (!selectedStudent || !selectedModule) {
      alert('학생과 모듈을 선택해주세요.');
      return;
    }
    setPopupOpen(true);
  };

  const getSelectedStudentName = (): string => {
    const student = students.find((s) => s.id === selectedStudent);
    return student?.name || '';
  };

  const getSelectedModuleName = (): string => {
    const module = modules.find((m) => m.id === selectedModule);
    return module?.name || '';
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="spinner-large"></div>
          <p>시스템 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-screen">
          <h2>오류 발생</h2>
          <p>{error}</p>
          <button onClick={loadInitialData}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🎓 AI 교육 시스템</h1>
        <p className="app-subtitle">내가 자주 틀리는 개념 분석 시스템</p>
      </header>

      <main className="app-main">
        <div className="demo-card">
          <div className="demo-header">
            <h2 className="demo-title">📊 학습 분석 데모</h2>
            <p className="demo-description">
              학생을 선택하고 모듈을 선택한 후, 자주 틀리는 개념을 확인해보세요.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="student-select" className="form-label">
              학생 선택
            </label>
            <select
              id="student-select"
              className="form-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">학생을 선택하세요</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="module-select" className="form-label">
              학습 모듈 선택
            </label>
            <select
              id="module-select"
              className="form-select"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={!selectedStudent || modules.length === 0}
            >
              <option value="">모듈을 선택하세요</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name} (진행률: {module.progress_percentage?.toFixed(0)}%)
                </option>
              ))}
            </select>
            {selectedStudent && modules.length === 0 && (
              <p className="form-hint">이 학생은 등록된 모듈이 없습니다.</p>
            )}
          </div>

          {selectedStudent && selectedModule && (
            <div className="selected-info">
              <div className="info-item">
                <span className="info-label">선택된 학생:</span>
                <span className="info-value">{getSelectedStudentName()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">선택된 모듈:</span>
                <span className="info-value">{getSelectedModuleName()}</span>
              </div>
            </div>
          )}

          <button
            className="show-popup-button"
            onClick={handleShowPopup}
            disabled={!selectedStudent || !selectedModule}
          >
            📊 자주 틀리는 개념 TOP3 보기
          </button>
        </div>

        <div className="info-card">
          <h3 className="info-title">💡 기능 소개</h3>
          <ul className="info-list">
            <li>학생별 자주 틀리는 개념을 자동으로 분석합니다</li>
            <li>오답 빈도가 높은 TOP 3 개념을 우선순위로 표시합니다</li>
            <li>각 개념에 대한 개선 방법을 제공합니다</li>
            <li>실시간으로 학습 데이터를 추적하고 분석합니다</li>
          </ul>
        </div>
      </main>

      <MisconceptionsPopup
        studentId={selectedStudent}
        moduleId={selectedModule}
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        limit={3}
        timeframe="all_time"
      />
    </div>
  );
}

export default App;
