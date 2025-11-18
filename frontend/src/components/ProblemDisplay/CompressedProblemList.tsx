/**
 * Compressed Problem List Component
 * Displays LMS problems in a compressed single-line format
 */

import React, { useState, useEffect } from 'react';
import { Problem, CompressedProblem, compressProblems, getProblemMetadata } from '../../utils/problemCompressor';
import { fetchProblems } from '../../services/problemService';
import './CompressedProblemList.css';

interface CompressedProblemListProps {
  moduleId: string;
  limit?: number;
}

export const CompressedProblemList: React.FC<CompressedProblemListProps> = ({
  moduleId,
  limit = 50
}) => {
  const [problems, setProblems] = useState<CompressedProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, [moduleId]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProblems(moduleId, limit);
      const compressed = compressProblems(data);
      setProblems(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemClick = (problemId: string) => {
    setSelectedProblemId(selectedProblemId === problemId ? null : problemId);
  };

  if (loading) {
    return <div className="compressed-problem-list loading">Loading problems...</div>;
  }

  if (error) {
    return <div className="compressed-problem-list error">Error: {error}</div>;
  }

  if (problems.length === 0) {
    return <div className="compressed-problem-list empty">No problems found</div>;
  }

  return (
    <div className="compressed-problem-list">
      <div className="problem-list-header">
        <h3>Problems ({problems.length})</h3>
        <button onClick={loadProblems} className="refresh-button">↻ Refresh</button>
      </div>

      <div className="problem-items">
        {problems.map((problem, index) => (
          <div
            key={problem.id}
            className={`problem-item ${selectedProblemId === problem.id ? 'selected' : ''}`}
            onClick={() => handleProblemClick(problem.id)}
            title={getProblemMetadata(problem.original)}
          >
            <span className="problem-index">{index + 1}.</span>
            <span className="problem-compressed">{problem.compressed}</span>

            {selectedProblemId === problem.id && (
              <div className="problem-details">
                <div className="detail-row">
                  <strong>ID:</strong> {problem.original.id}
                </div>
                <div className="detail-row">
                  <strong>Description:</strong> {problem.original.description}
                </div>
                {problem.original.data && (
                  <div className="detail-row">
                    <strong>Data:</strong>
                    <pre>{JSON.stringify(problem.original.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompressedProblemList;
