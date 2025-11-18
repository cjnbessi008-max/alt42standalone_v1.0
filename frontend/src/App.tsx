import { useState, useEffect } from 'react'
import VirtualPhone from './components/VirtualPhone'
import ConditionScanner from './components/ConditionScanner'
import ControlPanel from './components/ControlPanel'
import { api } from './services/api'
import { MoodleActivity, ScanState } from './types'

function App() {
  const [activities, setActivities] = useState<MoodleActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<MoodleActivity | null>(null);
  const [scanState, setScanState] = useState<ScanState>({
    currentIndex: 0,
    isScanning: false,
    isPaused: false,
    speed: 2000, // 2초마다 하이라이트
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const connected = await api.testMoodleConnection();
    setIsConnected(connected);
  };

  const loadActivities = async (courseId: number) => {
    try {
      const data = await api.getMoodleActivities(courseId);
      setActivities(data);
      if (data.length > 0) {
        setSelectedActivity(data[0]);
      }
    } catch (error) {
      console.error('활동 로드 실패:', error);
    }
  };

  const handleStartScan = () => {
    setScanState(prev => ({ ...prev, isScanning: true, isPaused: false, currentIndex: 0 }));
  };

  const handlePauseScan = () => {
    setScanState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopScan = () => {
    setScanState({ currentIndex: 0, isScanning: false, isPaused: false, speed: 2000 });
  };

  const handleSpeedChange = (speed: number) => {
    setScanState(prev => ({ ...prev, speed }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            조건 스캐너 - Moodle 연동
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Moodle 활동의 조건부 논리를 시각화하고 분석합니다
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 컨트롤 패널 */}
          <div className="lg:col-span-2 space-y-6">
            <ControlPanel
              isConnected={isConnected}
              activities={activities}
              selectedActivity={selectedActivity}
              scanState={scanState}
              onLoadActivities={loadActivities}
              onSelectActivity={setSelectedActivity}
              onStartScan={handleStartScan}
              onPauseScan={handlePauseScan}
              onStopScan={handleStopScan}
              onSpeedChange={handleSpeedChange}
            />

            <ConditionScanner
              activity={selectedActivity}
              scanState={scanState}
              onScanStateChange={setScanState}
            />
          </div>

          {/* 우측 하단: 가상 스마트폰 */}
          <div className="lg:col-span-1">
            <VirtualPhone
              activity={selectedActivity}
              scanState={scanState}
            />
          </div>
        </div>
      </main>

      <footer className="mt-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Moodle 3.7 | PHP 7.1.9 | MySQL 5.7 연동</p>
        </div>
      </footer>
    </div>
  )
}

export default App
