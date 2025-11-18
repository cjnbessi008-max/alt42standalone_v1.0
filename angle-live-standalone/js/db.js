/**
 * Angle Live - IndexedDB Manager
 * 로컬 데이터베이스 관리
 */

class AngleLiveDB {
    constructor() {
        this.dbName = 'AngleLiveDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * 데이터베이스 초기화
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
                console.log('IndexedDB 연결 성공');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('IndexedDB 스키마 업그레이드');
                const db = event.target.result;

                // 세션 저장소
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    sessionsStore.createIndex('angle', 'angle', { unique: false });
                }

                // 사용자 진행 상황
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', {
                        keyPath: 'id'
                    });
                    progressStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // 각도 기록
                if (!db.objectStoreNames.contains('angleHistory')) {
                    const historyStore = db.createObjectStore('angleHistory', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('angle', 'angle', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('date', 'date', { unique: false });
                }

                // 설정
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('IndexedDB 스키마 생성 완료');
            };
        });
    }

    /**
     * 세션 저장
     */
    async saveSession(sessionData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');

            const data = {
                angle: sessionData.angle,
                status: sessionData.status,
                description: sessionData.description,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            };

            const request = store.add(data);

            request.onsuccess = () => {
                console.log('세션 저장 완료:', data);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('세션 저장 실패:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 모든 세션 조회
     */
    async getAllSessions(limit = 100) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const index = store.index('timestamp');

            const request = index.openCursor(null, 'prev'); // 최신순
            const results = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                console.error('세션 조회 실패:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 각도 기록 저장
     */
    async saveAngleHistory(angle, statusInfo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['angleHistory'], 'readwrite');
            const store = transaction.objectStore('angleHistory');

            const data = {
                angle: angle,
                status: statusInfo.name,
                description: statusInfo.description,
                color: statusInfo.visual,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            };

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('각도 기록 실패:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 각도 기록 조회
     */
    async getAngleHistory(limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['angleHistory'], 'readonly');
            const store = transaction.objectStore('angleHistory');
            const index = store.index('timestamp');

            const request = index.openCursor(null, 'prev');
            const results = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 진행 상황 저장
     */
    async saveProgress(progressData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readwrite');
            const store = transaction.objectStore('progress');

            const data = {
                id: 'main',
                totalSessions: progressData.totalSessions || 0,
                anglesDiscovered: progressData.anglesDiscovered || 0,
                uniqueAngles: progressData.uniqueAngles || [],
                completionPercentage: progressData.completionPercentage || 0,
                lastAngle: progressData.lastAngle || 0,
                updatedAt: Date.now(),
                startedAt: progressData.startedAt || Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => {
                resolve(data);
            };

            request.onerror = () => {
                console.error('진행 상황 저장 실패:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 진행 상황 조회
     */
    async getProgress() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');

            const request = store.get('main');

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    // 초기 진행 상황 생성
                    const initialProgress = {
                        totalSessions: 0,
                        anglesDiscovered: 0,
                        uniqueAngles: [],
                        completionPercentage: 0,
                        lastAngle: 0,
                        startedAt: Date.now()
                    };
                    resolve(initialProgress);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 설정 저장
     */
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            const data = { key, value, updatedAt: Date.now() };
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(data);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 설정 조회
     */
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');

            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 통계 조회
     */
    async getStatistics() {
        const sessions = await this.getAllSessions(1000);
        const progress = await this.getProgress();

        // 각도별 빈도수 계산
        const angleFrequency = {};
        sessions.forEach(session => {
            const angle = Math.round(session.angle);
            angleFrequency[angle] = (angleFrequency[angle] || 0) + 1;
        });

        // 가장 많이 조작한 각도
        const mostFrequentAngle = Object.entries(angleFrequency)
            .sort((a, b) => b[1] - a[1])[0] || [0, 0];

        // 날짜별 세션 수
        const sessionsByDate = {};
        sessions.forEach(session => {
            const date = session.date || new Date(session.timestamp).toISOString().split('T')[0];
            sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
        });

        return {
            totalSessions: sessions.length,
            uniqueAngles: new Set(sessions.map(s => Math.round(s.angle))).size,
            mostFrequentAngle: parseInt(mostFrequentAngle[0]),
            mostFrequentCount: mostFrequentAngle[1],
            angleFrequency,
            sessionsByDate,
            progress
        };
    }

    /**
     * 모든 데이터 내보내기
     */
    async exportData() {
        const sessions = await this.getAllSessions(10000);
        const progress = await this.getProgress();
        const history = await this.getAngleHistory(1000);
        const statistics = await this.getStatistics();

        return {
            version: this.version,
            exportDate: new Date().toISOString(),
            sessions,
            progress,
            history,
            statistics
        };
    }

    /**
     * 데이터 가져오기
     */
    async importData(data) {
        // 기존 데이터 백업
        const backup = await this.exportData();

        try {
            // 진행 상황 복원
            if (data.progress) {
                await this.saveProgress(data.progress);
            }

            // 세션 복원
            if (data.sessions && Array.isArray(data.sessions)) {
                for (const session of data.sessions) {
                    await this.saveSession(session);
                }
            }

            console.log('데이터 가져오기 완료');
            return { success: true, backup };
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            throw error;
        }
    }

    /**
     * 모든 데이터 삭제
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            const storeNames = ['sessions', 'progress', 'angleHistory', 'settings'];
            const transaction = this.db.transaction(storeNames, 'readwrite');

            let completed = 0;

            storeNames.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    completed++;
                    if (completed === storeNames.length) {
                        console.log('모든 데이터 삭제 완료');
                        resolve();
                    }
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        });
    }

    /**
     * 데이터베이스 닫기
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('IndexedDB 연결 종료');
        }
    }
}

// 전역 인스턴스
const angleLiveDB = new AngleLiveDB();
