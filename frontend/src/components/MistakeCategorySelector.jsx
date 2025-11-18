import { useState, useEffect } from 'react';
import { mistakeCategoriesAPI } from '../api';

function MistakeCategorySelector({ attemptId, suggestedCategories, onComplete, onSkip }) {
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await mistakeCategoriesAPI.getAll();
      if (response.data.success) {
        setAllCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('실수 카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      alert('최소 1개의 실수 유형을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await mistakeCategoriesAPI.submit({
        attempt_id: attemptId,
        category_ids: selectedCategories,
      });

      if (response.data.success) {
        alert('실수 유형이 저장되었습니다!');
        onComplete();
      }
    } catch (error) {
      console.error('Failed to submit categories:', error);
      alert('실수 유형 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuggested = (categoryId) => {
    return suggestedCategories?.some((cat) => cat.id === categoryId);
  };

  const getSuggestionReason = (categoryId) => {
    const suggested = suggestedCategories?.find((cat) => cat.id === categoryId);
    return suggested?.reason;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">실수 카테고리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            실수 유형을 선택해주세요
          </h2>
          <p className="text-gray-600">
            당신의 실수가 어떤 유형에 해당하는지 선택하면 맞춤형 학습을 제공합니다.
          </p>
        </div>

        {suggestedCategories && suggestedCategories.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">💡</span>
              <h3 className="font-semibold text-blue-900">AI 추천 실수 유형</h3>
            </div>
            <p className="text-sm text-blue-700">
              답변 분석 결과 다음 유형일 가능성이 높습니다:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {category.icon} {category.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {allCategories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const suggested = isSuggested(category.id);
            const reason = getSuggestionReason(category.id);

            return (
              <div
                key={category.id}
                onClick={() => handleToggleCategory(category.id)}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
                  }
                  ${suggested ? 'ring-2 ring-yellow-400' : ''}
                `}
              >
                {suggested && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                      추천
                    </span>
                  </div>
                )}

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {category.name}
                      </h3>
                      {isSelected && (
                        <span className="ml-2 text-blue-500">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {category.description}
                    </p>
                    {suggested && reason && (
                      <p className="text-xs text-yellow-700 italic">
                        추천 이유: {reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedCategories.length === 0}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            {submitting ? '저장 중...' : `선택 완료 (${selectedCategories.length}개)`}
          </button>
          <button
            onClick={onSkip}
            disabled={submitting}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            건너뛰기
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          실수 유형을 분석하여 당신에게 맞는 학습 자료를 추천합니다
        </p>
      </div>
    </div>
  );
}

export default MistakeCategorySelector;
