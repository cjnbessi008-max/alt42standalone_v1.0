/**
 * Visualization Module
 * Canvas를 사용한 해집합 시각화
 */

class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scale = 20; // 픽셀 per 단위
        this.animationProgress = 0;
        this.animationId = null;
    }

    /**
     * 캔버스 초기화
     */
    clear() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawGrid();
        this.drawAxes();
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 1;

        // 세로선
        for (let x = 0; x <= this.width; x += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // 가로선
        for (let y = 0; y <= this.height; y += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 좌표축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;

        // X축
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.width, this.centerY);
        this.ctx.stroke();

        // Y축
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.height);
        this.ctx.stroke();

        // 축 레이블
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('x', this.width - 20, this.centerY - 10);
        this.ctx.fillText('y', this.centerX + 10, 20);
    }

    /**
     * 점 그리기
     */
    drawPoint(x, y, color = '#ec4899', radius = 6, label = null) {
        const px = this.centerX + x * this.scale;
        const py = this.centerY - y * this.scale;

        // 점
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 외곽선 (글로우 효과)
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();

        // 레이블
        if (label) {
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText(label, px + 10, py - 10);
        }
    }

    /**
     * 직선 그리기 (ax + by = c)
     */
    drawLine(a, b, c, color = '#6366f1') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        if (b !== 0) {
            // y = (c - ax) / b 형태로 변환
            const y1 = (c - a * (-this.width / (2 * this.scale))) / b;
            const y2 = (c - a * (this.width / (2 * this.scale))) / b;

            const x1 = -this.width / (2 * this.scale);
            const x2 = this.width / (2 * this.scale);

            const px1 = this.centerX + x1 * this.scale;
            const py1 = this.centerY - y1 * this.scale;
            const px2 = this.centerX + x2 * this.scale;
            const py2 = this.centerY - y2 * this.scale;

            this.ctx.beginPath();
            this.ctx.moveTo(px1, py1);
            this.ctx.lineTo(px2, py2);
            this.ctx.stroke();
        } else if (a !== 0) {
            // 수직선 x = c/a
            const x = c / a;
            const px = this.centerX + x * this.scale;

            this.ctx.beginPath();
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.height);
            this.ctx.stroke();
        }
    }

    /**
     * 포물선 그리기 (ax^2 + bx + c = 0)
     */
    drawParabola(a, b, c, color = '#8b5cf6') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        let firstPoint = true;

        for (let px = 0; px <= this.width; px++) {
            const x = (px - this.centerX) / this.scale;
            const y = a * x * x + b * x + c;
            const py = this.centerY - y * this.scale;

            if (firstPoint) {
                this.ctx.moveTo(px, py);
                firstPoint = false;
            } else {
                this.ctx.lineTo(px, py);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 해 표시 (애니메이션)
     */
    animateSolution(oldSolution, newSolution, problemType) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.animationProgress = 0;

        const animate = () => {
            this.animationProgress += 0.05;

            if (this.animationProgress > 1) {
                this.animationProgress = 1;
            }

            this.clear();

            // 문제 타입에 따라 시각화
            if (problemType === 'linear') {
                this.visualizeLinear(newSolution, this.animationProgress);
            } else if (problemType === 'quadratic') {
                this.visualizeQuadratic(newSolution, this.animationProgress);
            } else if (problemType === 'system') {
                this.visualizeSystem(newSolution, this.animationProgress);
            }

            if (this.animationProgress < 1) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 일차방정식 시각화
     */
    visualizeLinear(solution, progress = 1) {
        if (solution.solutions && solution.solutions.length > 0) {
            const x = solution.solutions[0];

            // 해를 점으로 표시
            this.drawPoint(x, 0, '#ec4899', 6 * progress, `x = ${x}`);

            // 세로선으로 표시
            const px = this.centerX + x * this.scale;
            this.ctx.strokeStyle = `rgba(236, 72, 153, ${progress * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, this.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    /**
     * 이차방정식 시각화
     */
    visualizeQuadratic(solution, progress = 1) {
        // 포물선 그리기 (방정식 파싱 필요)
        // 여기서는 근만 표시

        if (solution.solutions && solution.solutions.length > 0) {
            solution.solutions.forEach((x, i) => {
                const color = i === 0 ? '#ec4899' : '#8b5cf6';
                this.drawPoint(x, 0, color, 6 * progress, `x${i + 1} = ${x}`);
            });
        }

        // 판별식에 따른 메시지
        if (solution.type === 'complex') {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('실근 없음 (허근)', 10, 20);
        } else if (solution.type === 'double') {
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('중근', 10, 20);
        }
    }

    /**
     * 연립방정식 시각화
     */
    visualizeSystem(solution, progress = 1) {
        if (solution.equations && solution.equations.length === 2) {
            // 두 직선 파싱 및 그리기
            const eq1 = this.parseLinearEquation(solution.equations[0]);
            const eq2 = this.parseLinearEquation(solution.equations[1]);

            if (eq1) {
                this.drawLine(eq1.a, eq1.b, eq1.c, '#6366f1');
            }

            if (eq2) {
                this.drawLine(eq2.a, eq2.b, eq2.c, '#8b5cf6');
            }
        }

        // 교점 표시
        if (solution.type === 'unique' && solution.solutions) {
            const x = solution.solutions.x;
            const y = solution.solutions.y;

            this.drawPoint(x, y, '#ec4899', 8 * progress, `(${x}, ${y})`);
        } else if (solution.type === 'none') {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('해 없음 (평행)', 10, 20);
        } else if (solution.type === 'infinite') {
            this.ctx.fillStyle = '#10b981';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('무수히 많은 해', 10, 20);
        }
    }

    /**
     * 선형 방정식 파싱 (ax + by = c)
     */
    parseLinearEquation(equation) {
        // 예: "2x + 3y = 6"
        const match = equation.match(/([-\d.]+)x\s*\+\s*([-\d.]+)y\s*=\s*([-\d.]+)/);

        if (match) {
            return {
                a: parseFloat(match[1]),
                b: parseFloat(match[2]),
                c: parseFloat(match[3])
            };
        }

        return null;
    }

    /**
     * 파티클 효과 (춤추는 애니메이션)
     */
    triggerDanceEffect() {
        const particles = document.querySelectorAll('.particle');

        particles.forEach(particle => {
            particle.style.opacity = '0';
            particle.style.animation = 'none';

            setTimeout(() => {
                particle.style.animation = 'dance 2s ease-in-out';
            }, 10);
        });
    }
}
