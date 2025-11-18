/**
 * Boundary Slider 핵심 로직
 * 적분 경계값 슬라이더 기능
 */

class BoundarySlider {
    constructor(options = {}) {
        this.lowerBound = options.lowerBound || 0;
        this.upperBound = options.upperBound || 1;
        this.min = options.min || -10;
        this.max = options.max || 10;
        this.step = options.step || 0.1;
        this.problemId = options.problemId || null;

        this.lowerSlider = null;
        this.upperSlider = null;
        this.lowerValueDisplay = null;
        this.upperValueDisplay = null;

        this.callbacks = {
            onChange: options.onChange || null,
            onSubmit: options.onSubmit || null
        };

        this.init();
    }

    init() {
        // DOM 요소 가져오기
        this.lowerSlider = document.getElementById('lower-bound');
        this.upperSlider = document.getElementById('upper-bound');
        this.lowerValueDisplay = document.getElementById('lower-value');
        this.upperValueDisplay = document.getElementById('upper-value');

        if (!this.lowerSlider || !this.upperSlider) {
            console.error('슬라이더 요소를 찾을 수 없습니다.');
            return;
        }

        // 초기값 설정
        this.lowerSlider.value = this.lowerBound;
        this.upperSlider.value = this.upperBound;
        this.updateDisplay();

        // 이벤트 리스너 등록
        this.lowerSlider.addEventListener('input', (e) => this.handleLowerChange(e));
        this.upperSlider.addEventListener('input', (e) => this.handleUpperChange(e));

        // 키보드 접근성
        this.lowerSlider.addEventListener('keydown', (e) => this.handleKeyboard(e, 'lower'));
        this.upperSlider.addEventListener('keydown', (e) => this.handleKeyboard(e, 'upper'));
    }

    handleLowerChange(event) {
        let value = parseFloat(event.target.value);

        // 하한이 상한보다 크지 않도록 제한
        if (value >= this.upperBound) {
            value = this.upperBound - this.step;
            this.lowerSlider.value = value;
        }

        this.lowerBound = value;
        this.updateDisplay();
        this.updateSliderBackground(this.lowerSlider, value);

        if (this.callbacks.onChange) {
            this.callbacks.onChange({
                lower: this.lowerBound,
                upper: this.upperBound
            });
        }
    }

    handleUpperChange(event) {
        let value = parseFloat(event.target.value);

        // 상한이 하한보다 작지 않도록 제한
        if (value <= this.lowerBound) {
            value = this.lowerBound + this.step;
            this.upperSlider.value = value;
        }

        this.upperBound = value;
        this.updateDisplay();
        this.updateSliderBackground(this.upperSlider, value);

        if (this.callbacks.onChange) {
            this.callbacks.onChange({
                lower: this.lowerBound,
                upper: this.upperBound
            });
        }
    }

    handleKeyboard(event, type) {
        const slider = type === 'lower' ? this.lowerSlider : this.upperSlider;
        let value = parseFloat(slider.value);

        switch(event.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                event.preventDefault();
                value -= this.step;
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                event.preventDefault();
                value += this.step;
                break;
            case 'Home':
                event.preventDefault();
                value = this.min;
                break;
            case 'End':
                event.preventDefault();
                value = this.max;
                break;
            default:
                return;
        }

        slider.value = value;
        slider.dispatchEvent(new Event('input'));
    }

    updateDisplay() {
        // 값 표시 업데이트
        this.lowerValueDisplay.textContent = this.lowerBound.toFixed(1);
        this.upperValueDisplay.textContent = this.upperBound.toFixed(1);

        // 스마트폰 화면 동기화
        const phoneLower = document.getElementById('phone-lower');
        const phoneUpper = document.getElementById('phone-upper');

        if (phoneLower) phoneLower.textContent = this.lowerBound.toFixed(1);
        if (phoneUpper) phoneUpper.textContent = this.upperBound.toFixed(1);

        // 적분 표시 업데이트
        this.updateIntegralDisplay();
    }

    updateSliderBackground(slider, value) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const percentage = ((value - min) / (max - min)) * 100;

        slider.style.background = `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
    }

    updateIntegralDisplay() {
        const integralDisplay = document.getElementById('integral-display');
        const phoneIntegral = document.getElementById('phone-integral');

        const integralHTML = `
            <span style="font-size: 32px;">∫</span>
            <sub style="font-size: 16px;">${this.lowerBound.toFixed(1)}</sub>
            <sup style="font-size: 16px;">${this.upperBound.toFixed(1)}</sup>
            <span style="margin-left: 10px;">f(x) dx</span>
        `;

        if (integralDisplay) integralDisplay.innerHTML = integralHTML;
        if (phoneIntegral) phoneIntegral.innerHTML = integralHTML;
    }

    setBounds(lower, upper) {
        if (lower < upper && lower >= this.min && upper <= this.max) {
            this.lowerBound = lower;
            this.upperBound = upper;
            this.lowerSlider.value = lower;
            this.upperSlider.value = upper;
            this.updateDisplay();
        }
    }

    getBounds() {
        return {
            lower: this.lowerBound,
            upper: this.upperBound
        };
    }

    reset() {
        this.setBounds(0, 1);
    }

    setRange(min, max, step = 0.1) {
        this.min = min;
        this.max = max;
        this.step = step;

        this.lowerSlider.min = min;
        this.lowerSlider.max = max;
        this.lowerSlider.step = step;

        this.upperSlider.min = min;
        this.upperSlider.max = max;
        this.upperSlider.step = step;
    }
}

// 전역에서 사용 가능하도록 export
window.BoundarySlider = BoundarySlider;
