/**
 * Factor Lego - Drag and Drop Handler
 * 레고 조각 드래그 앤 드롭 기능
 */

class DragDropHandler {
    constructor() {
        this.draggedPiece = null;
        this.dropZone = null;
        this.palette = null;
        this.assembledPieces = [];
        this.interactionsCount = 0;
    }

    /**
     * 초기화
     * @param {HTMLElement} dropZone - 드롭 영역
     * @param {HTMLElement} palette - 팔레트 영역
     */
    initialize(dropZone, palette) {
        this.dropZone = dropZone;
        this.palette = palette;
        this.setupDropZone();
    }

    /**
     * 드롭 영역 설정
     */
    setupDropZone() {
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
            this.dropZone.classList.remove('drag-over');
        });
    }

    /**
     * 레고 조각 HTML 생성
     * @param {Object} piece - 레고 조각 객체
     * @param {boolean} inPalette - 팔레트에 있는지 여부
     * @returns {HTMLElement} 레고 조각 엘리먼트
     */
    createPieceElement(piece, inPalette = false) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `lego-piece ${piece.type} ${inPalette ? '' : 'pop'}`;
        pieceEl.draggable = true;
        pieceEl.dataset.pieceId = piece.id;
        pieceEl.dataset.pieceValue = piece.value;
        pieceEl.dataset.pieceType = piece.type;

        // 레고 조각 내용
        pieceEl.innerHTML = `
            <span class="piece-value">${piece.value}</span>
            ${!inPalette ? '<button class="remove-btn" title="제거">×</button>' : ''}
            <span class="tooltip">${piece.label}: ${piece.value}</span>
        `;

        // 드래그 이벤트 설정
        pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(e, piece, inPalette));
        pieceEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

        // 팔레트가 아닌 경우 제거 버튼 이벤트
        if (!inPalette) {
            const removeBtn = pieceEl.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removePiece(piece.id);
                });
            }
        }

        return pieceEl;
    }

    /**
     * 드래그 시작 처리
     * @param {DragEvent} e
     * @param {Object} piece - 레고 조각
     * @param {boolean} inPalette - 팔레트에서 드래그하는지
     */
    handleDragStart(e, piece, inPalette) {
        this.draggedPiece = {
            ...piece,
            fromPalette: inPalette
        };

        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', piece.id);

        this.interactionsCount++;
    }

    /**
     * 드래그 종료 처리
     * @param {DragEvent} e
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedPiece = null;
    }

    /**
     * 드롭 처리
     * @param {DragEvent} e
     */
    handleDrop(e) {
        if (!this.draggedPiece) return;

        // 팔레트에서 드래그한 경우 복제
        if (this.draggedPiece.fromPalette) {
            const newPiece = {
                ...this.draggedPiece,
                id: `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            this.addPieceToWorkspace(newPiece);
        } else {
            // 작업 영역 내에서 이동 (순서 변경)
            // 이미 있는 조각이므로 위치만 조정
            this.reorderPieces(e);
        }

        this.interactionsCount++;
        this.updateWorkspace();
    }

    /**
     * 작업 영역에 조각 추가
     * @param {Object} piece - 레고 조각
     */
    addPieceToWorkspace(piece) {
        this.assembledPieces.push(piece);
        this.renderWorkspace();
        this.playSound('add');
    }

    /**
     * 조각 제거
     * @param {string} pieceId - 조각 ID
     */
    removePiece(pieceId) {
        this.assembledPieces = this.assembledPieces.filter(p => p.id !== pieceId);
        this.renderWorkspace();
        this.playSound('remove');
        this.interactionsCount++;
    }

    /**
     * 작업 영역 렌더링
     */
    renderWorkspace() {
        // 드롭 힌트 제거
        const dropHint = this.dropZone.querySelector('.drop-hint');
        if (dropHint) {
            dropHint.style.display = this.assembledPieces.length === 0 ? 'block' : 'none';
        }

        // 기존 조각들 제거
        const existingPieces = this.dropZone.querySelectorAll('.lego-piece');
        existingPieces.forEach(p => p.remove());

        // has-pieces 클래스 토글
        if (this.assembledPieces.length > 0) {
            this.dropZone.classList.add('has-pieces');
        } else {
            this.dropZone.classList.remove('has-pieces');
        }

        // 새로운 조각들 추가
        this.assembledPieces.forEach((piece, index) => {
            const pieceEl = this.createPieceElement(piece, false);
            this.dropZone.appendChild(pieceEl);

            // 연결선 추가 (마지막 조각 제외)
            if (index < this.assembledPieces.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'lego-connector';
                this.dropZone.appendChild(connector);
            }
        });
    }

    /**
     * 팔레트 렌더링
     * @param {Array} pieces - 레고 조각 배열
     */
    renderPalette(pieces) {
        this.palette.innerHTML = '';

        pieces.forEach(piece => {
            const pieceEl = this.createPieceElement(piece, true);
            this.palette.appendChild(pieceEl);
        });
    }

    /**
     * 조각 순서 변경
     * @param {DragEvent} e
     */
    reorderPieces(e) {
        // 드롭 위치 계산
        const afterElement = this.getDragAfterElement(this.dropZone, e.clientX);
        const draggedIndex = this.assembledPieces.findIndex(p => p.id === this.draggedPiece.id);

        if (draggedIndex === -1) return;

        const [movedPiece] = this.assembledPieces.splice(draggedIndex, 1);

        if (afterElement == null) {
            this.assembledPieces.push(movedPiece);
        } else {
            const afterIndex = this.assembledPieces.findIndex(
                p => p.id === afterElement.dataset.pieceId
            );
            this.assembledPieces.splice(afterIndex, 0, movedPiece);
        }
    }

    /**
     * 드래그 후 위치 계산
     * @param {HTMLElement} container
     * @param {number} x - 마우스 X 좌표
     * @returns {HTMLElement|null}
     */
    getDragAfterElement(container, x) {
        const draggableElements = [
            ...container.querySelectorAll('.lego-piece:not(.dragging)')
        ];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * 작업 영역 업데이트
     */
    updateWorkspace() {
        this.renderWorkspace();
    }

    /**
     * 작업 영역 초기화
     */
    clearWorkspace() {
        this.assembledPieces = [];
        this.renderWorkspace();
        this.playSound('clear');
    }

    /**
     * 조립된 조각 가져오기
     * @returns {Array} 조각 배열
     */
    getAssembledPieces() {
        return this.assembledPieces;
    }

    /**
     * 상호작용 횟수 가져오기
     * @returns {number}
     */
    getInteractionsCount() {
        return this.interactionsCount;
    }

    /**
     * 상호작용 횟수 초기화
     */
    resetInteractionsCount() {
        this.interactionsCount = 0;
    }

    /**
     * 사운드 재생 (선택사항)
     * @param {string} type - 사운드 타입
     */
    playSound(type) {
        // 사운드 재생 로직 (필요시 구현)
        // 브라우저 오디오 API 사용 가능
        console.log(`Sound: ${type}`);
    }

    /**
     * 정답 시각 효과
     */
    showCorrectEffect() {
        const pieces = this.dropZone.querySelectorAll('.lego-piece');
        pieces.forEach((piece, index) => {
            setTimeout(() => {
                piece.classList.add('correct');
            }, index * 100);
        });

        setTimeout(() => {
            pieces.forEach(piece => {
                piece.classList.remove('correct');
            });
        }, 2000);
    }

    /**
     * 오답 시각 효과
     */
    showIncorrectEffect() {
        const pieces = this.dropZone.querySelectorAll('.lego-piece');
        pieces.forEach(piece => {
            piece.classList.add('incorrect');
        });

        setTimeout(() => {
            pieces.forEach(piece => {
                piece.classList.remove('incorrect');
            });
        }, 500);
    }

    /**
     * 힌트 하이라이트
     * @param {Array} hintPieceValues - 힌트 조각 값 배열
     */
    highlightHintPieces(hintPieceValues) {
        const palettePieces = this.palette.querySelectorAll('.lego-piece');

        palettePieces.forEach(piece => {
            if (hintPieceValues.includes(piece.dataset.pieceValue)) {
                piece.classList.add('hint-highlight');

                setTimeout(() => {
                    piece.classList.remove('hint-highlight');
                }, 3000);
            }
        });
    }
}

// 전역 인스턴스 생성
const dragDropHandler = new DragDropHandler();
