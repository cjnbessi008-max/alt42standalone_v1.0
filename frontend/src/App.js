import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VirtualSmartphone from './components/VirtualSmartphone/VirtualSmartphone';
import TimelinePanel from './components/Timeline/TimelinePanel';
import Header from './components/Header';
import { useTimelineStore } from './store/timelineStore';

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  padding: 20px;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;

  @media (max-width: 1024px) {
    position: relative;
    bottom: auto;
    right: auto;
  }
`;

function App() {
  const { currentTimeline } = useTimelineStore();
  const [studentInfo, setStudentInfo] = useState({
    id: 'student-demo-001',
    name: '데모 학생'
  });

  useEffect(() => {
    // URL 파라미터에서 Moodle 세션 정보 읽기
    const params = new URLSearchParams(window.location.search);
    const moodleUserId = params.get('moodle_user_id');
    const moodleUserName = params.get('moodle_user_name');

    if (moodleUserId) {
      setStudentInfo({
        id: moodleUserId,
        name: moodleUserName || '학생'
      });
    }
  }, []);

  return (
    <AppContainer>
      <Header studentName={studentInfo.name} />
      <MainContent>
        <LeftPanel>
          <TimelinePanel />
        </LeftPanel>
        <RightPanel>
          <VirtualSmartphone studentId={studentInfo.id} studentName={studentInfo.name} />
        </RightPanel>
      </MainContent>
    </AppContainer>
  );
}

export default App;
