/**
 * 스마트폰 뷰포트 컨트롤러
 * 우측 하단 스마트폰 화면의 인터랙션 관리
 */
class SmartphoneViewport {
    constructor() {
        this.viewport = document.querySelector('.smartphone-viewport');
        this.isDraggable = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        this.init();
    }

    init() {
        // 드래그 기능 활성화 (선택적)
        // this.enableDragging();

        // 터치 이벤트 지원
        this.setupTouchEvents();
    }

    /**
     * 드래그 기능 활성화
     */
    enableDragging() {
        this.isDraggable = true;
        this.viewport.classList.add('draggable');

        this.viewport.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.onDragEnd());
    }

    onDragStart(e) {
        if (!this.isDraggable) return;

        this.isDragging = true;
        this.viewport.classList.add('dragging');

        const rect = this.viewport.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
    }

    onDrag(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        this.currentX = e.clientX - this.startX;
        this.currentY = e.clientY - this.startY;

        // 화면 밖으로 나가지 않도록 제한
        const maxX = window.innerWidth - this.viewport.offsetWidth;
        const maxY = window.innerHeight - this.viewport.offsetHeight;

        this.currentX = Math.max(0, Math.min(this.currentX, maxX));
        this.currentY = Math.max(0, Math.min(this.currentY, maxY));

        this.viewport.style.position = 'fixed';
        this.viewport.style.left = this.currentX + 'px';
        this.viewport.style.top = this.currentY + 'px';
        this.viewport.style.bottom = 'auto';
        this.viewport.style.right = 'auto';
    }

    onDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.viewport.classList.remove('dragging');
    }

    /**
     * 터치 이벤트 설정
     */
    setupTouchEvents() {
        // 스마트폰 화면 내부 터치 이벤트 처리
        const screen = this.viewport.querySelector('.smartphone-screen');

        screen.addEventListener('touchstart', (e) => {
            // 터치 피드백
            screen.style.opacity = '0.9';
        });

        screen.addEventListener('touchend', (e) => {
            screen.style.opacity = '1';
        });
    }

    /**
     * 위치 초기화
     */
    resetPosition() {
        this.viewport.style.position = 'fixed';
        this.viewport.style.bottom = '20px';
        this.viewport.style.right = '20px';
        this.viewport.style.left = 'auto';
        this.viewport.style.top = 'auto';
    }

    /**
     * 보이기/숨기기
     */
    show() {
        this.viewport.style.display = 'block';
        setTimeout(() => {
            this.viewport.style.opacity = '1';
        }, 10);
    }

    hide() {
        this.viewport.style.opacity = '0';
        setTimeout(() => {
            this.viewport.style.display = 'none';
        }, 300);
    }

    /**
     * 애니메이션 효과
     */
    shake() {
        this.viewport.style.animation = 'none';
        setTimeout(() => {
            this.viewport.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
    }

    pulse() {
        const screen = this.viewport.querySelector('.smartphone-screen');
        screen.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            screen.style.animation = '';
        }, 500);
    }
}

// 애니메이션 키프레임 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// 전역으로 export
window.SmartphoneViewport = SmartphoneViewport;
