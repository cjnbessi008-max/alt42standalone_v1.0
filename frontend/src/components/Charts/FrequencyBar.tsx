import { useFrequencyAnimation } from '../../hooks/useFrequencyAnimation';
import '../../styles/animations/frequency-fill.css';

interface FrequencyBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  colorLight?: string;
  height?: number;
  width?: number;
  animationDuration?: number;
  animationDelay?: number;
  showValue?: boolean;
}

/**
 * 개별 도수분포 막대 컴포넌트
 * 부드러운 차오름 애니메이션 적용
 */
const FrequencyBar: React.FC<FrequencyBarProps> = ({
  label,
  value,
  maxValue,
  color = '#4CAF50',
  colorLight = '#66BB6A',
  height = 300,
  width = 60,
  animationDuration = 1500,
  animationDelay = 0,
  showValue = true,
}) => {
  const { currentValue, percentage, isAnimating } = useFrequencyAnimation({
    targetValue: value,
    maxValue,
    duration: animationDuration,
    delay: animationDelay,
  });

  return (
    <div className="frequency-bar" style={{ width: `${width}px` }}>
      <div
        className="frequency-bar-container"
        style={{ height: `${height}px` }}
      >
        <div
          className={`frequency-bar-fill ${isAnimating ? 'animating' : ''}`}
          style={{
            height: `${percentage}%`,
            '--bar-color': color,
            '--bar-color-light': colorLight,
          } as React.CSSProperties}
        />
        {showValue && (
          <div className="frequency-bar-value">
            {Math.round(currentValue)}
          </div>
        )}
      </div>
      <div className="frequency-bar-label">{label}</div>
    </div>
  );
};

export default FrequencyBar;
