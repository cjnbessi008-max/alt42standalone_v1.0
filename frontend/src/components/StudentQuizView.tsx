/**
 * Student Quiz View Component
 *
 * 학생용 셔플된 문제 세트 표시 컴포넌트
 *
 * @module StudentQuizView
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Choice {
    id: string;
    displayed_position: string;
    choice_text: string;
}

interface Question {
    id: string;
    displayed_position: number;
    question_text: string;
    question_type: string;
    points: number;
    time_limit_seconds?: number;
    choices?: Choice[];
}

interface QuestionSet {
    question_set_id: string;
    name: string;
    description: string;
    shuffle_map_id: string;
    shuffle_seed: number;
    total_questions: number;
    questions: Question[];
}

interface StudentAnswer {
    question_id: string;
    selected_choice_id?: string;
    displayed_position?: string;
    answer_text?: string;
}

interface StudentQuizViewProps {
    questionSetId: string;
    onSubmit?: (result: any) => void;
}

const StudentQuizView: React.FC<StudentQuizViewProps> = ({
    questionSetId,
    onSubmit
}) => {
    const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, StudentAnswer>>(new Map());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // 문제 세트 로드
    useEffect(() => {
        loadQuestionSet();
    }, [questionSetId]);

    // 타이머
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 1) {
                    handleSubmit(); // 자동 제출
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const loadQuestionSet = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/question-sets/${questionSetId}/student-view`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = response.data.data;
            setQuestionSet(data);

            // 전체 제한 시간 계산
            const totalTime = data.questions.reduce(
                (sum: number, q: Question) => sum + (q.time_limit_seconds || 0),
                0
            );
            if (totalTime > 0) {
                setTimeRemaining(totalTime);
            }

            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || '문제를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, answer: StudentAnswer) => {
        const newAnswers = new Map(answers);
        newAnswers.set(questionId, answer);
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (!questionSet) return;

        const unanswered = questionSet.questions.filter(
            q => !answers.has(q.id)
        );

        if (unanswered.length > 0 && !window.confirm(
            `${unanswered.length}개의 문제가 미답변 상태입니다. 제출하시겠습니까?`
        )) {
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(
                `/api/question-sets/${questionSetId}/submit`,
                {
                    shuffle_map_id: questionSet.shuffle_map_id,
                    answers: Array.from(answers.values())
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (onSubmit) {
                onSubmit(response.data.data);
            }

            alert(`제출 완료!\n점수: ${response.data.data.score}점`);
        } catch (err: any) {
            setError(err.response?.data?.error || '제출에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    };

    const renderQuestion = (question: Question) => {
        const answer = answers.get(question.id);

        switch (question.question_type) {
            case 'mcq':
            case 'true_false':
                return (
                    <div className="choices">
                        {question.choices?.map(choice => (
                            <label key={choice.id} className="choice-label">
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={choice.id}
                                    checked={answer?.selected_choice_id === choice.id}
                                    onChange={() => handleAnswerChange(question.id, {
                                        question_id: question.id,
                                        selected_choice_id: choice.id,
                                        displayed_position: choice.displayed_position
                                    })}
                                />
                                <span className="choice-letter">{choice.displayed_position}.</span>
                                <span className="choice-text">{choice.choice_text}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'short_answer':
                return (
                    <textarea
                        className="answer-textarea"
                        value={answer?.answer_text || ''}
                        onChange={(e) => handleAnswerChange(question.id, {
                            question_id: question.id,
                            answer_text: e.target.value
                        })}
                        placeholder="답안을 입력하세요"
                        rows={4}
                    />
                );

            case 'essay':
                return (
                    <textarea
                        className="answer-textarea essay"
                        value={answer?.answer_text || ''}
                        onChange={(e) => handleAnswerChange(question.id, {
                            question_id: question.id,
                            answer_text: e.target.value
                        })}
                        placeholder="답안을 작성하세요"
                        rows={10}
                    />
                );

            default:
                return <div>지원하지 않는 문제 유형입니다.</div>;
        }
    };

    if (loading) {
        return (
            <div className="quiz-loading">
                <div className="spinner"></div>
                <p>문제를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-error">
                <h3>오류 발생</h3>
                <p>{error}</p>
                <button onClick={loadQuestionSet}>다시 시도</button>
            </div>
        );
    }

    if (!questionSet) {
        return <div>문제 세트를 찾을 수 없습니다.</div>;
    }

    const currentQuestion = questionSet.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questionSet.total_questions) * 100;

    return (
        <div className="student-quiz-view">
            {/* 헤더 */}
            <header className="quiz-header">
                <div className="quiz-info">
                    <h1>{questionSet.name}</h1>
                    {questionSet.description && (
                        <p className="quiz-description">{questionSet.description}</p>
                    )}
                </div>
                {timeRemaining !== null && (
                    <div className={`time-remaining ${timeRemaining < 300 ? 'warning' : ''}`}>
                        <span className="time-icon">⏱️</span>
                        <span className="time-value">{formatTime(timeRemaining)}</span>
                    </div>
                )}
            </header>

            {/* 진행도 */}
            <div className="quiz-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="progress-text">
                    문제 {currentQuestionIndex + 1} / {questionSet.total_questions}
                    {' '}
                    ({answers.size} 답변 완료)
                </div>
            </div>

            {/* 문제 표시 */}
            <div className="question-container">
                <div className="question-header">
                    <span className="question-number">
                        Question {currentQuestion.displayed_position}
                    </span>
                    <span className="question-points">
                        {currentQuestion.points}점
                    </span>
                </div>

                <div className="question-text">
                    {currentQuestion.question_text}
                </div>

                <div className="question-answer">
                    {renderQuestion(currentQuestion)}
                </div>
            </div>

            {/* 네비게이션 */}
            <div className="quiz-navigation">
                <button
                    className="nav-button prev"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                >
                    ← 이전
                </button>

                <div className="question-dots">
                    {questionSet.questions.map((q, index) => (
                        <button
                            key={q.id}
                            className={`question-dot ${
                                index === currentQuestionIndex ? 'active' : ''
                            } ${
                                answers.has(q.id) ? 'answered' : ''
                            }`}
                            onClick={() => setCurrentQuestionIndex(index)}
                            title={`문제 ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                <button
                    className="nav-button next"
                    onClick={() => setCurrentQuestionIndex(
                        Math.min(questionSet.total_questions - 1, currentQuestionIndex + 1)
                    )}
                    disabled={currentQuestionIndex === questionSet.total_questions - 1}
                >
                    다음 →
                </button>
            </div>

            {/* 제출 버튼 */}
            <div className="quiz-submit">
                <button
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? '제출 중...' : '답안 제출'}
                </button>
            </div>

            <style jsx>{`
                .student-quiz-view {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .quiz-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .quiz-info h1 {
                    font-size: 24px;
                    margin: 0 0 8px 0;
                    color: #1a1a1a;
                }

                .quiz-description {
                    color: #666;
                    margin: 0;
                }

                .time-remaining {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 20px;
                    font-weight: bold;
                    padding: 8px 16px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }

                .time-remaining.warning {
                    background: #fff3cd;
                    color: #856404;
                }

                .quiz-progress {
                    margin-bottom: 24px;
                }

                .progress-bar {
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #45a049);
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 14px;
                    color: #666;
                }

                .question-container {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 32px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .question-number {
                    color: #666;
                    font-weight: 600;
                }

                .question-points {
                    color: #4CAF50;
                    font-weight: 600;
                }

                .question-text {
                    font-size: 18px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    color: #1a1a1a;
                }

                .choices {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .choice-label {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .choice-label:hover {
                    border-color: #4CAF50;
                    background: #f9fff9;
                }

                .choice-label input:checked + .choice-letter {
                    background: #4CAF50;
                    color: white;
                }

                .choice-label input:checked ~ .choice-text {
                    font-weight: 600;
                }

                .choice-label input {
                    margin-right: 12px;
                }

                .choice-letter {
                    min-width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f5f5f5;
                    border-radius: 50%;
                    font-weight: 600;
                    margin-right: 12px;
                }

                .choice-text {
                    flex: 1;
                    line-height: 1.5;
                }

                .answer-textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 16px;
                    font-family: inherit;
                    resize: vertical;
                }

                .answer-textarea:focus {
                    outline: none;
                    border-color: #4CAF50;
                }

                .quiz-navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    gap: 16px;
                }

                .nav-button {
                    padding: 10px 20px;
                    background: #f5f5f5;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .nav-button:hover:not(:disabled) {
                    background: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                }

                .nav-button:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .question-dots {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center;
                    flex: 1;
                }

                .question-dot {
                    width: 36px;
                    height: 36px;
                    border: 2px solid #e0e0e0;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .question-dot.active {
                    background: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                }

                .question-dot.answered {
                    background: #e8f5e9;
                    border-color: #4CAF50;
                }

                .question-dot:hover {
                    transform: scale(1.1);
                }

                .quiz-submit {
                    text-align: center;
                }

                .submit-button {
                    padding: 16px 48px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                }

                .submit-button:hover:not(:disabled) {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
                }

                .submit-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .quiz-loading, .quiz-error {
                    text-align: center;
                    padding: 48px;
                }

                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #4CAF50;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default StudentQuizView;
