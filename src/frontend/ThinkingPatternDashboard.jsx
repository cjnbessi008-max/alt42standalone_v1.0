import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Thinking Pattern Analysis Dashboard
 * Visualizes morning vs evening learning performance
 */
const ThinkingPatternDashboard = ({ userId, apiBaseUrl }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch analysis data
  useEffect(() => {
    fetchAnalysisData();
  }, [userId, dateRange]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/analysis/${userId}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analysis data');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      await fetchAnalysisData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!analysisData || !analysisData.patterns) return [];

    return Object.entries(analysisData.patterns).map(([timeOfDay, data]) => ({
      timeOfDay: timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1),
      accuracy: parseFloat(data.avg_accuracy || 0).toFixed(1),
      concentration: parseFloat(data.avg_concentration || 0).toFixed(1),
      thinkingDepth: parseFloat(data.avg_thinking_depth || 0).toFixed(1),
      efficiency: parseFloat(data.efficiency_score || 0).toFixed(1),
      activities: parseInt(data.total_activities || 0)
    }));
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!analysisData || !analysisData.patterns) return [];

    const morning = analysisData.patterns.morning || {};
    const evening = analysisData.patterns.evening || {};

    return [
      {
        metric: '정확도 (Accuracy)',
        morning: parseFloat(morning.avg_accuracy || 0),
        evening: parseFloat(evening.avg_accuracy || 0)
      },
      {
        metric: '집중도 (Concentration)',
        morning: parseFloat(morning.avg_concentration || 0),
        evening: parseFloat(evening.avg_concentration || 0)
      },
      {
        metric: '사고 깊이 (Thinking Depth)',
        morning: parseFloat(morning.avg_thinking_depth || 0),
        evening: parseFloat(evening.avg_thinking_depth || 0)
      },
      {
        metric: '효율성 (Efficiency)',
        morning: parseFloat(morning.efficiency_score || 0),
        evening: parseFloat(evening.efficiency_score || 0)
      },
      {
        metric: '일관성 (Consistency)',
        morning: parseFloat(morning.consistency_score || 0),
        evening: parseFloat(evening.consistency_score || 0)
      }
    ];
  };

  // Render loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>분석 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard-error">
        <h3>오류 발생</h3>
        <p>{error}</p>
        <button onClick={fetchAnalysisData}>다시 시도</button>
      </div>
    );
  }

  // Render dashboard
  const chartData = getChartData();
  const radarData = getRadarData();
  const morningVsEvening = analysisData?.comparison?.morning_vs_evening || {};

  return (
    <div className="thinking-pattern-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🧠 사고력 패턴 분석 대시보드</h1>
        <p>아침·저녁 학습 성과 비교 분석</p>
      </header>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <label>
          시작일:
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </label>
        <label>
          종료일:
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </label>
        <button onClick={triggerAnalysis} className="btn-primary">
          분석 실행
        </button>
      </div>

      {/* Key Insights */}
      {analysisData?.comparison?.overall_best_time && (
        <div className="key-insights">
          <div className="insight-card">
            <h3>📊 최적 학습 시간대</h3>
            <div className="insight-value">
              {analysisData.comparison.overall_best_time.toUpperCase()}
            </div>
            <p>가장 높은 학습 효율을 보이는 시간대입니다.</p>
          </div>

          {morningVsEvening.better_time && morningVsEvening.better_time !== 'similar' && (
            <div className="insight-card">
              <h3>🌅 아침 vs 🌆 저녁</h3>
              <div className="insight-value">
                {morningVsEvening.better_time === 'morning' ? '아침' : '저녁'}
              </div>
              <p>
                {morningVsEvening.confidence}% 신뢰도로{' '}
                {morningVsEvening.better_time === 'morning' ? '아침' : '저녁'}에
                더 나은 성과를 보입니다.
              </p>
            </div>
          )}

          {morningVsEvening.accuracy_difference && (
            <div className="insight-card">
              <h3>🎯 정확도 차이</h3>
              <div className="insight-value">
                {morningVsEvening.accuracy_difference > 0 ? '+' : ''}
                {morningVsEvening.accuracy_difference.toFixed(1)}%
              </div>
              <p>
                아침이 저녁보다{' '}
                {Math.abs(morningVsEvening.accuracy_difference).toFixed(1)}%{' '}
                {morningVsEvening.accuracy_difference > 0 ? '높습니다' : '낮습니다'}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        {/* Performance by Time of Day */}
        <div className="chart-container">
          <h2>시간대별 학습 성과</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeOfDay" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" name="정확도 (%)" />
              <Bar dataKey="concentration" fill="#82ca9d" name="집중도 (%)" />
              <Bar dataKey="efficiency" fill="#ffc658" name="효율성 (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Morning vs Evening Radar Chart */}
        <div className="chart-container">
          <h2>아침 vs 저녁 비교 (레이더 차트)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="아침 (Morning)"
                dataKey="morning"
                stroke="#ff7300"
                fill="#ff7300"
                fillOpacity={0.5}
              />
              <Radar
                name="저녁 (Evening)"
                dataKey="evening"
                stroke="#387908"
                fill="#387908"
                fillOpacity={0.5}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Count */}
        <div className="chart-container">
          <h2>시간대별 활동 수</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeOfDay" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activities" fill="#8884d8" name="활동 수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      {analysisData?.recommendations && analysisData.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2>💡 맞춤 학습 제안</h2>
          <div className="recommendations-list">
            {analysisData.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`recommendation-card priority-${rec.priority}`}
              >
                <h4>{rec.type.replace(/_/g, ' ').toUpperCase()}</h4>
                <p className="message-ko">{rec.message_ko}</p>
                <p className="message-en">{rec.message_en}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Statistics Table */}
      <div className="statistics-table">
        <h2>📈 상세 통계</h2>
        <table>
          <thead>
            <tr>
              <th>시간대</th>
              <th>활동 수</th>
              <th>평균 정확도</th>
              <th>평균 집중도</th>
              <th>사고 깊이</th>
              <th>효율성</th>
              <th>완료율</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(analysisData?.patterns || {}).map(([time, data]) => (
              <tr key={time}>
                <td>{time.toUpperCase()}</td>
                <td>{data.total_activities || 0}</td>
                <td>{parseFloat(data.avg_accuracy || 0).toFixed(1)}%</td>
                <td>{parseFloat(data.avg_concentration || 0).toFixed(1)}%</td>
                <td>{parseFloat(data.avg_thinking_depth || 0).toFixed(1)}%</td>
                <td>{parseFloat(data.efficiency_score || 0).toFixed(1)}%</td>
                <td>{parseFloat(data.completion_rate || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThinkingPatternDashboard;
