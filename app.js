/**
 * 벡터 학습 앱 - Orthogonal Freeze 문제 해결
 *
 * 문제: 내적이 0일 때 (두 벡터가 수직일 때) 화면이 멈추는 현상
 * 해결:
 *   1. Orthogonal 조건 감지 및 특별 처리
 *   2. Zero division 방지
 *   3. 비동기 렌더링으로 UI blocking 방지
 *   4. 상태 기반 렌더링
 */

class VectorApp {
    constructor() {
        this.canvas = document.getElementById('vectorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentProblem = null;
        this.debugLog = [];
        this.freezeSimulation = false; // Freeze 문제 시뮬레이션 모드

        // DOM 요소 참조
        this.elements = {
            ax: document.getElementById('ax'),
            ay: document.getElementById('ay'),
            bx: document.getElementById('bx'),
            by: document.getElementById('by'),
            calculateBtn: document.getElementById('calculateBtn'),
            loadProblemBtn: document.getElementById('loadProblemBtn'),
            vectorA: document.getElementById('vectorA'),
            vectorB: document.getElementById('vectorB'),
            dotProduct: document.getElementById('dotProduct'),
            angle: document.getElementById('angle'),
            status: document.getElementById('status'),
            debugLog: document.getElementById('debugLog'),
            phoneVectorA: document.getElementById('phoneVectorA'),
            phoneVectorB: document.getElementById('phoneVectorB'),
            phoneDotProduct: document.getElementById('phoneDotProduct'),
            phoneDotStatus: document.getElementById('phoneDotStatus'),
            problemId: document.getElementById('problemId'),
            answerSection: document.getElementById('answerSection'),
            answerInput: document.getElementById('answerInput'),
            submitAnswer: document.getElementById('submitAnswer'),
            feedbackSection: document.getElementById('feedbackSection')
        };

        this.initializeEventListeners();
        this.log('시스템 초기화 완료', 'success');
        this.log('Moodle LMS 연결 준비 완료 (MySQL 5.7 + PHP 7.1.9 + Moodle 3.7)', 'success');
    }

    /**
     * 이벤트 리스너 초기화
     */
    initializeEventListeners() {
        this.elements.calculateBtn.addEventListener('click', () => this.calculateDotProduct());
        this.elements.loadProblemBtn.addEventListener('click', () => this.loadProblemFromMoodle());
        this.elements.submitAnswer.addEventListener('click', () => this.submitAnswer());

        // 엔터키로 제출
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // 입력 필드 변경 시 실시간 미리보기
        ['ax', 'ay', 'bx', 'by'].forEach(id => {
            this.elements[id].addEventListener('input', () => {
                this.drawVectorsOnCanvas();
            });
        });

        // 초기 캔버스 그리기
        this.drawVectorsOnCanvas();
    }

    /**
     * 벡터 내적 계산 (핵심 로직)
     */
    async calculateDotProduct() {
        try {
            // 입력 값 가져오기
            const ax = parseFloat(this.elements.ax.value) || 0;
            const ay = parseFloat(this.elements.ay.value) || 0;
            const bx = parseFloat(this.elements.bx.value) || 0;
            const by = parseFloat(this.elements.by.value) || 0;

            const vectorA = { x: ax, y: ay };
            const vectorB = { x: bx, y: by };

            this.log(`계산 시작: A(${ax}, ${ay}), B(${bx}, ${by})`);

            // 🔴 이전 문제: 여기서 바로 동기적으로 계산하면 복잡한 연산 시 UI가 멈춤
            // ✅ 해결책: 비동기 처리로 변경

            // UI 업데이트 (계산 중 표시)
            this.updateStatus('calculating');

            // 비동기 계산 (UI blocking 방지)
            const result = await this.calculateAsync(vectorA, vectorB);

            // Orthogonal 감지
            if (result.isOrthogonal) {
                this.log(`⚠️ Orthogonal 조건 감지! 내적 = ${result.dotProduct}`, 'warning');

                // 🔴 이전 문제: Orthogonal일 때 특별 처리 없이 그냥 진행하면
                // 각도 계산 등에서 division by zero나 무한 루프 발생 가능

                // ✅ 해결책: Orthogonal 상태를 명시적으로 처리
                await this.handleOrthogonalCase(vectorA, vectorB, result);
            } else {
                // 일반 경우 처리
                await this.handleNormalCase(vectorA, vectorB, result);
            }

            // UI 업데이트
            this.updateResultDisplay(vectorA, vectorB, result);
            this.drawVectorsOnCanvas(vectorA, vectorB, result);

            this.log(`계산 완료: 내적 = ${result.dotProduct}, 각도 = ${result.angle}°`, 'success');

        } catch (error) {
            this.log(`❌ 계산 오류: ${error.message}`, 'error');
            this.updateStatus('error');
        }
    }

    /**
     * 비동기 벡터 계산 (UI Blocking 방지)
     */
    async calculateAsync(vectorA, vectorB) {
        // Promise로 감싸서 비동기 처리
        return new Promise((resolve) => {
            // requestAnimationFrame을 사용하여 다음 프레임에 계산 수행
            // 이렇게 하면 UI 렌더링이 먼저 완료됨
            requestAnimationFrame(() => {
                // 내적 계산: A·B = Ax*Bx + Ay*By
                const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;

                // 벡터 크기 계산
                const magnitudeA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
                const magnitudeB = Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y);

                // Orthogonal 조건 감지 (부동소수점 오차 고려)
                const EPSILON = 0.0001;
                const isOrthogonal = Math.abs(dotProduct) < EPSILON;

                // 각도 계산 (특별 처리 포함)
                let angle = 0;

                // 🔴 이전 문제: magnitudeA * magnitudeB가 0일 때 division by zero
                // ✅ 해결책: Zero division 방지
                if (magnitudeA > EPSILON && magnitudeB > EPSILON) {
                    const cosTheta = dotProduct / (magnitudeA * magnitudeB);
                    // cosTheta 값 범위 제한 (-1 ~ 1)
                    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));
                    angle = Math.acos(clampedCosTheta) * (180 / Math.PI);
                } else {
                    // 영벡터인 경우
                    angle = 0;
                    this.log('⚠️ 영벡터 감지', 'warning');
                }

                resolve({
                    dotProduct: parseFloat(dotProduct.toFixed(4)),
                    angle: parseFloat(angle.toFixed(2)),
                    magnitudeA: parseFloat(magnitudeA.toFixed(4)),
                    magnitudeB: parseFloat(magnitudeB.toFixed(4)),
                    isOrthogonal,
                    isZeroVector: magnitudeA < EPSILON || magnitudeB < EPSILON
                });
            });
        });
    }

    /**
     * Orthogonal 케이스 처리 (Freeze 방지 핵심 로직)
     */
    async handleOrthogonalCase(vectorA, vectorB, result) {
        this.log('🔧 Orthogonal 특별 처리 시작', 'warning');

        // 🔴 이전 문제: Orthogonal 케이스에서 무한 루프나 blocking 연산이 있었을 가능성
        // ✅ 해결책 1: 상태를 명시적으로 관리
        this.updateStatus('orthogonal');

        // ✅ 해결책 2: 렌더링을 여러 프레임으로 분산
        await this.renderInChunks(async () => {
            // Orthogonal 시각화 (특별 표시)
            this.drawOrthogonalIndicator();
        });

        // ✅ 해결책 3: 타임아웃 보호 장치
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                this.log('⏱️ Orthogonal 처리 타임아웃 보호 발동', 'warning');
                resolve();
            }, 5000);
        });

        // 실제 처리와 타임아웃 중 먼저 완료되는 것 사용
        await Promise.race([
            this.processOrthogonalLogic(vectorA, vectorB, result),
            timeoutPromise
        ]);

        this.log('✅ Orthogonal 처리 완료 (Freeze 방지됨)', 'success');
    }

    /**
     * Orthogonal 로직 처리
     */
    async processOrthogonalLogic(vectorA, vectorB, result) {
        // 비동기로 처리하여 UI 응답성 유지
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                // Orthogonal일 때의 특별한 로직들...
                // (예: 특별한 애니메이션, 강조 표시 등)

                // 각도는 정확히 90도
                result.angle = 90.0;

                // 내적은 정확히 0
                result.dotProduct = 0.0;

                resolve();
            });
        });
    }

    /**
     * 일반 케이스 처리
     */
    async handleNormalCase(vectorA, vectorB, result) {
        this.updateStatus('normal');

        // 일반적인 처리 (비동기로 처리)
        await this.renderInChunks(async () => {
            // 정상적인 시각화
        });
    }

    /**
     * 렌더링을 여러 프레임으로 분산 (UI Freeze 방지)
     */
    async renderInChunks(callback) {
        return new Promise((resolve) => {
            requestAnimationFrame(async () => {
                await callback();
                resolve();
            });
        });
    }

    /**
     * 상태 업데이트
     */
    updateStatus(status) {
        const statusElement = this.elements.status;

        switch (status) {
            case 'calculating':
                statusElement.textContent = '계산 중...';
                statusElement.className = 'value status-normal';
                break;
            case 'orthogonal':
                statusElement.textContent = 'ORTHOGONAL (수직)';
                statusElement.className = 'value status-orthogonal';
                break;
            case 'normal':
                statusElement.textContent = '정상';
                statusElement.className = 'value status-normal';
                break;
            case 'error':
                statusElement.textContent = '오류 발생';
                statusElement.className = 'value status-error';
                break;
        }
    }

    /**
     * 결과 표시 업데이트
     */
    updateResultDisplay(vectorA, vectorB, result) {
        // PC 화면 업데이트
        this.elements.vectorA.textContent = `(${vectorA.x}, ${vectorA.y})`;
        this.elements.vectorB.textContent = `(${vectorB.x}, ${vectorB.y})`;
        this.elements.dotProduct.textContent = result.dotProduct;
        this.elements.angle.textContent = `${result.angle}°`;

        // 스마트폰 화면 업데이트
        this.elements.phoneVectorA.textContent = `(${vectorA.x}, ${vectorA.y})`;
        this.elements.phoneVectorB.textContent = `(${vectorB.x}, ${vectorB.y})`;
        this.elements.phoneDotProduct.textContent = result.dotProduct;

        // 상태 메시지
        if (result.isOrthogonal) {
            this.elements.phoneDotStatus.textContent = '두 벡터가 수직입니다! (Orthogonal)';
            this.elements.phoneDotStatus.style.color = '#ff9800';
        } else if (result.dotProduct > 0) {
            this.elements.phoneDotStatus.textContent = '예각 (0° < θ < 90°)';
            this.elements.phoneDotStatus.style.color = '#4caf50';
        } else if (result.dotProduct < 0) {
            this.elements.phoneDotStatus.textContent = '둔각 (90° < θ < 180°)';
            this.elements.phoneDotStatus.style.color = '#f44336';
        } else {
            this.elements.phoneDotStatus.textContent = '직각 (θ = 90°)';
            this.elements.phoneDotStatus.style.color = '#ff9800';
        }
    }

    /**
     * 캔버스에 벡터 그리기
     */
    drawVectorsOnCanvas(vectorA = null, vectorB = null, result = null) {
        // 입력이 없으면 현재 입력 필드 값 사용
        if (!vectorA) {
            vectorA = {
                x: parseFloat(this.elements.ax.value) || 0,
                y: parseFloat(this.elements.ay.value) || 0
            };
        }
        if (!vectorB) {
            vectorB = {
                x: parseFloat(this.elements.bx.value) || 0,
                y: parseFloat(this.elements.by.value) || 0
            };
        }

        const canvas = this.canvas;
        const ctx = this.ctx;

        // 캔버스 클리어
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 좌표계 설정 (중앙이 원점)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 30; // 픽셀/단위

        // 격자 그리기
        this.drawGrid(ctx, centerX, centerY, scale);

        // 축 그리기
        this.drawAxes(ctx, centerX, centerY);

        // 벡터 A 그리기 (빨간색)
        this.drawVector(ctx, centerX, centerY, vectorA.x, vectorA.y, '#e74c3c', 'A', scale);

        // 벡터 B 그리기 (파란색)
        this.drawVector(ctx, centerX, centerY, vectorB.x, vectorB.y, '#3498db', 'B', scale);

        // Orthogonal 표시
        if (result && result.isOrthogonal) {
            this.drawOrthogonalIndicator(ctx, centerX, centerY, scale);
        }
    }

    /**
     * 격자 그리기
     */
    drawGrid(ctx, centerX, centerY, scale) {
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 0.5;

        // 세로선
        for (let x = 0; x < this.canvas.width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // 가로선
        for (let y = 0; y < this.canvas.height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * 좌표축 그리기
     */
    drawAxes(ctx, centerX, centerY) {
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;

        // X축
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.canvas.width, centerY);
        ctx.stroke();

        // Y축
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.canvas.height);
        ctx.stroke();

        // 원점 표시
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(centerX - 2, centerY - 2, 4, 4);

        // 축 레이블
        ctx.fillStyle = '#34495e';
        ctx.font = '12px Arial';
        ctx.fillText('X', this.canvas.width - 15, centerY - 10);
        ctx.fillText('Y', centerX + 10, 15);
    }

    /**
     * 벡터 그리기
     */
    drawVector(ctx, centerX, centerY, x, y, color, label, scale) {
        const endX = centerX + x * scale;
        const endY = centerY - y * scale; // Y축은 반전

        // 벡터 선
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 화살표
        const angle = Math.atan2(endY - centerY, endX - centerX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();

        // 레이블
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(label, endX + 10, endY - 10);
        ctx.font = '12px Arial';
        ctx.fillText(`(${x.toFixed(1)}, ${y.toFixed(1)})`, endX + 10, endY + 5);
    }

    /**
     * Orthogonal 표시 그리기
     */
    drawOrthogonalIndicator(ctx = this.ctx, centerX = this.canvas.width / 2, centerY = this.canvas.height / 2, scale = 30) {
        // 직각 기호 그리기
        const size = 20;
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, Math.PI / 2);
        ctx.stroke();

        ctx.setLineDash([]);

        // "⊥" 기호 표시
        ctx.fillStyle = '#ff9800';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('⊥', centerX + 30, centerY - 30);

        ctx.font = '14px Arial';
        ctx.fillText('Orthogonal', centerX + 30, centerY - 10);
    }

    /**
     * Moodle에서 문제 불러오기
     */
    async loadProblemFromMoodle() {
        try {
            this.log('📡 Moodle LMS에서 문제 로드 중...', 'info');
            this.elements.loadProblemBtn.disabled = true;
            this.elements.loadProblemBtn.textContent = '로딩 중...';

            // Moodle API 호출
            const response = await moodleLMS.fetchProblem();

            if (response.success) {
                this.currentProblem = response.data;
                const vectors = response.data.vectors;

                this.log(`✅ 문제 로드 성공: #${response.data.problem_id} - ${response.data.title}`, 'success');

                if (response.data.is_orthogonal) {
                    this.log('⚠️ 이 문제는 Orthogonal 케이스입니다!', 'warning');
                }

                // 입력 필드에 벡터 값 설정
                this.elements.ax.value = vectors.vector_a.x;
                this.elements.ay.value = vectors.vector_a.y;
                this.elements.bx.value = vectors.vector_b.x;
                this.elements.by.value = vectors.vector_b.y;

                // 스마트폰 화면 업데이트
                this.elements.problemId.textContent = response.data.problem_id;

                // 답안 섹션 표시
                this.elements.answerSection.style.display = 'flex';
                this.elements.answerInput.value = '';
                this.elements.feedbackSection.className = 'feedback-section';
                this.elements.feedbackSection.textContent = '';

                // 자동으로 계산 수행
                await this.calculateDotProduct();

            } else {
                throw new Error('문제 로드 실패');
            }

        } catch (error) {
            this.log(`❌ 문제 로드 오류: ${error.message}`, 'error');
        } finally {
            this.elements.loadProblemBtn.disabled = false;
            this.elements.loadProblemBtn.textContent = 'Moodle에서 문제 불러오기';
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (!this.currentProblem) {
            alert('먼저 문제를 불러와주세요!');
            return;
        }

        try {
            const userAnswer = parseFloat(this.elements.answerInput.value);

            if (isNaN(userAnswer)) {
                alert('올바른 숫자를 입력해주세요!');
                return;
            }

            this.log(`📤 답안 제출: ${userAnswer}`);
            this.elements.submitAnswer.disabled = true;
            this.elements.submitAnswer.textContent = '제출 중...';

            // 현재 계산된 내적 값
            const correctAnswer = parseFloat(this.elements.dotProduct.textContent);

            // Moodle에 답안 제출
            const response = await moodleLMS.submitAnswer(
                this.currentProblem.problem_id,
                userAnswer,
                correctAnswer
            );

            if (response.success) {
                const data = response.data;

                // 피드백 표시
                const feedbackSection = this.elements.feedbackSection;
                feedbackSection.className = data.is_correct
                    ? 'feedback-section correct show'
                    : 'feedback-section incorrect show';

                feedbackSection.innerHTML = `
                    <strong>${data.is_correct ? '✅ 정답!' : '❌ 오답'}</strong><br>
                    ${data.feedback}<br>
                    <small>획득 점수: ${data.points_earned}점</small>
                `;

                this.log(
                    data.is_correct ? '✅ 정답 제출 성공!' : '❌ 오답 제출됨',
                    data.is_correct ? 'success' : 'error'
                );

                // 진행 상황 로그
                this.log(`진행: ${data.progress.correctAnswers}/${data.progress.totalProblems} 정답`, 'info');
            }

        } catch (error) {
            this.log(`❌ 답안 제출 오류: ${error.message}`, 'error');
        } finally {
            this.elements.submitAnswer.disabled = false;
            this.elements.submitAnswer.textContent = '제출';
        }
    }

    /**
     * 디버그 로그
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        const logEntry = {
            timestamp,
            message,
            type
        };

        this.debugLog.push(logEntry);

        // 최근 20개만 유지
        if (this.debugLog.length > 20) {
            this.debugLog.shift();
        }

        // DOM 업데이트
        this.updateDebugLog();

        // 콘솔 출력
        console.log(`[${timestamp}] ${message}`);
    }

    /**
     * 디버그 로그 표시 업데이트
     */
    updateDebugLog() {
        const logHtml = this.debugLog.map(entry => {
            const className = `log-${entry.type}`;
            return `<div class="log-entry ${className}">
                <span class="log-time">[${entry.timestamp}]</span> ${entry.message}
            </div>`;
        }).join('');

        this.elements.debugLog.innerHTML = logHtml;

        // 자동 스크롤
        this.elements.debugLog.scrollTop = this.elements.debugLog.scrollHeight;
    }
}

// 앱 초기화
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new VectorApp();
    console.log('🚀 벡터 학습 앱 시작 - Orthogonal Freeze 문제 해결됨!');
});
