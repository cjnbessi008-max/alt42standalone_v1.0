import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { GraphAnalysis } from '../utils/types';

interface GraphCanvasProps {
  analysis: GraphAnalysis | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 h-96 flex items-center justify-center">
        <p className="text-gray-400 text-lg">함수를 입력하고 분석을 시작하세요</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = analysis.points.map(point => ({
    x: Number(point.x.toFixed(3)),
    y: Number(point.y.toFixed(3)),
  }));

  // Prepare critical points data
  const criticalPointsData = analysis.criticalPoints.map(point => ({
    x: Number(point.x.toFixed(3)),
    y: Number(point.y.toFixed(3)),
    type: point.type,
  }));

  // Prepare inflection points data
  const inflectionPointsData = analysis.inflectionPoints.map(point => ({
    x: Number(point.x.toFixed(3)),
    y: Number(point.y.toFixed(3)),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-sm font-semibold">x: {payload[0].payload.x}</p>
          <p className="text-sm font-semibold">y: {payload[0].payload.y}</p>
          {payload[0].payload.type && (
            <p className="text-sm text-primary">
              {payload[0].payload.type === 'maximum' ? '극대' : '극소'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">그래프 시각화</h2>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'x', position: 'insideBottomRight', offset: -10 }}
            stroke="#666"
          />
          <YAxis
            type="number"
            domain={['auto', 'auto']}
            label={{ value: 'y', angle: -90, position: 'insideLeft' }}
            stroke="#666"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Reference lines for axes */}
          <ReferenceLine y={0} stroke="#999" strokeWidth={1} />
          <ReferenceLine x={0} stroke="#999" strokeWidth={1} />

          {/* Main function line */}
          <Line
            type="monotone"
            dataKey="y"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            name="f(x)"
            animationDuration={1000}
          />

          {/* Critical points (maxima/minima) */}
          <Scatter
            data={criticalPointsData}
            fill="#ef4444"
            name="극값"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              const isMaximum = payload.type === 'maximum';
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={isMaximum ? '#ef4444' : '#10b981'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={cx}
                    y={cy - 15}
                    textAnchor="middle"
                    fontSize={12}
                    fill={isMaximum ? '#ef4444' : '#10b981'}
                    fontWeight="bold"
                  >
                    {isMaximum ? '극대' : '극소'}
                  </text>
                </g>
              );
            }}
          />

          {/* Inflection points */}
          <Scatter
            data={inflectionPointsData}
            fill="#f59e0b"
            name="변곡점"
            shape={(props: any) => {
              const { cx, cy } = props;
              return (
                <g>
                  <polygon
                    points={`${cx},${cy - 7} ${cx + 6},${cy + 7} ${cx - 6},${cy + 7}`}
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={cx}
                    y={cy - 15}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#f59e0b"
                    fontWeight="bold"
                  >
                    변곡
                  </text>
                </g>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>함수 그래프</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>극대값</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>극소값</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
          <span>변곡점</span>
        </div>
      </div>
    </div>
  );
};
