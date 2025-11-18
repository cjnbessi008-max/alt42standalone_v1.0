/**
 * 메인 애플리케이션 로직
 * 모든 모듈을 통합하여 실행
 */

class App {
    constructor() {
        this.shapeRenderer = null;
        this.innerViewMode = null;
        this.currentProblem = null;

        this.elements = {
            connectionStatus: document.getElementById('connection-status'),
            problemContent: document.getElementById('problem-content'),
            shapeTitle: document.getElementById('shape-title'),
            shapeDescription: document.getElementById('shape-description'),
            resetButton: document.getElementById('reset-view')
        };
    }

    /**
     * 애플리케이션 초기화
     */
    async initialize() {
        console.log('애플리케이션 초기화 시작...');

        // 3D 렌더러 초기화
        this.shapeRenderer = new ShapeRenderer('canvas-container');

        // Inner View Mode 초기화
        this.innerViewMode = new InnerViewMode(this.shapeRenderer);

        // Moodle 연동 이벤트 리스너 설정
        this.setupMoodleListeners();

        // UI 이벤트 리스너 설정
        this.setupUIListeners();

        // Moodle 연결 시도
        const connected = await moodleConnector.initialize();

        if (connected) {
            console.log('Moodle 연결 성공');
            // 데모 데이터 로드 (실제 환경에서는 실제 API 호출)
            await this.loadDemoData();
        } else {
            console.warn('Moodle 연결 실패 - 데모 모드로 전환');
            await this.loadDemoData();
        }
    }

    /**
     * Moodle 이벤트 리스너 설정
     */
    setupMoodleListeners() {
        // 연결 상태 변경 이벤트
        moodleConnector.on('statusChange', (status) => {
            this.updateConnectionStatus(status);
        });

        // 문제 로드 이벤트
        moodleConnector.on('problemLoaded', (problem) => {
            this.loadProblem(problem);
        });

        // 에러 이벤트
        moodleConnector.on('error', (error) => {
            this.handleError(error);
        });
    }

    /**
     * UI 이벤트 리스너 설정
     */
    setupUIListeners() {
        // 시점 초기화 버튼
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                this.resetView();
            });
        }
    }

    /**
     * 데모 데이터 로드
     */
    async loadDemoData() {
        console.log('데모 데이터 로드 중...');
        await moodleConnector.loadDemoData();
    }

    /**
     * 문제 로드 및 표시
     */
    loadProblem(problem) {
        console.log('문제 로드:', problem);
        this.currentProblem = problem;

        // 문제 정보 UI 업데이트
        if (this.elements.problemContent) {
            this.elements.problemContent.innerHTML = `
                <div class="problem-details">
                    <h3 style="color: #667eea; margin-bottom: 15px;">${problem.title}</h3>
                    <p style="font-size: 16px; line-height: 1.8; color: #444;">
                        ${problem.description}
                    </p>
                    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
                        <strong>도형 종류:</strong> ${this.getShapeTypeName(problem.shape.type)}<br>
                        <strong>크기:</strong> ${this.getShapeDimensions(problem.shape)}
                    </div>
                </div>
            `;
        }

        // 도형 제목 업데이트
        if (this.elements.shapeTitle) {
            this.elements.shapeTitle.textContent = problem.title;
        }

        // 도형 설명 업데이트
        if (this.elements.shapeDescription) {
            this.elements.shapeDescription.textContent =
                `${this.getShapeTypeName(problem.shape.type)} - Inner View 모드를 활성화하여 내부 구조를 관찰하세요.`;
        }

        // 3D 도형 렌더링
        if (this.shapeRenderer) {
            this.shapeRenderer.createShape(problem.shape);
        }

        // Inner View Mode 리셋
        if (this.innerViewMode) {
            this.innerViewMode.reset();
        }
    }

    /**
     * 도형 타입 이름 한글화
     */
    getShapeTypeName(type) {
        const names = {
            'cube': '정육면체',
            'cylinder': '원기둥',
            'sphere': '구',
            'pyramid': '사각뿔',
            'cone': '원뿔'
        };
        return names[type] || type;
    }

    /**
     * 도형 크기 정보 문자열 생성
     */
    getShapeDimensions(shape) {
        const { type, dimensions } = shape;

        switch (type) {
            case 'cube':
                return `한 변의 길이 ${dimensions.size}cm`;
            case 'cylinder':
                return `반지름 ${dimensions.radius}cm, 높이 ${dimensions.height}cm`;
            case 'sphere':
                return `반지름 ${dimensions.radius}cm`;
            case 'pyramid':
                return `밑면 ${dimensions.baseSize}cm, 높이 ${dimensions.height}cm`;
            case 'cone':
                return `반지름 ${dimensions.radius}cm, 높이 ${dimensions.height}cm`;
            default:
                return 'N/A';
        }
    }

    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(status) {
        if (!this.elements.connectionStatus) return;

        this.elements.connectionStatus.className = 'status-indicator';

        switch (status) {
            case 'connected':
                this.elements.connectionStatus.classList.add('connected');
                this.elements.connectionStatus.textContent = 'Moodle 연결됨';
                break;
            case 'disconnected':
                this.elements.connectionStatus.classList.add('disconnected');
                this.elements.connectionStatus.textContent = '연결 끊김';
                break;
            case 'waiting':
                this.elements.connectionStatus.classList.add('waiting');
                this.elements.connectionStatus.textContent = '연결 중...';
                break;
        }
    }

    /**
     * 시점 초기화
     */
    resetView() {
        console.log('시점 초기화');

        if (this.shapeRenderer) {
            this.shapeRenderer.resetCameraPosition();
        }

        if (this.innerViewMode) {
            this.innerViewMode.reset();
        }
    }

    /**
     * 에러 처리
     */
    handleError(error) {
        console.error('애플리케이션 에러:', error);

        if (this.elements.problemContent) {
            this.elements.problemContent.innerHTML = `
                <div style="padding: 20px; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">
                    <strong style="color: #c62828;">오류 발생</strong>
                    <p style="margin-top: 10px; color: #666;">
                        ${error.message || '알 수 없는 오류가 발생했습니다.'}
                    </p>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        다시 시도
                    </button>
                </div>
            `;
        }
    }

    /**
     * 정리 (메모리 해제)
     */
    dispose() {
        if (this.shapeRenderer) {
            this.shapeRenderer.dispose();
        }
    }
}

// 페이지 로드 시 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();

    // 전역에서 접근 가능하도록 설정 (디버깅용)
    window.app = app;
});
