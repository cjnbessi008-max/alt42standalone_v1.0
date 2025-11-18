/**
 * LocalStorage - IndexedDB 기반 로컬 저장소 관리
 */

class LocalStorage {
    constructor(dbName = 'LogFlowDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * IndexedDB 초기화
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB 열기 실패:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB 초기화 완료');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 문제 저장소
                if (!db.objectStoreNames.contains('problems')) {
                    const problemStore = db.createObjectStore('problems', { keyPath: 'id' });
                    problemStore.createIndex('difficulty', 'difficulty', { unique: false });
                    problemStore.createIndex('category', 'category', { unique: false });
                }

                // 답안 저장소
                if (!db.objectStoreNames.contains('answers')) {
                    const answerStore = db.createObjectStore('answers', { keyPath: 'id', autoIncrement: true });
                    answerStore.createIndex('problemId', 'problemId', { unique: false });
                    answerStore.createIndex('timestamp', 'timestamp', { unique: false });
                    answerStore.createIndex('synced', 'synced', { unique: false });
                }

                // 진행상황 저장소
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', { keyPath: 'problemId' });
                    progressStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
                }

                // 학습 통계 저장소
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', { keyPath: 'date' });
                }

                // 사용자 설정 저장소
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('IndexedDB 스키마 업데이트 완료');
            };
        });
    }

    /**
     * 문제 저장
     */
    async saveProblem(problem) {
        const tx = this.db.transaction(['problems'], 'readwrite');
        const store = tx.objectStore('problems');
        return store.put(problem);
    }

    /**
     * 문제 가져오기
     */
    async getProblem(id) {
        const tx = this.db.transaction(['problems'], 'readonly');
        const store = tx.objectStore('problems');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 모든 문제 가져오기
     */
    async getAllProblems() {
        const tx = this.db.transaction(['problems'], 'readonly');
        const store = tx.objectStore('problems');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 난이도별 문제 가져오기
     */
    async getProblemsByDifficulty(difficulty) {
        const tx = this.db.transaction(['problems'], 'readonly');
        const store = tx.objectStore('problems');
        const index = store.index('difficulty');
        return new Promise((resolve, reject) => {
            const request = index.getAll(difficulty);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 답안 저장
     */
    async saveAnswer(answer) {
        const answerData = {
            ...answer,
            timestamp: Date.now(),
            synced: false // 서버와 동기화 여부
        };

        const tx = this.db.transaction(['answers'], 'readwrite');
        const store = tx.objectStore('answers');
        return new Promise((resolve, reject) => {
            const request = store.add(answerData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 동기화되지 않은 답안 가져오기
     */
    async getUnsyncedAnswers() {
        const tx = this.db.transaction(['answers'], 'readonly');
        const store = tx.objectStore('answers');
        const index = store.index('synced');
        return new Promise((resolve, reject) => {
            const request = index.getAll(false);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 답안 동기화 완료 표시
     */
    async markAnswerAsSynced(id) {
        const tx = this.db.transaction(['answers'], 'readwrite');
        const store = tx.objectStore('answers');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const answer = getRequest.result;
                if (answer) {
                    answer.synced = true;
                    const putRequest = store.put(answer);
                    putRequest.onsuccess = () => resolve(true);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve(false);
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 진행상황 저장
     */
    async saveProgress(problemId, progressData) {
        const progress = {
            problemId,
            ...progressData,
            lastAccessed: Date.now()
        };

        const tx = this.db.transaction(['progress'], 'readwrite');
        const store = tx.objectStore('progress');
        return store.put(progress);
    }

    /**
     * 진행상황 가져오기
     */
    async getProgress(problemId) {
        const tx = this.db.transaction(['progress'], 'readonly');
        const store = tx.objectStore('progress');
        return new Promise((resolve, reject) => {
            const request = store.get(problemId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 학습 통계 저장
     */
    async saveStatistics(date, stats) {
        const statistics = {
            date,
            ...stats,
            timestamp: Date.now()
        };

        const tx = this.db.transaction(['statistics'], 'readwrite');
        const store = tx.objectStore('statistics');
        return store.put(statistics);
    }

    /**
     * 학습 통계 가져오기
     */
    async getStatistics(startDate, endDate) {
        const tx = this.db.transaction(['statistics'], 'readonly');
        const store = tx.objectStore('statistics');

        return new Promise((resolve, reject) => {
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = store.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 전체 학습 통계 계산
     */
    async getTotalStatistics() {
        const tx = this.db.transaction(['answers'], 'readonly');
        const store = tx.objectStore('answers');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const answers = request.result;

                const stats = {
                    totalAttempts: answers.length,
                    correctAnswers: answers.filter(a => a.isCorrect).length,
                    averageGrade: answers.reduce((sum, a) => sum + (a.grade || 0), 0) / answers.length || 0,
                    problemsAttempted: new Set(answers.map(a => a.problemId)).size,
                    lastActivity: answers.length > 0 ? Math.max(...answers.map(a => a.timestamp)) : 0
                };

                stats.successRate = stats.totalAttempts > 0
                    ? (stats.correctAnswers / stats.totalAttempts * 100).toFixed(2)
                    : 0;

                resolve(stats);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 문제별 통계 계산
     */
    async getProblemStatistics(problemId) {
        const tx = this.db.transaction(['answers'], 'readonly');
        const store = tx.objectStore('answers');
        const index = store.index('problemId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(problemId);
            request.onsuccess = () => {
                const answers = request.result;

                const stats = {
                    attempts: answers.length,
                    correct: answers.filter(a => a.isCorrect).length,
                    lastAttempt: answers.length > 0 ? Math.max(...answers.map(a => a.timestamp)) : 0,
                    averageGrade: answers.reduce((sum, a) => sum + (a.grade || 0), 0) / answers.length || 0
                };

                resolve(stats);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 설정 저장
     */
    async saveSetting(key, value) {
        const setting = { key, value };
        const tx = this.db.transaction(['settings'], 'readwrite');
        const store = tx.objectStore('settings');
        return store.put(setting);
    }

    /**
     * 설정 가져오기
     */
    async getSetting(key, defaultValue = null) {
        const tx = this.db.transaction(['settings'], 'readonly');
        const store = tx.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 모든 데이터 삭제
     */
    async clearAll() {
        const storeNames = ['problems', 'answers', 'progress', 'statistics'];

        const promises = storeNames.map(storeName => {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });

        return Promise.all(promises);
    }

    /**
     * 데이터 내보내기 (백업)
     */
    async exportData() {
        const data = {
            problems: await this.getAllProblems(),
            answers: await this.getAll('answers'),
            progress: await this.getAll('progress'),
            statistics: await this.getAll('statistics'),
            settings: await this.getAll('settings'),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * 데이터 가져오기 (복원)
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // 각 저장소에 데이터 복원
            for (const [storeName, items] of Object.entries(data)) {
                if (storeName === 'exportDate') continue;

                const tx = this.db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);

                for (const item of items) {
                    store.put(item);
                }
            }

            return true;
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            return false;
        }
    }

    /**
     * 저장소의 모든 데이터 가져오기
     */
    async getAll(storeName) {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// 전역에서 사용 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorage;
}
