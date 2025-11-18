import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { LogGraphData } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface LogGraphProps {
  data: LogGraphData;
  title?: string;
}

const LogGraph: React.FC<LogGraphProps> = ({ data, title = 'Activity Log Graph' }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Chart options with smooth zoom configuration
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
      // Smooth zoom plugin configuration
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.05, // Slower = smoother (0.01-0.1 range)
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
          onZoomComplete: ({ chart }) => {
            const currentZoom = chart.getZoomLevel();
            setZoomLevel(Math.round(currentZoom * 100));
          },
        },
        pan: {
          enabled: true,
          mode: 'xy',
          modifierKey: 'shift',
        },
        limits: {
          x: { min: 'original', max: 'original', minRange: 2 },
          y: { min: 'original', max: 'original', minRange: 10 },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date/Time',
          font: {
            size: 13,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Score / Duration',
          font: {
            size: 13,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    // Smooth animation on data changes
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };

  // Zoom control functions
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.8);
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setZoomLevel(100);
    }
  };

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="log-graph-container">
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-button" title="Zoom In (+)">
          🔍 확대
        </button>
        <button onClick={handleZoomOut} className="zoom-button" title="Zoom Out (-)">
          🔍 축소
        </button>
        <button onClick={handleResetZoom} className="reset-button" title="Reset Zoom (0)">
          ↺ 초기화
        </button>
        <span className="info-badge">{zoomLevel}%</span>
      </div>

      {/* Info Panel */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 조작 방법:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>마우스 휠: 부드러운 줌 인/아웃</li>
          <li>Shift + 드래그: 그래프 이동 (Pan)</li>
          <li>키보드 +/-: 줌 인/아웃, 0: 초기화</li>
          <li>핀치: 모바일 줌 (터치스크린)</li>
        </ul>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: '400px' }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default LogGraph;
