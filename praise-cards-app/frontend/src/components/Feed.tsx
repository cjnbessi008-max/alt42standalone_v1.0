import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import PraiseCard from './PraiseCard';
import { praiseCardsApi } from '@/services/api';
import './Feed.css';

interface FeedProps {
  studentId?: string;
  currentStudentId?: string;
}

export default function Feed({ studentId, currentStudentId }: FeedProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['praise-cards-feed', studentId, page],
    queryFn: async () => {
      const response = await praiseCardsApi.getFeed(studentId, page, 20);
      return response.data;
    },
  });

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="feed-loading">
        <Loader2 size={32} className="spinner" />
        <p>칭찬 카드를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="feed-error">
        <AlertCircle size={32} />
        <p>카드를 불러오는 중 오류가 발생했습니다</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          다시 시도
        </button>
      </div>
    );
  }

  if (!data || data.cards.length === 0) {
    return (
      <div className="feed-empty">
        <p>아직 칭찬 카드가 없어요</p>
        <p className="empty-subtitle">학습을 시작하면 자동으로 카드가 생성돼요!</p>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h2 className="feed-title">
          {studentId ? '내 칭찬 카드' : '모든 칭찬 카드'}
        </h2>
        <p className="feed-subtitle">
          총 {data.total}개의 카드
        </p>
      </div>

      <div className="feed-grid">
        {data.cards.map((card) => (
          <PraiseCard
            key={card.id}
            card={card}
            currentStudentId={currentStudentId}
            onLikeToggle={() => refetch()}
          />
        ))}
      </div>

      {data.has_more && (
        <div className="feed-pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            이전
          </button>
          <span className="page-indicator">
            페이지 {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!data.has_more}
            className="btn btn-secondary"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
