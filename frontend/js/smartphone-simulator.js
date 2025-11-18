/**
 * Next Term Vision - Smartphone Simulator
 * 스마트폰 시뮬레이터 관리 클래스
 */

class SmartphoneSimulator {
    constructor() {
        this.screen = document.querySelector('.phone-screen');
        this.isInteractive = true;
        this.init();
    }

    init() {
        // 시간 업데이트
        this.updateTime();
        setInterval(() => this.updateTime(), 60000); // 1분마다 업데이트

        // 배터리 애니메이션
        this.animateBattery();

        // 터치 이벤트 시뮬레이션
        this.setupTouchSimulation();
    }

    /**
     * 시간 표시 업데이트
     */
    updateTime() {
        const timeElement = document.querySelector('.app-header .time');
        if (timeElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * 배터리 아이콘 애니메이션
     */
    animateBattery() {
        const battery = document.querySelector('.battery-icon');
        if (battery) {
            const batteryLevels = ['🔋', '🔌', '⚡'];
            let index = 0;

            setInterval(() => {
                index = (index + 1) % batteryLevels.length;
                battery.textContent = batteryLevels[index];
            }, 5000);
        }
    }

    /**
     * 터치 이벤트 시뮬레이션 설정
     */
    setupTouchSimulation() {
        const screen = this.screen;

        screen.addEventListener('click', (e) => {
            if (!this.isInteractive) return;

            // 터치 효과 표시
            this.showTouchEffect(e.clientX, e.clientY);
        });
    }

    /**
     * 터치 효과 표시
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     */
    showTouchEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(74, 144, 226, 0.5)';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.pointerEvents = 'none';
        ripple.style.transition = 'all 0.6s ease-out';
        ripple.style.zIndex = '9999';

        document.body.appendChild(ripple);

        // 애니메이션 트리거
        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(3)';
            ripple.style.opacity = '0';
        });

        // 제거
        setTimeout(() => {
            document.body.removeChild(ripple);
        }, 600);
    }

    /**
     * 화면 잠금/잠금 해제
     * @param {boolean} locked
     */
    setLocked(locked) {
        this.isInteractive = !locked;
        if (locked) {
            this.screen.style.filter = 'brightness(0.3)';
        } else {
            this.screen.style.filter = 'brightness(1)';
        }
    }

    /**
     * 진동 효과
     */
    vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        // 시각적 진동 효과
        const phone = document.querySelector('.smartphone');
        phone.style.animation = 'shake 0.3s';
        setTimeout(() => {
            phone.style.animation = '';
        }, 300);

        // CSS에 애니메이션 추가 (동적으로)
        if (!document.querySelector('#shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 알림 표시
     * @param {string} message
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;
        notification.textContent = message;

        this.screen.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                this.screen.removeChild(notification);
            }, 300);
        }, 2000);
    }

    /**
     * 스크롤 애니메이션
     * @param {HTMLElement} element
     */
    scrollToElement(element) {
        if (!element) return;

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// 전역 인스턴스 생성
const smartphone = new SmartphoneSimulator();
