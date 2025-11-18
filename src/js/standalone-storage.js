/**
 * Standalone Storage Manager - LocalStorage 기반 데이터 관리
 * PHP/MySQL 대신 브라우저 로컬 스토리지 사용
 */

class StandaloneStorage {
    constructor() {
        this.storageKey = 'rootGlowApp';
        this.initializeStorage();
    }

    /**
     * 스토리지 초기화
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                user: {
                    id: this.generateUserId(),
                    username: 'Student',
                    createdAt: new Date().toISOString()
                },
                progress: {},
                answers: [],
                settings: {
                    glowEnabled: true,
                    glowIntensity: 5,
                    glowColor: '#00ffff'
                },
                statistics: {
                    totalProblems: 0,
                    totalAttempts: 0,
                    correctAnswers: 0,
                    averageScore: 0
                }
            };

            this.saveData(initialData);
        }
    }

    /**
     * 고유 사용자 ID 생성
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 데이터 저장
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    /**
     * 데이터 로드
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    }

    /**
     * 사용자 정보 가져오기
     */
    getUser() {
        const data = this.loadData();
        return data ? data.user : null;
    }

    /**
     * 사용자 정보 업데이트
     */
    updateUser(userInfo) {
        const data = this.loadData();
        if (data) {
            data.user = { ...data.user, ...userInfo };
            return this.saveData(data);
        }
        return false;
    }

    /**
     * 진행 상황 저장
     */
    saveProgress(problemId, roots, status = 'in_progress') {
        const data = this.loadData();
        if (data) {
            data.progress[problemId] = {
                roots: roots,
                status: status,
                updatedAt: new Date().toISOString(),
                attempts: (data.progress[problemId]?.attempts || 0) + 1
            };
            return this.saveData(data);
        }
        return false;
    }

    /**
     * 진행 상황 가져오기
     */
    getProgress(problemId) {
        const data = this.loadData();
        return data?.progress[problemId] || null;
    }

    /**
     * 모든 진행 상황 가져오기
     */
    getAllProgress() {
        const data = this.loadData();
        return data?.progress || {};
    }

    /**
     * 답안 저장
     */
    saveAnswer(problemId, roots, score, correct) {
        const data = this.loadData();
        if (data) {
            const answer = {
                id: Date.now(),
                problemId: problemId,
                roots: roots,
                score: score,
                correct: correct,
                submittedAt: new Date().toISOString()
            };

            data.answers.push(answer);

            // 통계 업데이트
            this.updateStatistics(data, score, correct);

            // 진행 상황 업데이트
            data.progress[problemId] = {
                ...data.progress[problemId],
                status: correct ? 'completed' : 'attempted',
                lastScore: score
            };

            return this.saveData(data);
        }
        return false;
    }

    /**
     * 통계 업데이트
     */
    updateStatistics(data, score, correct) {
        const stats = data.statistics;
        stats.totalAttempts++;
        if (correct) {
            stats.correctAnswers++;
        }

        // 평균 점수 계산
        const totalScore = stats.averageScore * (stats.totalAttempts - 1) + score;
        stats.averageScore = Math.round(totalScore / stats.totalAttempts);
    }

    /**
     * 답안 내역 가져오기
     */
    getAnswers(problemId = null) {
        const data = this.loadData();
        if (!data) return [];

        if (problemId) {
            return data.answers.filter(a => a.problemId === problemId);
        }
        return data.answers;
    }

    /**
     * 통계 가져오기
     */
    getStatistics() {
        const data = this.loadData();
        return data?.statistics || {
            totalProblems: 0,
            totalAttempts: 0,
            correctAnswers: 0,
            averageScore: 0
        };
    }

    /**
     * 설정 저장
     */
    saveSettings(settings) {
        const data = this.loadData();
        if (data) {
            data.settings = { ...data.settings, ...settings };
            return this.saveData(data);
        }
        return false;
    }

    /**
     * 설정 가져오기
     */
    getSettings() {
        const data = this.loadData();
        return data?.settings || {
            glowEnabled: true,
            glowIntensity: 5,
            glowColor: '#00ffff'
        };
    }

    /**
     * 특정 문제 완료 여부
     */
    isProblemCompleted(problemId) {
        const progress = this.getProgress(problemId);
        return progress?.status === 'completed';
    }

    /**
     * 데이터 내보내기 (JSON)
     */
    exportData() {
        const data = this.loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `root-glow-data-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * 데이터 가져오기 (JSON)
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.saveData(data);
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    /**
     * 모든 데이터 삭제
     */
    clearAllData() {
        if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem(this.storageKey);
            this.initializeStorage();
            return true;
        }
        return false;
    }

    /**
     * 스토리지 사용량 확인
     */
    getStorageInfo() {
        const data = this.loadData();
        const dataString = JSON.stringify(data);
        const bytes = new Blob([dataString]).size;
        const kb = (bytes / 1024).toFixed(2);
        const mb = (bytes / 1024 / 1024).toFixed(2);

        return {
            bytes: bytes,
            kb: kb,
            mb: mb,
            answersCount: data?.answers.length || 0,
            progressCount: Object.keys(data?.progress || {}).length
        };
    }
}

// 전역 객체로 노출
window.StandaloneStorage = StandaloneStorage;
