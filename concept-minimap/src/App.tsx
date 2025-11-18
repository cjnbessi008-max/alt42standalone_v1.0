import { useState } from 'react';
import ConceptMinimap from './components/ConceptMinimap';
import ProblemViewer from './components/ProblemViewer';
import { conceptTreeData, sampleLMSData, sampleProblems } from './data/sampleData';
import './App.css';

function App() {
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [lmsData, setLmsData] = useState(sampleLMSData);

  const handleConceptClick = (conceptId: string) => {
    console.log('Concept clicked:', conceptId);
    const concept = conceptTreeData.concepts[conceptId];
    if (concept) {
      alert(`개념: ${concept.name}\n\n${concept.description}\n\n난이도: ${concept.difficulty}\n학습 진도: ${concept.learningProgress || 0}%`);
    }
  };

  const handleProblemChange = (index: number) => {
    setSelectedProblemIndex(index);
    // 문제가 변경되면 LMS 데이터도 업데이트
    setLmsData({
      ...lmsData,
      currentProblem: sampleProblems[index],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 헤더 */}
      <header
        style={{
          backgroundColor: '#1e293b',
          color: 'white',
          padding: '16px 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            🎓 개념 트리 미니맵 - LMS 학습 도우미
          </h1>

          {/* 문제 선택 드롭다운 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', color: '#cbd5e1' }}>문제 선택:</label>
            <select
              value={selectedProblemIndex}
              onChange={(e) => handleProblemChange(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#334155',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {sampleProblems.map((problem, index) => (
                <option key={problem.id} value={index}>
                  {problem.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 왼쪽: 문제 뷰어 */}
        <div
          style={{
            flex: '0 0 45%',
            borderRight: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <ProblemViewer
            problem={lmsData.currentProblem}
            concepts={conceptTreeData.concepts}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* 오른쪽: 개념 미니맵 */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ConceptMinimap
            conceptTree={conceptTreeData}
            lmsData={lmsData}
            onConceptClick={handleConceptClick}
          />
        </div>
      </div>

      {/* 푸터 */}
      <footer
        style={{
          backgroundColor: '#f1f5f9',
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        💡 개념을 클릭하면 상세 정보를 볼 수 있습니다. 노드를 드래그하거나 마우스 휠로 확대/축소할 수 있습니다.
      </footer>
    </div>
  );
}

export default App;
