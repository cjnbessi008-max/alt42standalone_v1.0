/**
 * Local Storage Manager
 * 독립형 웹앱을 위한 로컬 데이터 저장소
 */

class StorageManager {
    constructor() {
        this.prefix = 'alt42_';
        this.initializeStorage();
    }

    /**
     * 스토리지 초기화
     */
    initializeStorage() {
        if (!this.get('user')) {
            this.set('user', {
                name: '학습자',
                level: 1,
                experience: 0,
                createdAt: new Date().toISOString(),
                streak: 0,
                lastActivity: new Date().toISOString()
            });
        }

        if (!this.get('statistics')) {
            this.set('statistics', {
                totalProblems: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                totalPoints: 0,
                problemsByCategory: {},
                problemsByDifficulty: {},
                dailyActivity: []
            });
        }

        if (!this.get('learningHistory')) {
            this.set('learningHistory', []);
        }

        if (!this.get('userPreferences')) {
            this.set('userPreferences', {
                weakCategories: [],
                strongCategories: [],
                preferredDifficulty: 'medium',
                learningSpeed: 'normal'
            });
        }
    }

    /**
     * 데이터 저장
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, data);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * 데이터 가져오기
     */
    get(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    /**
     * 데이터 삭제
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * 모든 데이터 삭제
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * 사용자 정보 업데이트
     */
    updateUser(updates) {
        const user = this.get('user');
        const updated = { ...user, ...updates };
        this.set('user', updated);
        return updated;
    }

    /**
     * 통계 업데이트
     */
    updateStatistics(updates) {
        const stats = this.get('statistics');
        const updated = { ...stats, ...updates };
        this.set('statistics', updated);
        return updated;
    }

    /**
     * 학습 기록 추가
     */
    addLearningRecord(record) {
        const history = this.get('learningHistory') || [];
        const newRecord = {
            ...record,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        history.push(newRecord);

        // 최근 1000개만 유지
        if (history.length > 1000) {
            history.shift();
        }

        this.set('learningHistory', history);
        return newRecord;
    }

    /**
     * 학습 기록 가져오기
     */
    getLearningHistory(limit = 100) {
        const history = this.get('learningHistory') || [];
        return history.slice(-limit).reverse();
    }

    /**
     * 문제 풀이 기록
     */
    recordProblemAttempt(problemId, isCorrect, difficulty, category, timeSpent) {
        const record = {
            problemId,
            isCorrect,
            difficulty,
            category,
            timeSpent,
            timestamp: new Date().toISOString()
        };

        this.addLearningRecord(record);

        // 통계 업데이트
        const stats = this.get('statistics');
        stats.totalProblems++;

        if (isCorrect) {
            stats.correctAnswers++;
            stats.totalPoints += this.getPointsByDifficulty(difficulty);
        } else {
            stats.incorrectAnswers++;
        }

        // 카테고리별 통계
        if (!stats.problemsByCategory[category]) {
            stats.problemsByCategory[category] = { total: 0, correct: 0 };
        }
        stats.problemsByCategory[category].total++;
        if (isCorrect) {
            stats.problemsByCategory[category].correct++;
        }

        // 난이도별 통계
        if (!stats.problemsByDifficulty[difficulty]) {
            stats.problemsByDifficulty[difficulty] = { total: 0, correct: 0 };
        }
        stats.problemsByDifficulty[difficulty].total++;
        if (isCorrect) {
            stats.problemsByDifficulty[difficulty].correct++;
        }

        // 일일 활동 기록
        const today = new Date().toISOString().split('T')[0];
        const dailyIndex = stats.dailyActivity.findIndex(d => d.date === today);

        if (dailyIndex >= 0) {
            stats.dailyActivity[dailyIndex].count++;
            if (isCorrect) stats.dailyActivity[dailyIndex].correct++;
        } else {
            stats.dailyActivity.push({
                date: today,
                count: 1,
                correct: isCorrect ? 1 : 0
            });
        }

        // 최근 30일만 유지
        if (stats.dailyActivity.length > 30) {
            stats.dailyActivity = stats.dailyActivity.slice(-30);
        }

        this.set('statistics', stats);

        // 사용자 레벨 업데이트
        this.updateUserLevel();
    }

    /**
     * 난이도별 점수
     */
    getPointsByDifficulty(difficulty) {
        const points = {
            'easy': 10,
            'medium': 20,
            'hard': 30
        };
        return points[difficulty] || 10;
    }

    /**
     * 사용자 레벨 업데이트
     */
    updateUserLevel() {
        const user = this.get('user');
        const stats = this.get('statistics');

        const newLevel = Math.floor(stats.totalPoints / 100) + 1;

        if (newLevel > user.level) {
            user.level = newLevel;
            user.experience = stats.totalPoints % 100;
            this.set('user', user);
            return true; // 레벨 업!
        }

        return false;
    }

    /**
     * 연속 학습일 업데이트
     */
    updateStreak() {
        const user = this.get('user');
        const lastActivity = new Date(user.lastActivity);
        const today = new Date();
        const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // 오늘 이미 활동함
            return user.streak;
        } else if (daysDiff === 1) {
            // 연속 학습
            user.streak++;
        } else {
            // 연속 끊김
            user.streak = 1;
        }

        user.lastActivity = today.toISOString();
        this.set('user', user);
        return user.streak;
    }

    /**
     * 약점 카테고리 분석
     */
    analyzeWeakCategories() {
        const stats = this.get('statistics');
        const weakCategories = [];

        for (const [category, data] of Object.entries(stats.problemsByCategory)) {
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;

            if (accuracy < 70 && data.total >= 3) {
                weakCategories.push({
                    category,
                    accuracy,
                    total: data.total,
                    correct: data.correct
                });
            }
        }

        // 정확도가 낮은 순으로 정렬
        weakCategories.sort((a, b) => a.accuracy - b.accuracy);

        const prefs = this.get('userPreferences');
        prefs.weakCategories = weakCategories.map(w => w.category);
        this.set('userPreferences', prefs);

        return weakCategories;
    }

    /**
     * 강점 카테고리 분석
     */
    analyzeStrongCategories() {
        const stats = this.get('statistics');
        const strongCategories = [];

        for (const [category, data] of Object.entries(stats.problemsByCategory)) {
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;

            if (accuracy >= 80 && data.total >= 5) {
                strongCategories.push({
                    category,
                    accuracy,
                    total: data.total,
                    correct: data.correct
                });
            }
        }

        // 정확도가 높은 순으로 정렬
        strongCategories.sort((a, b) => b.accuracy - a.accuracy);

        const prefs = this.get('userPreferences');
        prefs.strongCategories = strongCategories.map(s => s.category);
        this.set('userPreferences', prefs);

        return strongCategories;
    }

    /**
     * 데이터 내보내기 (백업)
     */
    exportData() {
        const data = {
            user: this.get('user'),
            statistics: this.get('statistics'),
            learningHistory: this.get('learningHistory'),
            userPreferences: this.get('userPreferences'),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * 데이터 가져오기 (복원)
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.user) this.set('user', data.user);
            if (data.statistics) this.set('statistics', data.statistics);
            if (data.learningHistory) this.set('learningHistory', data.learningHistory);
            if (data.userPreferences) this.set('userPreferences', data.userPreferences);

            return true;
        } catch (error) {
            console.error('Import data error:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
const storage = new StorageManager();
