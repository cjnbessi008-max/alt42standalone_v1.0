import React, { useState } from 'react';
import { LearningActivity } from './components/LearningActivity';

function App() {
  const [language, setLanguage] = useState<'en' | 'kr'>('kr');
  const [studentId] = useState(() => `student-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
              {language === 'kr' ? 'AI 교육 시스템' : 'AI Education System'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {language === 'kr'
                ? '혼동 위험 개념 쌍 경고 시스템'
                : 'Confusion-Prone Concept Pair Warning System'}
            </p>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(lang => lang === 'kr' ? 'en' : 'kr')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            {language === 'kr' ? '🇬🇧 English' : '🇰🇷 한국어'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px 0' }}>
        <LearningActivity
          studentId={studentId}
          moduleId="demo-module"
          language={language}
        />
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '48px',
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>
          {language === 'kr'
            ? '© 2025 KAIST Touch Math Academy - AI 교육 시스템'
            : '© 2025 KAIST Touch Math Academy - AI Education System'}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
          {language === 'kr'
            ? 'LMS 연동 혼동 위험 개념 쌍 경고 기능 데모'
            : 'LMS-Integrated Concept Pair Warning System Demo'}
        </p>
      </footer>
    </div>
  );
}

export default App;
