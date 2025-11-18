/**
 * Tree Visualizer
 * Renders and animates the growing tree based on progress
 */

class TreeVisualizer {
    constructor() {
        this.svg = document.getElementById('treeSVG');
        this.treeGroup = document.getElementById('treeGroup');
        this.treeTrunk = document.getElementById('treeTrunk');
        this.branches = document.getElementById('branches');
        this.leaves = document.getElementById('leaves');
        this.growthText = document.getElementById('growthText');

        this.currentHeight = 50; // Initial trunk height
        this.maxHeight = 350; // Maximum trunk height
        this.baseY = 400; // Ground level
        this.trunkX = 135;
        this.trunkWidth = 30;

        this.leafColors = ['#228B22', '#2E8B57', '#3CB371', '#66CDAA', '#90EE90'];
        this.animationDuration = 1000; // ms
    }

    /**
     * Update tree visualization based on progress
     */
    updateTree(stats) {
        const targetHeight = Math.min(stats.treeHeight, this.maxHeight);
        const leafCount = logCalculator.calculateLeafCount(stats.treeHeight);
        const branchCount = logCalculator.calculateBranchCount(stats.solvedProblems);

        // Animate trunk growth
        this.animateTrunkGrowth(targetHeight);

        // Update branches
        this.updateBranches(branchCount, targetHeight);

        // Update leaves
        this.updateLeaves(leafCount, targetHeight);

        // Update growth text
        this.updateGrowthText(stats);

        // Add celebration animation if completed a problem
        if (stats.solvedProblems > 0) {
            this.addCelebrationAnimation();
        }
    }

    /**
     * Animate trunk growth
     */
    animateTrunkGrowth(targetHeight) {
        const startHeight = this.currentHeight;
        const startY = this.baseY - startHeight;
        const targetY = this.baseY - targetHeight;

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);

            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentY = startY + (targetY - startY) * easeProgress;
            const currentHeightValue = startHeight + (targetHeight - startHeight) * easeProgress;

            this.treeTrunk.setAttribute('y', currentY);
            this.treeTrunk.setAttribute('height', currentHeightValue);

            // Make trunk slightly wider as it grows
            const trunkWidth = this.trunkWidth + (currentHeightValue / 20);
            this.treeTrunk.setAttribute('width', trunkWidth);
            this.treeTrunk.setAttribute('x', this.trunkX + this.trunkWidth/2 - trunkWidth/2);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentHeight = targetHeight;
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Update branches
     */
    updateBranches(branchCount, treeHeight) {
        // Clear existing branches
        this.branches.innerHTML = '';

        if (branchCount === 0) {
            this.branches.setAttribute('opacity', '0');
            return;
        }

        this.branches.setAttribute('opacity', '1');

        const trunkTop = this.baseY - treeHeight;
        const branchSpacing = treeHeight / (branchCount + 1);

        for (let i = 0; i < branchCount; i++) {
            const yPos = trunkTop + branchSpacing * (i + 1);
            const branchLength = 20 + (i * 5);
            const angle = (i % 2 === 0) ? -30 : 30;

            // Create branch line
            const branch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const centerX = this.trunkX + this.trunkWidth / 2;

            if (i % 2 === 0) {
                // Left branch
                branch.setAttribute('x1', centerX);
                branch.setAttribute('y1', yPos);
                branch.setAttribute('x2', centerX - branchLength);
                branch.setAttribute('y2', yPos - branchLength * 0.7);
            } else {
                // Right branch
                branch.setAttribute('x1', centerX);
                branch.setAttribute('y1', yPos);
                branch.setAttribute('x2', centerX + branchLength);
                branch.setAttribute('y2', yPos - branchLength * 0.7);
            }

            branch.setAttribute('stroke', '#654321');
            branch.setAttribute('stroke-width', Math.max(3, 6 - i));
            branch.setAttribute('stroke-linecap', 'round');

            // Animation
            branch.style.opacity = '0';
            this.branches.appendChild(branch);

            setTimeout(() => {
                branch.style.transition = 'opacity 0.5s ease';
                branch.style.opacity = '1';
            }, i * 100);
        }
    }

    /**
     * Update leaves
     */
    updateLeaves(leafCount, treeHeight) {
        // Clear existing leaves
        this.leaves.innerHTML = '';

        const trunkTop = this.baseY - treeHeight;
        const centerX = this.trunkX + this.trunkWidth / 2;

        for (let i = 0; i < leafCount; i++) {
            const angle = (Math.PI * 2 * i) / leafCount;
            const radius = 25 + Math.random() * 20;
            const leafSize = 10 + Math.random() * 15;

            const x = centerX + Math.cos(angle) * radius;
            const y = trunkTop - 10 + Math.sin(angle) * radius;

            const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            leaf.setAttribute('cx', x);
            leaf.setAttribute('cy', y);
            leaf.setAttribute('r', leafSize);
            leaf.setAttribute('fill', this.leafColors[i % this.leafColors.length]);
            leaf.setAttribute('opacity', '0.7');

            // Animation
            leaf.style.transformOrigin = `${x}px ${y}px`;
            leaf.style.animation = `grow 0.6s ease-out ${i * 0.05}s both`;

            this.leaves.appendChild(leaf);

            // Add some smaller leaves for variety
            if (i % 2 === 0) {
                const smallLeaf = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                smallLeaf.setAttribute('cx', x + Math.random() * 10 - 5);
                smallLeaf.setAttribute('cy', y + Math.random() * 10 - 5);
                smallLeaf.setAttribute('r', leafSize * 0.6);
                smallLeaf.setAttribute('fill', this.leafColors[(i + 1) % this.leafColors.length]);
                smallLeaf.setAttribute('opacity', '0.5');
                smallLeaf.style.animation = `grow 0.6s ease-out ${i * 0.05 + 0.2}s both`;

                this.leaves.appendChild(smallLeaf);
            }
        }
    }

    /**
     * Update growth text display
     */
    updateGrowthText(stats) {
        let message = '';

        if (stats.solvedProblems === 0) {
            message = '시작하세요!';
        } else if (stats.solvedProblems < 5) {
            message = '씨앗이 자라고 있어요 🌱';
        } else if (stats.solvedProblems < 10) {
            message = '작은 나무로 성장 중! 🌿';
        } else if (stats.solvedProblems < 20) {
            message = '건강한 나무예요! 🌳';
        } else {
            message = '아름다운 큰 나무! 🌲';
        }

        this.growthText.textContent = message;

        // Add scale animation
        this.growthText.style.animation = 'none';
        setTimeout(() => {
            this.growthText.style.animation = 'grow 0.5s ease';
        }, 10);
    }

    /**
     * Add celebration animation when a problem is solved
     */
    addCelebrationAnimation() {
        // Create sparkles
        const svgNS = 'http://www.w3.org/2000/svg';

        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElementNS(svgNS, 'circle');
            const x = 100 + Math.random() * 100;
            const y = 100 + Math.random() * 200;

            sparkle.setAttribute('cx', x);
            sparkle.setAttribute('cy', y);
            sparkle.setAttribute('r', '3');
            sparkle.setAttribute('fill', '#FFD700');
            sparkle.setAttribute('opacity', '1');

            this.svg.appendChild(sparkle);

            // Animate sparkle
            const animation = sparkle.animate([
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(2)' }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });

            animation.onfinish = () => sparkle.remove();
        }
    }

    /**
     * Show message on phone
     */
    showPhoneMessage(message, type = 'info') {
        const phoneMessage = document.getElementById('phoneMessage');
        phoneMessage.textContent = message;

        // Add color based on type
        phoneMessage.style.color = type === 'success' ? '#2E7D32' :
                                   type === 'error' ? '#C62828' :
                                   '#1976D2';

        // Pulse animation
        phoneMessage.style.animation = 'none';
        setTimeout(() => {
            phoneMessage.style.animation = 'slideIn 0.5s ease';
        }, 10);
    }

    /**
     * Reset tree to initial state
     */
    reset() {
        this.currentHeight = 50;
        this.treeTrunk.setAttribute('y', this.baseY - 50);
        this.treeTrunk.setAttribute('height', '50');
        this.treeTrunk.setAttribute('width', this.trunkWidth);
        this.branches.innerHTML = '';
        this.branches.setAttribute('opacity', '0');
        this.leaves.innerHTML = '';

        // Add initial small leaf
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leaf.setAttribute('cx', '150');
        leaf.setAttribute('cy', '345');
        leaf.setAttribute('r', '15');
        leaf.setAttribute('fill', '#228B22');
        leaf.setAttribute('opacity', '0.8');
        this.leaves.appendChild(leaf);

        this.growthText.textContent = '시작하세요!';
    }

    /**
     * Add seasonal effects (bonus feature)
     */
    addSeasonalEffect(season = 'spring') {
        const sky = this.svg.querySelector('rect');

        switch (season) {
            case 'spring':
                // Green and fresh
                this.leafColors = ['#228B22', '#2E8B57', '#3CB371', '#66CDAA', '#90EE90'];
                break;
            case 'summer':
                // Deep green
                this.leafColors = ['#006400', '#228B22', '#2E8B57', '#3CB371', '#32CD32'];
                break;
            case 'autumn':
                // Orange and red
                this.leafColors = ['#FF8C00', '#FF6347', '#FFD700', '#FFA500', '#FF4500'];
                break;
            case 'winter':
                // Minimal leaves, snow effect
                this.leafColors = ['#E8F5E9', '#FFFFFF', '#B0E0E6', '#ADD8E6', '#87CEEB'];
                break;
        }
    }
}

// Export for use in other files
const treeVisualizer = new TreeVisualizer();
