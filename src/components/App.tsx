import { useState, useEffect } from 'react';
import LogGraph from './LogGraph';
import SmartphoneFrame from './SmartphoneFrame';
import MoodleApiService from '../services/moodleApi';
import { LogGraphData, MoodleActivityLog } from '../types';

function App() {
  const [graphData, setGraphData] = useState<LogGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    // Load data on component mount
    loadActivityData();
  }, []);

  const loadActivityData = () => {
    setLoading(true);

    // For demo purposes, using mock data
    // In production, replace with actual Moodle API call
    const mockLogs = MoodleApiService.generateMockData(30);
    const transformed = transformLogsToGraphData(mockLogs);
    setGraphData(transformed);

    setLoading(false);
  };

  const transformLogsToGraphData = (logs: MoodleActivityLog[]): LogGraphData => {
    // Sort by timestamp
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

    // Create labels (dates)
    const labels = sortedLogs.map((log) => {
      const date = new Date(log.timestamp);
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    });

    // Create datasets
    const datasets = [
      {
        label: 'Activity Score',
        data: sortedLogs.map((log) => log.score || 0),
        borderColor: 'rgb(249, 128, 18)', // Moodle orange
        backgroundColor: 'rgba(249, 128, 18, 0.1)',
        fill: true,
        tension: 0.4, // Smooth curves
      },
      {
        label: 'Duration (min)',
        data: sortedLogs.map((log) => (log.duration || 0) / 60), // Convert to minutes
        borderColor: 'rgb(17, 119, 209)', // Moodle blue
        backgroundColor: 'rgba(17, 119, 209, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ];

    return { labels, datasets };
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-moodle-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading activity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="glass-effect rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ALT42 - Smooth Log Zoom
              </h1>
              <p className="text-gray-600">
                Moodle 3.7 LMS Integration | Activity Log Visualization
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadActivityData}
                className="px-4 py-2 bg-moodle-secondary text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
              >
                🔄 Refresh Data
              </button>
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 bg-moodle-primary text-white rounded-lg hover:bg-orange-600 transition-all shadow-md"
              >
                {viewMode === 'desktop' ? '📱 Mobile View' : '🖥️ Desktop View'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {viewMode === 'desktop' ? (
          <div className="glass-effect rounded-2xl p-8 shadow-xl">
            {graphData && <LogGraph data={graphData} title="Student Activity Log (Desktop View)" />}
          </div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg">
              👇 Check the smartphone view at the bottom-right corner
            </p>
          </div>
        )}

        {/* Feature Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="glass-effect rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Smooth Zoom</h3>
            <p className="text-sm text-gray-600">
              Chart.js with chartjs-plugin-zoom provides buttery-smooth zoom animations with 300ms easing.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mobile Ready</h3>
            <p className="text-sm text-gray-600">
              Responsive design with smartphone simulator for testing mobile experience.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Moodle Integration</h3>
            <p className="text-sm text-gray-600">
              Ready for Moodle 3.7 LMS integration with web service API support.
            </p>
          </div>
        </div>
      </main>

      {/* Smartphone Frame (Fixed position - bottom right) */}
      {viewMode === 'mobile' && graphData && (
        <SmartphoneFrame position="bottom-right">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 bg-moodle-primary text-white">
              <h2 className="text-lg font-bold">Activity Log</h2>
              <p className="text-xs opacity-90">학습 활동 기록</p>
            </div>
            <div className="flex-1 overflow-auto">
              <LogGraph data={graphData} title="Activity Progress" />
            </div>
          </div>
        </SmartphoneFrame>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-sm text-gray-500">
        <p>Built with React 18 + TypeScript + Chart.js + Vite</p>
        <p className="mt-1">Compatible with Moodle 3.7 | MySQL 5.7 | PHP 7.1.9</p>
      </footer>
    </div>
  );
}

export default App;
