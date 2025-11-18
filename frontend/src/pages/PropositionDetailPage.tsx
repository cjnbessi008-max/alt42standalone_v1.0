import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Proposition, Counterexample, CreateCounterexampleRequest } from '../types';
import { propositionsApi, counterexamplesApi } from '../services/api';
import CounterexampleShadow from '../components/CounterexampleShadow/CounterexampleShadow';
import VirtualPhone from '../components/VirtualPhone/VirtualPhone';
import './PropositionDetailPage.css';

const PropositionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [counterexamples, setCounterexamples] = useState<Counterexample[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCounterexample, setNewCounterexample] = useState<CreateCounterexampleRequest>({
    value: '',
    explanation: '',
    visualPosition: { x: 50, y: 50 },
    shadowIntensity: 0.8,
  });

  useEffect(() => {
    if (id) {
      loadProposition(id);
    }
  }, [id]);

  const loadProposition = async (propId: string) => {
    try {
      setLoading(true);
      const data = await propositionsApi.getById(propId);
      setProposition(data);
      setCounterexamples(data.counterexamples || []);
    } catch (err) {
      console.error('Failed to load proposition:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCounterexample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const created = await counterexamplesApi.create(id, newCounterexample);
      setCounterexamples((prev) => [...prev, created]);
      setShowAddForm(false);
      setNewCounterexample({
        value: '',
        explanation: '',
        visualPosition: { x: 50, y: 50 },
        shadowIntensity: 0.8,
      });
    } catch (err) {
      alert('반례 추가에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDeleteCounterexample = async (ceId: string) => {
    if (!confirm('이 반례를 삭제하시겠습니까?')) return;

    try {
      await counterexamplesApi.delete(ceId);
      setCounterexamples((prev) => prev.filter((ce) => ce.id !== ceId));
    } catch (err) {
      alert('삭제에 실패했습니다.');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="proposition-detail-page loading">로딩 중...</div>;
  }

  if (!proposition) {
    return (
      <div className="proposition-detail-page error">
        <p>명제를 찾을 수 없습니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="proposition-detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← 목록으로
        </Link>
        <h1>{proposition.title}</h1>
        <p className="statement">{proposition.statement}</p>
        <div className="meta">
          <span className="domain">정의역: {proposition.domain}</span>
          <span className={`badge badge-${proposition.type}`}>
            {getTypeLabel(proposition.type)}
          </span>
          {proposition.truthValue !== null && (
            <span className={`truth-value ${proposition.truthValue ? 'true' : 'false'}`}>
              {proposition.truthValue ? '참' : '거짓'}
            </span>
          )}
        </div>
      </div>

      <div className="visualization-section">
        <h2>시각화</h2>
        <CounterexampleShadow
          counterexamples={counterexamples}
          config={proposition.visualConfig}
          width={800}
          height={500}
        />
      </div>

      <div className="counterexamples-section">
        <div className="section-header">
          <h2>반례 목록</h2>
          <button
            className="btn-add"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '취소' : '반례 추가'}
          </button>
        </div>

        {showAddForm && (
          <form className="add-counterexample-form" onSubmit={handleAddCounterexample}>
            <div className="form-row">
              <div className="form-group">
                <label>값</label>
                <input
                  type="text"
                  value={newCounterexample.value}
                  onChange={(e) =>
                    setNewCounterexample((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder="예: 2"
                  required
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  value={newCounterexample.explanation}
                  onChange={(e) =>
                    setNewCounterexample((prev) => ({ ...prev, explanation: e.target.value }))
                  }
                  placeholder="예: 2는 유일한 짝수 소수입니다"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>위치 X (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCounterexample.visualPosition?.x || 50}
                  onChange={(e) =>
                    setNewCounterexample((prev) => ({
                      ...prev,
                      visualPosition: {
                        ...prev.visualPosition!,
                        x: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>위치 Y (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCounterexample.visualPosition?.y || 50}
                  onChange={(e) =>
                    setNewCounterexample((prev) => ({
                      ...prev,
                      visualPosition: {
                        ...prev.visualPosition!,
                        y: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>그림자 강도 (0-1)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={newCounterexample.shadowIntensity}
                  onChange={(e) =>
                    setNewCounterexample((prev) => ({
                      ...prev,
                      shadowIntensity: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">
              추가
            </button>
          </form>
        )}

        {counterexamples.length === 0 ? (
          <p className="empty-message">아직 추가된 반례가 없습니다.</p>
        ) : (
          <div className="counterexamples-list">
            {counterexamples.map((ce) => (
              <div key={ce.id} className="counterexample-item">
                <div className="ce-content">
                  <strong className="ce-value">{String(ce.value)}</strong>
                  <p className="ce-explanation">{ce.explanation}</p>
                  <div className="ce-meta">
                    위치: ({ce.visualPosition.x}, {ce.visualPosition.y}) | 강도:{' '}
                    {ce.shadowIntensity}
                  </div>
                </div>
                <button
                  className="btn-delete-ce"
                  onClick={() => handleDeleteCounterexample(ce.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Virtual Phone Display */}
      <VirtualPhone>
        <div className="phone-content">
          <h3>{proposition.title}</h3>
          <CounterexampleShadow
            counterexamples={counterexamples}
            config={proposition.visualConfig}
            width={351}
            height={400}
          />
        </div>
      </VirtualPhone>
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

export default PropositionDetailPage;
