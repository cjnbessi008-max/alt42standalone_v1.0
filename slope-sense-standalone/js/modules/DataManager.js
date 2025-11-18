/**
 * DataManager - Handles all data operations with localStorage
 * No server required - 100% client-side
 */

export class DataManager {
    constructor() {
        this.storageKey = 'slopeSense_data';
        this.problems = [];
        this.userData = this.loadUserData();
    }

    /**
     * Load problems from JSON file
     */
    async loadProblems() {
        try {
            const response = await fetch('js/data/problems.json');
            const data = await response.json();
            this.problems = data.problems;
            return this.problems;
        } catch (error) {
            console.error('Error loading problems:', error);
            // Fallback to embedded problems
            this.problems = this.getFallbackProblems();
            return this.problems;
        }
    }

    /**
     * Get fallback problems if JSON fails to load
     */
    getFallbackProblems() {
        return [
            {
                id: 1,
                level: 1,
                type: "two_points",
                title: "기본 양의 기울기",
                description: "두 점 사이의 기울기를 구하세요",
                point1: { x: 0, y: 0 },
                point2: { x: 4, y: 2 },
                answer: 0.5,
                hint: "기울기 = (y₂ - y₁) / (x₂ - x₁) = (2 - 0) / (4 - 0)",
                explanation: "상승(rise)이 2이고 진행(run)이 4이므로, 기울기는 2/4 = 0.5입니다.",
                animation: "ball_roll"
            },
            {
                id: 2,
                level: 1,
                type: "two_points",
                title: "기울기 1",
                description: "45도 각도의 기울기를 찾으세요",
                point1: { x: 1, y: 1 },
                point2: { x: 5, y: 5 },
                answer: 1,
                hint: "상승과 진행이 같으면 기울기는 1입니다",
                explanation: "rise = 4, run = 4이므로 기울기 = 4/4 = 1입니다.",
                animation: "skier"
            },
            {
                id: 3,
                level: 2,
                type: "two_points",
                title: "음수 기울기",
                description: "내리막 경사의 기울기를 계산하세요",
                point1: { x: 1, y: 5 },
                point2: { x: 5, y: 1 },
                answer: -1,
                hint: "y값이 감소하면 기울기는 음수입니다",
                explanation: "rise = -4, run = 4이므로 기울기 = -1입니다.",
                animation: "ball_roll"
            }
        ];
    }

    /**
     * Load user data from localStorage
     */
    loadUserData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error parsing stored data:', error);
            }
        }

        // Return default user data structure
        return {
            currentProblemIndex: 0,
            completedProblems: [],
            attempts: [],
            stats: {
                totalAttempts: 0,
                correctAttempts: 0,
                totalTime: 0,
                hintsUsed: 0,
                lastPlayed: null
            },
            settings: {
                animationSpeed: 1.0,
                soundEnabled: true,
                showHintsAutomatically: false
            }
        };
    }

    /**
     * Save user data to localStorage
     */
    saveUserData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    /**
     * Get current problem
     */
    getCurrentProblem() {
        const index = this.userData.currentProblemIndex;
        return this.problems[index] || null;
    }

    /**
     * Get problem by index
     */
    getProblem(index) {
        return this.problems[index] || null;
    }

    /**
     * Get all problems
     */
    getAllProblems() {
        return this.problems;
    }

    /**
     * Get problems by level
     */
    getProblemsByLevel(level) {
        return this.problems.filter(p => p.level === level);
    }

    /**
     * Move to next problem
     */
    nextProblem() {
        if (this.userData.currentProblemIndex < this.problems.length - 1) {
            this.userData.currentProblemIndex++;
            this.saveUserData();
            return this.getCurrentProblem();
        }
        return null;
    }

    /**
     * Move to previous problem
     */
    previousProblem() {
        if (this.userData.currentProblemIndex > 0) {
            this.userData.currentProblemIndex--;
            this.saveUserData();
            return this.getCurrentProblem();
        }
        return null;
    }

    /**
     * Jump to specific problem
     */
    goToProblem(index) {
        if (index >= 0 && index < this.problems.length) {
            this.userData.currentProblemIndex = index;
            this.saveUserData();
            return this.getCurrentProblem();
        }
        return null;
    }

    /**
     * Record an attempt
     */
    recordAttempt(problemId, userAnswer, isCorrect, timeSpent, hintsUsed = 0) {
        const attempt = {
            problemId,
            userAnswer,
            isCorrect,
            timeSpent,
            hintsUsed,
            timestamp: new Date().toISOString()
        };

        this.userData.attempts.push(attempt);

        // Update stats
        this.userData.stats.totalAttempts++;
        if (isCorrect) {
            this.userData.stats.correctAttempts++;

            // Mark problem as completed
            if (!this.userData.completedProblems.includes(problemId)) {
                this.userData.completedProblems.push(problemId);
            }
        }
        this.userData.stats.totalTime += timeSpent;
        this.userData.stats.hintsUsed += hintsUsed;
        this.userData.stats.lastPlayed = new Date().toISOString();

        this.saveUserData();
        return attempt;
    }

    /**
     * Get user statistics
     */
    getStats() {
        const accuracy = this.userData.stats.totalAttempts > 0
            ? Math.round((this.userData.stats.correctAttempts / this.userData.stats.totalAttempts) * 100)
            : 0;

        const avgTime = this.userData.stats.totalAttempts > 0
            ? Math.round(this.userData.stats.totalTime / this.userData.stats.totalAttempts)
            : 0;

        return {
            ...this.userData.stats,
            accuracy,
            avgTime,
            completedCount: this.userData.completedProblems.length,
            totalProblems: this.problems.length
        };
    }

    /**
     * Get problem-specific statistics
     */
    getProblemStats(problemId) {
        const attempts = this.userData.attempts.filter(a => a.problemId === problemId);
        const correctAttempts = attempts.filter(a => a.isCorrect).length;

        return {
            totalAttempts: attempts.length,
            correctAttempts,
            accuracy: attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0,
            isCompleted: this.userData.completedProblems.includes(problemId),
            lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null
        };
    }

    /**
     * Check if answer is correct
     */
    checkAnswer(problemId, userAnswer) {
        const problem = this.problems.find(p => p.id === problemId);
        if (!problem) return false;

        const tolerance = 0.05; // 5% tolerance
        const diff = Math.abs(userAnswer - problem.answer);
        return diff <= tolerance || diff <= Math.abs(problem.answer * 0.05);
    }

    /**
     * Reset all progress
     */
    resetProgress() {
        if (confirm('정말로 모든 진행상황을 초기화하시겠습니까?')) {
            this.userData = {
                currentProblemIndex: 0,
                completedProblems: [],
                attempts: [],
                stats: {
                    totalAttempts: 0,
                    correctAttempts: 0,
                    totalTime: 0,
                    hintsUsed: 0,
                    lastPlayed: null
                },
                settings: this.userData.settings // Keep settings
            };
            this.saveUserData();
            return true;
        }
        return false;
    }

    /**
     * Export data to JSON
     */
    exportData() {
        const dataStr = JSON.stringify(this.userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `slope-sense-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import data from JSON
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.userData = data;
                    this.saveUserData();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        this.userData.settings = { ...this.userData.settings, ...settings };
        this.saveUserData();
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.userData.settings;
    }
}

export default DataManager;
