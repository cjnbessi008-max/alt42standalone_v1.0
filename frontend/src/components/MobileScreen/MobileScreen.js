import React from 'react';
import './MobileScreen.css';
import GraphViewer from '../GraphViewer/GraphViewer';

function MobileScreen({ problem }) {
  return (
    <div className="mobile-screen-container">
      <div className="mobile-frame">
        <div className="mobile-notch"></div>
        <div className="mobile-screen">
          {problem ? (
            <GraphViewer problem={problem} />
          ) : (
            <div className="no-problem">
              <p>문제를 선택해주세요</p>
            </div>
          )}
        </div>
        <div className="mobile-home-indicator"></div>
      </div>
      <div className="mobile-label">가상 스마트폰 화면</div>
    </div>
  );
}

export default MobileScreen;
