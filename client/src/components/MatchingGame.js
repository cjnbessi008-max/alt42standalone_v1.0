import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import Shape3DItem from './Shape3DItem';
import Shape2DTarget from './Shape2DTarget';
import api from '../services/api';
import './MatchingGame.css';

// Detect touch device
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const MatchingGame = ({ problemId: propProblemId, studentId = 2 }) => {
  const { problemId: paramProblemId } = useParams();
  const problemId = propProblemId || paramProblemId || 1;

  const [problem, setProblem] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [shapes3D, setShapes3D] = useState([]);
  const [shapes2D, setShapes2D] = useState([]);
  const [matches, setMatches] = useState({});
  const [correctMatches, setCorrectMatches] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch problem details
      const problemResponse = await api.get(`/problems/${problemId}`);
      setProblem(problemResponse.data.data);

      // Fetch problem pairs
      const pairsResponse = await api.get(`/problems/${problemId}/pairs`);
      const pairsData = pairsResponse.data.data;
      setPairs(pairsData);

      // Extract unique 3D and 2D shapes
      const unique3D = [];
      const unique2D = [];
      const seen3D = new Set();
      const seen2D = new Set();

      pairsData.forEach(pair => {
        if (!seen3D.has(pair.shape_3d_id)) {
          unique3D.push({
            id: pair.shape_3d_id,
            name: pair.shape_3d_name,
            name_ko: pair.shape_3d_name_ko,
            thumbnail_url: pair.shape_3d_thumbnail_url
          });
          seen3D.add(pair.shape_3d_id);
        }

        if (!seen2D.has(pair.shape_2d_id)) {
          unique2D.push({
            id: pair.shape_2d_id,
            name: pair.shape_2d_name,
            name_ko: pair.shape_2d_name_ko,
            svg_path: pair.shape_2d_svg_path,
            image_url: pair.shape_2d_image_url
          });
          seen2D.add(pair.shape_2d_id);
        }
      });

      setShapes3D(unique3D);
      setShapes2D(unique2D);
      setLoading(false);
    } catch (err) {
      console.error('Error loading problem:', err);
      setError('문제를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleDrop = async (shape3DId, shape2DId) => {
    const responseTime = Date.now() - startTime;
    setAttempts(attempts + 1);

    try {
      // Submit match to API
      const response = await api.post('/matching/submit', {
        student_id: studentId,
        problem_id: problemId,
        shape_3d_id: shape3DId,
        shape_2d_id: shape2DId,
        response_time_ms: responseTime,
        attempt_number: attempts + 1,
        gesture_data: {
          timestamp: new Date().toISOString()
        }
      });

      const { is_correct, progress } = response.data.data;

      // Update UI
      setMatches(prev => ({
        ...prev,
        [shape3DId]: shape2DId
      }));

      if (is_correct) {
        setCorrectMatches(prev => new Set([...prev, shape3DId]));
        setScore(progress.correct_matches);
      }

      // Check if completed
      if (progress.is_completed) {
        setTimeout(() => {
          alert(`축하합니다! 모든 매칭을 완료했습니다!\n점수: ${progress.correct_matches}/${progress.total_matches}`);
        }, 500);
      }
    } catch (err) {
      console.error('Error submitting match:', err);
      alert('매칭 결과를 제출하는데 실패했습니다.');
    }
  };

  const removeMatch = (shape3DId) => {
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[shape3DId];
      return newMatches;
    });
    setCorrectMatches(prev => {
      const newSet = new Set(prev);
      newSet.delete(shape3DId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="matching-game loading">
        <div className="spinner"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matching-game error">
        <p>{error}</p>
        <button onClick={loadProblem}>다시 시도</button>
      </div>
    );
  }

  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={backend}>
      <div className="matching-game">
        {/* Header */}
        <div className="game-header">
          <h2>{problem?.title_ko || problem?.title}</h2>
          <div className="game-stats">
            <span className="score">점수: {score}/{shapes3D.length}</span>
            <span className="attempts">시도: {attempts}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <p>{problem?.instructions_ko || problem?.instructions || '입체도형을 해당하는 평면도형으로 드래그하세요'}</p>
        </div>

        {/* Game area */}
        <div className="game-area">
          {/* 3D Shapes */}
          <div className="shapes-3d">
            <h3>입체도형</h3>
            <div className="shapes-grid">
              {shapes3D.map(shape => (
                <Shape3DItem
                  key={shape.id}
                  shape={shape}
                  isMatched={correctMatches.has(shape.id)}
                  currentMatch={matches[shape.id]}
                  onRemoveMatch={() => removeMatch(shape.id)}
                />
              ))}
            </div>
          </div>

          {/* 2D Shapes */}
          <div className="shapes-2d">
            <h3>평면도형</h3>
            <div className="shapes-grid">
              {shapes2D.map(shape => (
                <Shape2DTarget
                  key={shape.id}
                  shape={shape}
                  onDrop={handleDrop}
                  matches={matches}
                  correctMatches={correctMatches}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(score / shapes3D.length) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {score} / {shapes3D.length} 완료
          </p>
        </div>
      </div>
    </DndProvider>
  );
};

export default MatchingGame;
