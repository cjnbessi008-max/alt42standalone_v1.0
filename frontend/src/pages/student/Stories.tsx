import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { studentApi } from '@/lib/api';
import { Story } from '@/types';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/utils';

export default function Stories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await studentApi.getAvailableStories();
      setStories(data);
    } catch (error) {
      toast.error('스토리 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStories = stories.filter((story) => {
    if (filter === 'completed') return story.progress?.completed;
    if (filter === 'incomplete') return !story.progress?.completed;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">학습 스토리</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'incomplete' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            진행중
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            완료
          </button>
        </div>
      </div>

      {filteredStories.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">스토리가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div key={story.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{story.title}</h3>
                {story.progress?.completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                )}
              </div>

              {story.problem && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">과목:</span>
                    <span className="font-medium text-gray-900">{story.problem.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">주제:</span>
                    <span className="font-medium text-gray-900">{story.problem.topic}</span>
                  </div>
                  <div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                        story.problem.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(story.problem.difficulty)}
                    </span>
                  </div>
                </div>
              )}

              {story.progress && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">시도 횟수:</span>
                    <span className="font-medium">{story.progress.attempts}회</span>
                  </div>
                  {story.progress.timeSpent > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">소요 시간:</span>
                      <span className="font-medium">{story.progress.timeSpent}초</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate(`/student/story/${story.id}`)}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>{story.progress?.completed ? '다시 하기' : '시작하기'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
