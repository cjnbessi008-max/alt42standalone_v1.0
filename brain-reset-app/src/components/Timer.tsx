import './Timer.css';

interface TimerProps {
  totalTime: number;
  currentTime: number;
}

export function Timer({ totalTime, currentTime }: TimerProps) {
  const progress = ((totalTime - currentTime) / totalTime) * 100;
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);

  return (
    <div className="timer">
      <div className="timer__display">
        <span className="timer__time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="timer__progress-bar">
        <div
          className="timer__progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="timer__label">남은 시간</p>
    </div>
  );
}
