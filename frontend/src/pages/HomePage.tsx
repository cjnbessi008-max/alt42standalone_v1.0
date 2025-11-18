import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Proposition } from '../types';
import { propositionsApi } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPropositions();
  }, []);

  const loadPropositions = async () => {
    try {
      setLoading(true);
      const data = await propositionsApi.getAll();
      setPropositions(data);
    } catch (err) {
      setError('명제 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await propositionsApi.delete(id);
      setPropositions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('삭제에 실패했습니다.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>Counterexample Shadow</h1>
        <p className="subtitle">명제의 반례를 어두운 그림자로 시각화</p>
        <Link to="/create" className="btn-create">
          새 명제 만들기
        </Link>
      </header>

      {propositions.length === 0 ? (
        <div className="empty-state">
          <p>아직 생성된 명제가 없습니다.</p>
          <Link to="/create" className="btn-create-inline">
            첫 번째 명제 만들기
          </Link>
        </div>
      ) : (
        <div className="propositions-grid">
          {propositions.map((prop) => (
            <div key={prop.id} className="proposition-card">
              <div className="card-header">
                <h3>{prop.title}</h3>
                <span className={`badge badge-${prop.type}`}>
                  {getTypeLabel(prop.type)}
                </span>
              </div>
              <p className="statement">{prop.statement}</p>
              <div className="card-meta">
                <span className="domain">정의역: {prop.domain}</span>
                {prop.truthValue !== null && (
                  <span className={`truth-value ${prop.truthValue ? 'true' : 'false'}`}>
                    {prop.truthValue ? '참' : '거짓'}
                  </span>
                )}
              </div>
              <div className="card-actions">
                <Link to={`/proposition/${prop.id}`} className="btn-view">
                  보기
                </Link>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(prop.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    universal: '전칭 ∀',
    existential: '존재 ∃',
    conditional: '조건 →',
    biconditional: '쌍조건 ↔',
  };
  return labels[type] || type;
}

export default HomePage;
