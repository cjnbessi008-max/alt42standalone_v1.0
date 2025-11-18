import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WebcamView } from './WebcamView';
import { FocusScore } from './FocusScore';
import { FocusChart } from './FocusChart';
import { FocusData, Session } from '@/types';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';
import { detectDistraction, getFocusLevel } from '@/utils/focusCalculator';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const StudentSession: React.FC = () => {
  const [studentName, setStudentName] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<FocusData | null>(null);
  const [focusHistory, setFocusHistory] = useState<FocusData[]>([]);
  const [showDistractAlert, setShowDistractAlert] = useState(false);

  const focusDataBufferRef = useRef<FocusData[]>([]);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 세션 시작
  const handleStartSession = async () => {
    if (!studentName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      const response = await apiService.createSession(studentName);
      if (response.success && response.data) {
        setSession(response.data);
        setIsSessionActive(true);
        setFocusHistory([]);

        // WebSocket 연결
        await websocketService.connect(response.data.id);

        // 주기적 저장 시작 (10초마다)
        saveIntervalRef.current = setInterval(() => {
          saveFocusDataBatch();
        }, 10000);
      }
    } catch (error) {
      console.error('세션 시작 실패:', error);
      alert('세션 시작에 실패했습니다.');
    }
  };

  // 세션 종료
  const handleEndSession = async () => {
    if (!session) return;

    try {
      // 남은 데이터 저장
      await saveFocusDataBatch();

      // 세션 종료 API 호출
      await apiService.endSession(session.id);

      // WebSocket 종료
      websocketService.disconnect();

      // 주기적 저장 중지
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      setIsSessionActive(false);
      alert('학습 세션이 종료되었습니다.');
    } catch (error) {
      console.error('세션 종료 실패:', error);
      alert('세션 종료에 실패했습니다.');
    }
  };

  // 집중도 업데이트 핸들러
  const handleFocusUpdate = useCallback((focusData: FocusData) => {
    setCurrentFocus(focusData);
    setFocusHistory((prev) => [...prev, focusData]);

    // 버퍼에 추가
    focusDataBufferRef.current.push(focusData);

    // WebSocket으로 실시간 전송
    if (websocketService.isConnected()) {
      websocketService.sendFocusUpdate(focusData);
    }

    // 산만함 감지
    const recentScores = [...focusHistory.slice(-10), focusData].map(d => d.score);
    if (detectDistraction(recentScores)) {
      setShowDistractAlert(true);
      setTimeout(() => setShowDistractAlert(false), 3000);
    }
  }, [focusHistory]);

  // 일괄 저장
  const saveFocusDataBatch = async () => {
    if (!session || focusDataBufferRef.current.length === 0) return;

    try {
      await apiService.saveFocusDataBatch(session.id, focusDataBufferRef.current);
      focusDataBufferRef.current = []; // 버퍼 초기화
    } catch (error) {
      console.error('집중도 데이터 저장 실패:', error);
    }
  };

  // 통계 계산
  const stats = React.useMemo(() => {
    if (focusHistory.length === 0) {
      return {
        average: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
    }

    const average = focusHistory.reduce((sum, d) => sum + d.score, 0) / focusHistory.length;
    const highCount = focusHistory.filter(d => getFocusLevel(d.score) === 'high').length;
    const mediumCount = focusHistory.filter(d => getFocusLevel(d.score) === 'medium').length;
    const lowCount = focusHistory.filter(d => getFocusLevel(d.score) === 'low').length;

    return { average, highCount, mediumCount, lowCount };
  }, [focusHistory]);

  // 세션 시간 계산
  const sessionDuration = React.useMemo(() => {
    if (!session || !isSessionActive) return '00:00';

    const start = new Date(session.startTime);
    return formatDistanceToNow(start, { locale: ko, addSuffix: false });
  }, [session, isSessionActive, currentFocus]); // currentFocus를 의존성에 추가하여 1초마다 업데이트

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      websocketService.disconnect();
    };
  }, []);

  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">학습 집중도 감지</h1>
            <p className="text-gray-600">실시간으로 학습 집중도를 측정합니다</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름을 입력하세요
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStartSession()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
                autoFocus
              />
            </div>

            <button
              onClick={handleStartSession}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              세션 시작
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 사용 방법</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 웹캠 권한을 허용해주세요</li>
              <li>• 카메라가 얼굴을 정면으로 볼 수 있게 위치하세요</li>
              <li>• 화면을 집중해서 바라보세요</li>
              <li>• 실시간으로 집중도가 측정됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{studentName}님의 학습 세션</h2>
            <p className="text-sm text-gray-600">세션 시간: {sessionDuration}</p>
          </div>
          <button
            onClick={handleEndSession}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            세션 종료
          </button>
        </div>
      </div>

      {/* 산만함 알림 */}
      {showDistractAlert && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-bold">집중력이 떨어지고 있습니다!</p>
                <p className="text-sm">화면을 집중해서 봐주세요.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 웹캠 뷰 */}
        <div className="lg:col-span-2 space-y-6">
          <WebcamView
            onFocusUpdate={handleFocusUpdate}
            className="h-96"
            showVideo={true}
          />

          {/* 차트 */}
          <FocusChart data={focusHistory} />
        </div>

        {/* 오른쪽: 집중도 스코어 & 통계 */}
        <div className="space-y-6">
          <FocusScore focusData={currentFocus} />

          {/* 세션 통계 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">세션 통계</h3>
            <div className="space-y-3">
              <StatItem label="평균 집중도" value={`${Math.round(stats.average)}점`} />
              <StatItem
                label="높은 집중"
                value={`${stats.highCount}회`}
                color="text-green-600"
              />
              <StatItem
                label="중간 집중"
                value={`${stats.mediumCount}회`}
                color="text-amber-600"
              />
              <StatItem
                label="낮은 집중"
                value={`${stats.lowCount}회`}
                color="text-red-600"
              />
              <StatItem label="데이터 포인트" value={`${focusHistory.length}개`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color = 'text-gray-900' }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}</span>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);
