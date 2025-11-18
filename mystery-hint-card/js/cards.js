/**
 * 미스터리 힌트 카드 관리 클래스
 */
class MysteryCardManager {
    constructor(hintsData) {
        this.cards = hintsData.cards;
        this.settings = hintsData.settings;
        this.currentUnlocked = 0;
        this.totalCards = this.cards.length;

        // 로컬 스토리지에서 진행 상황 복원
        this.loadProgress();
    }

    /**
     * 카드 개봉 가능 여부 확인
     */
    canUnlock(cardId) {
        const cardIndex = cardId - 1;

        // 이미 개봉된 카드
        if (this.cards[cardIndex].unlocked) {
            return false;
        }

        // 순차 개봉 모드
        if (this.settings.sequential) {
            return cardIndex === this.currentUnlocked;
        }

        // 자유 개봉 모드
        return true;
    }

    /**
     * 카드 개봉
     */
    unlockCard(cardId) {
        const cardIndex = cardId - 1;

        if (!this.canUnlock(cardId)) {
            return false;
        }

        this.cards[cardIndex].unlocked = true;
        this.currentUnlocked++;

        // 진행 상황 저장
        this.saveProgress();

        return true;
    }

    /**
     * 특정 카드가 개봉되었는지 확인
     */
    isUnlocked(cardId) {
        const cardIndex = cardId - 1;
        return this.cards[cardIndex].unlocked;
    }

    /**
     * 진행률 계산
     */
    getProgress() {
        return {
            current: this.currentUnlocked,
            total: this.totalCards,
            percentage: Math.round((this.currentUnlocked / this.totalCards) * 100)
        };
    }

    /**
     * 모든 카드 가져오기
     */
    getAllCards() {
        return this.cards;
    }

    /**
     * 진행 상황 초기화
     */
    reset() {
        this.cards.forEach(card => {
            card.unlocked = false;
        });
        this.currentUnlocked = 0;
        this.saveProgress();
    }

    /**
     * 로컬 스토리지에 진행 상황 저장
     */
    saveProgress() {
        const progressData = {
            cards: this.cards,
            currentUnlocked: this.currentUnlocked
        };
        localStorage.setItem('mysteryCardProgress', JSON.stringify(progressData));
    }

    /**
     * 로컬 스토리지에서 진행 상황 복원
     */
    loadProgress() {
        const saved = localStorage.getItem('mysteryCardProgress');
        if (saved) {
            try {
                const progressData = JSON.parse(saved);

                // 저장된 카드 수와 현재 카드 수가 같은 경우만 복원
                if (progressData.cards.length === this.cards.length) {
                    this.cards = progressData.cards;
                    this.currentUnlocked = progressData.currentUnlocked;
                }
            } catch (e) {
                console.error('진행 상황 복원 실패:', e);
            }
        }
    }

    /**
     * SVG 도형 생성 (이모지 대신 사용 가능)
     */
    generateShapeSVG(shapeType) {
        const svgTemplates = {
            pizza: `<svg viewBox="0 0 100 100" width="60" height="60">
                <circle cx="50" cy="50" r="40" fill="#FFA500" stroke="#FF6B00" stroke-width="2"/>
                <circle cx="35" cy="35" r="5" fill="#FF0000"/>
                <circle cx="65" cy="35" r="5" fill="#FF0000"/>
                <circle cx="50" cy="55" r="5" fill="#FF0000"/>
                <line x1="50" y1="50" x2="50" y2="10" stroke="#FF6B00" stroke-width="2"/>
            </svg>`,

            numbers: `<svg viewBox="0 0 100 100" width="60" height="60">
                <text x="50" y="70" font-size="60" text-anchor="middle" fill="#6366f1" font-weight="bold">1+2</text>
            </svg>`,

            visual: `<svg viewBox="0 0 100 100" width="60" height="60">
                <rect x="10" y="30" width="20" height="40" fill="#10b981" opacity="0.5"/>
                <rect x="40" y="30" width="20" height="40" fill="#10b981" opacity="0.5"/>
                <rect x="70" y="30" width="20" height="40" fill="#10b981" opacity="0.5"/>
                <rect x="10" y="30" width="80" height="40" fill="none" stroke="#333" stroke-width="2"/>
            </svg>`,

            math: `<svg viewBox="0 0 100 100" width="60" height="60">
                <text x="50" y="70" font-size="70" text-anchor="middle" fill="#8b5cf6">+</text>
            </svg>`,

            answer: `<svg viewBox="0 0 100 100" width="60" height="60">
                <circle cx="50" cy="50" r="40" fill="#10b981"/>
                <path d="M 30 50 L 45 65 L 70 35" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/>
            </svg>`
        };

        return svgTemplates[shapeType] || '';
    }
}
