import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemApi } from '../api/problemApi';
import { Problem } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await problemApi.getAllProblems();
      setProblems(data);
    } catch (err) {
      console.error('Error loading problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: number): string => {
    if (level <= 1) return '#4CAF50';
    if (level <= 3) return '#FFA726';
    return '#F44336';
  };

  const getDifficultyLabel = (level: number): string => {
    if (level <= 1) return 'Easy';
    if (level <= 3) return 'Medium';
    return 'Hard';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #E0E0E0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            📝 Correspondence Lines
          </h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            Interactive learning module for Moodle LMS
          </p>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '24px' }}>
          Available Problems
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading problems...
          </div>
        ) : problems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '12px',
              color: '#666',
            }}
          >
            No problems available. Please contact your teacher.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {problems.map((problem) => (
              <div
                key={problem.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                }}
                onClick={() => navigate(`/problem/${problem.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderColor = '#4A90E2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Difficulty badge */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getDifficultyColor(problem.difficulty_level),
                    color: 'white',
                    marginBottom: '12px',
                  }}
                >
                  {getDifficultyLabel(problem.difficulty_level)}
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                  {problem.title}
                </h3>

                {/* Description */}
                {problem.description && (
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      color: '#666',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {problem.description}
                  </p>
                )}

                {/* Metadata */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    color: '#999',
                    paddingTop: '16px',
                    borderTop: '1px solid #F0F0F0',
                  }}
                >
                  <div>📊 {problem.left_items?.length || 0} pairs</div>
                  <div>⏱️ {Math.floor(problem.time_limit_seconds / 60)} min</div>
                  <div>🔄 {problem.max_attempts} attempts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
