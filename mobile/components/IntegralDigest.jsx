/**
 * Integral Digest Mobile Component
 * 적분 문제 전체 구조를 요약해서 보여주는 모바일 UI 컴포넌트
 * 우측 하단 가상 스마트폰 화면에 표시
 *
 * @package Alt42 Education System
 * @copyright 2025
 */

import React, { useState, useEffect } from 'react';
import './IntegralDigest.css';

/**
 * 적분 문제 다이제스트 메인 컴포넌트
 */
const IntegralDigest = ({ problemId, apiEndpoint }) => {
    const [digest, setDigest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        expression: true,
        visualization: false,
        solution: false,
        learning: false
    });

    // 다이제스트 데이터 로드
    useEffect(() => {
        loadDigest();
    }, [problemId]);

    const loadDigest = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${apiEndpoint}?action=get_digest&problem_id=${problemId}&format=mobile`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                setDigest(data.data);
            } else {
                setError(data.error.message);
            }
        } catch (err) {
            setError('데이터를 불러오는데 실패했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) {
        return (
            <div className="integral-digest-mobile loading">
                <div className="loading-spinner"></div>
                <p>문제 다이제스트를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="integral-digest-mobile error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={loadDigest}>다시 시도</button>
            </div>
        );
    }

    if (!digest) {
        return null;
    }

    return (
        <div className="integral-digest-mobile">
            {/* 헤더 */}
            <DigestHeader title={digest.title} problemId={digest.problem_id} />

            {/* 스크롤 가능한 컨텐츠 영역 */}
            <div className="digest-content">

                {/* 문제 개요 섹션 */}
                <CollapsibleSection
                    title="📊 문제 개요"
                    isExpanded={expandedSections.overview}
                    onToggle={() => toggleSection('overview')}
                >
                    <OverviewSection overview={digest.overview} />
                </CollapsibleSection>

                {/* 수학적 표현 섹션 */}
                <CollapsibleSection
                    title="📐 수학적 표현"
                    isExpanded={expandedSections.expression}
                    onToggle={() => toggleSection('expression')}
                >
                    <MathExpressionSection
                        expression={digest.mathematical_expression}
                        keyConcepts={digest.key_concepts}
                    />
                </CollapsibleSection>

                {/* 시각화 섹션 */}
                <CollapsibleSection
                    title="📈 시각화"
                    isExpanded={expandedSections.visualization}
                    onToggle={() => toggleSection('visualization')}
                >
                    <VisualizationSection visualization={digest.visualization} />
                </CollapsibleSection>

                {/* 해법 다이제스트 섹션 */}
                <CollapsibleSection
                    title="💡 해법 요약"
                    isExpanded={expandedSections.solution}
                    onToggle={() => toggleSection('solution')}
                    badge="정답 포함"
                >
                    <SolutionDigestSection solution={digest.solution_digest} />
                </CollapsibleSection>

                {/* 학습 가이드 섹션 */}
                <CollapsibleSection
                    title="📚 학습 가이드"
                    isExpanded={expandedSections.learning}
                    onToggle={() => toggleSection('learning')}
                >
                    <LearningGuideSection guide={digest.learning_guide} />
                </CollapsibleSection>

                {/* 통계 섹션 */}
                <StatisticsSection statistics={digest.statistics} />
            </div>

            {/* 하단 네비게이션 */}
            <DigestFooter />
        </div>
    );
};

/**
 * 헤더 컴포넌트
 */
const DigestHeader = ({ title, problemId }) => {
    return (
        <div className="digest-header">
            <div className="header-top">
                <button className="back-button">←</button>
                <h1 className="digest-title">{title}</h1>
                <button className="menu-button">⋮</button>
            </div>
            <div className="header-subtitle">
                <span className="problem-id">문제 ID: {problemId.substring(0, 8)}...</span>
            </div>
        </div>
    );
};

/**
 * 접을 수 있는 섹션 컴포넌트
 */
const CollapsibleSection = ({ title, isExpanded, onToggle, badge, children }) => {
    return (
        <div className={`collapsible-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={onToggle}>
                <h2 className="section-title">
                    {title}
                    {badge && <span className="section-badge">{badge}</span>}
                </h2>
                <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            </div>
            {isExpanded && (
                <div className="section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

/**
 * 문제 개요 섹션
 */
const OverviewSection = ({ overview }) => {
    return (
        <div className="overview-section">
            <div className="overview-card">
                <div className="overview-item">
                    <span className="label">문제 유형:</span>
                    <span className="value type">{overview.type}</span>
                </div>

                <div className="overview-item">
                    <span className="label">난이도:</span>
                    <div className="difficulty-display">
                        <span className="stars">{overview.difficulty.stars}</span>
                        <span className="level">Level {overview.difficulty.level}</span>
                    </div>
                </div>

                <div className="overview-item">
                    <span className="label">예상 시간:</span>
                    <span className="value time">⏱️ {overview.time_estimate}</span>
                </div>
            </div>

            <div className="concept-box">
                <h3>핵심 개념</h3>
                <p>{overview.concept}</p>
            </div>

            {overview.difficulty.explanation && (
                <div className="difficulty-explanation">
                    <small>{overview.difficulty.explanation}</small>
                </div>
            )}
        </div>
    );
};

/**
 * 수학적 표현 섹션
 */
const MathExpressionSection = ({ expression, keyConcepts }) => {
    return (
        <div className="math-expression-section">
            {/* LaTeX 수식 */}
            <div className="latex-display">
                <div className="latex-formula" dangerouslySetInnerHTML={{
                    __html: renderLatex(expression.latex)
                }} />
            </div>

            {/* 상세 정보 */}
            <div className="expression-details">
                <div className="detail-item">
                    <span className="label">피적분함수:</span>
                    <code className="value">{expression.integrand}</code>
                </div>

                {expression.bounds.lower && expression.bounds.upper && (
                    <div className="detail-item">
                        <span className="label">적분 구간:</span>
                        <span className="value bounds">
                            [{expression.bounds.lower}, {expression.bounds.upper}]
                        </span>
                    </div>
                )}

                <div className="detail-item">
                    <span className="label">적분 변수:</span>
                    <span className="value variable">{expression.variable}</span>
                </div>
            </div>

            {/* 핵심 개념 태그 */}
            {keyConcepts && keyConcepts.length > 0 && (
                <div className="key-concepts-tags">
                    <h4>필요한 개념:</h4>
                    <div className="concept-tags">
                        {keyConcepts.map((concept, index) => (
                            <span key={index} className="concept-tag">
                                {concept}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * 시각화 섹션
 */
const VisualizationSection = ({ visualization }) => {
    return (
        <div className="visualization-section">
            <div className="graph-container">
                {visualization.type === 'graph' && (
                    <GraphVisualization config={visualization.config} />
                )}
                {visualization.has_animation && (
                    <div className="animation-controls">
                        <button className="play-button">▶ 애니메이션 재생</button>
                    </div>
                )}
            </div>

            <div className="visualization-legend">
                <div className="legend-item">
                    <span className="color-box function"></span>
                    <span>함수 그래프</span>
                </div>
                {visualization.config.features.show_shaded_area && (
                    <div className="legend-item">
                        <span className="color-box shaded"></span>
                        <span>적분 영역</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * 그래프 시각화 (SVG 기반)
 */
const GraphVisualization = ({ config }) => {
    return (
        <div className="graph-svg-container">
            <svg viewBox="0 0 400 300" className="graph-svg">
                {/* 그리드 */}
                {config.features.show_grid && <GridLines />}

                {/* 축 */}
                {config.features.show_axes && <Axes />}

                {/* 함수 그래프 (실제 구현에서는 데이터 기반으로 그림) */}
                {config.features.show_function && (
                    <path
                        d="M 50 250 Q 200 50 350 250"
                        stroke={config.colors.function}
                        strokeWidth="2"
                        fill="none"
                    />
                )}

                {/* 적분 영역 음영 */}
                {config.features.show_shaded_area && (
                    <path
                        d="M 100 250 Q 200 150 300 250 L 300 250 L 100 250 Z"
                        fill={config.colors.shaded_area}
                        stroke="none"
                    />
                )}

                {/* 경계선 */}
                {config.features.show_bounds && (
                    <>
                        <line x1="100" y1="50" x2="100" y2="250"
                              stroke={config.colors.bounds} strokeWidth="2" strokeDasharray="5,5" />
                        <line x1="300" y1="50" x2="300" y2="250"
                              stroke={config.colors.bounds} strokeWidth="2" strokeDasharray="5,5" />
                    </>
                )}
            </svg>
        </div>
    );
};

/**
 * 해법 다이제스트 섹션
 */
const SolutionDigestSection = ({ solution }) => {
    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div className="solution-digest-section">
            {/* 단계별 해법 */}
            <div className="solution-steps">
                <h4>단계별 해법</h4>
                {solution.steps.map((step, index) => (
                    <div key={index} className="solution-step">
                        <div className="step-header">
                            <span className="step-number">Step {step.step}</span>
                            <span className="step-action">{step.action}</span>
                        </div>
                        <div className="step-content">
                            <p className="step-description">{step.description}</p>
                            {step.formula && (
                                <div className="step-formula">
                                    <code>{step.formula}</code>
                                </div>
                            )}
                            {step.result && (
                                <div className="step-result">
                                    결과: <strong>{step.result}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 최종 답 (스포일러 방지) */}
            <div className="final-answer-box">
                <h4>최종 정답</h4>
                {!showAnswer ? (
                    <button
                        className="reveal-answer-button"
                        onClick={() => setShowAnswer(true)}
                    >
                        정답 보기 👁️
                    </button>
                ) : (
                    <div className="answer-revealed">
                        <div className="answer-value">{solution.final_answer}</div>
                    </div>
                )}
            </div>

            {/* 해법 설명 */}
            {solution.explanation && (
                <div className="solution-explanation">
                    <h4>해법 설명</h4>
                    <p>{solution.explanation}</p>
                </div>
            )}

            {/* 대안적 풀이법 */}
            {solution.alternative_methods && solution.alternative_methods.length > 0 && (
                <div className="alternative-methods">
                    <h4>다른 풀이 방법</h4>
                    {solution.alternative_methods.map((method, index) => (
                        <div key={index} className="alternative-method">
                            <h5>{method.name}</h5>
                            <p>{method.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * 학습 가이드 섹션
 */
const LearningGuideSection = ({ guide }) => {
    return (
        <div className="learning-guide-section">
            {/* 학습 목표 */}
            <div className="learning-objectives">
                <h4>📋 학습 목표</h4>
                <ul>
                    {guide.objectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                    ))}
                </ul>
            </div>

            {/* 선수 학습 */}
            <div className="prerequisites">
                <h4>🔧 필요한 선수 지식</h4>
                <div className="prerequisite-tags">
                    {guide.prerequisites.map((prereq, index) => (
                        <span key={index} className="prerequisite-tag">
                            {prereq}
                        </span>
                    ))}
                </div>
            </div>

            {/* 흔한 실수 */}
            <div className="common-mistakes">
                <h4>⚠️ 주의할 점</h4>
                {guide.common_mistakes.map((mistake, index) => (
                    <div key={index} className="mistake-card">
                        <div className="mistake-text">
                            <strong>실수:</strong> {mistake.mistake}
                        </div>
                        <div className="correction-text">
                            <strong>올바른 방법:</strong> {mistake.correction}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * 통계 섹션
 */
const StatisticsSection = ({ statistics }) => {
    if (statistics.total_attempts === 0) {
        return (
            <div className="statistics-section empty">
                <p>아직 통계 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="statistics-section">
            <h3>📊 학생들의 성과 통계</h3>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{statistics.avg_attempts.toFixed(1)}</div>
                    <div className="stat-label">평균 시도 횟수</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{statistics.success_rate.toFixed(0)}%</div>
                    <div className="stat-label">정답률</div>
                    <div className="stat-bar">
                        <div
                            className="stat-bar-fill"
                            style={{ width: `${statistics.success_rate}%` }}
                        ></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{statistics.avg_time_minutes}분</div>
                    <div className="stat-label">평균 소요 시간</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{statistics.total_attempts}</div>
                    <div className="stat-label">총 시도 횟수</div>
                </div>
            </div>
        </div>
    );
};

/**
 * 하단 네비게이션
 */
const DigestFooter = () => {
    return (
        <div className="digest-footer">
            <button className="footer-button">
                <span className="icon">📝</span>
                <span className="label">문제 풀기</span>
            </button>
            <button className="footer-button">
                <span className="icon">💡</span>
                <span className="label">힌트</span>
            </button>
            <button className="footer-button">
                <span className="icon">🔄</span>
                <span className="label">새로고침</span>
            </button>
        </div>
    );
};

/**
 * 헬퍼 함수들
 */

// LaTeX 렌더링 (MathJax 또는 KaTeX 사용)
const renderLatex = (latex) => {
    // 실제 구현에서는 MathJax나 KaTeX를 사용
    return `<span class="latex-rendered">$$${latex}$$</span>`;
};

// SVG 그리드 라인
const GridLines = () => {
    const lines = [];
    for (let i = 0; i <= 400; i += 40) {
        lines.push(
            <line key={`v${i}`} x1={i} y1="0" x2={i} y2="300"
                  stroke="#e0e0e0" strokeWidth="1" />
        );
    }
    for (let i = 0; i <= 300; i += 30) {
        lines.push(
            <line key={`h${i}`} x1="0" y1={i} x2="400" y2={i}
                  stroke="#e0e0e0" strokeWidth="1" />
        );
    }
    return <g className="grid-lines">{lines}</g>;
};

// SVG 축
const Axes = () => {
    return (
        <g className="axes">
            <line x1="50" y1="250" x2="350" y2="250"
                  stroke="#333" strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="250"
                  stroke="#333" strokeWidth="2" />
            <text x="360" y="255" fontSize="14">x</text>
            <text x="40" y="45" fontSize="14">y</text>
        </g>
    );
};

export default IntegralDigest;
