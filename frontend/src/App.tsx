import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentPage from './pages/StudentPage';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/student/:studentId" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Adaptive Learning System
          </h1>
          <p className="text-xl text-gray-600">
            Speed-based difficulty adjustment for personalized learning
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Portal */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Portal</h2>
              <p className="text-gray-600 mb-6">
                Solve problems and improve your skills with adaptive difficulty
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 mb-3">Select a student:</h3>
              <Link
                to="/student/33333333-3333-3333-3333-333333333333"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-semibold"
              >
                Lee Minho (Difficulty 2)
              </Link>
              <Link
                to="/student/44444444-4444-4444-4444-444444444444"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-semibold"
              >
                Choi Yuna (Difficulty 4)
              </Link>
              <Link
                to="/student/55555555-5555-5555-5555-555555555555"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-semibold"
              >
                Jung Seojun (Difficulty 3)
              </Link>
            </div>
          </div>

          {/* Teacher Portal */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
              <p className="text-gray-600 mb-6">
                Monitor student progress and analyze performance metrics
              </p>
            </div>
            <Link
              to="/teacher"
              className="block w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition text-center font-semibold"
            >
              Open Dashboard
            </Link>

            <div className="mt-6 pt-6 border-t border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Real-time performance tracking
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Automatic difficulty adjustment
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Detailed analytics and trends
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-1">Adaptive Algorithm</h4>
              <p className="text-sm text-gray-600">
                Difficulty adjusts based on speed and accuracy
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-900 mb-1">Real-time Feedback</h4>
              <p className="text-sm text-gray-600">
                Instant results and explanations
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900 mb-1">Progress Tracking</h4>
              <p className="text-sm text-gray-600">
                Comprehensive analytics for teachers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
