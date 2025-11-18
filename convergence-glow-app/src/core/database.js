/**
 * IndexedDB Wrapper for Convergence Glow
 * 로컬 데이터베이스 관리
 */

import { openDB } from 'idb';

const DB_NAME = 'convergence-glow-db';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // 수열 문제 저장소
                if (!db.objectStoreNames.contains('problems')) {
                    const problemStore = db.createObjectStore('problems', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    problemStore.createIndex('type', 'type');
                    problemStore.createIndex('difficulty', 'difficulty');
                }

                // 학생 응답 저장소
                if (!db.objectStoreNames.contains('attempts')) {
                    const attemptStore = db.createObjectStore('attempts', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    attemptStore.createIndex('problemId', 'problemId');
                    attemptStore.createIndex('timestamp', 'timestamp');
                    attemptStore.createIndex('isCorrect', 'isCorrect');
                }

                // 사용자 설정 저장소
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // 학습 통계 저장소
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', {
                        keyPath: 'date'
                    });
                    statsStore.createIndex('date', 'date');
                }
            }
        });

        // 기본 문제 데이터 삽입
        await this.seedDefaultProblems();

        return this.db;
    }

    // ===== 문제 관리 =====

    async getAllProblems() {
        return await this.db.getAll('problems');
    }

    async getProblem(id) {
        return await this.db.get('problems', id);
    }

    async getProblemsByType(type) {
        return await this.db.getAllFromIndex('problems', 'type', type);
    }

    async getRandomProblem(difficulty = null) {
        let problems = await this.getAllProblems();

        if (difficulty) {
            problems = problems.filter(p => p.difficulty === difficulty);
        }

        if (problems.length === 0) {
            await this.seedDefaultProblems();
            problems = await this.getAllProblems();
        }

        return problems[Math.floor(Math.random() * problems.length)];
    }

    async addProblem(problem) {
        return await this.db.add('problems', problem);
    }

    async updateProblem(id, problem) {
        return await this.db.put('problems', { ...problem, id });
    }

    async deleteProblem(id) {
        return await this.db.delete('problems', id);
    }

    // ===== 응답 관리 =====

    async saveAttempt(attempt) {
        const attemptData = {
            ...attempt,
            timestamp: new Date().toISOString()
        };
        return await this.db.add('attempts', attemptData);
    }

    async getAttemptsByProblem(problemId) {
        return await this.db.getAllFromIndex('attempts', 'problemId', problemId);
    }

    async getAllAttempts() {
        return await this.db.getAll('attempts');
    }

    async getRecentAttempts(limit = 10) {
        const attempts = await this.getAllAttempts();
        return attempts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // ===== 설정 관리 =====

    async getSetting(key, defaultValue = null) {
        const setting = await this.db.get('settings', key);
        return setting ? setting.value : defaultValue;
    }

    async setSetting(key, value) {
        return await this.db.put('settings', { key, value });
    }

    // ===== 통계 관리 =====

    async updateStatistics(date, stats) {
        const existing = await this.db.get('statistics', date);
        const updated = existing
            ? { ...existing, ...stats }
            : { date, ...stats };
        return await this.db.put('statistics', updated);
    }

    async getStatistics(startDate, endDate) {
        const all = await this.db.getAll('statistics');
        return all.filter(stat => {
            const statDate = new Date(stat.date);
            return statDate >= new Date(startDate) && statDate <= new Date(endDate);
        });
    }

    async getTodayStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const stats = await this.db.get('statistics', today);
        return stats || {
            date: today,
            totalAttempts: 0,
            correctAttempts: 0,
            totalTimeSpent: 0,
            problemsSolved: new Set()
        };
    }

    // ===== 데이터 초기화 =====

    async seedDefaultProblems() {
        const count = await this.db.count('problems');
        if (count > 0) return; // 이미 데이터가 있으면 건너뛰기

        const defaultProblems = [
            {
                type: 'geometric',
                difficulty: 'easy',
                title: '수렴하는 등비수열 (공비 1/2)',
                formula: {
                    expression: 'a_n = 1 × (1/2)^n',
                    latex: 'a_n = \\frac{1}{2^n}',
                    nStart: 0
                },
                initialTerm: 1,
                commonRatio: 0.5,
                convergenceType: 'convergent',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#FFE66D',
                    colorEnd: '#4ECDC4',
                    animationSpeed: 1.0
                },
                description: '항이 증가할수록 0에 가까워지는 수열입니다.'
            },
            {
                type: 'geometric',
                difficulty: 'easy',
                title: '발산하는 등비수열 (공비 2)',
                formula: {
                    expression: 'a_n = 1 × 2^n',
                    latex: 'a_n = 2^n',
                    nStart: 0
                },
                initialTerm: 1,
                commonRatio: 2,
                convergenceType: 'divergent',
                limitValue: null,
                visualConfig: {
                    colorStart: '#4ECDC4',
                    colorEnd: '#FF6B6B',
                    animationSpeed: 1.5
                },
                description: '항이 증가할수록 값이 급격히 커지는 수열입니다.'
            },
            {
                type: 'arithmetic',
                difficulty: 'easy',
                title: '수렴하는 등차수열',
                formula: {
                    expression: 'a_n = 10 - 0.5n',
                    latex: 'a_n = 10 - 0.5n',
                    nStart: 1
                },
                initialTerm: 10,
                commonDifference: -0.5,
                convergenceType: 'convergent',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#FFE66D',
                    colorEnd: '#95E1D3',
                    animationSpeed: 1.0
                },
                description: '일정한 속도로 감소하여 0에 수렴하는 수열입니다.'
            },
            {
                type: 'custom',
                difficulty: 'medium',
                title: '진동하며 수렴하는 수열',
                formula: {
                    expression: 'a_n = (-1)^n / n',
                    latex: 'a_n = \\frac{(-1)^n}{n}',
                    nStart: 1
                },
                convergenceType: 'oscillating',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#F38181',
                    colorEnd: '#AA96DA',
                    animationSpeed: 0.8
                },
                description: '양수와 음수를 번갈아가며 0에 수렴하는 수열입니다.'
            },
            {
                type: 'harmonic',
                difficulty: 'medium',
                title: '조화수열',
                formula: {
                    expression: 'a_n = 1 / n',
                    latex: 'a_n = \\frac{1}{n}',
                    nStart: 1
                },
                convergenceType: 'convergent',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#A8E6CF',
                    colorEnd: '#3D5A80',
                    animationSpeed: 1.2
                },
                description: '역수로 이루어진 수열로 0에 수렴합니다.'
            },
            {
                type: 'custom',
                difficulty: 'hard',
                title: '복잡한 수렴 수열',
                formula: {
                    expression: 'a_n = (n^2 + 1) / (n^3)',
                    latex: 'a_n = \\frac{n^2 + 1}{n^3}',
                    nStart: 1
                },
                convergenceType: 'convergent',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#FFB6B9',
                    colorEnd: '#8E7CC3',
                    animationSpeed: 1.0
                },
                description: '분자와 분모가 모두 증가하지만 0에 수렴하는 수열입니다.'
            },
            {
                type: 'geometric',
                difficulty: 'medium',
                title: '음의 공비를 가진 등비수열',
                formula: {
                    expression: 'a_n = 10 × (-0.8)^n',
                    latex: 'a_n = 10 \\times (-0.8)^n',
                    nStart: 0
                },
                initialTerm: 10,
                commonRatio: -0.8,
                convergenceType: 'oscillating',
                limitValue: 0,
                visualConfig: {
                    colorStart: '#FEC8D8',
                    colorEnd: '#957DAD',
                    animationSpeed: 1.0
                },
                description: '양수와 음수를 번갈아가며 0에 수렴합니다.'
            },
            {
                type: 'custom',
                difficulty: 'hard',
                title: '느리게 발산하는 수열',
                formula: {
                    expression: 'a_n = sqrt(n)',
                    latex: 'a_n = \\sqrt{n}',
                    nStart: 1
                },
                convergenceType: 'divergent',
                limitValue: null,
                visualConfig: {
                    colorStart: '#C7CEEA',
                    colorEnd: '#FF8B94',
                    animationSpeed: 1.3
                },
                description: '천천히 증가하지만 결국 발산하는 수열입니다.'
            }
        ];

        for (const problem of defaultProblems) {
            await this.addProblem(problem);
        }
    }

    // ===== 데이터 내보내기/가져오기 =====

    async exportData() {
        const [problems, attempts, settings, statistics] = await Promise.all([
            this.getAllProblems(),
            this.getAllAttempts(),
            this.db.getAll('settings'),
            this.db.getAll('statistics')
        ]);

        return {
            version: DB_VERSION,
            exportDate: new Date().toISOString(),
            data: {
                problems,
                attempts,
                settings,
                statistics
            }
        };
    }

    async importData(exportedData) {
        const tx = this.db.transaction(['problems', 'attempts', 'settings', 'statistics'], 'readwrite');

        try {
            // 기존 데이터 삭제
            await Promise.all([
                tx.objectStore('problems').clear(),
                tx.objectStore('attempts').clear(),
                tx.objectStore('settings').clear(),
                tx.objectStore('statistics').clear()
            ]);

            // 새 데이터 추가
            const { problems, attempts, settings, statistics } = exportedData.data;

            for (const problem of problems) {
                await tx.objectStore('problems').add(problem);
            }

            for (const attempt of attempts) {
                await tx.objectStore('attempts').add(attempt);
            }

            for (const setting of settings) {
                await tx.objectStore('settings').add(setting);
            }

            for (const stat of statistics) {
                await tx.objectStore('statistics').add(stat);
            }

            await tx.done;
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    async clearAllData() {
        const tx = this.db.transaction(['problems', 'attempts', 'settings', 'statistics'], 'readwrite');

        await Promise.all([
            tx.objectStore('problems').clear(),
            tx.objectStore('attempts').clear(),
            tx.objectStore('settings').clear(),
            tx.objectStore('statistics').clear()
        ]);

        await tx.done;
        await this.seedDefaultProblems();
    }
}

// 싱글톤 인스턴스
let dbInstance = null;

export async function getDatabase() {
    if (!dbInstance) {
        dbInstance = new Database();
        await dbInstance.init();
    }
    return dbInstance;
}

export default Database;
