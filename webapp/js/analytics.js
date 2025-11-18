// Analytics Dashboard JavaScript

class AnalyticsDashboard {
    constructor() {
        this.profile = null;
        this.analytics = null;
        this.skills = null;

        this.init();
    }

    async init() {
        try {
            // Load all data
            await this.loadProfile();
            await this.loadAnalytics();
            await this.loadSkills();
            await this.displayRecommendations();
            this.setupEventListeners();
            this.displayAchievements();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    async loadProfile() {
        try {
            this.profile = await api.getStudentProfile();
            this.displayProfile();
        } catch (error) {
            console.error('Error loading profile:', error);
            document.getElementById('profile-content').innerHTML = '<p class="empty-state-text">프로필을 불러올 수 없습니다.</p>';
        }
    }

    displayProfile() {
        const content = document.getElementById('profile-content');

        if (!this.profile) {
            content.innerHTML = '<p class="empty-state-text">프로필 데이터가 없습니다.</p>';
            return;
        }

        const html = `
            <div class="profile-info">
                <div class="profile-item">
                    <span class="profile-label">현재 스킬 레벨</span>
                    <span class="profile-value highlight">${this.formatSkillLevel(this.profile.current_skill_level || 1.0)}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">선호 난이도</span>
                    <span class="profile-value">${this.formatDifficulty(this.profile.preferred_difficulty || 2)}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">학습 속도</span>
                    <span class="profile-value">${this.formatPace(this.profile.learning_pace || 'medium')}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">전체 정답률</span>
                    <span class="profile-value ${this.getAccuracyClass(this.profile.overall_accuracy_rate)}">${this.profile.overall_accuracy_rate?.toFixed(1) || 0}%</span>
                </div>
                ${this.profile.strongest_shape_type ? `
                <div class="profile-item">
                    <span class="profile-label">가장 잘하는 도형</span>
                    <span class="profile-value">📐 ${this.formatShapeType(this.profile.strongest_shape_type)}</span>
                </div>
                ` : ''}
                ${this.profile.weakest_shape_type ? `
                <div class="profile-item">
                    <span class="profile-label">연습 필요한 도형</span>
                    <span class="profile-value">📚 ${this.formatShapeType(this.profile.weakest_shape_type)}</span>
                </div>
                ` : ''}
            </div>
        `;

        content.innerHTML = html;

        // Set preference values
        if (this.profile.preferred_difficulty) {
            document.getElementById('difficulty-pref').value = this.profile.preferred_difficulty;
        }
        if (this.profile.learning_pace) {
            document.getElementById('pace-pref').value = this.profile.learning_pace;
        }
    }

    async loadAnalytics() {
        try {
            this.analytics = await api.getAnalytics();
            this.displayAnalytics();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    displayAnalytics() {
        if (!this.analytics || !this.analytics.summary) {
            return;
        }

        const summary = this.analytics.summary;

        document.getElementById('total-attempts').textContent = summary.total_questions_attempted || 0;
        document.getElementById('correct-answers').textContent = summary.total_correct_answers || 0;
        document.getElementById('accuracy-rate').textContent = (summary.overall_accuracy_rate || 0).toFixed(1) + '%';
        document.getElementById('avg-time').textContent = Math.round(summary.average_time_per_question || 0) + '초';
    }

    async loadSkills() {
        try {
            this.skills = await api.getSkillProgression();
            this.displaySkills();
        } catch (error) {
            console.error('Error loading skills:', error);
            document.getElementById('skills-content').innerHTML = '<p class="empty-state-text">기술 데이터를 불러올 수 없습니다.</p>';
        }
    }

    displaySkills() {
        const content = document.getElementById('skills-content');

        if (!this.skills || this.skills.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📖</div>
                    <p class="empty-state-text">아직 학습한 기술이 없습니다.<br>문제를 풀어보세요!</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.skills.forEach(skill => {
            const proficiency = parseFloat(skill.proficiency_level);
            const percentage = Math.min(100, (proficiency / 5.0) * 100);
            const masteryRate = skill.questions_attempted > 0
                ? (skill.questions_mastered / skill.questions_attempted) * 100
                : 0;

            html += `
                <div class="skill-item">
                    <div class="skill-header">
                        <span class="skill-name">${this.formatSkillName(skill.skill_name)}</span>
                        <span class="skill-level">${proficiency.toFixed(1)} / 5.0</span>
                    </div>
                    <div class="skill-progress">
                        <div class="skill-progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="skill-stats">
                        <span>시도: ${skill.questions_attempted}회</span>
                        <span>숙달: ${skill.questions_mastered}회 (${masteryRate.toFixed(0)}%)</span>
                    </div>
                    ${skill.last_practiced ? `
                    <div class="skill-stats">
                        <span>마지막 연습: ${this.formatDate(skill.last_practiced)}</span>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        content.innerHTML = html;
    }

    async displayRecommendations() {
        const content = document.getElementById('recommendations-content');

        try {
            const profile = this.profile || await api.getStudentProfile();

            let recommendations = [];

            if (!profile || profile.is_new_student) {
                recommendations.push({
                    title: '🌟 기초부터 시작하세요',
                    description: '쉬운 문제부터 시작하여 기초를 탄탄히 다져보세요.'
                });
            } else {
                if (profile.overall_accuracy_rate >= 80) {
                    recommendations.push({
                        title: '🚀 난이도를 높여보세요',
                        description: '정답률이 높습니다! 더 어려운 문제에 도전해보세요.'
                    });
                } else if (profile.overall_accuracy_rate < 60) {
                    recommendations.push({
                        title: '📚 복습이 필요합니다',
                        description: '기초 문제로 돌아가서 개념을 다시 확인해보세요.'
                    });
                }

                if (profile.weakest_shape_type) {
                    recommendations.push({
                        title: `📐 ${this.formatShapeType(profile.weakest_shape_type)} 연습`,
                        description: `${this.formatShapeType(profile.weakest_shape_type)} 문제를 더 연습하면 실력이 향상됩니다.`
                    });
                }

                if (profile.average_time_per_question > 120) {
                    recommendations.push({
                        title: '⏱️ 시간 관리',
                        description: '문제 풀이 속도를 높여보세요. 시간 제한을 두고 연습해보는 것도 좋습니다.'
                    });
                }
            }

            if (recommendations.length === 0) {
                recommendations.push({
                    title: '✨ 계속 학습하세요',
                    description: '꾸준히 문제를 풀며 실력을 향상시키고 있습니다!'
                });
            }

            const html = `
                <div class="recommendation-list">
                    ${recommendations.map(rec => `
                        <div class="recommendation-item">
                            <h3>${rec.title}</h3>
                            <p>${rec.description}</p>
                        </div>
                    `).join('')}
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            console.error('Error displaying recommendations:', error);
            content.innerHTML = '<p class="empty-state-text">추천을 생성할 수 없습니다.</p>';
        }
    }

    displayAchievements() {
        const content = document.getElementById('achievements-content');

        const achievements = [
            { icon: '🎯', name: '첫 정답', condition: () => this.profile?.total_correct_answers >= 1 },
            { icon: '🔥', name: '연속 5문제', condition: () => false }, // TODO: implement streak tracking
            { icon: '⭐', name: '100% 정답률', condition: () => this.profile?.overall_accuracy_rate === 100 },
            { icon: '🏃', name: '빠른 해결사', condition: () => this.profile?.average_time_per_question < 30 },
            { icon: '📚', name: '학습왕', condition: () => this.profile?.total_questions_attempted >= 50 },
            { icon: '🎓', name: '전문가', condition: () => this.profile?.current_skill_level >= 4.0 },
        ];

        const html = achievements.map(achievement => {
            const earned = achievement.condition();
            return `
                <div class="badge-item ${earned ? 'earned' : 'locked'}">
                    <div class="badge-icon">${achievement.icon}</div>
                    <div class="badge-name">${achievement.name}</div>
                </div>
            `;
        }).join('');

        content.innerHTML = html;
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-to-quiz-btn').addEventListener('click', () => {
            window.location.href = 'index.html' + window.location.search;
        });

        // Save preferences
        document.getElementById('save-preferences-btn').addEventListener('click', async () => {
            const difficulty = parseInt(document.getElementById('difficulty-pref').value);
            const pace = document.getElementById('pace-pref').value;

            try {
                await api.setLearningPreference(difficulty, pace);
                alert('설정이 저장되었습니다!');
                await this.loadProfile();
            } catch (error) {
                console.error('Error saving preferences:', error);
                alert('설정 저장 중 오류가 발생했습니다.');
            }
        });
    }

    // Utility Methods
    formatSkillLevel(level) {
        const num = parseFloat(level);
        if (num < 2) return `${num.toFixed(1)} (초급)`;
        if (num < 3) return `${num.toFixed(1)} (중급)`;
        if (num < 4) return `${num.toFixed(1)} (고급)`;
        return `${num.toFixed(1)} (전문가)`;
    }

    formatDifficulty(difficulty) {
        const levels = ['', '매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움'];
        return levels[difficulty] || '보통';
    }

    formatPace(pace) {
        const paces = {
            'slow': '천천히',
            'medium': '보통',
            'fast': '빠르게'
        };
        return paces[pace] || '보통';
    }

    formatShapeType(type) {
        const types = {
            'rectangle': '직사각형',
            'triangle': '삼각형',
            'circle': '원'
        };
        return types[type] || type;
    }

    formatSkillName(skillName) {
        const names = {
            'rectangle_area': '직사각형 넓이',
            'triangle_area': '삼각형 넓이',
            'circle_area': '원 넓이'
        };
        return names[skillName] || skillName;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;
        if (days < 30) return `${Math.floor(days / 7)}주 전`;
        return `${Math.floor(days / 30)}개월 전`;
    }

    getAccuracyClass(accuracy) {
        if (accuracy >= 80) return 'highlight';
        if (accuracy >= 60) return '';
        return 'warning';
    }

    showError(message) {
        alert(message);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AnalyticsDashboard();
    window.analyticsDashboard = dashboard; // For debugging
});
