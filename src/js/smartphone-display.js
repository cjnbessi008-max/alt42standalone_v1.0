/**
 * Smartphone Display Manager - 가상 스마트폰 화면 관리
 */

class SmartphoneDisplay {
    constructor() {
        this.phoneCanvas = document.getElementById('phone-canvas');
        this.phoneCtx = this.phoneCanvas ? this.phoneCanvas.getContext('2d') : null;

        this.phoneProblemDisplay = document.getElementById('phone-problem-display');
        this.phoneRootsDisplay = document.getElementById('phone-roots-display');
        this.phoneTime = document.getElementById('phone-time');

        // 스마트폰 화면 크기
        this.width = 230;
        this.height = 200;

        if (this.phoneCanvas) {
            this.phoneCanvas.width = this.width;
            this.phoneCanvas.height = this.height;
        }

        // 그래프 렌더러 (작은 크기)
        this.renderer = null;

        // 시간 업데이트
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    /**
     * 시간 업데이트
     */
    updateTime() {
        if (this.phoneTime) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.phoneTime.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * 문제 정보 표시
     */
    displayProblem(problemData) {
        if (!this.phoneProblemDisplay) return;

        const html = `
            <div style="margin-bottom: 10px;">
                <strong>문제 ID:</strong> ${problemData.id || 'N/A'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>함수:</strong> <code>f(x) = ${problemData.function || 'N/A'}</code>
            </div>
            <div>
                <strong>목표:</strong> ${problemData.description || '함수의 근을 찾으세요'}
            </div>
        `;

        this.phoneProblemDisplay.innerHTML = html;
    }

    /**
     * 그래프 표시
     */
    displayGraph(fn, roots = []) {
        if (!this.phoneCanvas || !this.phoneCtx) return;

        // 작은 그래프 렌더러 생성
        if (!this.renderer) {
            // Canvas를 직접 사용하는 간단한 렌더러
            this.renderSimpleGraph(fn, roots);
        } else {
            this.renderSimpleGraph(fn, roots);
        }
    }

    /**
     * 간단한 그래프 렌더링
     */
    renderSimpleGraph(fn, roots) {
        const ctx = this.phoneCtx;
        const w = this.width;
        const h = this.height;
        const padding = 20;

        // 배경
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, w, h);

        // 그래프 범위
        const xMin = -10;
        const xMax = 10;
        const yMin = -10;
        const yMax = 10;

        // 좌표 변환 함수
        const toCanvasX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (w - 2 * padding);
        const toCanvasY = (y) => h - padding - ((y - yMin) / (yMax - yMin)) * (h - 2 * padding);

        // 축 그리기
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;

        // X축
        ctx.beginPath();
        ctx.moveTo(padding, toCanvasY(0));
        ctx.lineTo(w - padding, toCanvasY(0));
        ctx.stroke();

        // Y축
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), padding);
        ctx.lineTo(toCanvasX(0), h - padding);
        ctx.stroke();

        // 함수 그리기
        if (fn) {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.beginPath();

            let isFirst = true;
            const step = (xMax - xMin) / 200;

            for (let x = xMin; x <= xMax; x += step) {
                const y = MathUtils.evaluate(fn, x);

                if (y !== null && y >= yMin && y <= yMax) {
                    const cx = toCanvasX(x);
                    const cy = toCanvasY(y);

                    if (isFirst) {
                        ctx.moveTo(cx, cy);
                        isFirst = false;
                    } else {
                        ctx.lineTo(cx, cy);
                    }
                } else {
                    isFirst = true;
                }
            }

            ctx.stroke();
        }

        // 근 표시
        if (roots && roots.length > 0) {
            roots.forEach((root, index) => {
                const cx = toCanvasX(root.x);
                const cy = toCanvasY(0);

                // Glow 효과 (작게)
                const time = Date.now() / 1000;
                const pulse = Math.sin(time * 2 + index * Math.PI / 3) * 0.3 + 0.7;

                for (let i = 3; i > 0; i--) {
                    const radius = 3 + i * 2 * pulse;
                    const alpha = (0.3 * pulse) / i;

                    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 근 점
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }
    }

    /**
     * 근 목록 표시
     */
    displayRoots(roots) {
        if (!this.phoneRootsDisplay) return;

        if (!roots || roots.length === 0) {
            this.phoneRootsDisplay.innerHTML = '<p style="color: #999; text-align: center;">근이 없습니다</p>';
            return;
        }

        let html = '<div style="font-weight: 600; margin-bottom: 8px; color: #667eea;">찾은 근:</div>';

        roots.forEach((root, index) => {
            html += `
                <div class="phone-root-item">
                    <strong>근 ${index + 1}:</strong> x = ${MathUtils.formatNumber(root.x, 4)}
                </div>
            `;
        });

        this.phoneRootsDisplay.innerHTML = html;
    }

    /**
     * 로딩 상태 표시
     */
    showLoading(message = '계산 중...') {
        if (this.phoneProblemDisplay) {
            this.phoneProblemDisplay.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="margin-bottom: 10px;">⏳</div>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    /**
     * 오류 메시지 표시
     */
    showError(error) {
        if (this.phoneProblemDisplay) {
            this.phoneProblemDisplay.innerHTML = `
                <div style="background: #ffebee; padding: 10px; border-radius: 5px; color: #c62828;">
                    <strong>⚠️ 오류:</strong><br>
                    ${error}
                </div>
            `;
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        successDiv.textContent = message;

        const container = document.querySelector('.smartphone-content');
        if (container) {
            container.appendChild(successDiv);

            setTimeout(() => {
                successDiv.remove();
            }, 2000);
        }
    }

    /**
     * 전체 업데이트
     */
    update(problemData, fn, roots) {
        this.displayProblem(problemData);
        this.displayGraph(fn, roots);
        this.displayRoots(roots);
    }

    /**
     * 초기화
     */
    reset() {
        if (this.phoneProblemDisplay) {
            this.phoneProblemDisplay.innerHTML = '<p>문제를 기다리는 중...</p>';
        }

        if (this.phoneRootsDisplay) {
            this.phoneRootsDisplay.innerHTML = '';
        }

        if (this.phoneCanvas && this.phoneCtx) {
            this.phoneCtx.clearRect(0, 0, this.width, this.height);
        }
    }

    /**
     * 애니메이션 시작
     */
    startAnimation(fn, roots) {
        const animate = () => {
            this.displayGraph(fn, roots);
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// 전역 객체로 노출
window.SmartphoneDisplay = SmartphoneDisplay;
