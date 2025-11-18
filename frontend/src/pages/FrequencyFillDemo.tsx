import { useState, useEffect } from 'react';
import FrequencyChart from '../components/Charts/FrequencyChart';
import MobileFrame from '../components/MobilePreview/MobileFrame';
import MobileApp from '../components/MobilePreview/MobileApp';
import { getLMSService } from '../services/lmsService';
import { generateMockFrequencyData } from '../utils/chartDataProcessing';
import { FrequencyData, LMSProblemData } from '../types/frequency';
import './FrequencyFillDemo.css';

const FrequencyFillDemo = () => {
  const [problemData, setProblemData] = useState<LMSProblemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState('problem-001');
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(1500);
  const [animationDelay, setAnimationDelay] = useState(200);

  // LMS에서 문제 데이터 로드
  useEffect(() => {
    loadProblemData(selectedProblem);
  }, [selectedProblem]);

  const loadProblemData = async (problemId: string) => {
    setIsLoading(true);
    try {
      const lmsService = getLMSService(true); // Mock 모드 사용
      const data = await lmsService.fetchProblemData(problemId);
      setProblemData(data);
    } catch (error) {
      console.error('Failed to load problem data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    loadProblemData(selectedProblem);
  };

  const handleGenerateRandom = () => {
    const randomData: LMSProblemData = {
      problemId: 'random',
      problemType: 'frequency-distribution',
      frequencyData: generateMockFrequencyData(6),
      metadata: {
        title: '랜덤 도수분포',
        description: '무작위로 생성된 도수분포표입니다.',
      },
    };
    setProblemData(randomData);
  };

  return (
    <div className="demo-container">
      {/* 좌측 컨트롤 패널 */}
      <div className="demo-sidebar">
        <h2 className="demo-title">Frequency Fill Animation</h2>
        <p className="demo-subtitle">도수분포표 부드러운 차오름 애니메이션</p>

        <div className="demo-section">
          <h3>문제 선택</h3>
          <select
            value={selectedProblem}
            onChange={(e) => setSelectedProblem(e.target.value)}
            className="demo-select"
          >
            <option value="problem-001">수학 시험 점수 분포</option>
            <option value="problem-002">키 분포도</option>
          </select>
          <button onClick={handleReload} className="demo-button">
            🔄 새로고침
          </button>
          <button onClick={handleGenerateRandom} className="demo-button">
            🎲 랜덤 생성
          </button>
        </div>

        <div className="demo-section">
          <h3>애니메이션 설정</h3>
          <label className="demo-label">
            지속 시간: {animationDuration}ms
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={animationDuration}
              onChange={(e) => setAnimationDuration(Number(e.target.value))}
              className="demo-slider"
            />
          </label>
          <label className="demo-label">
            막대 간 지연: {animationDelay}ms
            <input
              type="range"
              min="0"
              max="500"
              step="50"
              value={animationDelay}
              onChange={(e) => setAnimationDelay(Number(e.target.value))}
              className="demo-slider"
            />
          </label>
        </div>

        <div className="demo-section">
          <h3>미리보기 설정</h3>
          <label className="demo-checkbox">
            <input
              type="checkbox"
              checked={showMobilePreview}
              onChange={(e) => setShowMobilePreview(e.target.checked)}
            />
            모바일 미리보기 표시
          </label>
        </div>

        {problemData && (
          <div className="demo-section demo-info">
            <h3>문제 정보</h3>
            <p><strong>ID:</strong> {problemData.problemId}</p>
            <p><strong>제목:</strong> {problemData.metadata?.title}</p>
            <p><strong>설명:</strong> {problemData.metadata?.description}</p>
            <p><strong>데이터 수:</strong> {problemData.frequencyData.length}개</p>
          </div>
        )}

        <div className="demo-section demo-tech-info">
          <h3>기술 스택</h3>
          <ul>
            <li>React 18 + TypeScript</li>
            <li>Vite (빌드 도구)</li>
            <li>CSS3 Animations</li>
            <li>LMS 연동: Moodle 3.7</li>
            <li>DB: MySQL 5.7</li>
            <li>Backend: PHP 7.1.9</li>
          </ul>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="demo-main">
        <div className="demo-content">
          {isLoading ? (
            <div className="demo-loading">
              <div className="loading-spinner"></div>
              <p>문제 데이터 로딩 중...</p>
            </div>
          ) : problemData ? (
            <>
              <div className="demo-chart-header">
                <h2>{problemData.metadata?.title || '도수분포표'}</h2>
                <p>{problemData.metadata?.description}</p>
              </div>
              <FrequencyChart
                data={problemData.frequencyData}
                animationDuration={animationDuration}
                animationDelay={animationDelay}
                height={350}
                barWidth={70}
                showLabels={true}
                showValues={true}
              />
            </>
          ) : (
            <div className="demo-empty">
              <p>문제를 선택하거나 생성해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 우측 하단 모바일 미리보기 */}
      {showMobilePreview && problemData && (
        <MobileFrame position="bottom-right" scale={0.5}>
          <MobileApp title="KAIST Math">
            <div style={{ padding: '10px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                {problemData.metadata?.title}
              </h3>
              <FrequencyChart
                data={problemData.frequencyData}
                animationDuration={animationDuration}
                animationDelay={animationDelay}
                height={250}
                barWidth={40}
                showLabels={true}
                showValues={true}
              />
            </div>
          </MobileApp>
        </MobileFrame>
      )}
    </div>
  );
};

export default FrequencyFillDemo;
