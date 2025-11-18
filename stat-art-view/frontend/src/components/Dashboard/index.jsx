import React from 'react';
import './Dashboard.css';
import RadialChart from '../StatArtView/RadialChart';
import ParticleFlow from '../StatArtView/ParticleFlow';
import NetworkGraph from '../StatArtView/NetworkGraph';

const Dashboard = ({ artData }) => {
  if (!artData) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📈 데스크톱 대시보드</h2>
        <p>전체 통계 및 시각화</p>
      </div>

      <div className="dashboard-grid">
        {/* 방사형 차트 */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🌸 방사형 정답률 차트</h3>
            <p>각 문제별 정답률을 꽃잎 모양으로 표시</p>
          </div>
          <div className="card-content">
            <RadialChart data={artData.radial} />
          </div>
        </div>

        {/* 파티클 플로우 */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>✨ 파티클 플로우</h3>
            <p>학습 진도를 움직이는 점들로 표현</p>
          </div>
          <div className="card-content">
            <ParticleFlow data={artData.particles} />
          </div>
        </div>

        {/* 네트워크 그래프 */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>🕸️ 문제 연관성 네트워크</h3>
            <p>문제 간 연결 관계를 유기적으로 시각화</p>
          </div>
          <div className="card-content">
            <NetworkGraph data={artData.network} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
