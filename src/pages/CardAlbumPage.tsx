import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';
import './CardAlbumPage.css';

export default function CardAlbumPage() {
  const navigate = useNavigate();
  const { collectedCards, playerStats } = useGameStore();

  const statsArray = [
    { key: 'creativity', name: '창의성', value: playerStats.creativity },
    { key: 'intuition', name: '직관', value: playerStats.intuition },
    { key: 'persistence', name: '집착', value: playerStats.persistence },
    { key: 'logic', name: '논리', value: playerStats.logic },
    { key: 'imagination', name: '상상력', value: playerStats.imagination },
  ];

  const maxStat = Math.max(...statsArray.map((s) => s.value), 1);
  const dominantStat = statsArray.reduce((prev, current) =>
    current.value > prev.value ? current : prev
  );

  return (
    <div className="album-page">
      <motion.div
        className="album-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="back-button" onClick={() => navigate('/')}>
          ← 돌아가기
        </button>
        <h1>카드 앨범</h1>
        <p className="collection-count">
          수집: {collectedCards.length} / 7 카드
        </p>
      </motion.div>

      <div className="album-content">
        <div className="stats-panel">
          <h2>나의 수학사 성향</h2>

          <div className="radar-chart">
            <svg viewBox="0 0 200 200">
              {/* Background grid */}
              <g className="grid">
                {[1, 2, 3, 4, 5].map((level) => {
                  const radius = (level / 5) * 80;
                  const points = statsArray
                    .map((_, index) => {
                      const angle = (index * 2 * Math.PI) / statsArray.length - Math.PI / 2;
                      const x = 100 + radius * Math.cos(angle);
                      const y = 100 + radius * Math.sin(angle);
                      return `${x},${y}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={level}
                      points={points}
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>

              {/* Data polygon */}
              <polygon
                points={statsArray
                  .map((stat, index) => {
                    const angle = (index * 2 * Math.PI) / statsArray.length - Math.PI / 2;
                    const radius = (stat.value / maxStat) * 80;
                    const x = 100 + radius * Math.cos(angle);
                    const y = 100 + radius * Math.sin(angle);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="rgba(255,215,0,0.3)"
                stroke="var(--gold)"
                strokeWidth="2"
              />

              {/* Axis labels */}
              {statsArray.map((stat, index) => {
                const angle = (index * 2 * Math.PI) / statsArray.length - Math.PI / 2;
                const x = 100 + 95 * Math.cos(angle);
                const y = 100 + 95 * Math.sin(angle);
                return (
                  <text
                    key={stat.key}
                    x={x}
                    y={y}
                    fill="var(--text-light)"
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {stat.name}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="stats-summary">
            <p className="dominant-stat">
              그대는 <span className="highlight">"{dominantStat.name}"</span>의 수호자로구나.
            </p>
            <div className="stats-list-horizontal">
              {statsArray.map((stat) => (
                <div key={stat.key} className="stat-bar">
                  <span className="stat-label">{stat.name}</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${(stat.value / maxStat) * 100}%` }}
                    />
                  </div>
                  <span className="stat-number">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cards-grid">
          {collectedCards.length === 0 ? (
            <div className="empty-state">
              <p>아직 수집한 카드가 없습니다.</p>
              <p>여정을 시작하여 카드를 모아보세요!</p>
              <button className="start-journey-button" onClick={() => navigate('/game')}>
                여정 시작하기
              </button>
            </div>
          ) : (
            collectedCards.map((card) => (
              <motion.div
                key={card.id}
                className="collected-card"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="card-era">{card.era}</div>
                <h3 className="card-title">{card.title}</h3>
                <div className="card-visual-placeholder">
                  {card.mathematician && <p className="mathematician">{card.mathematician}</p>}
                </div>
                <p className="card-description">{card.description}</p>
                <div className="card-stats">
                  {Object.entries(card.statsGained).map(([stat, value]) => {
                    const statNames: Record<string, string> = {
                      creativity: '창의성',
                      intuition: '직관',
                      persistence: '집착',
                      logic: '논리',
                      imagination: '상상력',
                    };
                    return (
                      <span key={stat} className="stat-badge">
                        {statNames[stat]} +{value}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
