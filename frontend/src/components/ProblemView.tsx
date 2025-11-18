import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DynamicTree from './DynamicTree/DynamicTree';
import api from '../services/api';
import { Problem, TreeNode, TreeCalculationResult } from '../types';

const ProblemView: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [calculation, setCalculation] = useState<TreeCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!problemId) {
        setError('문제 ID가 없습니다.');
        return;
      }

      const data = await api.getProblemById(parseInt(problemId));
      setProblem(data.problem);
      setTreeNodes(data.treeNodes);

      // Calculate outcomes
      if (data.problem.tree_config.calculateOutcomes) {
        const calc = await api.calculateTree(data.problem.id);
        setCalculation(calc);
      }
    } catch (err: any) {
      setError(err.message || '문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const handleSubmit = async () => {
    if (!problem || !selectedNode) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await api.saveAttempt({
        problemId: problem.id,
        moodleUserId: 1, // TODO: Get from auth context
        answer: { selectedNode: selectedNode.node_key },
        isCorrect: true, // TODO: Implement answer validation
        timeSpentSeconds: timeSpent,
        treeInteractionLog: { clicks: [selectedNode.node_key] }
      });

      alert('답안이 제출되었습니다!');
    } catch (err: any) {
      alert('제출 실패: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-600">문제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="p-4 bg-white shadow-sm">
        <h1 className="text-lg font-bold text-gray-800 mb-1">{problem.title}</h1>
        {problem.description && (
          <p className="text-sm text-gray-600">{problem.description}</p>
        )}
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            난이도 {problem.difficulty_level}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            {problem.problem_type.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="bg-white rounded-lg shadow-sm h-full p-2">
          <DynamicTree
            nodes={treeNodes}
            config={{
              showProbabilities: problem.tree_config.showProbabilities,
              animated: problem.tree_config.animation?.enabled,
              onNodeClick: handleNodeClick
            }}
          />
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <div className="p-4 bg-white border-t">
          <div className="text-sm">
            <p className="font-semibold text-gray-700 mb-2">계산 결과</p>
            <div className="flex gap-4">
              <div className="bg-blue-50 px-3 py-2 rounded">
                <span className="text-xs text-gray-600">전체 경우의 수</span>
                <p className="text-xl font-bold text-blue-600">{calculation.totalOutcomes}</p>
              </div>
              <div className="bg-purple-50 px-3 py-2 rounded">
                <span className="text-xs text-gray-600">노드 수</span>
                <p className="text-xl font-bold text-purple-600">{treeNodes.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
          <p className="text-sm font-semibold text-gray-700 mb-2">선택된 노드</p>
          <div className="bg-white rounded-lg p-3 text-sm">
            <p><span className="font-medium">레이블:</span> {selectedNode.label}</p>
            {selectedNode.probability && (
              <p><span className="font-medium">확률:</span> {(selectedNode.probability * 100).toFixed(2)}%</p>
            )}
            <p><span className="font-medium">레벨:</span> {selectedNode.level}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t">
        <button
          onClick={handleSubmit}
          disabled={!selectedNode}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            selectedNode
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          답안 제출
        </button>
      </div>
    </div>
  );
};

export default ProblemView;
