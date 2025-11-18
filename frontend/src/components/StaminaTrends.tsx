import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface Trend {
  session_id: number;
  started_at: string;
  mental_stamina_score: string;
  fatigue_level: string;
  total_questions: number;
  correct_answers: number;
}

interface Props {
  trends: Trend[];
}

export default function StaminaTrends({ trends }: Props) {
  if (!trends || trends.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4">사고 체력 추이</h3>
        <p className="text-gray-600">추이 데이터가 없습니다.</p>
      </div>
    );
  }

  const chartData = trends
    .slice()
    .reverse()
    .map((trend) => ({
      date: format(new Date(trend.started_at), 'MM/dd HH:mm'),
      score: parseFloat(trend.mental_stamina_score),
      accuracy: (trend.correct_answers / trend.total_questions) * 100,
    }));

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4">사고 체력 추이</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0ea5e9"
            strokeWidth={2}
            name="사고 체력"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#10b981"
            strokeWidth={2}
            name="정답률"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
