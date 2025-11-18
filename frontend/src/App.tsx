/**
 * Main App Component
 */

import React from 'react';
import StudentDashboard from './pages/StudentDashboard';

// Mock student data - In production, this would come from authentication
const MOCK_STUDENT_ID = 'student-001';
const MOCK_MODULE_ID = 'module-fractions-01';

function App() {
  return (
    <div className="App">
      <StudentDashboard studentId={MOCK_STUDENT_ID} moduleId={MOCK_MODULE_ID} />
    </div>
  );
}

export default App;
