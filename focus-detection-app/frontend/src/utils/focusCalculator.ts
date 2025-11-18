import { FocusData } from '@/types';

/**
 * 집중도 계산 유틸리티
 *
 * 집중도 점수 구성:
 * - 얼굴 존재: 30점
 * - 시선 방향: 40점
 * - 고개 방향: 20점
 * - 움직임 안정성: 10점
 */

// 얼굴 존재 점수 (30점 만점)
export const calculateFacePresenceScore = (faceDetected: boolean): number => {
  return faceDetected ? 30 : 0;
};

// 시선 방향 점수 (40점 만점)
export const calculateGazeScore = (
  gazeX: number,
  gazeY: number,
  threshold = 0.3
): number => {
  // 화면 중앙(0, 0)에서의 거리 계산
  const distance = Math.sqrt(gazeX * gazeX + gazeY * gazeY);

  // 거리가 threshold 이하면 만점, 그 이상이면 점수 감소
  if (distance <= threshold) {
    return 40;
  }

  // threshold를 넘으면 거리에 비례해서 점수 감소
  const score = Math.max(0, 40 - (distance - threshold) * 80);
  return Math.round(score);
};

// 고개 방향 점수 (20점 만점)
export const calculateHeadPoseScore = (
  pitch: number, // 상하
  yaw: number,   // 좌우
  roll: number   // 기울기
): number => {
  // 각도 범위: pitch, yaw, roll은 대략 -30 ~ 30도가 정면 응시
  const pitchScore = Math.max(0, 1 - Math.abs(pitch) / 30);
  const yawScore = Math.max(0, 1 - Math.abs(yaw) / 30);
  const rollScore = Math.max(0, 1 - Math.abs(roll) / 20);

  // 가중 평균 (yaw가 가장 중요)
  const score = (pitchScore * 0.3 + yawScore * 0.5 + rollScore * 0.2) * 20;
  return Math.round(score);
};

// 움직임 점수 (10점 만점)
export const calculateMovementScore = (
  previousPose: { pitch: number; yaw: number; roll: number } | null,
  currentPose: { pitch: number; yaw: number; roll: number },
  threshold = 5 // 각도 변화 임계값
): number => {
  if (!previousPose) return 10; // 첫 프레임은 만점

  // 각 축의 변화량 계산
  const pitchChange = Math.abs(currentPose.pitch - previousPose.pitch);
  const yawChange = Math.abs(currentPose.yaw - previousPose.yaw);
  const rollChange = Math.abs(currentPose.roll - previousPose.roll);

  const totalChange = pitchChange + yawChange + rollChange;

  // 변화가 작을수록 높은 점수
  if (totalChange <= threshold) {
    return 10;
  }

  const score = Math.max(0, 10 - (totalChange - threshold) / 2);
  return Math.round(score);
};

// 전체 집중도 점수 계산
export const calculateTotalFocusScore = (
  faceDetected: boolean,
  gazeX: number,
  gazeY: number,
  headPose: { pitch: number; yaw: number; roll: number },
  previousPose: { pitch: number; yaw: number; roll: number } | null
): FocusData => {
  const faceScore = calculateFacePresenceScore(faceDetected);
  const gazeScore = calculateGazeScore(gazeX, gazeY);
  const headPoseScore = calculateHeadPoseScore(headPose.pitch, headPose.yaw, headPose.roll);
  const movementScore = calculateMovementScore(previousPose, headPose);

  const totalScore = faceScore + gazeScore + headPoseScore + movementScore;

  return {
    timestamp: Date.now(),
    score: Math.min(100, Math.max(0, totalScore)),
    faceDetected,
    gazeScore,
    headPoseScore,
    movementScore,
    headPose,
    gazeDirection: { x: gazeX, y: gazeY },
  };
};

// 집중도 레벨 판단
export const getFocusLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

// 집중도 레벨 색상
export const getFocusColor = (score: number): string => {
  const level = getFocusLevel(score);
  switch (level) {
    case 'high':
      return '#10b981'; // green
    case 'medium':
      return '#f59e0b'; // amber
    case 'low':
      return '#ef4444'; // red
  }
};

// 집중도 메시지
export const getFocusMessage = (score: number): string => {
  const level = getFocusLevel(score);
  switch (level) {
    case 'high':
      return '집중 상태가 매우 좋습니다! 👍';
    case 'medium':
      return '조금 더 집중해 보세요.';
    case 'low':
      return '집중력이 떨어지고 있어요. 화면을 봐주세요! ⚠️';
  }
};

// 산만함 감지 (일정 시간동안 낮은 점수 유지)
export const detectDistraction = (
  recentScores: number[],
  threshold = 40,
  minSamples = 5
): boolean => {
  if (recentScores.length < minSamples) return false;

  const recent = recentScores.slice(-minSamples);
  const lowScoreCount = recent.filter(score => score < threshold).length;

  return lowScoreCount >= minSamples * 0.8; // 80% 이상이 낮은 점수
};
