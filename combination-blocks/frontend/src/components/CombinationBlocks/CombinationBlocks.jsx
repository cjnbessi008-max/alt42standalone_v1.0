import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { combinationBlocksAPI } from '../../services/api';
import './CombinationBlocks.css';

const ItemTypes = {
  BLOCK: 'block',
};

/**
 * Draggable Block Component
 */
const Block = ({ element, index, onAdd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BLOCK,
    item: { element, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`block ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundColor: element.color_code,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      onClick={() => onAdd(element)}
    >
      <div className="block-content">
        {element.icon_url && <img src={element.icon_url} alt="" className="block-icon" />}
        <span className="block-text">{element.display_text}</span>
      </div>
    </div>
  );
};

/**
 * Drop Zone for Combination
 */
const CombinationZone = ({ combination, onDrop, onRemove }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.BLOCK,
    drop: (item) => onDrop(item.element),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`combination-zone ${isOver ? 'over' : ''} ${combination.length === 0 ? 'empty' : ''}`}
    >
      {combination.length === 0 ? (
        <div className="combination-placeholder">
          <span>블록을 여기에 드래그하거나 클릭하세요</span>
        </div>
      ) : (
        <div className="combination-items">
          {combination.map((element, index) => (
            <div
              key={`${element.id}-${index}`}
              className="combination-item"
              style={{ backgroundColor: element.color_code }}
              onClick={() => onRemove(index)}
              title="클릭하여 제거"
            >
              {element.display_text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main CombinationBlocks Component
 */
const CombinationBlocks = ({ blockId, userId }) => {
  const [block, setBlock] = useState(null);
  const [combination, setCombination] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [progress, setProgress] = useState(null);
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Load block data
  useEffect(() => {
    loadBlock();
    loadProgress();
    loadHints();

    // Timer for tracking time spent
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [blockId]);

  const loadBlock = async () => {
    try {
      setLoading(true);
      const data = await combinationBlocksAPI.getBlockById(blockId);
      setBlock(data);
    } catch (error) {
      console.error('Failed to load block:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await combinationBlocksAPI.getProgress(userId, blockId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadHints = async () => {
    try {
      const data = await combinationBlocksAPI.getHints(blockId);
      setHints(data);
    } catch (error) {
      console.error('Failed to load hints:', error);
    }
  };

  const handleAddBlock = (element) => {
    if (combination.length >= (block?.max_blocks || 10)) {
      setFeedback({ type: 'warning', message: '최대 블록 개수에 도달했습니다!' });
      return;
    }
    setCombination([...combination, element]);
    setFeedback(null);
  };

  const handleRemoveBlock = (index) => {
    const newCombination = [...combination];
    newCombination.splice(index, 1);
    setCombination(newCombination);
    setFeedback(null);
  };

  const handleClear = () => {
    setCombination([]);
    setResult(null);
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (combination.length === 0) {
      setFeedback({ type: 'warning', message: '블록을 먼저 조합해주세요!' });
      return;
    }

    try {
      const attemptData = {
        combination_block_id: blockId,
        moodle_user_id: userId,
        combination_data: combination.map(el => el.id),
        time_spent: timeSpent,
      };

      const response = await combinationBlocksAPI.submitAttempt(attemptData);
      setResult(response);

      if (response.is_correct) {
        setFeedback({
          type: 'success',
          message: response.feedback || '정답입니다! 🎉',
        });
      } else {
        setFeedback({
          type: 'error',
          message: response.feedback || '틀렸습니다. 다시 시도해보세요!',
        });
      }

      // Reload progress
      await loadProgress();
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      setFeedback({ type: 'error', message: '제출 중 오류가 발생했습니다.' });
    }
  };

  if (loading) {
    return (
      <div className="combination-blocks loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="combination-blocks error">
        <p>블록을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="combination-blocks">
        {/* Header */}
        <div className="cb-header">
          <h2>{block.title}</h2>
          <p className="cb-description">{block.description}</p>
          <div className="cb-target">
            <span className="target-label">목표:</span>
            <span className="target-value">{block.target_combination}</span>
          </div>
        </div>

        {/* Progress Info */}
        {progress && progress.attempts_count > 0 && (
          <div className="cb-progress">
            <div className="progress-stat">
              <span className="stat-label">시도:</span>
              <span className="stat-value">{progress.attempts_count}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">정답:</span>
              <span className="stat-value">{progress.correct_attempts}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">시간:</span>
              <span className="stat-value">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}

        {/* Combination Zone */}
        <div className="cb-workspace">
          <h3>조합 영역</h3>
          <CombinationZone
            combination={combination}
            onDrop={handleAddBlock}
            onRemove={handleRemoveBlock}
          />
        </div>

        {/* Available Blocks */}
        <div className="cb-blocks-container">
          <h3>사용 가능한 블록</h3>
          <div className="cb-blocks-grid">
            {block.elements.map((element, index) => (
              <Block
                key={element.id}
                element={element}
                index={index}
                onAdd={handleAddBlock}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="cb-actions">
          <button className="btn btn-secondary" onClick={handleClear}>
            지우기
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            제출
          </button>
          <button
            className="btn btn-hint"
            onClick={() => setShowHints(!showHints)}
          >
            💡 힌트 {showHints ? '숨기기' : '보기'}
          </button>
        </div>

        {/* Hints */}
        {showHints && hints.length > 0 && (
          <div className="cb-hints">
            <h4>힌트</h4>
            {hints.map((hint, index) => (
              <div key={hint.id} className={`hint hint-level-${hint.hint_level}`}>
                <span className="hint-number">{index + 1}</span>
                <span className="hint-text">{hint.hint_text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`cb-feedback ${feedback.type}`}>
            <span className="feedback-icon">
              {feedback.type === 'success' ? '✓' : feedback.type === 'error' ? '✗' : 'ⓘ'}
            </span>
            <span className="feedback-message">{feedback.message}</span>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CombinationBlocks;
