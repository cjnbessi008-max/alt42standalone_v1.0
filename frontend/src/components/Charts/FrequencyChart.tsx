import { useMemo } from 'react';
import FrequencyBar from './FrequencyBar';
import { FrequencyData, FrequencyChartProps } from '../../types/frequency';
import '../../styles/animations/frequency-fill.css';

// 기본 색상 팔레트
const DEFAULT_COLORS = [
  { color: '#4CAF50', light: '#66BB6A' },
  { color: '#2196F3', light: '#42A5F5' },
  { color: '#FF9800', light: '#FFB74D' },
  { color: '#E91E63', light: '#EC407A' },
  { color: '#9C27B0', light: '#AB47BC' },
  { color: '#00BCD4', light: '#26C6DA' },
];

/**
 * 도수분포표 차트 컴포넌트
 * 여러 막대를 표시하고 순차적으로 애니메이션
 */
const FrequencyChart: React.FC<FrequencyChartProps> = ({
  data,
  maxValue,
  animationDuration = 1500,
  animationDelay = 200,
  height = 300,
  barWidth = 60,
  showLabels = true,
  showValues = true,
}) => {
  // 최대값 자동 계산
  const calculatedMaxValue = useMemo(() => {
    if (maxValue) return maxValue;
    return Math.max(...data.map(d => d.value), 10);
  }, [data, maxValue]);

  return (
    <div className="frequency-chart" style={{ position: 'relative' }}>
      {data.map((item, index) => {
        const colorPalette = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        return (
          <FrequencyBar
            key={`${item.label}-${index}`}
            label={showLabels ? item.label : ''}
            value={item.value}
            maxValue={calculatedMaxValue}
            color={item.color || colorPalette.color}
            colorLight={colorPalette.light}
            height={height}
            width={barWidth}
            animationDuration={animationDuration}
            animationDelay={index * animationDelay}
            showValue={showValues}
          />
        );
      })}
    </div>
  );
};

export default FrequencyChart;
