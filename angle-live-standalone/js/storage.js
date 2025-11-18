/**
 * Angle Live - Storage Manager
 * localStorage + IndexedDB 통합 관리
 */

class StorageManager {
    constructor() {
        this.prefix = 'angleLive_';
        this.db = angleLiveDB;
    }

    /**
     * localStorage에 저장
     */
    setLocal(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error('localStorage 저장 실패:', error);
            return false;
        }
    }

    /**
     * localStorage에서 가져오기
     */
    getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('localStorage 조회 실패:', error);
            return defaultValue;
        }
    }

    /**
     * localStorage에서 삭제
     */
    removeLocal(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('localStorage 삭제 실패:', error);
            return false;
        }
    }

    /**
     * 모든 localStorage 데이터 삭제
     */
    clearLocal() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * 각도 임계값 데이터 (정적 데이터)
     */
    getAngleThresholds() {
        // 기본 임계값 데이터
        const defaultThresholds = [
            {
                id: 1,
                angleMin: 0,
                angleMax: 30,
                name: 'Acute Angle - Very Sharp',
                nameKo: '매우 좁은 예각',
                description: '매우 좁은 각도입니다. 예각이라고 합니다.',
                visual: 'color-blue',
                audio: null
            },
            {
                id: 2,
                angleMin: 30.01,
                angleMax: 60,
                name: 'Acute Angle - Moderate',
                nameKo: '중간 크기 예각',
                description: '중간 크기의 예각입니다.',
                visual: 'color-cyan',
                audio: null
            },
            {
                id: 3,
                angleMin: 60.01,
                angleMax: 89.99,
                name: 'Acute Angle - Wide',
                nameKo: '넓은 예각',
                description: '넓은 예각입니다.',
                visual: 'color-green',
                audio: null
            },
            {
                id: 4,
                angleMin: 90,
                angleMax: 90,
                name: 'Right Angle',
                nameKo: '직각',
                description: '직각입니다! 90도 정확히 맞췄습니다.',
                visual: 'color-yellow',
                audio: null
            },
            {
                id: 5,
                angleMin: 90.01,
                angleMax: 120,
                name: 'Obtuse Angle - Narrow',
                nameKo: '좁은 둔각',
                description: '좁은 둔각입니다.',
                visual: 'color-orange',
                audio: null
            },
            {
                id: 6,
                angleMin: 120.01,
                angleMax: 150,
                name: 'Obtuse Angle - Moderate',
                nameKo: '중간 크기 둔각',
                description: '중간 크기의 둔각입니다.',
                visual: 'color-red',
                audio: null
            },
            {
                id: 7,
                angleMin: 150.01,
                angleMax: 179.99,
                name: 'Obtuse Angle - Wide',
                nameKo: '넓은 둔각',
                description: '매우 넓은 둔각입니다.',
                visual: 'color-purple',
                audio: null
            },
            {
                id: 8,
                angleMin: 180,
                angleMax: 180,
                name: 'Straight Angle',
                nameKo: '평각',
                description: '평각입니다! 180도 정확히 맞췄습니다.',
                visual: 'color-pink',
                audio: null
            },
            {
                id: 9,
                angleMin: 180.01,
                angleMax: 270,
                name: 'Reflex Angle - Narrow',
                nameKo: '좁은 우각',
                description: '좁은 우각입니다.',
                visual: 'color-brown',
                audio: null
            },
            {
                id: 10,
                angleMin: 270.01,
                angleMax: 360,
                name: 'Reflex Angle - Wide',
                nameKo: '넓은 우각',
                description: '넓은 우각입니다.',
                visual: 'color-gray',
                audio: null
            }
        ];

        // 커스텀 임계값이 있으면 사용
        const customThresholds = this.getLocal('angleThresholds');
        return customThresholds || defaultThresholds;
    }

    /**
     * 각도에 해당하는 상태 정보 찾기
     */
    findAngleStatus(angle) {
        const thresholds = this.getAngleThresholds();

        for (const threshold of thresholds) {
            if (angle >= threshold.angleMin && angle <= threshold.angleMax) {
                return {
                    name: threshold.nameKo || threshold.name,
                    description: threshold.description,
                    visual: threshold.visual,
                    audio: threshold.audio
                };
            }
        }

        return {
            name: 'Unknown',
            description: '알 수 없는 각도입니다.',
            visual: 'color-default',
            audio: null
        };
    }

    /**
     * 앱 설정 저장
     */
    async saveSetting(key, value) {
        // localStorage에도 저장
        this.setLocal('setting_' + key, value);

        // IndexedDB에도 저장
        try {
            await this.db.saveSetting(key, value);
        } catch (error) {
            console.error('설정 저장 실패:', error);
        }
    }

    /**
     * 앱 설정 가져오기
     */
    async getSetting(key, defaultValue = null) {
        // 먼저 localStorage 확인
        const localValue = this.getLocal('setting_' + key);
        if (localValue !== null) {
            return localValue;
        }

        // IndexedDB 확인
        try {
            const dbValue = await this.db.getSetting(key);
            return dbValue !== null ? dbValue : defaultValue;
        } catch (error) {
            console.error('설정 조회 실패:', error);
            return defaultValue;
        }
    }

    /**
     * 모든 설정 가져오기
     */
    getAllSettings() {
        const settings = {};
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(this.prefix + 'setting_')) {
                const settingKey = key.replace(this.prefix + 'setting_', '');
                settings[settingKey] = this.getLocal('setting_' + settingKey);
            }
        });

        return settings;
    }

    /**
     * 진행 상황 저장
     */
    async saveProgress(progressData) {
        // localStorage 백업
        this.setLocal('progress', progressData);

        // IndexedDB 저장
        try {
            return await this.db.saveProgress(progressData);
        } catch (error) {
            console.error('진행 상황 저장 실패:', error);
            return progressData;
        }
    }

    /**
     * 진행 상황 가져오기
     */
    async getProgress() {
        try {
            // IndexedDB에서 가져오기
            const dbProgress = await this.db.getProgress();

            // localStorage에도 백업
            this.setLocal('progress', dbProgress);

            return dbProgress;
        } catch (error) {
            console.error('진행 상황 조회 실패:', error);

            // IndexedDB 실패 시 localStorage 백업 사용
            return this.getLocal('progress', {
                totalSessions: 0,
                anglesDiscovered: 0,
                uniqueAngles: [],
                completionPercentage: 0,
                lastAngle: 0,
                startedAt: Date.now()
            });
        }
    }

    /**
     * 세션 저장
     */
    async saveSession(angle, statusInfo) {
        try {
            await this.db.saveSession({
                angle,
                status: statusInfo.name,
                description: statusInfo.description
            });

            // 각도 기록도 저장
            await this.db.saveAngleHistory(angle, statusInfo);

            // 진행 상황 업데이트
            await this.updateProgress(angle);
        } catch (error) {
            console.error('세션 저장 실패:', error);
        }
    }

    /**
     * 진행 상황 업데이트
     */
    async updateProgress(angle) {
        try {
            const progress = await this.getProgress();

            // 세션 수 증가
            progress.totalSessions = (progress.totalSessions || 0) + 1;

            // 고유 각도 추가
            const roundedAngle = Math.round(angle);
            if (!progress.uniqueAngles.includes(roundedAngle)) {
                progress.uniqueAngles.push(roundedAngle);
                progress.anglesDiscovered = progress.uniqueAngles.length;
            }

            // 완료율 계산 (0-360도 중 몇 개 발견했는지)
            progress.completionPercentage = (progress.anglesDiscovered / 361) * 100;

            // 마지막 각도
            progress.lastAngle = angle;

            // 저장
            await this.saveProgress(progress);

            return progress;
        } catch (error) {
            console.error('진행 상황 업데이트 실패:', error);
        }
    }

    /**
     * 통계 조회
     */
    async getStatistics() {
        try {
            return await this.db.getStatistics();
        } catch (error) {
            console.error('통계 조회 실패:', error);
            return null;
        }
    }

    /**
     * 데이터 내보내기
     */
    async exportData() {
        try {
            const data = await this.db.exportData();

            // localStorage 데이터도 포함
            data.localStorage = {
                settings: this.getAllSettings(),
                progress: this.getLocal('progress')
            };

            // JSON 파일로 다운로드
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `angle-live-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return data;
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            throw error;
        }
    }

    /**
     * 데이터 가져오기
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // IndexedDB 데이터 복원
            await this.db.importData(data);

            // localStorage 데이터 복원
            if (data.localStorage) {
                if (data.localStorage.settings) {
                    for (const [key, value] of Object.entries(data.localStorage.settings)) {
                        this.setLocal('setting_' + key, value);
                    }
                }
                if (data.localStorage.progress) {
                    this.setLocal('progress', data.localStorage.progress);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            throw error;
        }
    }

    /**
     * 모든 데이터 삭제
     */
    async clearAllData() {
        if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return false;
        }

        try {
            // localStorage 삭제
            this.clearLocal();

            // IndexedDB 삭제
            await this.db.clearAll();

            console.log('모든 데이터 삭제 완료');
            return true;
        } catch (error) {
            console.error('데이터 삭제 실패:', error);
            return false;
        }
    }

    /**
     * 저장소 용량 정보
     */
    async getStorageInfo() {
        const info = {
            localStorage: {
                used: 0,
                available: '약 5-10MB'
            },
            indexedDB: {
                used: 0,
                available: '브라우저 설정에 따라 다름'
            }
        };

        // localStorage 사용량 계산
        let localStorageSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
                localStorageSize += localStorage[key].length + key.length;
            }
        }
        info.localStorage.used = `${(localStorageSize / 1024).toFixed(2)} KB`;

        // IndexedDB 사용량 (추정)
        try {
            const sessions = await this.db.getAllSessions(10000);
            const estimatedSize = JSON.stringify(sessions).length / 1024;
            info.indexedDB.used = `약 ${estimatedSize.toFixed(2)} KB`;
        } catch (error) {
            info.indexedDB.used = '계산 불가';
        }

        return info;
    }
}

// 전역 인스턴스
const storage = new StorageManager();
