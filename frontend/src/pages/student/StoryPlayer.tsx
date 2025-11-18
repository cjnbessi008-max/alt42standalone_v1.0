import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { storyApi, studentApi } from '@/lib/api';
import { Story, StoryScene } from '@/types';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function StoryPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      const data = await storyApi.getById(id!);
      setStory(data);
      await studentApi.startStory(id!);
    } catch (error: any) {
      toast.error('스토리를 불러오는데 실패했습니다');
      navigate('/student/stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    if (showFeedback) return;
    setSelectedChoice(choiceId);
    setShowFeedback(true);
    setChoicesMade([...choicesMade, choiceId]);
  };

  const handleNext = () => {
    if (!story || !selectedChoice) return;

    const currentScene = story.storyData.scenes[currentSceneIndex];
    const choice = currentScene.choices.find((c) => c.id === selectedChoice);

    if (!choice) return;

    if (choice.nextScene) {
      const nextSceneIndex = story.storyData.scenes.findIndex((s) => s.id === choice.nextScene);
      if (nextSceneIndex !== -1) {
        setCurrentSceneIndex(nextSceneIndex);
        setSelectedChoice(null);
        setShowFeedback(false);
      }
    } else {
      completeStory(choice.isCorrect);
    }
  };

  const completeStory = async (isCorrect: boolean) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await studentApi.completeStory(id!, {
        choicesMade,
        isCorrect,
        timeSpent,
      });

      setIsComplete(true);
      toast.success(isCorrect ? '정답입니다! 🎉' : '아쉽네요. 다시 도전해보세요!');
    } catch (error) {
      toast.error('결과 저장에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!story) return null;

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="card text-center">
          <div className="mb-4">
            {choicesMade.some((id) =>
              story.storyData.scenes
                .flatMap((s) => s.choices)
                .find((c) => c.id === id)?.isCorrect
            ) ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-4">스토리 완료!</h2>
          <p className="text-gray-600 mb-6">
            소요 시간: {Math.floor((Date.now() - startTime) / 1000)}초
          </p>
          <div className="space-x-4">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              다시 하기
            </button>
            <button onClick={() => navigate('/student/stories')} className="btn btn-secondary">
              목록으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentScene = story.storyData.scenes[currentSceneIndex];
  const selectedChoiceObj = currentScene.choices.find((c) => c.id === selectedChoice);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{story.storyData.title}</h1>
        <p className="mt-2 text-gray-600">{story.storyData.context}</p>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600">
                {story.storyData.character.name[0]}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{story.storyData.character.name}</h3>
              <p className="text-sm text-gray-500">{story.storyData.character.role}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 mb-2">{currentScene.narration}</p>
            <p className="text-gray-900 font-medium italic">"{currentScene.dialogue}"</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 mb-2">어떻게 대답하시겠습니까?</h4>
          {currentScene.choices.map((choice) => {
            const isSelected = choice.id === selectedChoice;
            const showCorrect = showFeedback && choice.isCorrect;
            const showIncorrect = showFeedback && isSelected && !choice.isCorrect;

            return (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice.id)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                  showCorrect ? 'border-green-500 bg-green-50' : ''
                } ${showIncorrect ? 'border-red-500 bg-red-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-gray-900 flex-1">{choice.text}</p>
                  {showCorrect && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />}
                  {showIncorrect && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />}
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && selectedChoiceObj && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              selectedChoiceObj.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`font-medium mb-2 ${
                selectedChoiceObj.isCorrect ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {selectedChoiceObj.isCorrect ? '✓ 정답입니다!' : '✗ 아쉽네요...'}
            </p>
            <p className={selectedChoiceObj.isCorrect ? 'text-green-800' : 'text-red-800'}>
              {selectedChoiceObj.feedback}
            </p>
            <button onClick={handleNext} className="mt-4 btn btn-primary flex items-center space-x-2">
              <span>{selectedChoiceObj.nextScene ? '다음 장면' : '완료'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          장면 {currentSceneIndex + 1} / {story.storyData.scenes.length}
        </span>
        <span>소요 시간: {Math.floor((Date.now() - startTime) / 1000)}초</span>
      </div>
    </div>
  );
}
