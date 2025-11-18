/**
 * LogFlowAnimation - 로그 계산 과정을 물흐르듯 시각화하는 애니메이션 클래스
 */

class LogFlowAnimation {
    constructor(svgElementId) {
        this.svg = document.getElementById(svgElementId);
        this.width = 300;
        this.height = 400;
        this.animationSpeed = 1;
        this.isPlaying = false;
        this.currentStepIndex = 0;
        this.steps = [];
        this.particles = [];

        // SVG 네임스페이스
        this.svgNS = "http://www.w3.org/2000/svg";

        this.init();
    }

    /**
     * SVG 초기화
     */
    init() {
        // SVG 클리어
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }

        // 그라데이션 정의
        this.createGradients();

        // 배경 물결 추가
        this.createWaveBackground();
    }

    /**
     * 그라데이션 생성
     */
    createGradients() {
        const defs = document.createElementNS(this.svgNS, 'defs');

        // 물 흐름 그라데이션
        const gradient1 = document.createElementNS(this.svgNS, 'linearGradient');
        gradient1.setAttribute('id', 'waterGradient');
        gradient1.setAttribute('x1', '0%');
        gradient1.setAttribute('y1', '0%');
        gradient1.setAttribute('x2', '0%');
        gradient1.setAttribute('y2', '100%');

        const stop1 = document.createElementNS(this.svgNS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('style', 'stop-color:#3498db;stop-opacity:0.8');

        const stop2 = document.createElementNS(this.svgNS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('style', 'stop-color:#2ecc71;stop-opacity:0.8');

        gradient1.appendChild(stop1);
        gradient1.appendChild(stop2);
        defs.appendChild(gradient1);

        // 물방울 그라데이션
        const gradient2 = document.createElementNS(this.svgNS, 'radialGradient');
        gradient2.setAttribute('id', 'dropletGradient');

        const stop3 = document.createElementNS(this.svgNS, 'stop');
        stop3.setAttribute('offset', '0%');
        stop3.setAttribute('style', 'stop-color:#ecf0f1;stop-opacity:1');

        const stop4 = document.createElementNS(this.svgNS, 'stop');
        stop4.setAttribute('offset', '100%');
        stop4.setAttribute('style', 'stop-color:#3498db;stop-opacity:1');

        gradient2.appendChild(stop3);
        gradient2.appendChild(stop4);
        defs.appendChild(gradient2);

        this.svg.appendChild(defs);
    }

    /**
     * 배경 물결 생성
     */
    createWaveBackground() {
        const waveGroup = document.createElementNS(this.svgNS, 'g');
        waveGroup.setAttribute('id', 'waveBackground');
        waveGroup.setAttribute('opacity', '0.1');

        for (let i = 0; i < 3; i++) {
            const wave = document.createElementNS(this.svgNS, 'path');
            const yOffset = 100 + i * 100;
            const d = `M 0,${yOffset} Q 75,${yOffset - 20} 150,${yOffset} T 300,${yOffset}`;

            wave.setAttribute('d', d);
            wave.setAttribute('stroke', '#3498db');
            wave.setAttribute('stroke-width', '2');
            wave.setAttribute('fill', 'none');
            wave.style.animation = `wave ${3 + i}s ease-in-out infinite`;
            wave.style.animationDelay = `${i * 0.5}s`;

            waveGroup.appendChild(wave);
        }

        this.svg.appendChild(waveGroup);
    }

    /**
     * 계산 단계 설정
     * @param {Array} steps - LogCalculator에서 생성된 단계 배열
     */
    setSteps(steps) {
        this.steps = steps;
        this.currentStepIndex = 0;
        this.particles = [];
    }

    /**
     * 애니메이션 속도 설정
     * @param {number} speed - 속도 배수 (0.5 ~ 3)
     */
    setSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * 물흐르는 경로 생성
     * @param {Object} step - 현재 단계 정보
     */
    createFlowPath(step) {
        // 이전 애니메이션 요소 제거 (배경 제외)
        const elements = this.svg.querySelectorAll('.flow-element');
        elements.forEach(el => el.remove());

        const stepType = step.type;
        const values = step.values;

        switch (stepType) {
            case 'setup':
                this.drawSetupFlow(values);
                break;
            case 'calculation':
                this.drawCalculationFlow(values, step);
                break;
            case 'result':
                this.drawResultFlow(values);
                break;
            default:
                this.drawDefaultFlow(values);
        }
    }

    /**
     * 초기 설정 단계 그리기
     */
    drawSetupFlow(values) {
        const centerX = this.width / 2;

        // 제목
        this.createText(centerX, 50, '로그 계산 시작', 'flow-text flow-element fade-in');

        // 밑(base) 원
        const baseCircle = this.createCircle(centerX - 80, 150, 30, 'url(#dropletGradient)', 'flow-element water-drop');
        this.createText(centerX - 80, 155, values.base.toString(), 'flow-value flow-element');
        this.createText(centerX - 80, 190, 'base', 'flow-text flow-element');

        // 진수(value) 원
        const valueCircle = this.createCircle(centerX + 80, 150, 30, 'url(#dropletGradient)', 'flow-element water-drop');
        this.createText(centerX + 80, 155, values.value.toString(), 'flow-value flow-element');
        this.createText(centerX + 80, 190, 'value', 'flow-text flow-element');

        // 물방울 파티클 생성
        this.createParticles(centerX, 150, 10);
    }

    /**
     * 계산 단계 그리기
     */
    drawCalculationFlow(values, step) {
        const centerX = this.width / 2;
        const startY = 80;
        const stepHeight = 60;

        // 계산 흐름 경로
        const pathData = this.generateFlowPathData(values, startY, stepHeight);
        const path = document.createElementNS(this.svgNS, 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'flow-path flow-element flow-path-animated');
        path.setAttribute('stroke', 'url(#waterGradient)');
        this.svg.appendChild(path);

        // 현재 값 표시
        const currentY = startY + values.power * stepHeight;
        const currentCircle = this.createCircle(centerX, currentY, 25, '#2ecc71', 'flow-element pulse-effect');
        this.createText(centerX, currentY + 5, values.current.toString(), 'flow-value flow-element');

        // 거듭제곱 표시
        this.createText(centerX + 60, currentY, `${values.base}^${values.power}`, 'flow-text flow-element slide-in');

        // 물방울 애니메이션
        this.animateDroplets(centerX, startY, currentY);

        // 물결 효과
        if (step.isComplete) {
            this.createRippleEffect(centerX, currentY);
        }
    }

    /**
     * 결과 단계 그리기
     */
    drawResultFlow(values) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // 중앙에 큰 원
        const resultCircle = this.createCircle(centerX, centerY, 60, 'url(#waterGradient)', 'flow-element success-animation glow-effect');

        // 결과 값
        this.createText(centerX, centerY, values.power.toString(), 'flow-value flow-element', '32px');

        // 체크 마크
        const checkPath = document.createElementNS(this.svgNS, 'path');
        const checkData = `M ${centerX - 20} ${centerY + 60} L ${centerX - 5} ${centerY + 75} L ${centerX + 20} ${centerY + 50}`;
        checkPath.setAttribute('d', checkData);
        checkPath.setAttribute('stroke', '#2ecc71');
        checkPath.setAttribute('stroke-width', '5');
        checkPath.setAttribute('stroke-linecap', 'round');
        checkPath.setAttribute('fill', 'none');
        checkPath.setAttribute('class', 'checkmark-path flow-element');
        this.svg.appendChild(checkPath);

        // 축하 파티클
        this.createCelebrationParticles(centerX, centerY);
    }

    /**
     * 기본 흐름 그리기
     */
    drawDefaultFlow(values) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.createCircle(centerX, centerY, 40, '#3498db', 'flow-element pulse-effect');
        this.createText(centerX, centerY + 5, '계산 중...', 'flow-text flow-element');
    }

    /**
     * 흐름 경로 데이터 생성
     */
    generateFlowPathData(values, startY, stepHeight) {
        const centerX = this.width / 2;
        let pathData = `M ${centerX} ${startY}`;

        for (let i = 1; i <= values.power; i++) {
            const y = startY + i * stepHeight;
            const curve = (i % 2 === 0) ? 30 : -30;
            pathData += ` Q ${centerX + curve} ${y - stepHeight / 2} ${centerX} ${y}`;
        }

        return pathData;
    }

    /**
     * 원 생성 헬퍼
     */
    createCircle(cx, cy, r, fill, className = '') {
        const circle = document.createElementNS(this.svgNS, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        if (className) circle.setAttribute('class', className);
        this.svg.appendChild(circle);
        return circle;
    }

    /**
     * 텍스트 생성 헬퍼
     */
    createText(x, y, content, className = '', fontSize = '14px') {
        const text = document.createElementNS(this.svgNS, 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', className);
        text.style.fontSize = fontSize;
        text.textContent = content;
        this.svg.appendChild(text);
        return text;
    }

    /**
     * 물방울 파티클 생성
     */
    createParticles(centerX, centerY, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const radius = 50;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            setTimeout(() => {
                const particle = this.createCircle(x, y, 4, '#3498db', 'flow-element water-drop');
                particle.style.opacity = '0.6';
            }, i * 100 / this.animationSpeed);
        }
    }

    /**
     * 물방울 떨어지는 애니메이션
     */
    animateDroplets(centerX, startY, endY) {
        const dropletCount = 5;
        const duration = 2000 / this.animationSpeed;

        for (let i = 0; i < dropletCount; i++) {
            setTimeout(() => {
                const droplet = this.createCircle(centerX, startY, 6, '#3498db', 'flow-element');
                this.animateElement(droplet, { cy: endY }, duration, () => {
                    droplet.remove();
                });
            }, i * 200);
        }
    }

    /**
     * 물결 효과 생성
     */
    createRippleEffect(cx, cy) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = this.createCircle(cx, cy, 25, 'none', 'ripple-effect flow-element');
                ripple.style.animationDelay = `${i * 0.3}s`;
            }, i * 300);
        }
    }

    /**
     * 축하 파티클 생성
     */
    createCelebrationParticles(centerX, centerY) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 100;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;

            setTimeout(() => {
                const particle = this.createCircle(centerX, centerY, 5, '#2ecc71', 'flow-element');
                this.animateElement(particle, { cx: endX, cy: endY, r: 2 }, 1000, () => {
                    particle.remove();
                });
            }, i * 50);
        }
    }

    /**
     * 요소 애니메이션
     */
    animateElement(element, properties, duration, callback) {
        const start = performance.now();
        const startValues = {};

        for (let prop in properties) {
            startValues[prop] = parseFloat(element.getAttribute(prop)) || 0;
        }

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            for (let prop in properties) {
                const start = startValues[prop];
                const end = properties[prop];
                const current = start + (end - start) * progress;
                element.setAttribute(prop, current);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 다음 단계 애니메이션 재생
     */
    playNextStep() {
        if (this.currentStepIndex < this.steps.length) {
            const step = this.steps[this.currentStepIndex];
            this.createFlowPath(step);
            this.currentStepIndex++;
            return step;
        }
        return null;
    }

    /**
     * 애니메이션 리셋
     */
    reset() {
        this.currentStepIndex = 0;
        this.init();
    }

    /**
     * 전체 애니메이션 자동 재생
     */
    async playAll(onStepComplete) {
        this.reset();
        this.isPlaying = true;

        for (let i = 0; i < this.steps.length; i++) {
            if (!this.isPlaying) break;

            const step = this.playNextStep();
            if (onStepComplete) {
                onStepComplete(step, i);
            }

            // 다음 단계까지 대기
            await this.delay(2000 / this.animationSpeed);
        }

        this.isPlaying = false;
    }

    /**
     * 애니메이션 정지
     */
    stop() {
        this.isPlaying = false;
    }

    /**
     * 딜레이 헬퍼
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 전역에서 사용 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogFlowAnimation;
}
