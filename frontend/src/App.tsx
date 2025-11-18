import React, { useEffect, useState } from 'react';
import CountingTreeMap from './components/TreeMap/CountingTreeMap';
import MobileViewport from './components/MobileViewport/MobileViewport';
import { apiService } from './services/api';
import { socketService } from './services/socket';
import type { TreeNode, Problem } from './types';
import './App.css';

function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<TreeNode | null>(null);

  // Initialize on mount
  useEffect(() => {
    initializeApp();
    return () => {
      socketService.disconnect();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Connect to Socket.IO
      const socket = socketService.connect();
      setIsConnected(socket.connected);

      // Load sample problem (prob-001 from schema.sql)
      const data = await apiService.getProblem('prob-001');
      setProblem(data.problem);
      setTreeNodes(data.tree_nodes);

      // Create a session for demo
      const launchData = await apiService.moodleLaunch({
        moodle_problem_id: data.problem.moodle_problem_id,
        moodle_course_id: data.problem.moodle_course_id || 101,
        moodle_user_id: 12345,
        question_text: data.problem.question_text,
        problem_type: data.problem.problem_type,
        difficulty_level: data.problem.difficulty_level
      });

      setSessionId(launchData.session_id);

      // Join session via socket
      socketService.joinSession(launchData.session_id, 'demo-user-12345');

      // Listen to socket events
      setupSocketListeners();

    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.onTreeState((data) => {
      console.log('Tree state received:', data);
      setTreeNodes(data.nodes);
    });

    socketService.onNodeVisited((data) => {
      console.log('Node visited:', data);
      setHighlightedPath((prev) => [...prev, data.nodeId]);
    });

    socketService.onAnswerFeedback((data) => {
      console.log('Answer feedback:', data);
    });
  };

  const handleNodeClick = (nodeId: string, node: TreeNode) => {
    console.log('Node clicked:', nodeId, node);
    setSelectedNodeInfo(node);

    // Record navigation
    if (sessionId) {
      const currentOrder = highlightedPath.length;
      socketService.navigateNode(sessionId, nodeId, currentOrder);

      // Update highlighted path
      setHighlightedPath((prev) => {
        if (!prev.includes(nodeId)) {
          return [...prev, nodeId];
        }
        return prev;
      });
    }
  };

  const handleResetPath = () => {
    setHighlightedPath([]);
    setSelectedNodeInfo(null);
  };

  return (
    <div className="app">
      {/* Main Desktop View */}
      <div className="main-content">
        <header className="app-header">
          <h1>🌳 Counting Tree Map</h1>
          <p>사고 흐름을 나무 형태로 시각화</p>
          <div className="status-bar">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
            </span>
            {sessionId && <span>세션: {sessionId.substring(0, 8)}...</span>}
          </div>
        </header>

        <div className="problem-info">
          {problem && (
            <div className="problem-card">
              <h2>📝 문제</h2>
              <p className="question-text">{problem.question_text}</p>
              <div className="problem-meta">
                <span className="badge">난이도: {problem.difficulty_level}</span>
                <span className="badge">유형: {problem.problem_type}</span>
              </div>
            </div>
          )}

          {selectedNodeInfo && (
            <div className="selected-node-info">
              <h3>선택된 노드</h3>
              <p><strong>라벨:</strong> {selectedNodeInfo.label}</p>
              {selectedNodeInfo.description && (
                <p><strong>설명:</strong> {selectedNodeInfo.description}</p>
              )}
              <p><strong>유형:</strong> {selectedNodeInfo.node_type}</p>
              {selectedNodeInfo.is_correct !== null && (
                <p>
                  <strong>정답:</strong> {selectedNodeInfo.is_correct ? '✅ 맞음' : '❌ 틀림'}
                </p>
              )}
            </div>
          )}

          <div className="controls">
            <button onClick={handleResetPath} className="btn-reset">
              경로 초기화
            </button>
            <button onClick={initializeApp} className="btn-refresh">
              새로고침
            </button>
          </div>
        </div>

        <div className="tree-container">
          <CountingTreeMap
            problemId={problem?.id || ''}
            sessionId={sessionId}
            nodes={treeNodes}
            onNodeClick={handleNodeClick}
            isInteractive={true}
            showMiniMap={true}
            highlightedPath={highlightedPath}
          />
        </div>
      </div>

      {/* Mobile Viewport (Bottom Right) */}
      <MobileViewport position="bottom-right" scale={0.65} showFrame={true}>
        <div className="mobile-app">
          <div className="mobile-header">
            <h2>🌳 Counting Tree</h2>
          </div>

          {problem && (
            <div className="mobile-problem">
              <p className="mobile-question">{problem.question_text}</p>
            </div>
          )}

          <div className="mobile-tree">
            <CountingTreeMap
              problemId={problem?.id || ''}
              sessionId={sessionId}
              nodes={treeNodes}
              onNodeClick={handleNodeClick}
              isInteractive={true}
              showMiniMap={false}
              highlightedPath={highlightedPath}
            />
          </div>

          {selectedNodeInfo && (
            <div className="mobile-node-info">
              <strong>{selectedNodeInfo.label}</strong>
              {selectedNodeInfo.description && (
                <p>{selectedNodeInfo.description}</p>
              )}
            </div>
          )}
        </div>
      </MobileViewport>
    </div>
  );
}

export default App;
