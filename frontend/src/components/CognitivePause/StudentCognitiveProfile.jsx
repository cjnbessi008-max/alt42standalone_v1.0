/**
 * Student Cognitive Profile Component
 * Displays individual student's cognitive pause patterns and learning style
 *
 * @package    AI Education System
 * @copyright  2024
 * @license    MIT
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import './StudentCognitiveProfile.css';

const StudentCognitiveProfile = ({ studentId, courseId }) => {
    const [profile, setProfile] = useState(null);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudentData();
    }, [studentId, courseId]);

    const loadStudentData = async () => {
        try {
            const [profileData, analyticsData] = await Promise.all([
                axios.get(`/api/cogpause/student-profile/${studentId}`, {
                    params: { courseId }
                }),
                axios.get(`/api/cogpause/student-analytics/${studentId}`, {
                    params: { courseId }
                })
            ]);

            setProfile(profileData.data);
            setAnalytics(analyticsData.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading student data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading student profile...</div>;
    }

    if (!profile) {
        return <div>No profile data available</div>;
    }

    const getLearningStyleIcon = () => {
        if (profile.quick_thinker) return '⚡';
        if (profile.deep_thinker) return '🧠';
        if (profile.struggling_learner) return '😓';
        if (profile.distracted_learner) return '👀';
        return '📚';
    };

    const getLearningStyleDescription = () => {
        if (profile.quick_thinker) {
            return 'Quick Thinker: Makes decisions rapidly with short pauses';
        }
        if (profile.deep_thinker) {
            return 'Deep Thinker: Takes time to think through problems carefully';
        }
        if (profile.struggling_learner) {
            return 'Struggling Learner: Shows signs of difficulty with many questions';
        }
        if (profile.distracted_learner) {
            return 'Distracted Learner: Frequent interruptions and context switches';
        }
        return 'Standard Learner: Balanced approach to problem-solving';
    };

    const getCognitiveLoadColor = (score) => {
        if (score >= 70) return '#F44336';
        if (score >= 50) return '#FF9800';
        return '#4CAF50';
    };

    return (
        <div className="student-cognitive-profile">
            <div className="profile-header">
                <div className="student-avatar">{getLearningStyleIcon()}</div>
                <div className="student-info">
                    <h2>Student #{studentId}</h2>
                    <p className="learning-style">{getLearningStyleDescription()}</p>
                    {profile.at_risk_flag && (
                        <div className="alert-banner">
                            ⚠️ This student is at risk and may need additional support
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-stats-grid">
                <div className="stat-card">
                    <h4>Questions Attempted</h4>
                    <div className="stat-value">{profile.total_questions_attempted}</div>
                </div>

                <div className="stat-card">
                    <h4>Avg Pauses per Question</h4>
                    <div className="stat-value">{profile.avg_pauses_per_question.toFixed(1)}</div>
                </div>

                <div className="stat-card">
                    <h4>Avg Pause Duration</h4>
                    <div className="stat-value">
                        {(profile.avg_pause_duration_ms / 1000).toFixed(1)}s
                    </div>
                </div>

                <div className="stat-card">
                    <h4>Cognitive Load</h4>
                    <div
                        className="stat-value"
                        style={{ color: getCognitiveLoadColor(profile.avg_cognitive_load) }}
                    >
                        {profile.avg_cognitive_load.toFixed(1)}
                    </div>
                    <div className="load-bar-container">
                        <div
                            className="load-bar"
                            style={{
                                width: `${profile.avg_cognitive_load}%`,
                                backgroundColor: getCognitiveLoadColor(profile.avg_cognitive_load)
                            }}
                        />
                    </div>
                </div>

                <div className="stat-card">
                    <h4>Questions with Struggle</h4>
                    <div className="stat-value">
                        {profile.questions_with_struggle} / {profile.total_questions_attempted}
                    </div>
                    <div className="stat-subtext">
                        {((profile.questions_with_struggle / profile.total_questions_attempted) * 100).toFixed(0)}%
                    </div>
                </div>

                <div className="stat-card">
                    <h4>Improvement Trend</h4>
                    <div className="stat-value">
                        {profile.improvement_trend === 'improving' && '📈 Improving'}
                        {profile.improvement_trend === 'stable' && '➡️ Stable'}
                        {profile.improvement_trend === 'declining' && '📉 Declining'}
                        {profile.improvement_trend === 'insufficient_data' && '❓ Insufficient Data'}
                    </div>
                </div>
            </div>

            <div className="cognitive-patterns-section">
                <h3>Cognitive Pause Patterns</h3>
                <CognitivePatternChart analytics={analytics} />
            </div>

            <div className="recommendations-section">
                <h3>Recommended Interventions</h3>
                <RecommendationsList profile={profile} />
            </div>

            {profile.optimal_study_time && (
                <div className="optimal-time-section">
                    <h4>💡 Optimal Study Time</h4>
                    <p>This student performs best during: <strong>{profile.optimal_study_time}</strong></p>
                </div>
            )}
        </div>
    );
};

/**
 * Cognitive Pattern Chart Component
 */
const CognitivePatternChart = ({ analytics }) => {
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!analytics || analytics.length === 0) return;

        createPatternChart();
    }, [analytics]);

    const createPatternChart = () => {
        const data = analytics.map(a => ({
            question: `Q${a.question_id}`,
            thinking: a.thinking_pauses,
            confusion: a.confusion_pauses,
            distraction: a.distraction_pauses,
            rereading: a.rereading_pauses,
            cognitiveLoad: a.cognitive_load_score
        }));

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 120, bottom: 40, left: 50 };

        d3.select(chartRef.current).selectAll('*').remove();

        const svg = d3.select(chartRef.current)
            .attr('width', width)
            .attr('height', height);

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.question))
            .range([0, chartWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.thinking + d.confusion + d.distraction + d.rereading)])
            .range([chartHeight, 0])
            .nice();

        // Stack data
        const stack = d3.stack()
            .keys(['thinking', 'confusion', 'distraction', 'rereading']);

        const series = stack(data);

        // Colors
        const color = d3.scaleOrdinal()
            .domain(['thinking', 'confusion', 'distraction', 'rereading'])
            .range(['#4CAF50', '#FF9800', '#F44336', '#2196F3']);

        // Draw stacked bars
        g.selectAll('.serie')
            .data(series)
            .enter().append('g')
            .attr('class', 'serie')
            .attr('fill', d => color(d.key))
            .selectAll('rect')
            .data(d => d)
            .enter().append('rect')
            .attr('x', d => x(d.data.question))
            .attr('y', d => y(d[1]))
            .attr('height', d => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth());

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x));

        g.append('g')
            .call(d3.axisLeft(y));

        // Legend
        const legend = svg.append('g')
            .attr('transform', `translate(${chartWidth + margin.left + 10},${margin.top})`);

        ['thinking', 'confusion', 'distraction', 'rereading'].forEach((key, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0,${i * 20})`);

            legendRow.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', color(key));

            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '12px')
                .text(key.charAt(0).toUpperCase() + key.slice(1));
        });
    };

    return <svg ref={chartRef} />;
};

/**
 * Recommendations List Component
 */
const RecommendationsList = ({ profile }) => {
    const recommendations = [];

    if (profile.at_risk_flag) {
        recommendations.push({
            icon: '🚨',
            priority: 'high',
            text: 'Schedule a one-on-one meeting to discuss challenges'
        });
    }

    if (profile.struggling_learner) {
        recommendations.push({
            icon: '📚',
            priority: 'high',
            text: 'Provide additional learning resources and practice problems'
        });
        recommendations.push({
            icon: '👥',
            priority: 'medium',
            text: 'Pair with a peer tutor or study group'
        });
    }

    if (profile.avg_cognitive_load > 70) {
        recommendations.push({
            icon: '🧘',
            priority: 'medium',
            text: 'Recommend breaks and stress management techniques'
        });
        recommendations.push({
            icon: '📉',
            priority: 'medium',
            text: 'Consider reducing assignment load temporarily'
        });
    }

    if (profile.distracted_learner) {
        recommendations.push({
            icon: '🎯',
            priority: 'medium',
            text: 'Suggest focus techniques and distraction-free study environment'
        });
    }

    if (profile.quick_thinker) {
        recommendations.push({
            icon: '🚀',
            priority: 'low',
            text: 'Provide advanced challenge problems to maintain engagement'
        });
    }

    if (profile.deep_thinker) {
        recommendations.push({
            icon: '⏰',
            priority: 'low',
            text: 'Allow extended time on assessments to accommodate thinking style'
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            icon: '✅',
            priority: 'info',
            text: 'Student is performing well - continue current approach'
        });
    }

    return (
        <ul className="recommendations-list">
            {recommendations.map((rec, index) => (
                <li key={index} className={`recommendation priority-${rec.priority}`}>
                    <span className="icon">{rec.icon}</span>
                    <span className="text">{rec.text}</span>
                </li>
            ))}
        </ul>
    );
};

export default StudentCognitiveProfile;
