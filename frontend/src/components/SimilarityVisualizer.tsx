import React, { useState, useEffect } from 'react';
import { SimilarityProblem, SimilarityAnalysis } from '../types';
import { api } from '../api/client';
import GeometricCanvas from './GeometricCanvas';

interface SimilarityVisualizerProps {
    problem?: SimilarityProblem;
}

const SimilarityVisualizer: React.FC<SimilarityVisualizerProps> = ({ problem }) => {
    const [analysis, setAnalysis] = useState<SimilarityAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRatios, setShowRatios] = useState(true);
    const [animationScale, setAnimationScale] = useState(1);

    useEffect(() => {
        if (problem && problem.shape_a_id && problem.shape_b_id) {
            analyzeProblem();
        }
    }, [problem]);

    // Animation effect for similarity highlighting
    useEffect(() => {
        if (analysis?.is_similar) {
            let scale = 1;
            let direction = 1;
            const interval = setInterval(() => {
                scale += direction * 0.02;
                if (scale > 1.1) direction = -1;
                if (scale < 0.9) direction = 1;
                setAnimationScale(scale);
            }, 50);

            return () => clearInterval(interval);
        } else {
            setAnimationScale(1);
        }
    }, [analysis?.is_similar]);

    const analyzeProblem = async () => {
        if (!problem || !problem.shape_a_id || !problem.shape_b_id) return;

        setLoading(true);
        try {
            const result = await api.analyzeSimilarity(problem.shape_a_id, problem.shape_b_id);
            setAnalysis(result);
        } catch (error) {
            console.error('Failed to analyze similarity:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!problem || !problem.shape_a_vertices || !problem.shape_b_vertices) {
        return (
            <div className="p-6 text-center text-gray-500">
                문제를 선택해주세요
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{problem.title}</h2>
                {problem.description && (
                    <p className="text-gray-600 text-sm">{problem.description}</p>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showRatios}
                        onChange={(e) => setShowRatios(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700 font-medium">변의 길이 표시</span>
                </label>
            </div>

            {/* Geometric Shapes */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                        도형 A: {problem.shape_a_name}
                    </h3>
                    <GeometricCanvas
                        vertices={problem.shape_a_vertices}
                        color="#3b82f6"
                        fillColor="rgba(59, 130, 246, 0.15)"
                        showLabels={true}
                        highlightRatios={showRatios}
                        label="A"
                        scale={1}
                    />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                        도형 B: {problem.shape_b_name}
                    </h3>
                    <GeometricCanvas
                        vertices={problem.shape_b_vertices}
                        color="#8b5cf6"
                        fillColor="rgba(139, 92, 246, 0.15)"
                        showLabels={true}
                        highlightRatios={showRatios}
                        label="B"
                        scale={analysis?.is_similar ? animationScale : 1}
                    />
                </div>
            </div>

            {/* Analysis Result */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">분석 중...</p>
                </div>
            ) : analysis ? (
                <div
                    className={`rounded-lg shadow-md p-6 ${
                        analysis.is_similar
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-400'
                    }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">
                            {analysis.is_similar ? '✓ 닮은 도형입니다!' : '✗ 닮은 도형이 아닙니다'}
                        </h3>
                        {analysis.is_similar && (
                            <span className="text-4xl animate-pulse">✨</span>
                        )}
                    </div>

                    {analysis.is_similar && (
                        <div className="space-y-3">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600">닮음 유형</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {analysis.similarity_type}
                                    {analysis.similarity_type === 'SSS' && ' (세 변의 비)'}
                                    {analysis.similarity_type === 'AA' && ' (두 각의 크기)'}
                                    {analysis.similarity_type === 'SAS' && ' (두 변과 그 사이각)'}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600">닮음비</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    1 : {analysis.similarity_ratio?.toFixed(2)}
                                </p>
                            </div>

                            {analysis.side_ratios && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-2">변의 비율</p>
                                    <div className="flex gap-2">
                                        {analysis.side_ratios.map((ratio, idx) => (
                                            <div key={idx} className="bg-blue-100 px-3 py-2 rounded-md">
                                                <span className="font-mono font-semibold text-blue-800">
                                                    {ratio.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-600">신뢰도</p>
                                <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                                    <div
                                        className="bg-green-500 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${analysis.confidence * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-sm font-semibold mt-1">
                                    {(analysis.confidence * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {!analysis.is_similar && analysis.angle_differences && (
                        <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                            <p className="text-sm text-gray-600 mb-2">각도 차이</p>
                            <div className="flex gap-2">
                                {analysis.angle_differences.map((diff, idx) => (
                                    <div key={idx} className="bg-red-100 px-3 py-2 rounded-md">
                                        <span className="font-mono font-semibold text-red-800">
                                            {diff.toFixed(1)}°
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default SimilarityVisualizer;
