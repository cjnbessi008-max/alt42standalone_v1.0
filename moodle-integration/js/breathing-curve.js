/**
 * Breathing Curve Animation Engine
 *
 * 함수의 증가/감소를 숨결처럼 부드럽게 표현하는 애니메이션 엔진
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    'use strict';

    const canvas = document.getElementById('breathingCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    // 캔버스 크기 설정
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 30;
        canvas.height = 300;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 애니메이션 상태
    let breathPhase = 0; // 0 ~ 2π
    let currentFunctionType = 'quadratic';
    let animationRunning = true;

    // 함수 정의
    const functions = {
        quadratic: {
            name: '2차 함수',
            func: (x) => -0.5 * Math.pow(x - 3, 2) + 4,
            derivative: (x) => -(x - 3),
            range: { min: -2, max: 8 },
            yRange: { min: -2, max: 6 }
        },
        sine: {
            name: '삼각 함수',
            func: (x) => 3 * Math.sin(x / 2) + 2,
            derivative: (x) => 1.5 * Math.cos(x / 2),
            range: { min: -2, max: 10 },
            yRange: { min: -2, max: 6 }
        },
        cubic: {
            name: '3차 함수',
            func: (x) => 0.1 * Math.pow(x - 3, 3) - 0.5 * (x - 3) + 2,
            derivative: (x) => 0.3 * Math.pow(x - 3, 2) - 0.5,
            range: { min: -2, max: 8 },
            yRange: { min: -2, max: 6 }
        }
    };

    // 좌표 변환 함수
    function toCanvasX(x) {
        const range = functions[currentFunctionType].range;
        const xRange = range.max - range.min;
        return (x - range.min) / xRange * (canvas.width - 80) + 40;
    }

    function toCanvasY(y) {
        const yRange = functions[currentFunctionType].yRange;
        const yRangeSize = yRange.max - yRange.min;
        return canvas.height - ((y - yRange.min) / yRangeSize * (canvas.height - 80) + 40);
    }

    // Breathing 효과 계산
    function getBreathingScale(phase) {
        // 부드러운 sine 기반 호흡 효과 (0.85 ~ 1.15)
        return 1 + 0.15 * Math.sin(phase);
    }

    // 색상 계산 (증가/감소에 따라)
    function getColorForDerivative(derivative, breathPhase) {
        const isIncreasing = derivative > 0;
        const alpha = 0.5 + 0.3 * Math.sin(breathPhase);

        if (isIncreasing) {
            // 증가 구간: 파란색
            return {
                color: `rgba(66, 126, 234, ${alpha})`,
                glowColor: `rgba(66, 126, 234, 0.3)`
            };
        } else {
            // 감소 구간: 빨간색
            return {
                color: `rgba(234, 66, 98, ${alpha})`,
                glowColor: `rgba(234, 66, 98, 0.3)`
            };
        }
    }

    // 배경 그리드 그리기
    function drawGrid() {
        const currentFunc = functions[currentFunctionType];
        const range = currentFunc.range;
        const yRange = currentFunc.yRange;

        // 세로 그리드
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let x = Math.ceil(range.min); x <= range.max; x++) {
            ctx.beginPath();
            ctx.moveTo(toCanvasX(x), 0);
            ctx.lineTo(toCanvasX(x), canvas.height);
            ctx.stroke();
        }

        // 가로 그리드
        for (let y = Math.ceil(yRange.min); y <= yRange.max; y++) {
            ctx.beginPath();
            ctx.moveTo(0, toCanvasY(y));
            ctx.lineTo(canvas.width, toCanvasY(y));
            ctx.stroke();
        }
    }

    // 좌표축 그리기
    function drawAxes() {
        const currentFunc = functions[currentFunctionType];
        const range = currentFunc.range;
        const yRange = currentFunc.yRange;

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // X축
        ctx.beginPath();
        ctx.moveTo(toCanvasX(range.min), toCanvasY(0));
        ctx.lineTo(toCanvasX(range.max), toCanvasY(0));
        ctx.stroke();

        // Y축
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(yRange.min));
        ctx.lineTo(toCanvasX(0), toCanvasY(yRange.max));
        ctx.stroke();

        // 축 레이블
        drawAxisLabels(range, yRange);
    }

    // 축 레이블 그리기
    function drawAxisLabels(range, yRange) {
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';

        // X축 레이블
        ctx.textAlign = 'center';
        for (let x = Math.ceil(range.min); x <= range.max; x += 2) {
            ctx.fillText(x.toString(), toCanvasX(x), toCanvasY(0) + 20);
        }

        // Y축 레이블
        ctx.textAlign = 'right';
        for (let y = Math.ceil(yRange.min); y <= yRange.max; y += 2) {
            if (y !== 0) {
                ctx.fillText(y.toString(), toCanvasX(0) - 10, toCanvasY(y) + 4);
            }
        }

        // 원점 표시
        ctx.fillText('O', toCanvasX(0) - 10, toCanvasY(0) + 20);
    }

    // 함수 곡선 그리기 (Breathing 효과)
    function drawFunctionCurve(breathScale) {
        const currentFunc = functions[currentFunctionType];
        const range = currentFunc.range;
        const step = 0.05;

        for (let x = range.min; x <= range.max; x += step) {
            const y = currentFunc.func(x);
            const derivative = currentFunc.derivative(x);
            const nextX = x + step;
            const nextY = currentFunc.func(nextX);

            // Breathing 효과에 따른 선 두께
            const baseWidth = 3;
            const lineWidth = baseWidth * breathScale;

            // 색상 결정
            const colors = getColorForDerivative(derivative, breathPhase);

            // Glow 효과
            ctx.shadowBlur = 10 * breathScale;
            ctx.shadowColor = colors.glowColor;

            ctx.strokeStyle = colors.color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(toCanvasX(x), toCanvasY(y));
            ctx.lineTo(toCanvasX(nextX), toCanvasY(nextY));
            ctx.stroke();
        }

        // Shadow 효과 제거
        ctx.shadowBlur = 0;
    }

    // 극값 표시
    function drawCriticalPoints(breathScale) {
        const currentFunc = functions[currentFunctionType];
        const range = currentFunc.range;

        // 극값 찾기 (도함수가 0인 지점)
        for (let x = range.min; x <= range.max; x += 0.1) {
            const derivative = currentFunc.derivative(x);
            const nextDerivative = currentFunc.derivative(x + 0.1);

            // 부호가 바뀌는 지점 (극값)
            if (Math.abs(derivative) < 0.05 || derivative * nextDerivative < 0) {
                const y = currentFunc.func(x);
                const canvasX = toCanvasX(x);
                const canvasY = toCanvasY(y);

                // Breathing 효과가 적용된 점
                const radius = 5 * breathScale;

                ctx.beginPath();
                ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);

                // 극댓값/극솟값에 따라 색상 변경
                if (derivative >= 0 || (x > range.min && currentFunc.derivative(x - 0.1) > 0)) {
                    ctx.fillStyle = 'rgba(66, 234, 126, 0.7)'; // 초록색 (극댓값)
                } else {
                    ctx.fillStyle = 'rgba(234, 198, 66, 0.7)'; // 노란색 (극솟값)
                }

                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    // 메인 그래프 그리기 함수
    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const breathScale = getBreathingScale(breathPhase);

        // 그리기 순서
        drawGrid();
        drawAxes();
        drawFunctionCurve(breathScale);
        drawCriticalPoints(breathScale);
    }

    // 애니메이션 루프
    function animate() {
        if (!animationRunning) return;

        breathPhase += 0.03; // 호흡 속도
        if (breathPhase > 2 * Math.PI) {
            breathPhase = 0;
        }

        drawGraph();
        requestAnimationFrame(animate);
    }

    // 함수 변경 (전역 함수)
    window.changeFunction = function(type) {
        if (functions[type]) {
            currentFunctionType = type;
            const funcNameElement = document.getElementById('currentFunc');
            if (funcNameElement) {
                funcNameElement.textContent = functions[type].name;
            }
        }
    };

    // LMS 연동을 위한 데이터 수신 인터페이스
    window.receiveProblemFromLMS = function(problemData) {
        console.log('Received problem data from LMS:', problemData);

        if (problemData.type && functions[problemData.type]) {
            window.changeFunction(problemData.type);
        }
    };

    // 애니메이션 제어
    window.pauseBreathingAnimation = function() {
        animationRunning = false;
    };

    window.resumeBreathingAnimation = function() {
        if (!animationRunning) {
            animationRunning = true;
            animate();
        }
    };

    // 초기화
    console.log('Breathing Curve Animation Engine initialized');
    animate();

})();
