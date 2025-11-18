import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { problemApi, storyApi } from '@/lib/api';
import { Problem, Story } from '@/types';
import { BookOpen, FileText, Sparkles, Plus } from 'lucide-react';

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [problemsData, storiesData] = await Promise.all([
        problemApi.getAll(),
        storyApi.getAll(),
      ]);
      setProblems(problemsData);
      setStories(storiesData);
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const recentProblems = problems.slice(0, 5);
  const recentStories = stories.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">교육 콘텐츠 관리 및 현황을 확인하세요</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">총 문제 수</p>
              <p className="text-2xl font-bold text-gray-900">{problems.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">생성된 스토리</p>
              <p className="text-2xl font-bold text-gray-900">{stories.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">변환율</p>
              <p className="text-2xl font-bold text-gray-900">
                {problems.length > 0 ? Math.round((stories.length / problems.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Problems */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">최근 문제</h2>
          <Link to="/teacher/problems" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            전체 보기 →
          </Link>
        </div>

        {recentProblems.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">아직 생성된 문제가 없습니다</p>
            <Link to="/teacher/problems/new" className="btn btn-primary inline-flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>첫 문제 만들기</span>
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-gray-200">
            {recentProblems.map((problem) => (
              <Link
                key={problem.id}
                to={`/teacher/problems/${problem.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{problem.question}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {problem.subject} · {problem.topic}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {new Date(problem.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Stories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">최근 스토리</h2>
          <Link to="/teacher/stories" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            전체 보기 →
          </Link>
        </div>

        {recentStories.length === 0 ? (
          <div className="card text-center py-8">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">아직 생성된 스토리가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStories.map((story) => (
              <Link
                key={story.id}
                to={`/teacher/stories/${story.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{story.title}</h3>
                <p className="text-sm text-gray-600">생성 시간: {story.generationTime}ms</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(story.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
