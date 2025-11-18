/**
 * Teacher Dashboard for Cognitive Pause Analytics
 * Main dashboard interface for teachers to monitor student cognitive pauses
 *
 * @package    AI Education System
 * @copyright  2024
 * @license    MIT
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PauseHeatmap from './PauseHeatmap';
import PauseTimeline from './PauseTimeline';
import StudentCognitiveProfile from './StudentCognitiveProfile';
import QuestionDifficultyChart from './QuestionDifficultyChart';
import './TeacherDashboard.css';

const TeacherDashboard = ({ courseId, teacherId }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [overviewData, setOverviewData] = useState(null);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [questionPatterns, setQuestionPatterns] = useState([]);
    const [pauseEvents, setPauseEvents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Filter states
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date()
    });
    const [pauseTypeFilter, setPauseTypeFilter] = useState('all');

    useEffect(() => {
        loadDashboardData();
    }, [courseId, dateRange]);

    /**
     * Load all dashboard data
     */
    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load data in parallel
            const [overview, atRisk, questions, events] = await Promise.all([
                fetchOverviewData(),
                fetchAtRiskStudents(),
                fetchQuestionPatterns(),
                fetchPauseEvents()
            ]);

            setOverviewData(overview);
            setAtRiskStudents(atRisk);
            setQuestionPatterns(questions);
            setPauseEvents(events);

            setLoading(false);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
            setLoading(false);
        }
    };

    /**
     * Fetch overview statistics
     */
    const fetchOverviewData = async () => {
        const response = await axios.get('/api/cogpause/overview', {
            params: { courseId, startDate: dateRange.start, endDate: dateRange.end }
        });
        return response.data;
    };

    /**
     * Fetch at-risk students
     */
    const fetchAtRiskStudents = async () => {
        const response = await axios.get('/api/cogpause/at-risk-students', {
            params: { courseId }
        });
        return response.data;
    };

    /**
     * Fetch question pause patterns
     */
    const fetchQuestionPatterns = async () => {
        const response = await axios.get('/api/cogpause/question-patterns', {
            params: { courseId }
        });
        return response.data;
    };

    /**
     * Fetch pause events
     */
    const fetchPauseEvents = async () => {
        const response = await axios.get('/api/cogpause/pause-events', {
            params: {
                courseId,
                startDate: dateRange.start,
                endDate: dateRange.end,
                pauseType: pauseTypeFilter !== 'all' ? pauseTypeFilter : null
            }
        });
        return response.data;
    };

    /**
     * Render overview tab
     */
    const renderOverviewTab = () => {
        if (!overviewData) return <div>Loading...</div>;

        return (
            <div className="overview-tab">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <div className="stat-value">{overviewData.totalStudents}</div>
                    </div>

                    <div className="stat-card">
                        <h3>Active Students</h3>
                        <div className="stat-value">{overviewData.activeStudents}</div>
                        <div className="stat-change positive">
                            +{overviewData.activeStudentsChange}%
                        </div>
                    </div>

                    <div className="stat-card">
                        <h3>Total Pauses</h3>
                        <div className="stat-value">{overviewData.totalPauses}</div>
                    </div>

                    <div className="stat-card">
                        <h3>Avg Pause Duration</h3>
                        <div className="stat-value">
                            {(overviewData.avgPauseDuration / 1000).toFixed(1)}s
                        </div>
                    </div>

                    <div className="stat-card alert">
                        <h3>At-Risk Students</h3>
                        <div className="stat-value">{atRiskStudents.length}</div>
                        {atRiskStudents.length > 0 && (
                            <button
                                className="view-details-btn"
                                onClick={() => setActiveTab('at-risk')}
                            >
                                View Details
                            </button>
                        )}
                    </div>

                    <div className="stat-card">
                        <h3>Avg Cognitive Load</h3>
                        <div className="stat-value">
                            {overviewData.avgCognitiveLoad.toFixed(1)}
                        </div>
                        <div className="stat-indicator">
                            {overviewData.avgCognitiveLoad > 70 ? '🔴 High' :
                             overviewData.avgCognitiveLoad > 50 ? '🟡 Medium' : '🟢 Low'}
                        </div>
                    </div>
                </div>

                <div className="charts-section">
                    <div className="chart-container">
                        <h3>Pause Heatmap - All Students</h3>
                        <PauseHeatmap data={pauseEvents} width={800} height={600} />
                    </div>

                    <div className="chart-container">
                        <h3>Question Difficulty Analysis</h3>
                        <QuestionDifficultyChart data={questionPatterns} />
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Render at-risk students tab
     */
    const renderAtRiskTab = () => {
        return (
            <div className="at-risk-tab">
                <h2>At-Risk Students</h2>
                <p className="tab-description">
                    Students showing high cognitive load or signs of struggle
                </p>

                <div className="at-risk-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Avg Cognitive Load</th>
                                <th>Questions with Struggle</th>
                                <th>Avg Pauses per Question</th>
                                <th>Learning Style</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atRiskStudents.map(student => (
                                <tr key={student.user_id} className="at-risk-row">
                                    <td>
                                        <div className="student-info">
                                            <span className="student-name">
                                                Student #{student.user_id}
                                            </span>
                                            {student.struggling_learner && (
                                                <span className="badge struggling">Struggling</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cognitive-load-cell">
                                            <div
                                                className="load-bar"
                                                style={{
                                                    width: `${student.avg_cognitive_load}%`,
                                                    backgroundColor: student.avg_cognitive_load > 70 ?
                                                        '#F44336' : '#FF9800'
                                                }}
                                            />
                                            <span>{student.avg_cognitive_load.toFixed(1)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {student.questions_with_struggle} / {student.total_questions_attempted}
                                        ({((student.questions_with_struggle / student.total_questions_attempted) * 100).toFixed(0)}%)
                                    </td>
                                    <td>{student.avg_pauses_per_question.toFixed(1)}</td>
                                    <td>
                                        {student.quick_thinker && <span className="badge">Quick Thinker</span>}
                                        {student.deep_thinker && <span className="badge">Deep Thinker</span>}
                                        {student.struggling_learner && <span className="badge alert">Struggling</span>}
                                        {student.distracted_learner && <span className="badge warning">Distracted</span>}
                                    </td>
                                    <td>
                                        <button
                                            className="btn-small"
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setActiveTab('student-detail');
                                            }}
                                        >
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {atRiskStudents.length === 0 && (
                        <div className="empty-state">
                            <p>✓ No at-risk students detected</p>
                        </div>
                    )}
                </div>

                <div className="recommendations-section">
                    <h3>Recommended Interventions</h3>
                    <ul className="recommendations-list">
                        <li>📧 Send encouraging messages to struggling students</li>
                        <li>📚 Provide additional learning resources for difficult questions</li>
                        <li>👥 Consider peer tutoring or study groups</li>
                        <li>⏰ Suggest optimal study times based on patterns</li>
                        <li>🎯 Adjust question difficulty to match student ability</li>
                    </ul>
                </div>
            </div>
        );
    };

    /**
     * Render question analysis tab
     */
    const renderQuestionAnalysisTab = () => {
        // Sort questions by difficulty score
        const sortedQuestions = [...questionPatterns].sort(
            (a, b) => b.pause_difficulty_score - a.pause_difficulty_score
        );

        return (
            <div className="question-analysis-tab">
                <h2>Question Pause Analysis</h2>
                <p className="tab-description">
                    Identify questions that cause the most cognitive difficulty
                </p>

                <div className="difficult-questions-list">
                    {sortedQuestions.map(question => (
                        <div
                            key={question.question_id}
                            className={`question-card ${question.needs_revision ? 'needs-revision' : ''}`}
                        >
                            <div className="question-header">
                                <h4>Question #{question.question_id}</h4>
                                {question.needs_revision && (
                                    <span className="badge alert">Needs Revision</span>
                                )}
                            </div>

                            <div className="question-stats">
                                <div className="stat">
                                    <span className="label">Difficulty Score:</span>
                                    <span className="value">{question.pause_difficulty_score.toFixed(1)}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Total Students:</span>
                                    <span className="value">{question.total_students}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Avg Pauses:</span>
                                    <span className="value">{question.avg_pauses_per_attempt.toFixed(1)}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Avg Pause Time:</span>
                                    <span className="value">
                                        {(question.avg_total_pause_time_ms / 1000).toFixed(1)}s
                                    </span>
                                </div>
                            </div>

                            <div className="question-actions">
                                <button
                                    className="btn-small"
                                    onClick={() => {
                                        setSelectedQuestion(question);
                                        setActiveTab('question-detail');
                                    }}
                                >
                                    View Details
                                </button>
                                {question.needs_revision && (
                                    <button className="btn-small btn-primary">
                                        Edit Question
                                    </button>
                                )}
                            </div>

                            {question.revision_notes && (
                                <div className="revision-notes">
                                    <strong>Notes:</strong> {question.revision_notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /**
     * Render student detail tab
     */
    const renderStudentDetailTab = () => {
        if (!selectedStudent) {
            return <div>No student selected</div>;
        }

        return (
            <div className="student-detail-tab">
                <button
                    className="back-button"
                    onClick={() => setActiveTab('at-risk')}
                >
                    ← Back to At-Risk Students
                </button>

                <StudentCognitiveProfile
                    studentId={selectedStudent.user_id}
                    courseId={courseId}
                />

                <div className="student-pause-timeline">
                    <h3>Student Pause Timeline</h3>
                    <PauseTimeline
                        data={pauseEvents.filter(p => p.user_id === selectedStudent.user_id)}
                        width={1000}
                        height={400}
                    />
                </div>
            </div>
        );
    };

    /**
     * Render question detail tab
     */
    const renderQuestionDetailTab = () => {
        if (!selectedQuestion) {
            return <div>No question selected</div>;
        }

        const questionPauses = pauseEvents.filter(
            p => p.question_id === selectedQuestion.question_id
        );

        return (
            <div className="question-detail-tab">
                <button
                    className="back-button"
                    onClick={() => setActiveTab('question-analysis')}
                >
                    ← Back to Question Analysis
                </button>

                <h2>Question #{selectedQuestion.question_id} - Detailed Analysis</h2>

                <div className="question-detail-stats">
                    <div className="stat-card">
                        <h4>Difficulty Score</h4>
                        <div className="stat-value large">
                            {selectedQuestion.pause_difficulty_score.toFixed(1)}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h4>Total Attempts</h4>
                        <div className="stat-value">{selectedQuestion.total_attempts}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Unique Students</h4>
                        <div className="stat-value">{selectedQuestion.total_students}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Avg Pause Time</h4>
                        <div className="stat-value">
                            {(selectedQuestion.avg_total_pause_time_ms / 1000).toFixed(1)}s
                        </div>
                    </div>
                </div>

                <div className="question-pause-heatmap">
                    <h3>Pause Distribution for This Question</h3>
                    <PauseHeatmap data={questionPauses} width={800} height={400} />
                </div>

                <div className="question-recommendations">
                    <h3>Recommendations</h3>
                    <ul>
                        {selectedQuestion.pause_difficulty_score > 75 && (
                            <>
                                <li>⚠️ This question shows very high cognitive difficulty</li>
                                <li>📝 Consider simplifying the question wording</li>
                                <li>📊 Review if the question aligns with course objectives</li>
                            </>
                        )}
                        {selectedQuestion.pause_difficulty_score > 50 && selectedQuestion.pause_difficulty_score <= 75 && (
                            <>
                                <li>📈 This question has moderate difficulty</li>
                                <li>💡 Consider providing hints or scaffolding</li>
                            </>
                        )}
                        {selectedQuestion.pause_difficulty_score <= 50 && (
                            <li>✓ This question appears appropriate for student level</li>
                        )}
                    </ul>
                </div>
            </div>
        );
    };

    /**
     * Render filters section
     */
    const renderFilters = () => {
        return (
            <div className="filters-section">
                <div className="filter-group">
                    <label>Date Range:</label>
                    <input
                        type="date"
                        value={dateRange.start.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange({
                            ...dateRange,
                            start: new Date(e.target.value)
                        })}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.end.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange({
                            ...dateRange,
                            end: new Date(e.target.value)
                        })}
                    />
                </div>

                <div className="filter-group">
                    <label>Pause Type:</label>
                    <select
                        value={pauseTypeFilter}
                        onChange={(e) => setPauseTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="thinking">Thinking</option>
                        <option value="confusion">Confusion</option>
                        <option value="distraction">Distraction</option>
                        <option value="re_reading">Re-reading</option>
                    </select>
                </div>

                <button className="btn-primary" onClick={loadDashboardData}>
                    Apply Filters
                </button>

                <button className="btn-secondary" onClick={() => {
                    setDateRange({
                        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        end: new Date()
                    });
                    setPauseTypeFilter('all');
                }}>
                    Reset
                </button>
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="dashboard-error">
                <p>Error: {error}</p>
                <button onClick={loadDashboardData}>Retry</button>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">
            <header className="dashboard-header">
                <h1>🧠 Cognitive Pause Analytics Dashboard</h1>
                <p className="subtitle">Monitor student learning patterns and identify areas of difficulty</p>
            </header>

            {renderFilters()}

            <nav className="dashboard-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={activeTab === 'at-risk' ? 'active' : ''}
                    onClick={() => setActiveTab('at-risk')}
                >
                    ⚠️ At-Risk Students
                    {atRiskStudents.length > 0 && (
                        <span className="badge">{atRiskStudents.length}</span>
                    )}
                </button>
                <button
                    className={activeTab === 'question-analysis' ? 'active' : ''}
                    onClick={() => setActiveTab('question-analysis')}
                >
                    📝 Question Analysis
                </button>
                {selectedStudent && (
                    <button
                        className={activeTab === 'student-detail' ? 'active' : ''}
                        onClick={() => setActiveTab('student-detail')}
                    >
                        👤 Student Detail
                    </button>
                )}
                {selectedQuestion && (
                    <button
                        className={activeTab === 'question-detail' ? 'active' : ''}
                        onClick={() => setActiveTab('question-detail')}
                    >
                        🔍 Question Detail
                    </button>
                )}
            </nav>

            <main className="dashboard-content">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'at-risk' && renderAtRiskTab()}
                {activeTab === 'question-analysis' && renderQuestionAnalysisTab()}
                {activeTab === 'student-detail' && renderStudentDetailTab()}
                {activeTab === 'question-detail' && renderQuestionDetailTab()}
            </main>
        </div>
    );
};

export default TeacherDashboard;
