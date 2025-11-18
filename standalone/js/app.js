/**
 * Main Application Controller
 * Shape Guide Lines Generator - Standalone PWA
 */

class App {
    constructor() {
        // Initialize engines
        this.mainEngine = new ShapeEngine('main-canvas');
        this.mobileEngine = new ShapeEngine('mobile-canvas');

        // Application state
        this.currentShapeType = 'triangle';
        this.currentShape = null;
        this.isDrawingCustom = false;

        // PWA install prompt
        this.deferredPrompt = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.renderGallery();
        this.setupPWA();
        this.showWelcome();

        console.log('✅ App initialized');
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const settings = storage.getSettings();
        if (settings) {
            this.mainEngine.updateSettings(settings);
            this.mobileEngine.updateSettings(settings);

            // Update UI controls
            document.getElementById('show-parallel').checked = settings.showParallel;
            document.getElementById('show-perpendicular').checked = settings.showPerpendicular;
            document.getElementById('show-labels').checked = settings.showLabels;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Shape type selector
        document.getElementById('shape-type').addEventListener('change', (e) => {
            this.currentShapeType = e.target.value;
            this.isDrawingCustom = (e.target.value === 'custom');
            ui.updateCanvasStatus(
                this.isDrawingCustom
                    ? '클릭하여 점을 찍으세요 (더블클릭으로 완성)'
                    : '캔버스를 클릭하여 도형을 그리세요'
            );
        });

        // Checkboxes
        document.getElementById('show-parallel').addEventListener('change', (e) => {
            const checked = e.target.checked;
            this.mainEngine.updateSettings({ showParallel: checked });
            this.mobileEngine.updateSettings({ showParallel: checked });
            storage.updateSetting('showParallel', checked);
            this.syncToMobile();
        });

        document.getElementById('show-perpendicular').addEventListener('change', (e) => {
            const checked = e.target.checked;
            this.mainEngine.updateSettings({ showPerpendicular: checked });
            this.mobileEngine.updateSettings({ showPerpendicular: checked });
            storage.updateSetting('showPerpendicular', checked);
            this.syncToMobile();
        });

        document.getElementById('show-labels').addEventListener('change', (e) => {
            const checked = e.target.checked;
            this.mainEngine.updateSettings({ showLabels: checked });
            this.mobileEngine.updateSettings({ showLabels: checked });
            storage.updateSetting('showLabels', checked);
            this.syncToMobile();
        });

        // Buttons
        document.getElementById('new-shape-btn').addEventListener('click', () => this.newShape());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('save-btn').addEventListener('click', () => this.saveShape());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.importData());
        document.getElementById('toggle-phone').addEventListener('click', () => ui.togglePhoneViewer());

        // Canvas click
        document.getElementById('main-canvas').addEventListener('click', (e) => this.handleCanvasClick(e));
        document.getElementById('main-canvas').addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));

        // Gallery delegation
        document.getElementById('shapes-gallery').addEventListener('click', (e) => this.handleGalleryClick(e));

        // Import file
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Handle canvas click
     */
    handleCanvasClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scale for high DPI displays
        const scaleX = e.target.width / rect.width;
        const scaleY = e.target.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        if (this.isDrawingCustom) {
            // Custom drawing mode
            this.mainEngine.addVertex(canvasX, canvasY);
            this.mainEngine.render();
            ui.updateCanvasStatus(`점 ${this.mainEngine.vertices.length}개 추가됨 (더블클릭으로 완성)`);
        } else {
            // Predefined shape
            this.mainEngine.createShape(this.currentShapeType, canvasX, canvasY, 100);
            this.mainEngine.render();
            this.syncToMobile();
            ui.updateCanvasStatus(`${ui.getShapeTypeName(this.currentShapeType)} 생성됨`);
        }
    }

    /**
     * Handle canvas double-click (finish custom shape)
     */
    handleCanvasDoubleClick(e) {
        if (this.isDrawingCustom && this.mainEngine.vertices.length >= 3) {
            this.mainEngine.regenerateGuideLines();
            this.mainEngine.render();
            this.syncToMobile();
            ui.updateCanvasStatus('사용자 정의 도형 완성!');
            this.isDrawingCustom = false;
        }
    }

    /**
     * Handle gallery clicks (event delegation)
     */
    handleGalleryClick(e) {
        const card = e.target.closest('.shape-card');
        if (!card) return;

        const shapeId = card.dataset.shapeId;
        const action = e.target.closest('[data-action]')?.dataset.action;

        if (action === 'load') {
            this.loadShape(shapeId);
        } else if (action === 'delete') {
            this.deleteShape(shapeId);
        } else if (action === 'info') {
            const shape = storage.getShape(shapeId);
            if (shape) {
                ui.showShapeDetails(shape);
            }
        } else {
            // Click on card itself - load shape
            this.loadShape(shapeId);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveShape();
                    break;
                case 'n':
                    e.preventDefault();
                    this.newShape();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportData();
                    break;
            }
        } else if (e.key === 'Escape') {
            if (this.isDrawingCustom) {
                this.clearCanvas();
                this.isDrawingCustom = false;
            }
            ui.hideModal();
        }
    }

    /**
     * Create new shape
     */
    newShape() {
        const type = this.currentShapeType;

        if (type === 'custom') {
            this.clearCanvas();
            this.isDrawingCustom = true;
            ui.updateCanvasStatus('클릭하여 점을 찍으세요 (더블클릭으로 완성)');
        } else {
            const centerX = this.mainEngine.canvas.width / 2;
            const centerY = this.mainEngine.canvas.height / 2;
            this.mainEngine.createShape(type, centerX, centerY, 100);
            this.mainEngine.render();
            this.syncToMobile();
            ui.updateCanvasStatus(`${ui.getShapeTypeName(type)} 생성됨`);
        }
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        if (this.mainEngine.vertices.length > 0) {
            ui.confirm(
                '캔버스 지우기',
                '현재 도형을 지우시겠습니까?',
                () => {
                    this.mainEngine.reset();
                    this.mobileEngine.reset();
                    this.currentShape = null;
                    ui.updateCanvasStatus('캔버스가 지워졌습니다');
                    ui.showToast('캔버스가 지워졌습니다', 'info');
                }
            );
        } else {
            ui.showToast('지울 도형이 없습니다', 'warning');
        }
    }

    /**
     * Save current shape
     */
    saveShape() {
        if (this.mainEngine.vertices.length < 2) {
            ui.showToast('먼저 도형을 그려주세요', 'warning');
            return;
        }

        ui.prompt(
            '도형 저장',
            '도형 이름을 입력하세요',
            `도형 ${storage.getAllShapes().length + 1}`,
            (name) => {
                if (!name || name.trim() === '') {
                    ui.showToast('이름을 입력해주세요', 'error');
                    return;
                }

                const shapeData = {
                    name: name.trim(),
                    type: this.currentShapeType,
                    vertices: this.mainEngine.getVertices(),
                    guideLines: this.mainEngine.guideLines
                };

                const savedShape = storage.saveShape(shapeData);

                if (savedShape) {
                    ui.showToast(`"${name}" 저장 완료!`, 'success');
                    this.renderGallery();
                    this.currentShape = savedShape;
                } else {
                    ui.showToast('저장 실패', 'error');
                }
            }
        );
    }

    /**
     * Load shape from storage
     */
    loadShape(shapeId) {
        const shape = storage.getShape(shapeId);

        if (!shape) {
            ui.showToast('도형을 찾을 수 없습니다', 'error');
            return;
        }

        this.mainEngine.setVertices(shape.vertices);
        this.mainEngine.render();
        this.syncToMobile();

        this.currentShape = shape;
        this.currentShapeType = shape.type;
        document.getElementById('shape-type').value = shape.type;

        ui.updateCanvasStatus(`"${shape.name}" 불러오기 완료`);
        ui.showToast(`"${shape.name}" 불러오기 완료`, 'success');
    }

    /**
     * Delete shape from storage
     */
    deleteShape(shapeId) {
        const shape = storage.getShape(shapeId);
        if (!shape) return;

        ui.confirm(
            '도형 삭제',
            `"${shape.name}"을(를) 삭제하시겠습니까?`,
            () => {
                if (storage.deleteShape(shapeId)) {
                    ui.showToast('삭제되었습니다', 'success');
                    this.renderGallery();

                    if (this.currentShape?.id === shapeId) {
                        this.clearCanvas();
                    }
                } else {
                    ui.showToast('삭제 실패', 'error');
                }
            }
        );
    }

    /**
     * Sync main canvas to mobile view
     */
    syncToMobile() {
        const vertices = this.mainEngine.getVertices();
        if (vertices.length > 0) {
            this.mobileEngine.setVertices(vertices);
            this.mobileEngine.scaleToFit(30);
            this.mobileEngine.render();
        }
    }

    /**
     * Render shapes gallery
     */
    renderGallery() {
        const shapes = storage.getAllShapes();
        ui.renderShapesGallery(shapes);
    }

    /**
     * Export data to JSON file
     */
    exportData() {
        const data = storage.exportData();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shapeguide_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        ui.showToast('데이터 내보내기 완료!', 'success');
    }

    /**
     * Import data from JSON file
     */
    importData() {
        document.getElementById('import-file').click();
    }

    /**
     * Handle file import
     */
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const result = storage.importData(data);

                if (result.success) {
                    ui.showToast(`${result.imported}개 도형 불러오기 완료!`, 'success');
                    this.renderGallery();
                } else {
                    ui.showToast(`불러오기 실패: ${result.error}`, 'error');
                }
            } catch (error) {
                ui.showToast('올바른 JSON 파일이 아닙니다', 'error');
                console.error('Import error:', error);
            }

            // Reset file input
            e.target.value = '';
        };

        reader.onerror = () => {
            ui.showToast('파일 읽기 실패', 'error');
        };

        reader.readAsText(file);
    }

    /**
     * Setup PWA install
     */
    setupPWA() {
        const installBtn = document.getElementById('install-btn');

        // Capture install prompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            installBtn.classList.remove('hidden');
        });

        // Install button click
        installBtn.addEventListener('click', async () => {
            if (!this.deferredPrompt) return;

            this.deferredPrompt.prompt();

            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                ui.showToast('앱 설치 완료!', 'success');
            }

            this.deferredPrompt = null;
            installBtn.classList.add('hidden');
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            ui.showToast('앱이 설치되었습니다!', 'success');
            this.deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    }

    /**
     * Show welcome message
     */
    showWelcome() {
        const hasVisited = localStorage.getItem('shapeguide_visited');

        if (!hasVisited) {
            setTimeout(() => {
                ui.showModal(
                    '도형 보조선 자동 생성기에 오신 것을 환영합니다! 🎉',
                    `
                    <div style="padding: 20px; line-height: 1.8;">
                        <p><strong>평행선과 수선</strong>이 자동으로 생성되는 독립형 웹앱입니다.</p>
                        <br>
                        <h4 style="color: #667eea;">✨ 주요 기능</h4>
                        <ul style="margin: 15px 0;">
                            <li>🔷 다양한 도형 지원 (삼각형, 사각형, 다각형 등)</li>
                            <li>📏 자동 보조선 생성 (평행선, 수선)</li>
                            <li>📱 스마트폰 뷰 실시간 미리보기</li>
                            <li>💾 로컬 저장 (서버 불필요)</li>
                            <li>📤 데이터 내보내기/불러오기</li>
                        </ul>
                        <br>
                        <p style="background: #e0f2fe; padding: 15px; border-radius: 10px;">
                            💡 <strong>팁:</strong> 도형 유형을 선택하고 캔버스를 클릭하면 도형이 생성됩니다!
                        </p>
                    </div>
                    `,
                    [
                        {
                            text: '시작하기',
                            class: 'btn-primary',
                            onClick: () => {
                                localStorage.setItem('shapeguide_visited', 'true');
                                this.newShape();
                            }
                        }
                    ]
                );
            }, 500);
        } else {
            // Create default shape for returning users
            this.newShape();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

console.log('✅ App loaded');
