/**
 * UI Manager for Shape Guide Lines Generator
 * Handles toast notifications, modals, loading states, etc.
 */

class UIManager {
    constructor() {
        this.toast = document.getElementById('toast');
        this.modal = document.getElementById('modal');
        this.loading = document.getElementById('loading');
        this.toastTimeout = null;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success', duration = 3000) {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toast.textContent = message;
        this.toast.className = `toast show ${type}`;

        this.toastTimeout = setTimeout(() => {
            this.hideToast();
        }, duration);
    }

    /**
     * Hide toast
     */
    hideToast() {
        this.toast.classList.remove('show');
    }

    /**
     * Show modal
     */
    showModal(title, content, buttons = []) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = title;

        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else {
            modalBody.innerHTML = '';
            modalBody.appendChild(content);
        }

        // Add buttons
        if (buttons.length > 0) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'modal-buttons';
            buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;';

            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `btn ${button.class || 'btn-primary'}`;
                btn.textContent = button.text;
                btn.onclick = () => {
                    if (button.onClick) {
                        button.onClick();
                    }
                    if (button.closeOnClick !== false) {
                        this.hideModal();
                    }
                };
                buttonContainer.appendChild(btn);
            });

            modalBody.appendChild(buttonContainer);
        }

        this.modal.classList.add('show');
    }

    /**
     * Hide modal
     */
    hideModal() {
        this.modal.classList.remove('show');
    }

    /**
     * Show loading overlay
     */
    showLoading(message = '처리 중...') {
        const loadingText = this.loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        this.loading.classList.remove('hidden');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loading.classList.add('hidden');
    }

    /**
     * Confirm dialog
     */
    confirm(title, message, onConfirm, onCancel) {
        this.showModal(title, `<p>${message}</p>`, [
            {
                text: '취소',
                class: 'btn-secondary',
                onClick: onCancel || (() => {})
            },
            {
                text: '확인',
                class: 'btn-primary',
                onClick: onConfirm
            }
        ]);
    }

    /**
     * Prompt dialog
     */
    prompt(title, message, defaultValue = '', onSubmit) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.className = 'form-input';
        input.style.cssText = 'width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; margin-top: 15px;';
        input.placeholder = message;

        const container = document.createElement('div');
        container.innerHTML = `<p>${message}</p>`;
        container.appendChild(input);

        this.showModal(title, container, [
            {
                text: '취소',
                class: 'btn-secondary'
            },
            {
                text: '확인',
                class: 'btn-primary',
                onClick: () => {
                    if (onSubmit) {
                        onSubmit(input.value);
                    }
                }
            }
        ]);

        // Focus input after a delay
        setTimeout(() => input.focus(), 100);

        // Submit on Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (onSubmit) {
                    onSubmit(input.value);
                }
                this.hideModal();
            }
        });
    }

    /**
     * Show shape details modal
     */
    showShapeDetails(shape) {
        const vertices = shape.vertices || [];
        const guideLines = shape.guideLines || [];

        const stats = {
            vertices: vertices.length,
            parallel: guideLines.filter(l => l.type === 'parallel').length,
            perpendicular: guideLines.filter(l => l.type === 'perpendicular').length,
            perimeter: GeometryUtils.perimeter(vertices).toFixed(2),
            area: GeometryUtils.area(vertices).toFixed(2)
        };

        const content = `
            <div class="shape-details">
                <h3>${shape.name}</h3>
                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div class="detail-item">
                        <strong>도형 유형:</strong><br>
                        ${this.getShapeTypeName(shape.type)}
                    </div>
                    <div class="detail-item">
                        <strong>꼭짓점 개수:</strong><br>
                        ${stats.vertices}개
                    </div>
                    <div class="detail-item">
                        <strong>평행선 개수:</strong><br>
                        ${stats.parallel}개
                    </div>
                    <div class="detail-item">
                        <strong>수선 개수:</strong><br>
                        ${stats.perpendicular}개
                    </div>
                    <div class="detail-item">
                        <strong>둘레:</strong><br>
                        ${stats.perimeter} px
                    </div>
                    <div class="detail-item">
                        <strong>넓이:</strong><br>
                        ${stats.area} px²
                    </div>
                </div>
                <div class="timestamps" style="color: #6b7280; font-size: 0.9rem; margin-top: 15px;">
                    <p><strong>생성:</strong> ${new Date(shape.createdAt).toLocaleString('ko-KR')}</p>
                    ${shape.updatedAt ? `<p><strong>수정:</strong> ${new Date(shape.updatedAt).toLocaleString('ko-KR')}</p>` : ''}
                </div>
            </div>
        `;

        this.showModal('도형 상세 정보', content, [
            {
                text: '닫기',
                class: 'btn-secondary'
            }
        ]);
    }

    /**
     * Get shape type Korean name
     */
    getShapeTypeName(type) {
        const names = {
            'triangle': '삼각형',
            'square': '정사각형',
            'rectangle': '직사각형',
            'pentagon': '오각형',
            'hexagon': '육각형',
            'custom': '사용자 정의'
        };
        return names[type] || type;
    }

    /**
     * Update canvas status message
     */
    updateCanvasStatus(message) {
        const statusEl = document.getElementById('canvas-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    /**
     * Render shapes gallery
     */
    renderShapesGallery(shapes) {
        const gallery = document.getElementById('shapes-gallery');

        if (!shapes || shapes.length === 0) {
            gallery.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 40px;">저장된 도형이 없습니다. 도형을 그리고 저장해보세요!</p>';
            return;
        }

        gallery.innerHTML = '';

        shapes.slice().reverse().forEach(shape => {
            const card = this.createShapeCard(shape);
            gallery.appendChild(card);
        });
    }

    /**
     * Create shape card element
     */
    createShapeCard(shape) {
        const card = document.createElement('div');
        card.className = 'shape-card';
        card.dataset.shapeId = shape.id;

        // Create mini canvas for preview
        const canvas = document.createElement('canvas');
        canvas.className = 'shape-card-canvas';
        canvas.width = 250;
        canvas.height = 150;

        // Draw mini preview
        if (shape.vertices && shape.vertices.length > 0) {
            const miniEngine = new ShapeEngine(canvas.id);
            miniEngine.canvas = canvas;
            miniEngine.ctx = canvas.getContext('2d');
            miniEngine.setVertices(shape.vertices);
            miniEngine.scaleToFit(20);
            miniEngine.updateSettings({ showLabels: false });
            miniEngine.render();
        }

        card.innerHTML = `
            <div class="shape-card-header">
                <h4>${shape.name}</h4>
                <div class="shape-card-actions">
                    <button class="icon-btn" data-action="info" title="상세 정보">ℹ️</button>
                    <button class="icon-btn" data-action="load" title="불러오기">📂</button>
                    <button class="icon-btn" data-action="delete" title="삭제">🗑️</button>
                </div>
            </div>
            <div class="shape-card-info">
                <p>유형: ${this.getShapeTypeName(shape.type)}</p>
                <p>꼭짓점: ${shape.vertices?.length || 0}개</p>
                <p>${new Date(shape.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
        `;

        card.appendChild(canvas);

        return card;
    }

    /**
     * Toggle phone viewer
     */
    togglePhoneViewer() {
        const viewer = document.querySelector('.smartphone-viewer');
        viewer.classList.toggle('collapsed');
    }

    /**
     * Show stats
     */
    showStats() {
        const stats = storage.getStats();

        if (!stats) {
            this.showToast('통계를 불러올 수 없습니다', 'error');
            return;
        }

        const content = `
            <div class="stats-container" style="padding: 20px;">
                <h3 style="margin-bottom: 20px;">📊 사용 통계</h3>
                <div class="stats-grid" style="display: grid; gap: 15px;">
                    <div class="stat-item" style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                        <strong style="color: #667eea;">총 도형 개수</strong><br>
                        <span style="font-size: 2rem; font-weight: bold;">${stats.totalShapes}</span>개
                    </div>
                    <div class="stat-item" style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                        <strong style="color: #667eea;">저장 공간 사용</strong><br>
                        <span style="font-size: 1.5rem; font-weight: bold;">${stats.storagePercent}%</span><br>
                        <small>${(stats.storageUsed / 1024).toFixed(2)} KB / ${(stats.storageLimit / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                    ${stats.oldestShape ? `
                    <div class="stat-item" style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                        <strong style="color: #667eea;">처음 사용</strong><br>
                        ${new Date(stats.oldestShape).toLocaleDateString('ko-KR')}
                    </div>
                    ` : ''}
                    ${stats.newestShape ? `
                    <div class="stat-item" style="background: #f3f4f6; padding: 15px; border-radius: 10px;">
                        <strong style="color: #667eea;">마지막 사용</strong><br>
                        ${new Date(stats.newestShape).toLocaleDateString('ko-KR')}
                    </div>
                    ` : ''}
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 10px;">
                    <p style="margin: 0; color: #0c4a6e;">
                        💡 <strong>팁:</strong> 저장 공간이 부족하면 "내보내기" 기능으로 백업 후 불필요한 도형을 삭제하세요.
                    </p>
                </div>
            </div>
        `;

        this.showModal('통계', content, [
            {
                text: '닫기',
                class: 'btn-secondary'
            }
        ]);
    }
}

// Create global UI instance
const ui = new UIManager();

// Modal close button event
document.querySelector('.modal-close')?.addEventListener('click', () => {
    ui.hideModal();
});

// Click outside modal to close
document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        ui.hideModal();
    }
});

console.log('✅ UI Manager loaded');
