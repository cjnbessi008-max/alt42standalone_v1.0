/**
 * Local Storage Manager
 * Handles all data persistence
 */

const Storage = {
    KEYS: {
        PROGRESS: 'rhythm_seq_progress',
        SETTINGS: 'rhythm_seq_settings',
        ACHIEVEMENTS: 'rhythm_seq_achievements',
        STATS: 'rhythm_seq_stats'
    },

    /**
     * Get user progress
     */
    getProgress() {
        const data = localStorage.getItem(this.KEYS.PROGRESS);
        return data ? JSON.parse(data) : {
            solvedQuestions: [],
            scores: {},
            attempts: {},
            hints Used: {},
            bestTimes: {}
        };
    },

    /**
     * Save user progress
     */
    saveProgress(progress) {
        localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));
    },

    /**
     * Mark question as solved
     */
    markSolved(questionId, score, time, usedHint = false) {
        const progress = this.getProgress();

        if (!progress.solvedQuestions.includes(questionId)) {
            progress.solvedQuestions.push(questionId);
        }

        progress.scores[questionId] = (progress.scores[questionId] || 0) + score;
        progress.attempts[questionId] = (progress.attempts[questionId] || 0) + 1;

        if (usedHint) {
            progress.hintsUsed[questionId] = true;
        }

        if (!progress.bestTimes[questionId] || time < progress.bestTimes[questionId]) {
            progress.bestTimes[questionId] = time;
        }

        this.saveProgress(progress);
        this.updateStats();

        return progress;
    },

    /**
     * Get settings
     */
    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            theme: 'default',
            soundEnabled: true,
            animationSpeed: 5,
            animationStyle: 'wave',
            autoPlay: false
        };
    },

    /**
     * Save settings
     */
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    /**
     * Update setting
     */
    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.saveSettings(settings);
        return settings;
    },

    /**
     * Get achievements
     */
    getAchievements() {
        const data = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
        return data ? JSON.parse(data) : {
            unlocked: [],
            timestamps: {}
        };
    },

    /**
     * Unlock achievement
     */
    unlockAchievement(achievementId) {
        const achievements = this.getAchievements();

        if (!achievements.unlocked.includes(achievementId)) {
            achievements.unlocked.push(achievementId);
            achievements.timestamps[achievementId] = Date.now();
            localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
            return true;
        }

        return false;
    },

    /**
     * Check and unlock achievements
     */
    checkAchievements(stats, questionData) {
        const achievements = [];

        // First solve
        if (stats.totalSolved === 1) {
            if (this.unlockAchievement('first_solve')) {
                achievements.push('first_solve');
            }
        }

        // 5 streak
        if (stats.currentStreak >= 5) {
            if (this.unlockAchievement('five_streak')) {
                achievements.push('five_streak');
            }
        }

        // Perfect score (no hint, first try)
        if (questionData.firstTry && !questionData.usedHint) {
            if (this.unlockAchievement('perfect_score')) {
                achievements.push('perfect_score');
            }
        }

        // Master (all solved)
        if (stats.totalSolved >= 15) {
            if (this.unlockAchievement('master')) {
                achievements.push('master');
            }
        }

        // Speed demon (< 10 seconds)
        if (questionData.solveTime < 10000) {
            if (this.unlockAchievement('speed_demon')) {
                achievements.push('speed_demon');
            }
        }

        return achievements;
    },

    /**
     * Get statistics
     */
    getStats() {
        const data = localStorage.getItem(this.KEYS.STATS);
        return data ? JSON.parse(data) : {
            totalScore: 0,
            totalSolved: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalAttempts: 0,
            averageTime: 0,
            lastPlayed: null
        };
    },

    /**
     * Update statistics
     */
    updateStats() {
        const progress = this.getProgress();
        const stats = this.getStats();

        stats.totalScore = Object.values(progress.scores).reduce((a, b) => a + b, 0);
        stats.totalSolved = progress.solvedQuestions.length;
        stats.totalAttempts = Object.values(progress.attempts).reduce((a, b) => a + b, 0);

        const times = Object.values(progress.bestTimes);
        stats.averageTime = times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0;

        stats.lastPlayed = Date.now();

        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));

        return stats;
    },

    /**
     * Increment streak
     */
    incrementStreak() {
        const stats = this.getStats();
        stats.currentStreak++;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
        return stats;
    },

    /**
     * Reset streak
     */
    resetStreak() {
        const stats = this.getStats();
        stats.currentStreak = 0;
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
        return stats;
    },

    /**
     * Reset all data
     */
    resetAll() {
        if (confirm('정말로 모든 진행상황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem(this.KEYS.PROGRESS);
            localStorage.removeItem(this.KEYS.ACHIEVEMENTS);
            localStorage.removeItem(this.KEYS.STATS);
            Utils.showToast('모든 데이터가 초기화되었습니다', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    },

    /**
     * Export data as JSON
     */
    exportData() {
        const data = {
            progress: this.getProgress(),
            settings: this.getSettings(),
            achievements: this.getAchievements(),
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rhythm-seq-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.showToast('데이터를 내보냈습니다', 'success');
    },

    /**
     * Import data from JSON
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.progress) {
                    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(data.progress));
                }
                if (data.settings) {
                    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
                }
                if (data.achievements) {
                    localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements));
                }
                if (data.stats) {
                    localStorage.setItem(this.KEYS.STATS, JSON.stringify(data.stats));
                }

                Utils.showToast('데이터를 가져왔습니다', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                Utils.showToast('데이터 가져오기 실패: 잘못된 파일입니다', 'error');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Get leaderboard data (top scores)
     */
    getLeaderboard() {
        const progress = this.getProgress();
        const leaderboard = [];

        for (const [questionId, score] of Object.entries(progress.scores)) {
            leaderboard.push({
                questionId: parseInt(questionId),
                score,
                attempts: progress.attempts[questionId] || 1,
                bestTime: progress.bestTimes[questionId] || 0
            });
        }

        return leaderboard.sort((a, b) => b.score - a.score);
    }
};
