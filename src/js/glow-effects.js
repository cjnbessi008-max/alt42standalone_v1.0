/**
 * Glow Effects Manager - Root Glow 효과 관리
 */

class GlowEffectsManager {
    constructor() {
        this.enabled = true;
        this.intensity = 5;
        this.color = '#00ffff';
        this.animationSpeed = 2; // seconds per cycle
        this.activeRoots = [];
    }

    /**
     * DOM 요소에 Glow 효과 추가
     */
    addGlowToElement(element, rootData) {
        if (!this.enabled) return;

        element.classList.add('root-marker');
        element.classList.add(`glow-intensity-${this.intensity}`);

        // 위치 설정
        element.style.left = `${rootData.x}px`;
        element.style.top = `${rootData.y}px`;

        // 색상 설정
        element.style.setProperty('--glow-color', this.color);

        // 애니메이션 지연 (여러 근이 있을 때 시차 효과)
        const delay = rootData.index * 0.3;
        element.style.animationDelay = `${delay}s`;

        return element;
    }

    /**
     * 근 마커 생성
     */
    createRootMarker(root, index, container) {
        // 마커 컨테이너
        const marker = document.createElement('div');
        marker.className = 'root-marker';
        marker.dataset.rootIndex = index;
        marker.dataset.rootValue = root.x;

        // Glow 포인트
        const point = document.createElement('div');
        point.className = 'root-point';
        point.style.background = `radial-gradient(circle, ${this.color}, ${this.adjustBrightness(this.color, -30)})`;

        // Glow 효과 레이어
        const glowLayer = document.createElement('div');
        glowLayer.className = 'root-marker-glow';
        glowLayer.style.color = this.color;
        glowLayer.style.width = `${20 + this.intensity * 4}px`;
        glowLayer.style.height = `${20 + this.intensity * 4}px`;

        // 레이블
        const label = document.createElement('div');
        label.className = 'root-label';
        label.textContent = `x = ${MathUtils.formatNumber(root.x, 3)}`;
        label.style.top = '-30px';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';

        // 조합
        marker.appendChild(glowLayer);
        marker.appendChild(point);
        marker.appendChild(label);

        // 호버 이벤트
        marker.addEventListener('mouseenter', () => {
            this.onRootHover(root, marker);
        });

        marker.addEventListener('mouseleave', () => {
            this.onRootLeave(root, marker);
        });

        if (container) {
            container.appendChild(marker);
        }

        return marker;
    }

    /**
     * 근 호버 이벤트
     */
    onRootHover(root, element) {
        element.style.transform = 'scale(1.3)';
        element.style.zIndex = '100';

        // 상세 정보 표시
        const label = element.querySelector('.root-label');
        if (label) {
            label.innerHTML = `
                x = ${MathUtils.formatNumber(root.x, 5)}<br>
                방법: ${root.method || 'N/A'}<br>
                반복: ${root.iterations || 'N/A'}
            `;
        }
    }

    /**
     * 근 호버 해제 이벤트
     */
    onRootLeave(root, element) {
        element.style.transform = 'scale(1)';
        element.style.zIndex = 'auto';

        const label = element.querySelector('.root-label');
        if (label) {
            label.textContent = `x = ${MathUtils.formatNumber(root.x, 3)}`;
        }
    }

    /**
     * 색상 밝기 조정
     */
    adjustBrightness(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);

        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Canvas에 Glow 효과 그리기 (고성능)
     */
    drawCanvasGlow(ctx, x, y, intensity, color) {
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * this.animationSpeed) * 0.3 + 0.7;

        // 다층 Glow
        for (let i = intensity; i > 0; i--) {
            const radius = 8 + i * 3 * pulse;
            const alpha = (0.15 * pulse) / (i * 0.5);

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, this.hexToRgba(color, alpha));
            gradient.addColorStop(1, this.hexToRgba(color, 0));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Hex to RGBA 변환
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 성공 플래시 효과
     */
    flashSuccess(element) {
        element.classList.add('root-found-success');

        setTimeout(() => {
            element.classList.remove('root-found-success');
        }, 600);
    }

    /**
     * 모든 Glow 제거
     */
    clearAllGlows(container) {
        if (container) {
            const markers = container.querySelectorAll('.root-marker');
            markers.forEach(marker => marker.remove());
        }
        this.activeRoots = [];
    }

    /**
     * Glow 설정 업데이트
     */
    updateSettings(settings) {
        if (settings.enabled !== undefined) {
            this.enabled = settings.enabled;
        }
        if (settings.intensity !== undefined) {
            this.intensity = Math.max(1, Math.min(10, settings.intensity));
        }
        if (settings.color !== undefined) {
            this.color = settings.color;
        }
        if (settings.animationSpeed !== undefined) {
            this.animationSpeed = settings.animationSpeed;
        }
    }

    /**
     * 현재 설정 가져오기
     */
    getSettings() {
        return {
            enabled: this.enabled,
            intensity: this.intensity,
            color: this.color,
            animationSpeed: this.animationSpeed
        };
    }

    /**
     * 프리셋 적용
     */
    applyPreset(presetName) {
        const presets = {
            subtle: {
                intensity: 3,
                color: '#00ffff',
                animationSpeed: 3
            },
            normal: {
                intensity: 5,
                color: '#00ffff',
                animationSpeed: 2
            },
            intense: {
                intensity: 8,
                color: '#00ffff',
                animationSpeed: 1.5
            },
            rainbow: {
                intensity: 6,
                color: '#ff00ff',
                animationSpeed: 1
            }
        };

        if (presets[presetName]) {
            this.updateSettings(presets[presetName]);
        }
    }
}

// 전역 객체로 노출
window.GlowEffectsManager = GlowEffectsManager;
