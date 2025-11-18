/**
 * Drag and Drop Manager
 * 블록 드래그 앤 드롭 기능 관리
 */

export class DragDropManager {
    constructor(targetElement, onDropCallback) {
        this.targetElement = targetElement;
        this.onDropCallback = onDropCallback;

        this.draggingElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.ghostElement = null;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // 모든 드래그 가능한 블록에 이벤트 리스너 추가
        this.attachDragListeners();

        // 작업 영역을 드롭 존으로 설정
        this.setupDropZone();

        console.log('Drag & Drop Manager 초기화됨');
    }

    /**
     * 드래그 리스너 추가
     */
    attachDragListeners() {
        const draggableBlocks = document.querySelectorAll('.puzzle-block.draggable');

        draggableBlocks.forEach(block => {
            // 마우스 이벤트
            block.addEventListener('mousedown', (e) => this.onDragStart(e, block));

            // 터치 이벤트 (모바일)
            block.addEventListener('touchstart', (e) => this.onDragStart(e, block));
        });
    }

    /**
     * 드롭 존 설정
     */
    setupDropZone() {
        const canvas = this.targetElement.querySelector('#workspaceCanvas');

        // 드래그 오버
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });

        // 드래그 리브
        canvas.addEventListener('dragleave', () => {
            canvas.classList.remove('drag-over');
        });

        // 드롭
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
        });

        // 마우스 이동
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('touchmove', (e) => this.onDragMove(e));

        // 마우스 업
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
    }

    /**
     * 드래그 시작
     */
    onDragStart(event, block) {
        event.preventDefault();

        // 터치 이벤트 정규화
        const e = this.normalizeEvent(event);

        // 원본 블록 저장
        this.draggingElement = block;

        // 블록의 데이터 추출
        this.dragData = {
            type: block.dataset.type,
            value: block.dataset.value || null,
            inputs: parseInt(block.dataset.inputs) || 0
        };

        // 마우스 위치와 블록 위치 차이 계산
        const rect = block.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // 고스트 요소 생성
        this.createGhost(block, e.clientX, e.clientY);

        // 원본 블록 페이드
        block.classList.add('dragging');

        console.log('드래그 시작:', this.dragData);
    }

    /**
     * 드래그 이동
     */
    onDragMove(event) {
        if (!this.draggingElement || !this.ghostElement) {
            return;
        }

        event.preventDefault();

        const e = this.normalizeEvent(event);

        // 고스트 요소 이동
        this.ghostElement.style.left = (e.clientX - this.dragOffset.x) + 'px';
        this.ghostElement.style.top = (e.clientY - this.dragOffset.y) + 'px';
    }

    /**
     * 드래그 종료
     */
    onDragEnd(event) {
        if (!this.draggingElement) {
            return;
        }

        event.preventDefault();

        const e = this.normalizeEvent(event);

        // 드롭 위치 확인
        const dropTarget = this.getDropTarget(e.clientX, e.clientY);

        if (dropTarget) {
            // 작업 영역에 드롭됨
            const position = this.getCanvasPosition(e.clientX, e.clientY);

            // 콜백 호출
            if (this.onDropCallback) {
                this.onDropCallback(this.dragData, position);
            }

            console.log('드롭 완료:', position);
        }

        // 정리
        this.cleanup();
    }

    /**
     * 고스트 요소 생성
     */
    createGhost(block, x, y) {
        this.ghostElement = block.cloneNode(true);
        this.ghostElement.classList.add('ghost');
        this.ghostElement.classList.remove('draggable');
        this.ghostElement.style.position = 'fixed';
        this.ghostElement.style.left = (x - this.dragOffset.x) + 'px';
        this.ghostElement.style.top = (y - this.dragOffset.y) + 'px';
        this.ghostElement.style.pointerEvents = 'none';
        this.ghostElement.style.zIndex = '10000';
        this.ghostElement.style.opacity = '0.8';

        document.body.appendChild(this.ghostElement);
    }

    /**
     * 드롭 타겟 확인
     */
    getDropTarget(x, y) {
        const canvas = this.targetElement.querySelector('#workspaceCanvas');
        const rect = canvas.getBoundingClientRect();

        // 작업 영역 내부인지 확인
        if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        ) {
            return canvas;
        }

        return null;
    }

    /**
     * 캔버스 상대 좌표 계산
     */
    getCanvasPosition(x, y) {
        const canvas = this.targetElement.querySelector('#workspaceCanvas');
        const rect = canvas.getBoundingClientRect();

        return {
            x: x - rect.left - this.dragOffset.x + canvas.scrollLeft,
            y: y - rect.top - this.dragOffset.y + canvas.scrollTop
        };
    }

    /**
     * 이벤트 정규화 (마우스/터치)
     */
    normalizeEvent(event) {
        if (event.type.startsWith('touch')) {
            const touch = event.touches[0] || event.changedTouches[0];
            return {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
        }
        return event;
    }

    /**
     * 정리
     */
    cleanup() {
        if (this.draggingElement) {
            this.draggingElement.classList.remove('dragging');
            this.draggingElement = null;
        }

        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }

        this.dragData = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    /**
     * 작업 영역 블록 드래그 활성화
     */
    enableWorkspaceBlockDrag(blockElement) {
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let offset = { x: 0, y: 0 };

        const onMouseDown = (e) => {
            if (e.target.closest('.block-toolbar')) {
                return; // 툴바 버튼 클릭은 무시
            }

            isDragging = true;
            startPos = {
                x: e.clientX,
                y: e.clientY
            };

            const rect = blockElement.getBoundingClientRect();
            const canvas = blockElement.closest('#workspaceCanvas');
            const canvasRect = canvas.getBoundingClientRect();

            offset = {
                x: rect.left - canvasRect.left + canvas.scrollLeft,
                y: rect.top - canvasRect.top + canvas.scrollTop
            };

            blockElement.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startPos.x;
            const deltaY = e.clientY - startPos.y;

            blockElement.style.left = (offset.x + deltaX) + 'px';
            blockElement.style.top = (offset.y + deltaY) + 'px';
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                blockElement.style.cursor = 'move';

                // 최종 위치 업데이트
                const x = parseInt(blockElement.style.left);
                const y = parseInt(blockElement.style.top);

                console.log('블록 이동 완료:', { x, y });
            }
        };

        blockElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // 터치 이벤트도 추가
        blockElement.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });

        document.addEventListener('touchend', onMouseUp);
    }

    /**
     * 연결 라인 그리기
     */
    drawConnection(from, to) {
        // SVG를 사용한 연결 라인 그리기
        const canvas = this.targetElement.querySelector('#workspaceCanvas');

        // 기존 SVG 찾거나 생성
        let svg = canvas.querySelector('.connections-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('connections-svg');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            canvas.appendChild(svg);
        }

        // 베지어 곡선으로 연결선 그리기
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlPointOffset = Math.abs(to.x - from.x) / 2;

        const d = `M ${from.x} ${from.y} C ${from.x + controlPointOffset} ${from.y}, ${to.x - controlPointOffset} ${to.y}, ${to.x} ${to.y}`;

        path.setAttribute('d', d);
        path.setAttribute('stroke', '#7f8c8d');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');

        svg.appendChild(path);

        return path;
    }

    /**
     * 모든 연결 라인 지우기
     */
    clearConnections() {
        const canvas = this.targetElement.querySelector('#workspaceCanvas');
        const svg = canvas.querySelector('.connections-svg');

        if (svg) {
            svg.innerHTML = '';
        }
    }

    /**
     * 스냅 효과
     */
    snapToGrid(position, gridSize = 20) {
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }

    /**
     * 충돌 감지
     */
    checkCollision(block1, block2) {
        const rect1 = block1.getBoundingClientRect();
        const rect2 = block2.getBoundingClientRect();

        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }
}

export default DragDropManager;
