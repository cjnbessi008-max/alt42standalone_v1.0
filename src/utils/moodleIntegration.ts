/**
 * Moodle LMS 연동을 위한 유틸리티
 */

export interface MoodleProblemData {
  problemId: string;
  functionExpression: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  title?: string;
  instructions?: string;
}

export interface StudentResponse {
  problemId: string;
  timestamp: number;
  interactions: Array<{
    x: number;
    y: number;
    slope: number;
    time: number;
  }>;
  completed: boolean;
}

/**
 * URL 파라미터에서 문제 정보를 파싱합니다
 * @returns MoodleProblemData 또는 null
 */
export function parseMoodleParams(): MoodleProblemData | null {
  const params = new URLSearchParams(window.location.search);

  const problemId = params.get('problemId');
  const functionExpression = params.get('function');

  if (!problemId || !functionExpression) {
    return null;
  }

  return {
    problemId,
    functionExpression: decodeURIComponent(functionExpression),
    xMin: parseFloat(params.get('xMin') || '-10'),
    xMax: parseFloat(params.get('xMax') || '10'),
    yMin: parseFloat(params.get('yMin') || '-10'),
    yMax: parseFloat(params.get('yMax') || '10'),
    title: params.get('title') || undefined,
    instructions: params.get('instructions') || undefined
  };
}

/**
 * 학습 결과를 부모 윈도우(Moodle)로 전송합니다
 * @param response 학생 응답 데이터
 */
export function sendResponseToMoodle(response: StudentResponse): void {
  // postMessage API를 사용하여 부모 윈도우로 데이터 전송
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'DRAG_TO_SLOPE_RESPONSE',
        data: response
      },
      '*' // 실제 프로덕션에서는 특정 origin으로 제한해야 함
    );
  }

  // 로컬 스토리지에도 백업 저장
  try {
    localStorage.setItem(
      `drag_to_slope_${response.problemId}`,
      JSON.stringify(response)
    );
  } catch (error) {
    console.error('로컬 스토리지 저장 실패:', error);
  }
}

/**
 * Moodle로부터 메시지를 수신합니다
 * @param callback 메시지 수신 시 호출될 콜백
 */
export function listenToMoodleMessages(
  callback: (data: any) => void
): () => void {
  const handler = (event: MessageEvent) => {
    // 보안을 위해 실제로는 origin 검증 필요
    if (event.data && event.data.type === 'MOODLE_COMMAND') {
      callback(event.data.payload);
    }
  };

  window.addEventListener('message', handler);

  // 클린업 함수 반환
  return () => window.removeEventListener('message', handler);
}

/**
 * 앱이 준비되었음을 Moodle에 알립니다
 */
export function notifyMoodleReady(): void {
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'DRAG_TO_SLOPE_READY',
        timestamp: Date.now()
      },
      '*'
    );
  }
}

/**
 * 학습 진행 상황을 Moodle에 주기적으로 보고합니다
 * @param progress 0-100 사이의 진행률
 * @param details 추가 세부 정보
 */
export function reportProgress(progress: number, details?: any): void {
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'DRAG_TO_SLOPE_PROGRESS',
        progress: Math.min(100, Math.max(0, progress)),
        details,
        timestamp: Date.now()
      },
      '*'
    );
  }
}
