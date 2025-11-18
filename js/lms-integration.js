/**
 * LMS Integration Module
 * Simulates Moodle 3.7 integration with MySQL 5.7 database
 */

class LMSIntegration {
    constructor() {
        this.baseURL = 'http://localhost/moodle'; // Mock Moodle URL
        this.apiVersion = '3.7';
        this.connected = true;

        // Mock student data
        this.students = {
            1: { id: 1, name: '김철수', grade: 3 },
            2: { id: 2, name: '이영희', grade: 3 },
            3: { id: 3, name: '박민수', grade: 4 },
            4: { id: 4, name: '정수진', grade: 4 }
        };

        // Mock module data
        this.modules = {
            addition: { id: 'addition', name: '덧셈 학습', difficulty: 1 },
            subtraction: { id: 'subtraction', name: '뺄셈 학습', difficulty: 1 },
            multiplication: { id: 'multiplication', name: '곱셈 학습', difficulty: 2 },
            fractions: { id: 'fractions', name: '분수 학습', difficulty: 3 }
        };

        // Mock performance data (simulating MySQL database records)
        this.performanceData = this.generateMockPerformanceData();
    }

    /**
     * Generate mock performance data for students
     */
    generateMockPerformanceData() {
        const data = {};

        for (let studentId in this.students) {
            data[studentId] = {};

            for (let moduleId in this.modules) {
                data[studentId][moduleId] = this.generateStudentModuleData(
                    parseInt(studentId),
                    moduleId
                );
            }
        }

        return data;
    }

    /**
     * Generate performance data for a specific student and module
     */
    generateStudentModuleData(studentId, moduleId) {
        const sessions = 10; // Number of practice sessions
        const scores = [];
        const timestamps = [];
        const problems = [];

        // Different trend patterns for different students
        let trendPattern = this.getTrendPattern(studentId, moduleId);

        for (let i = 0; i < sessions; i++) {
            const baseScore = 60 + (studentId * 5);
            const trend = trendPattern(i, sessions);
            const noise = Math.random() * 10 - 5; // Random variation
            const score = Math.max(0, Math.min(100, baseScore + trend + noise));

            scores.push(Math.round(score));

            // Generate timestamp (last 10 days)
            const date = new Date();
            date.setDate(date.getDate() - (sessions - i));
            timestamps.push(date.toISOString());

            // Generate problem history for this session
            problems.push({
                sessionId: i + 1,
                problemText: this.generateProblemText(moduleId),
                score: Math.round(score),
                timestamp: date.toISOString(),
                attempts: Math.floor(Math.random() * 3) + 1,
                correct: score > 70
            });
        }

        return {
            scores,
            timestamps,
            problems,
            currentScore: scores[scores.length - 1],
            averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            trend: this.calculateTrend(scores),
            velocity: this.calculateVelocity(scores),
            improvement: this.calculateImprovement(scores)
        };
    }

    /**
     * Get trend pattern function for student/module combination
     */
    getTrendPattern(studentId, moduleId) {
        const patterns = {
            1: (i, total) => i * 3, // Steady improvement
            2: (i, total) => Math.sin(i / 2) * 15, // Fluctuating
            3: (i, total) => i * 5 - (i > total / 2 ? 10 : 0), // Improvement then plateau
            4: (i, total) => i * 2 + Math.random() * 5 // Gradual with noise
        };

        return patterns[studentId] || patterns[1];
    }

    /**
     * Generate problem text based on module
     */
    generateProblemText(moduleId) {
        const problems = {
            addition: () => {
                const a = Math.floor(Math.random() * 50) + 1;
                const b = Math.floor(Math.random() * 50) + 1;
                return `${a} + ${b} = ?`;
            },
            subtraction: () => {
                const a = Math.floor(Math.random() * 50) + 20;
                const b = Math.floor(Math.random() * a);
                return `${a} - ${b} = ?`;
            },
            multiplication: () => {
                const a = Math.floor(Math.random() * 12) + 1;
                const b = Math.floor(Math.random() * 12) + 1;
                return `${a} × ${b} = ?`;
            },
            fractions: () => {
                const n1 = Math.floor(Math.random() * 5) + 1;
                const d1 = Math.floor(Math.random() * 5) + 2;
                const n2 = Math.floor(Math.random() * 5) + 1;
                const d2 = Math.floor(Math.random() * 5) + 2;
                return `${n1}/${d1} + ${n2}/${d2} = ?`;
            }
        };

        return problems[moduleId] ? problems[moduleId]() : '문제 없음';
    }

    /**
     * Calculate trend direction
     */
    calculateTrend(scores) {
        if (scores.length < 2) return 'neutral';

        const recent = scores.slice(-3);
        const earlier = scores.slice(-6, -3);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

        if (recentAvg > earlierAvg + 5) return 'up';
        if (recentAvg < earlierAvg - 5) return 'down';
        return 'neutral';
    }

    /**
     * Calculate learning velocity (rate of improvement)
     */
    calculateVelocity(scores) {
        if (scores.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < scores.length; i++) {
            changes.push(scores[i] - scores[i - 1]);
        }

        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        return Math.max(0, Math.min(100, 50 + avgChange * 5));
    }

    /**
     * Calculate improvement percentage
     */
    calculateImprovement(scores) {
        if (scores.length < 2) return 0;

        const first = scores[0];
        const last = scores[scores.length - 1];
        const improvement = ((last - first) / first) * 100;

        return Math.max(0, Math.min(100, 50 + improvement));
    }

    /**
     * Fetch student performance data (Mock API call)
     */
    async fetchStudentPerformance(studentId, moduleId) {
        // Simulate network delay
        await this.simulateNetworkDelay();

        if (!this.connected) {
            throw new Error('LMS 연결 실패');
        }

        if (!this.performanceData[studentId] || !this.performanceData[studentId][moduleId]) {
            throw new Error('데이터를 찾을 수 없습니다');
        }

        return {
            success: true,
            data: {
                student: this.students[studentId],
                module: this.modules[moduleId],
                performance: this.performanceData[studentId][moduleId]
            },
            timestamp: new Date().toISOString(),
            source: 'Moodle 3.7',
            database: 'MySQL 5.7'
        };
    }

    /**
     * Fetch recent problems for a student
     */
    async fetchRecentProblems(studentId, moduleId, limit = 5) {
        await this.simulateNetworkDelay();

        const performance = this.performanceData[studentId][moduleId];
        const recentProblems = performance.problems.slice(-limit).reverse();

        return {
            success: true,
            data: recentProblems,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Simulate network delay
     */
    simulateNetworkDelay() {
        return new Promise(resolve => {
            setTimeout(resolve, 300 + Math.random() * 200);
        });
    }

    /**
     * Check connection status
     */
    checkConnection() {
        return this.connected;
    }

    /**
     * Get all students
     */
    getStudents() {
        return Object.values(this.students);
    }

    /**
     * Get all modules
     */
    getModules() {
        return Object.values(this.modules);
    }

    /**
     * Simulate real-time data update
     */
    startRealtimeUpdates(callback, interval = 5000) {
        return setInterval(() => {
            // Simulate new data point
            const studentId = Math.floor(Math.random() * 4) + 1;
            const moduleKeys = Object.keys(this.modules);
            const moduleId = moduleKeys[Math.floor(Math.random() * moduleKeys.length)];

            const performance = this.performanceData[studentId][moduleId];
            const newScore = Math.max(0, Math.min(100,
                performance.currentScore + (Math.random() * 20 - 10)
            ));

            performance.scores.push(Math.round(newScore));
            performance.currentScore = Math.round(newScore);
            performance.timestamps.push(new Date().toISOString());

            // Recalculate metrics
            performance.averageScore = Math.round(
                performance.scores.reduce((a, b) => a + b, 0) / performance.scores.length
            );
            performance.trend = this.calculateTrend(performance.scores);
            performance.velocity = this.calculateVelocity(performance.scores);
            performance.improvement = this.calculateImprovement(performance.scores);

            if (callback) {
                callback({
                    studentId,
                    moduleId,
                    newScore: Math.round(newScore),
                    performance
                });
            }
        }, interval);
    }
}

// Export for use in other modules
window.LMSIntegration = LMSIntegration;
