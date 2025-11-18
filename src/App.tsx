/**
 * Main Application Component
 * Integrates Logic Flow Visualization with Moodle LMS and Mobile Simulator
 */

import React, { useState, useEffect } from 'react';
import { LogicFlowVisualization } from '@components/LogicFlowVisualization';
import { MobileSimulator } from '@components/MobileSimulator';
import { useAppStore } from './store/useAppStore';
import { createMoodleApi } from '@services/moodleApi';
import type { LogicFlowGraph, LogicNode, MoodleConfig } from '@types/index';

// Example Logic Flow Data
const exampleLogicFlow: LogicFlowGraph = {
  nodes: [
    {
      id: '1',
      type: 'condition',
      label: '학생 답변 확인',
      description: '분수 덧셈 문제',
      position: { x: 0, y: 0 },
    },
    {
      id: '2',
      type: 'decision',
      label: '답이 정확한가?',
      position: { x: 0, y: 0 },
    },
    {
      id: '3',
      type: 'conclusion',
      label: '정답 피드백',
      description: '잘했습니다!',
      position: { x: 0, y: 0 },
    },
    {
      id: '4',
      type: 'action',
      label: '힌트 제공',
      description: '분모를 먼저 통분하세요',
      position: { x: 0, y: 0 },
    },
    {
      id: '5',
      type: 'condition',
      label: '재시도 횟수 확인',
      position: { x: 0, y: 0 },
    },
    {
      id: '6',
      type: 'conclusion',
      label: '다음 문제',
      description: '다음 단계로 진행',
      position: { x: 0, y: 0 },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', label: '평가' },
    { id: 'e2-3', source: '2', target: '3', label: '예 (Yes)' },
    { id: 'e2-4', source: '2', target: '4', label: '아니오 (No)' },
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e5-1', source: '5', target: '1', label: '< 3회', style: { strokeDasharray: '5,5' } },
    { id: 'e5-6', source: '5', target: '6', label: '≥ 3회' },
    { id: 'e3-6', source: '3', target: '6' },
  ],
  metadata: {
    title: '분수 덧셈 문제 로직',
    description: '조건에 따른 피드백 흐름',
    createdAt: new Date().toISOString(),
  },
};

function App() {
  const { logicFlow, setLogicFlow, moodleConfig, setMoodleConfig } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<LogicNode | null>(null);
  const [showMobileSimulator, setShowMobileSimulator] = useState(true);
  const [moodleConnected, setMoodleConnected] = useState(false);

  // Initialize with example data
  useEffect(() => {
    setLogicFlow(exampleLogicFlow);
  }, [setLogicFlow]);

  // Handle Moodle connection
  const handleMoodleConnect = async (config: MoodleConfig) => {
    try {
      const api = createMoodleApi(config);
      const isConnected = await api.testConnection();
      setMoodleConnected(isConnected);
      if (isConnected) {
        setMoodleConfig(config);
        alert('Moodle 연결 성공!');
      } else {
        alert('Moodle 연결 실패. 설정을 확인해주세요.');
      }
    } catch (error) {
      console.error('Moodle connection error:', error);
      alert('연결 중 오류가 발생했습니다.');
    }
  };

  const handleNodeClick = (node: LogicNode) => {
    setSelectedNode(node);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}>
          Logic Flow Visualization System
        </h1>
        <p style={{ color: '#64748B', fontSize: '16px' }}>
          Moodle LMS 연동 학습 로직 시각화 시스템
        </p>
      </header>

      {/* Moodle Connection Panel */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Moodle 연결 설정
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#475569' }}>
              Moodle URL
            </label>
            <input
              type="text"
              placeholder="https://your-moodle-site.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              id="moodle-url"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#475569' }}>
              Web Service Token
            </label>
            <input
              type="password"
              placeholder="your-token-here"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              id="moodle-token"
            />
          </div>
          <button
            onClick={() => {
              const url = (document.getElementById('moodle-url') as HTMLInputElement)?.value;
              const token = (document.getElementById('moodle-token') as HTMLInputElement)?.value;
              if (url && token) {
                handleMoodleConnect({ wstoken: token, domainname: url });
              }
            }}
            style={{
              padding: '8px 24px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            연결
          </button>
        </div>
        {moodleConnected && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#DCFCE7',
              border: '1px solid #86EFAC',
              borderRadius: '6px',
              color: '#166534',
              fontSize: '14px',
            }}
          >
            ✓ Moodle에 성공적으로 연결되었습니다
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Logic Flow Visualization */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            로직 흐름도 (Logic Flow)
          </h2>
          {logicFlow ? (
            <LogicFlowVisualization
              graph={logicFlow}
              width={800}
              height={600}
              interactive={true}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              로딩 중...
            </div>
          )}
        </div>

        {/* Node Details Panel */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            노드 상세 정보
          </h2>
          {selectedNode ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  유형 (Type)
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#EEF2FF',
                    color: '#3730A3',
                    borderRadius: '12px',
                    fontSize: '14px',
                  }}
                >
                  {selectedNode.type}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  레이블 (Label)
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {selectedNode.label}
                </div>
              </div>
              {selectedNode.description && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                    설명 (Description)
                  </div>
                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    {selectedNode.description}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                  ID
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#64748B' }}>
                  {selectedNode.id}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
              노드를 클릭하면 상세 정보가 표시됩니다
            </div>
          )}
        </div>
      </div>

      {/* Mobile Simulator */}
      {showMobileSimulator && (
        <MobileSimulator
          position="bottom-right"
          onClose={() => setShowMobileSimulator(false)}
          minimizable={true}
        >
          {/* Example content in mobile view */}
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              분수 덧셈 문제
            </h3>
            <div
              style={{
                padding: '24px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                1/2 + 1/4 = ?
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                답을 입력하세요:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="분자"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                  }}
                />
                <span>/</span>
                <input
                  type="number"
                  placeholder="분모"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              제출
            </button>
          </div>
        </MobileSimulator>
      )}

      {!showMobileSimulator && (
        <button
          onClick={() => setShowMobileSimulator(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 24px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          📱 모바일 시뮬레이터 열기
        </button>
      )}
    </div>
  );
}

export default App;
