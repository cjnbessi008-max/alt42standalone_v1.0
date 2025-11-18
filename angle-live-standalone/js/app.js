/**
 * Angle Live Standalone - Main Application
 * 독립형 웹앱 메인 로직
 */

class AngleLiveStandaloneApp {
    constructor() {
        this.visualizer = null;
        this.miniVisualizer = null;
        this.currentAngle = 0;
        this.saveDebounced = null;
        this.installPrompt = null;
    }

    /**
     * 앱 초기화
     */
    async init() {
        Utils.log('Initializing Angle Live Standalone App...');
        Utils.showLoading('앱 초기화 중...');

        try {
            // IndexedDB 초기화
            await angleLiveDB.init();
            Utils.log('Database initialized');

            // Service Worker 등록
            await this.registerServiceWorker();

            // 시각화 초기화
            this.initVisualizers();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // 진행 상황 로드
            await this.loadProgress();

            // 디바운스된 저장 함수 생성
            this.saveDebounced = Utils.debounce(
                (angle) => this.saveAngle(angle),
                CONFIG.AUTO_SAVE_DEBOUNCE
            );

            // 초기 각도 표시
            this.updateAngle(0, false);

            // PWA 설치 프롬프트 처리
            this.setupPWAInstall();

            // 온라인/오프라인 상태 모니터링
            this.setupNetworkMonitoring();

            Utils.hideLoading();
            Utils.showToast('앱이 준비되었습니다!', 'success');
            Utils.log('App initialized successfully');

        } catch (error) {
            Utils.error('App initialization failed:', error);
            Utils.hideLoading();
            Utils.showToast('앱 초기화 실패: ' + error.message, 'error');
        }
    }

    /**
     * Service Worker 등록
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                Utils.log('Service Worker registered:', registration);

                // 업데이트 확인
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            Utils.showToast('새 버전이 있습니다. 새로고침하시겠습니까?', 'info', 5000);
                        }
                    });
                });

                return registration;
            } catch (error) {
                Utils.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * 시각화 초기화
     */
    initVisualizers() {
        this.visualizer = new AngleVisualizer('angleCanvas', CONFIG.CANVAS);
        this.miniVisualizer = new MiniAngleVisualizer('miniAngleCanvas', CONFIG.MINI_CANVAS);
        Utils.log('Visualizers initialized');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 슬라이더
        const slider = document.getElementById('angleSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const angle = parseFloat(e.target.value);
                this.updateAngle(angle, false);

                // 디바운스된 저장
                if (CONFIG.AUTO_SAVE) {
                    this.saveDebounced(angle);
                }
            });

            slider.addEventListener('change', (e) => {
                const angle = parseFloat(e.target.value);
                this.saveAngle(angle);
            });
        }

        // 데이터 내보내기 버튼
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // 데이터 가져오기 버튼
        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }

        // 통계 보기 버튼
        const statsBtn = document.getElementById('showStatsBtn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.showStatistics());
        }

        // 데이터 삭제 버튼
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }

        // 설정 버튼
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.adjustAngle(-1);
            } else if (e.key === 'ArrowRight') {
                this.adjustAngle(1);
            } else if (e.key === 'ArrowUp') {
                this.adjustAngle(10);
            } else if (e.key === 'ArrowDown') {
                this.adjustAngle(-10);
            }
        });

        Utils.log('Event listeners setup complete');
    }

    /**
     * 각도 조정 (키보드)
     */
    adjustAngle(delta) {
        const slider = document.getElementById('angleSlider');
        if (slider) {
            let newAngle = this.currentAngle + delta;
            newAngle = Math.max(0, Math.min(360, newAngle));
            slider.value = newAngle;
            this.updateAngle(newAngle, true);
        }
    }

    /**
     * 각도 업데이트
     */
    updateAngle(angle, save = false) {
        this.currentAngle = angle;

        // UI 업데이트
        document.getElementById('angleValue').textContent = Math.round(angle);
        document.getElementById('miniAngleValue').textContent = Math.round(angle);

        // 상태 정보 가져오기
        const statusInfo = storage.findAngleStatus(angle);

        // 상태 표시
        document.getElementById('angleStatus').textContent = statusInfo.name;
        document.getElementById('statusDescription').textContent = statusInfo.description;
        document.getElementById('miniStatus').textContent = statusInfo.name;

        // 미니 정보 업데이트
        this.updateMiniInfo(statusInfo, angle);

        // 시각화 업데이트
        const color = CONFIG.COLORS[statusInfo.visual] || CONFIG.COLORS['color-default'];

        this.visualizer.setColor(statusInfo.visual);
        this.visualizer.draw(angle);

        this.miniVisualizer.setColor(statusInfo.visual);
        this.miniVisualizer.draw(angle);

        // 저장
        if (save) {
            this.saveAngle(angle);
        }
    }

    /**
     * 미니 정보 업데이트
     */
    updateMiniInfo(statusInfo, angle) {
        const miniType = document.getElementById('miniType');
        const miniRange = document.getElementById('miniRange');

        if (miniType) {
            let angleType = '예각';
            if (angle === 90) angleType = '직각';
            else if (angle > 90 && angle < 180) angleType = '둔각';
            else if (angle === 180) angleType = '평각';
            else if (angle > 180) angleType = '우각';

            miniType.textContent = angleType;
        }

        if (miniRange) {
            const thresholds = storage.getAngleThresholds();
            const threshold = thresholds.find(t =>
                angle >= t.angleMin && angle <= t.angleMax
            );

            if (threshold) {
                miniRange.textContent = `${threshold.angleMin}° - ${threshold.angleMax}°`;
            } else {
                miniRange.textContent = '-';
            }
        }
    }

    /**
     * 각도 저장
     */
    async saveAngle(angle) {
        try {
            const statusInfo = storage.findAngleStatus(angle);
            await storage.saveSession(angle, statusInfo);

            // 진행 상황 업데이트
            const progress = await storage.getProgress();
            this.updateProgressDisplay(progress);

            Utils.log('Angle saved:', angle);
        } catch (error) {
            Utils.error('Failed to save angle:', error);
        }
    }

    /**
     * 진행 상황 로드
     */
    async loadProgress() {
        try {
            const progress = await storage.getProgress();
            this.updateProgressDisplay(progress);
        } catch (error) {
            Utils.error('Failed to load progress:', error);
        }
    }

    /**
     * 진행 상황 표시 업데이트
     */
    updateProgressDisplay(progress) {
        const totalSessions = document.getElementById('totalSessions');
        const anglesDiscovered = document.getElementById('anglesDiscovered');
        const completionRate = document.getElementById('completionRate');

        if (totalSessions) totalSessions.textContent = progress.totalSessions || 0;
        if (anglesDiscovered) anglesDiscovered.textContent = progress.anglesDiscovered || 0;
        if (completionRate) {
            completionRate.textContent = Utils.formatNumber(progress.completionPercentage || 0) + '%';
        }
    }

    /**
     * 데이터 내보내기
     */
    async exportData() {
        try {
            Utils.showLoading('데이터 내보내는 중...');
            await storage.exportData();
            Utils.hideLoading();
            Utils.showToast('데이터를 성공적으로 내보냈습니다!', 'success');
        } catch (error) {
            Utils.hideLoading();
            Utils.error('Export failed:', error);
            Utils.showToast('데이터 내보내기 실패: ' + error.message, 'error');
        }
    }

    /**
     * 데이터 가져오기 대화상자
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    Utils.showLoading('데이터 가져오는 중...');
                    await storage.importData(file);
                    await this.loadProgress();
                    Utils.hideLoading();
                    Utils.showToast('데이터를 성공적으로 가져왔습니다!', 'success');

                    // 페이지 새로고침 제안
                    if (Utils.confirm('데이터를 완전히 적용하려면 페이지를 새로고침해야 합니다. 지금 새로고침하시겠습니까?')) {
                        location.reload();
                    }
                } catch (error) {
                    Utils.hideLoading();
                    Utils.error('Import failed:', error);
                    Utils.showToast('데이터 가져오기 실패: ' + error.message, 'error');
                }
            }
        });

        input.click();
    }

    /**
     * 통계 표시
     */
    async showStatistics() {
        try {
            Utils.showLoading('통계 계산 중...');
            const stats = await storage.getStatistics();
            Utils.hideLoading();

            if (!stats) {
                Utils.showToast('통계를 가져올 수 없습니다.', 'error');
                return;
            }

            // 통계 모달 표시
            const modal = this.createStatsModal(stats);
            document.body.appendChild(modal);
        } catch (error) {
            Utils.hideLoading();
            Utils.error('Failed to show statistics:', error);
            Utils.showToast('통계 조회 실패: ' + error.message, 'error');
        }
    }

    /**
     * 통계 모달 생성
     */
    createStatsModal(stats) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📊 학습 통계</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">총 세션</div>
                            <div class="stat-value">${stats.totalSessions}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">발견한 각도</div>
                            <div class="stat-value">${stats.uniqueAngles}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">가장 많이 사용한 각도</div>
                            <div class="stat-value">${stats.mostFrequentAngle}°</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">완료율</div>
                            <div class="stat-value">${Utils.formatNumber(stats.progress.completionPercentage)}%</div>
                        </div>
                    </div>
                    <div class="stats-chart">
                        <h3>각도별 빈도</h3>
                        <canvas id="statsChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        // 닫기 버튼
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        return modal;
    }

    /**
     * 설정 표시
     */
    showSettings() {
        const settings = storage.getAllSettings();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⚙️ 설정</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-list">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="autoSave" ${CONFIG.AUTO_SAVE ? 'checked' : ''}>
                                자동 저장
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="showGrid" ${CONFIG.SHOW_GRID ? 'checked' : ''}>
                                격자 표시
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="debugMode" ${CONFIG.DEBUG ? 'checked' : ''}>
                                디버그 모드
                            </label>
                        </div>
                    </div>
                    <div class="settings-actions">
                        <button id="saveSettings" class="btn btn-primary">저장</button>
                        <button id="cancelSettings" class="btn btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        `;

        // 저장 버튼
        modal.querySelector('#saveSettings').addEventListener('click', async () => {
            CONFIG.AUTO_SAVE = modal.querySelector('#autoSave').checked;
            CONFIG.SHOW_GRID = modal.querySelector('#showGrid').checked;
            CONFIG.DEBUG = modal.querySelector('#debugMode').checked;

            await storage.saveSetting('autoSave', CONFIG.AUTO_SAVE);
            await storage.saveSetting('showGrid', CONFIG.SHOW_GRID);
            await storage.saveSetting('debug', CONFIG.DEBUG);

            Utils.showToast('설정이 저장되었습니다.', 'success');
            document.body.removeChild(modal);
        });

        // 취소 버튼
        modal.querySelector('#cancelSettings').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 닫기 버튼
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.body.appendChild(modal);
    }

    /**
     * 모든 데이터 삭제
     */
    async clearAllData() {
        if (Utils.confirm('모든 학습 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                Utils.showLoading('데이터 삭제 중...');
                await storage.clearAllData();
                await this.loadProgress();
                Utils.hideLoading();
                Utils.showToast('모든 데이터가 삭제되었습니다.', 'success');
                location.reload();
            } catch (error) {
                Utils.hideLoading();
                Utils.error('Failed to clear data:', error);
                Utils.showToast('데이터 삭제 실패: ' + error.message, 'error');
            }
        }
    }

    /**
     * PWA 설치 설정
     */
    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            Utils.log('PWA install prompt available');

            // 설치 버튼 표시
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => this.showInstallPrompt());
            }
        });

        // 설치 완료 후
        window.addEventListener('appinstalled', () => {
            Utils.log('PWA installed');
            Utils.showToast('앱이 설치되었습니다!', 'success');
            this.installPrompt = null;

            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        });
    }

    /**
     * PWA 설치 프롬프트 표시
     */
    async showInstallPrompt() {
        if (!this.installPrompt) {
            Utils.showToast('이미 설치되었거나 설치할 수 없습니다.', 'info');
            return;
        }

        const result = await this.installPrompt.prompt();
        Utils.log('Install prompt result:', result);

        if (result.outcome === 'accepted') {
            Utils.showToast('앱 설치 중...', 'info');
        }

        this.installPrompt = null;
    }

    /**
     * 네트워크 상태 모니터링
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            Utils.log('Network: Online');
            Utils.showToast('온라인 상태입니다.', 'success', 2000);
        });

        window.addEventListener('offline', () => {
            Utils.log('Network: Offline');
            Utils.showToast('오프라인 상태입니다. 데이터는 로컬에 저장됩니다.', 'info', 3000);
        });
    }

    /**
     * 앱 상태 가져오기
     */
    getState() {
        return {
            angle: this.currentAngle,
            online: Utils.isOnline(),
            version: CONFIG.APP_VERSION
        };
    }
}

// 전역 앱 인스턴스
let app = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', async function() {
    Utils.log('DOM Content Loaded');

    app = new AngleLiveStandaloneApp();
    await app.init();

    // 디버그 모드에서 전역 노출
    if (CONFIG.DEBUG) {
        window.app = app;
        window.storage = storage;
        window.angleLiveDB = angleLiveDB;
        window.CONFIG = CONFIG;
        window.Utils = Utils;
        Utils.log('Debug mode: Objects exposed to window');
    }
});

// 페이지 언로드 전 정리
window.addEventListener('beforeunload', function() {
    if (angleLiveDB) {
        angleLiveDB.close();
    }
});
