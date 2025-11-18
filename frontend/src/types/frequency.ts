/**
 * 도수분포표 데이터 타입 정의
 */

export interface FrequencyData {
  label: string;        // 계급 라벨 (예: "0-10", "10-20")
  value: number;        // 도수 (빈도수)
  color?: string;       // 막대 색상 (선택)
}

export interface FrequencyChartProps {
  data: FrequencyData[];
  maxValue?: number;    // 최대값 (자동 계산 가능)
  animationDuration?: number;  // 애니메이션 지속 시간 (ms)
  animationDelay?: number;     // 각 막대 간 지연 시간 (ms)
  height?: number;      // 차트 높이 (px)
  barWidth?: number;    // 막대 너비 (px)
  showLabels?: boolean; // 라벨 표시 여부
  showValues?: boolean; // 값 표시 여부
}

export interface LMSProblemData {
  problemId: string;
  problemType: string;
  frequencyData: FrequencyData[];
  metadata?: Record<string, any>;
}
