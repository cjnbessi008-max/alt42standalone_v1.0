/**
 * Symmetry Shine - 함수 대칭성 시각화 애플리케이션
 * Moodle LMS와 연동하여 문제를 받아 처리
 */

class SymmetryShine {
    constructor() {
        this.canvas = document.getElementById('function-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentProblem = null;
        this.showSymmetry = false;
        this.shineActive = false;
        this.animationFrame = null;
        this.shineTime = 0;

        // Canvas 실제 해상도 설정 (레티나 대응)
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 320 * 2;  // 고해상도
        this.canvas.height = 400 * 2;
        this.ctx.scale(2, 2);

        this.setupEventListeners();
        this.loadProblemFromMoodle();
    }

    setupEventListeners() {
        document.getElementById('show-symmetry').addEventListener('click', () => {
            this.showSymmetry = !this.showSymmetry;
            this.draw();
        });

        document.getElementById('shine-effect').addEventListener('click', () => {
            this.toggleShineEffect();
        });

        document.getElementById('next-problem').addEventListener('click', () => {
            this.loadProblemFromMoodle();
        });

        document.getElementById('submit-answer').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Enter 키로 제출
        document.getElementById('symmetry-axis').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
    }

    async loadProblemFromMoodle() {
        try {
            // Moodle LMS API 호출
            const response = await fetch('../api/get_problem.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('문제를 불러올 수 없습니다');
            }

            const data = await response.json();
            this.currentProblem = data;

            document.getElementById('status').textContent = 'Moodle LMS 연결 성공!';
            document.getElementById('problem-title').textContent = data.title || '함수 대칭성 문제';
            document.getElementById('problem-description').textContent = data.description || '다음 함수의 대칭축을 찾으세요.';

            this.draw();
        } catch (error) {
            console.error('Moodle 연동 오류:', error);
            // 데모 문제 사용
            this.loadDemoProblem();
        }
    }

    loadDemoProblem() {
        // 데모용 문제 (Moodle 연결 실패 시)
        this.currentProblem = {
            title: '이차함수의 대칭성',
            description: 'f(x) = x² - 4x + 3의 대칭축을 찾으세요',
            function: 'x*x - 4*x + 3',
            symmetryAxis: 2,
            type: 'quadratic'
        };

        document.getElementById('status').textContent = '데모 모드 (Moodle 미연결)';
        document.getElementById('problem-title').textContent = this.currentProblem.title;
        document.getElementById('problem-description').textContent = this.currentProblem.description;

        this.draw();
    }

    evaluateFunction(x) {
        if (!this.currentProblem || !this.currentProblem.function) {
            // 기본 이차함수
            return x * x - 4 * x + 3;
        }

        try {
            // 안전한 함수 평가
            const func = this.currentProblem.function.replace(/\^/g, '**');
            return eval(func);
        } catch (error) {
            console.error('함수 평가 오류:', error);
            return x * x - 4 * x + 3;
        }
    }

    draw() {
        const ctx = this.ctx;
        const width = 320;
        const height = 400;

        // 배경 클리어
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 좌표계 설정
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 30; // 픽셀 per 단위

        // 격자 그리기
        this.drawGrid(ctx, centerX, centerY, scale, width, height);

        // 축 그리기
        this.drawAxes(ctx, centerX, centerY, width, height);

        // 함수 그리기
        this.drawFunction(ctx, centerX, centerY, scale, width, height);

        // 대칭축 표시
        if (this.showSymmetry && this.currentProblem) {
            this.drawSymmetryAxis(ctx, centerX, centerY, scale, height);
        }
    }

    drawGrid(ctx, centerX, centerY, scale, width, height) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;

        // 세로 격자선
        for (let x = centerX % scale; x < width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // 가로 격자선
        for (let y = centerY % scale; y < height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawAxes(ctx, centerX, centerY, width, height) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // X축
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Y축
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        // 축 레이블
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('x', width - 20, centerY - 10);
        ctx.fillText('y', centerX + 10, 15);
    }

    drawFunction(ctx, centerX, centerY, scale, width, height) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();

        let started = false;

        for (let px = 0; px < width; px++) {
            const x = (px - centerX) / scale;
            const y = this.evaluateFunction(x);
            const py = centerY - y * scale;

            // 화면 범위 내에서만 그리기
            if (py >= -50 && py <= height + 50) {
                if (!started) {
                    ctx.moveTo(px, py);
                    started = true;
                } else {
                    ctx.lineTo(px, py);
                }
            } else {
                started = false;
            }
        }

        ctx.stroke();
    }

    drawSymmetryAxis(ctx, centerX, centerY, scale, height) {
        const axisX = this.currentProblem.symmetryAxis || 0;
        const px = centerX + axisX * scale;

        // 대칭축 선
        ctx.strokeStyle = '#f5576c';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // 대칭축 레이블
        ctx.fillStyle = '#f5576c';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`x = ${axisX}`, px + 5, 20);

        // Shine 효과가 활성화된 경우
        if (this.shineActive) {
            this.drawShineEffect(ctx, px, height);
        }
    }

    drawShineEffect(ctx, axisX, height) {
        const time = this.shineTime;

        // 빛선 효과 - 여러 개의 광선이 대칭축에서 퍼져나감
        const rays = 12;
        const maxLength = 150;

        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const length = maxLength * (0.5 + 0.5 * Math.sin(time * 2 + i));

            const gradient = ctx.createLinearGradient(
                axisX, height / 2,
                axisX + Math.cos(angle) * length,
                height / 2 + Math.sin(angle) * length
            );

            gradient.addColorStop(0, 'rgba(245, 87, 108, 0.8)');
            gradient.addColorStop(0.5, 'rgba(240, 147, 251, 0.4)');
            gradient.addColorStop(1, 'rgba(240, 147, 251, 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(axisX, height / 2);
            ctx.lineTo(
                axisX + Math.cos(angle) * length,
                height / 2 + Math.sin(angle) * length
            );
            ctx.stroke();
        }

        // 중심 광채
        const glowGradient = ctx.createRadialGradient(
            axisX, height / 2, 0,
            axisX, height / 2, 50 * (0.8 + 0.2 * Math.sin(time * 3))
        );
        glowGradient.addColorStop(0, 'rgba(245, 87, 108, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(240, 147, 251, 0.3)');
        glowGradient.addColorStop(1, 'rgba(240, 147, 251, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(axisX, height / 2, 50, 0, Math.PI * 2);
        ctx.fill();
    }

    toggleShineEffect() {
        this.shineActive = !this.shineActive;

        if (this.shineActive) {
            this.showSymmetry = true; // 대칭축도 함께 표시
            this.animateShine();
        } else {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            this.draw();
        }
    }

    animateShine() {
        this.shineTime += 0.05;
        this.draw();

        if (this.shineActive) {
            this.animationFrame = requestAnimationFrame(() => this.animateShine());
        }
    }

    checkAnswer() {
        const userAnswer = parseFloat(document.getElementById('symmetry-axis').value);
        const correctAnswer = this.currentProblem?.symmetryAxis || 2;

        const feedback = document.getElementById('feedback');
        feedback.classList.remove('correct', 'incorrect', 'show');

        // 약간의 오차 허용 (0.1)
        const isCorrect = Math.abs(userAnswer - correctAnswer) < 0.1;

        setTimeout(() => {
            if (isCorrect) {
                feedback.textContent = '정답입니다! 🎉';
                feedback.classList.add('correct', 'show');
                this.submitToMoodle(true);
            } else {
                feedback.textContent = `틀렸습니다. 다시 시도해보세요! (힌트: ${correctAnswer - 1} < x < ${correctAnswer + 1})`;
                feedback.classList.add('incorrect', 'show');
                this.submitToMoodle(false);
            }
        }, 100);
    }

    async submitToMoodle(isCorrect) {
        if (!this.currentProblem || !this.currentProblem.id) {
            console.log('데모 모드: 결과 저장 생략');
            return;
        }

        try {
            await fetch('../api/submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: this.currentProblem.id,
                    answer: document.getElementById('symmetry-axis').value,
                    is_correct: isCorrect,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Moodle 제출 오류:', error);
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.symmetryApp = new SymmetryShine();
});
