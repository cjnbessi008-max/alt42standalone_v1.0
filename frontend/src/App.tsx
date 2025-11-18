import { useState, useEffect } from 'react';
import { SimilarityProblem } from './types';
import { api } from './api/client';
import SmartphoneFrame from './components/SmartphoneFrame';
import SimilarityVisualizer from './components/SimilarityVisualizer';

function App() {
    const [problems, setProblems] = useState<SimilarityProblem[]>([]);
    const [selectedProblem, setSelectedProblem] = useState<SimilarityProblem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProblems();
    }, []);

    const loadProblems = async () => {
        try {
            setLoading(true);
            const data = await api.getAllProblems();
            setProblems(data);
            if (data.length > 0) {
                setSelectedProblem(data[0]);
            }
            setError(null);
        } catch (err) {
            console.error('Failed to load problems:', err);
            setError('문제를 불러오는데 실패했습니다. 서버가 실행 중인지 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8">
            {/* Desktop view */}
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        닮음 인사이트
                    </h1>
                    <p className="text-xl text-white/90">
                        Similarity Insight - 기하학적 닮음 관계 분석 도구
                    </p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
                        <p className="font-bold">오류</p>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                        <p className="mt-6 text-xl text-gray-600">로딩 중...</p>
                    </div>
                ) : (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">문제 선택</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {problems.map((problem) => (
                                    <button
                                        key={problem.id}
                                        onClick={() => setSelectedProblem(problem)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                            selectedProblem?.id === problem.id
                                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                                        }`}
                                    >
                                        <h3 className="font-bold text-lg text-gray-800">
                                            {problem.title}
                                        </h3>
                                        {problem.description && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {problem.description}
                                            </p>
                                        )}
                                        <div className="flex gap-2 mt-3">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {problem.shape_a_name}
                                            </span>
                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                {problem.shape_b_name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {problems.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-600 text-lg">
                                    등록된 문제가 없습니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Smartphone display */}
            <SmartphoneFrame>
                <div className="h-full">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 text-center">
                        <h2 className="text-lg font-bold">닮음 인사이트</h2>
                        <p className="text-xs opacity-90">Similarity Analysis</p>
                    </div>

                    {selectedProblem ? (
                        <SimilarityVisualizer problem={selectedProblem} />
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            문제를 선택해주세요
                        </div>
                    )}
                </div>
            </SmartphoneFrame>
        </div>
    );
}

export default App;
