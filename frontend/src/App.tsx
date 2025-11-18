import { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { MeanCenterCanvas } from './components/MeanCenterCanvas';
import { useSession } from './hooks/useSession';
import { useMeanCenter } from './hooks/useMeanCenter';
import './App.css';

function App() {
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);

  const { session, loading, error, createSession, endSession } = useSession();
  const {
    coordinates,
    stats,
    addCoordinate,
    clear: clearMeanCenter,
  } = useMeanCenter(session?.session_id || null);

  // Initialize with demo student
  useEffect(() => {
    const demoStudentId = `student-${Date.now()}`;
    setStudentId(demoStudentId);
    setStudentName('Demo Student');
  }, []);

  const handleStart = async () => {
    if (!studentId) {
      alert('Please enter a student ID');
      return;
    }

    try {
      await createSession(
        studentId,
        studentName || `Student ${studentId}`,
        'mean-center-01',
        'Understanding Mean Center (무게중심 이해하기)'
      );
      setIsStarted(true);
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleEnd = async () => {
    if (!session) return;

    try {
      await endSession(session.session_id);
      setIsStarted(false);
      clearMeanCenter();
      alert(`Session ended!\nTotal points: ${coordinates.length}\nMean center: (${stats?.mean_x.toFixed(1)}, ${stats?.mean_y.toFixed(1)})`);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset? All points will be cleared.')) {
      clearMeanCenter();
      handleEnd();
    }
  };

  const handleCoordinateAdd = async (x: number, y: number) => {
    try {
      await addCoordinate(x, y);
    } catch (err) {
      console.error('Failed to add coordinate:', err);
    }
  };

  return (
    <div className="app">
      {/* Main content area */}
      <div className="main-content">
        <header className="app-header">
          <h1>🎯 Mean Center Visualization</h1>
          <p>Moodle LMS Integration - Understanding Center of Gravity</p>
        </header>

        {!isStarted ? (
          <div className="start-screen">
            <div className="start-card">
              <h2>Welcome to Mean Center App</h2>
              <p>평균이 무게중심처럼 이동하는 모습을 시각화합니다</p>

              <div className="form-group">
                <label htmlFor="studentId">Student ID:</label>
                <input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentName">Student Name:</label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={loading || !studentId}
              >
                {loading ? 'Starting...' : 'Start Session'}
              </button>

              <div className="info-box">
                <h3>How it works:</h3>
                <ul>
                  <li>👆 Tap or click on the phone screen to add points</li>
                  <li>🔴 The red center shows the mean (average) position</li>
                  <li>📊 Watch how the center moves like a center of gravity</li>
                  <li>📈 Statistics update in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="session-screen">
            <div className="session-info">
              <h2>Active Session</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Student:</span>
                  <span className="value">{session?.student_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Problem:</span>
                  <span className="value">{session?.problem_title}</span>
                </div>
                <div className="info-item">
                  <span className="label">Points Collected:</span>
                  <span className="value">{coordinates.length}</span>
                </div>
                {stats && (
                  <div className="info-item">
                    <span className="label">Mean Center:</span>
                    <span className="value">
                      ({stats.mean_x.toFixed(1)}, {stats.mean_y.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>

              <div className="button-group">
                <button className="btn btn-secondary" onClick={handleReset}>
                  Reset
                </button>
                <button className="btn btn-danger" onClick={handleEnd}>
                  End Session
                </button>
              </div>
            </div>

            <div className="instructions">
              <h3>📱 Use the smartphone screen on the right →</h3>
              <p>Tap or click to add points and watch the mean center move!</p>
            </div>
          </div>
        )}
      </div>

      {/* Smartphone frame (bottom-right) */}
      {isStarted && (
        <SmartphoneFrame position="bottom-right">
          <MeanCenterCanvas
            coordinates={coordinates}
            stats={stats}
            onCoordinateAdd={handleCoordinateAdd}
            width={296}
            height={550}
            showTrajectory={true}
            showStats={true}
          />
        </SmartphoneFrame>
      )}
    </div>
  );
}

export default App;
