/**
 * Gradient Color Module
 * 접선 경사도를 색상으로 매핑하는 핵심 모듈
 */

class GradientColorMapper {
    constructor() {
        // 색상 매핑 설정
        this.colorScheme = 'smooth'; // 'smooth', 'discrete', 'rainbow'
        this.minSlope = -5;
        this.maxSlope = 5;
    }

    /**
     * 경사도를 HSL 색상으로 변환
     * @param {number} slope - 접선의 경사도
     * @returns {string} - HSL 색상 문자열
     */
    slopeToColor(slope) {
        // 경사도를 각도로 변환 (라디안 -> 도)
        const angle = Math.atan(slope) * (180 / Math.PI);

        // 각도를 0-360 범위의 Hue 값으로 매핑
        // -90도(급격한 하강, 파랑) → 0도(평평, 노랑/초록) → 90도(급격한 상승, 빨강)
        const hue = this.angleToHue(angle);

        // 채도와 밝기 계산
        const saturation = this.calculateSaturation(slope);
        const lightness = 50;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * 각도를 Hue 값으로 변환
     * @param {number} angle - 각도 (-90 ~ 90)
     * @returns {number} - Hue 값 (0 ~ 360)
     */
    angleToHue(angle) {
        // -90도 → 240 (파랑)
        // -45도 → 180 (시안)
        // 0도 → 120 (초록)
        // 45도 → 60 (노랑)
        // 90도 → 0 (빨강)

        // 선형 매핑: angle [-90, 90] → hue [240, 0]
        const normalizedAngle = (angle + 90) / 180; // 0 ~ 1
        const hue = 240 - (normalizedAngle * 240); // 240 ~ 0

        return Math.max(0, Math.min(360, hue));
    }

    /**
     * 경사도에 따른 채도 계산
     * @param {number} slope - 경사도
     * @returns {number} - 채도 (0 ~ 100)
     */
    calculateSaturation(slope) {
        // 경사도가 클수록 채도 높게
        const absSlope = Math.abs(slope);
        const normalizedSlope = Math.min(absSlope / 3, 1); // 0 ~ 1

        return 60 + (normalizedSlope * 40); // 60 ~ 100
    }

    /**
     * 경사도를 RGB 색상으로 변환
     * @param {number} slope - 접선의 경사도
     * @returns {string} - RGB 색상 문자열
     */
    slopeToRGB(slope) {
        const hslColor = this.slopeToColor(slope);
        return this.hslToRgb(hslColor);
    }

    /**
     * HSL을 RGB로 변환
     * @param {string} hsl - HSL 색상 문자열
     * @returns {string} - RGB 색상 문자열
     */
    hslToRgb(hsl) {
        // HSL 파싱
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return 'rgb(128, 128, 128)';

        const h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }

    /**
     * 경사도를 각도로 변환
     * @param {number} slope - 경사도
     * @returns {number} - 각도 (도)
     */
    slopeToAngle(slope) {
        return Math.atan(slope) * (180 / Math.PI);
    }

    /**
     * 불연속 색상 스킴 (구간별)
     * @param {number} slope - 경사도
     * @returns {string} - 색상 문자열
     */
    discreteColorScheme(slope) {
        if (slope < -2) return 'hsl(240, 80%, 50%)'; // 진한 파랑
        if (slope < -1) return 'hsl(200, 80%, 50%)'; // 하늘색
        if (slope < -0.5) return 'hsl(160, 80%, 50%)'; // 청록
        if (slope < 0) return 'hsl(140, 80%, 50%)'; // 연두
        if (slope < 0.5) return 'hsl(100, 80%, 50%)'; // 초록-노랑
        if (slope < 1) return 'hsl(60, 80%, 50%)'; // 노랑
        if (slope < 2) return 'hsl(30, 80%, 50%)'; // 주황
        return 'hsl(0, 80%, 50%)'; // 빨강
    }

    /**
     * 무지개 색상 스킴
     * @param {number} slope - 경사도
     * @returns {string} - 색상 문자열
     */
    rainbowColorScheme(slope) {
        const normalized = (Math.atan(slope) + Math.PI / 2) / Math.PI;
        const hue = normalized * 360;
        return `hsl(${hue}, 90%, 50%)`;
    }

    /**
     * 색상 스킴 변경
     * @param {string} scheme - 'smooth', 'discrete', 'rainbow'
     */
    setColorScheme(scheme) {
        this.colorScheme = scheme;
    }

    /**
     * 현재 색상 스킴에 따른 색상 반환
     * @param {number} slope - 경사도
     * @returns {string} - 색상 문자열
     */
    getColor(slope) {
        switch (this.colorScheme) {
            case 'discrete':
                return this.discreteColorScheme(slope);
            case 'rainbow':
                return this.rainbowColorScheme(slope);
            case 'smooth':
            default:
                return this.slopeToColor(slope);
        }
    }

    /**
     * 그라디언트 생성 (여러 점의 경사도에 대해)
     * @param {Array} slopes - 경사도 배열
     * @returns {Array} - 색상 배열
     */
    createGradient(slopes) {
        return slopes.map(slope => this.getColor(slope));
    }
}

// 전역 인스턴스 생성
window.gradientColorMapper = new GradientColorMapper();
