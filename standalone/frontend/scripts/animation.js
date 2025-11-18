/**
 * 애니메이션 함수
 */

function displaySequenceWithAnimation(sequence, animationType = 'slide') {
    const container = document.getElementById('sequenceDisplay');
    container.innerHTML = '';

    sequence.forEach((num, index) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = `sequence-item animate-${animationType}`;
            item.textContent = num;
            container.appendChild(item);
        }, index * 150);
    });

    // 다음 항 (물음표)
    setTimeout(() => {
        const nextItem = document.createElement('div');
        nextItem.className = 'sequence-item next-item';
        nextItem.id = 'nextItem';
        nextItem.textContent = '?';
        container.appendChild(nextItem);
    }, sequence.length * 150 + 200);
}

function revealAnswer(answer, isCorrect) {
    const nextItem = document.getElementById('nextItem');
    if (!nextItem) return;

    nextItem.style.transition = 'all 0.5s ease';

    if (isCorrect) {
        nextItem.textContent = answer;
        nextItem.style.background = 'linear-gradient(135deg, #52c41a, #95de64)';
        nextItem.style.transform = 'scale(1.2) rotate(360deg)';

        // 축하 파티클
        createCelebrationParticles(nextItem);

        setTimeout(() => {
            nextItem.style.transform = 'scale(1)';
        }, 500);
    } else {
        nextItem.style.background = 'linear-gradient(135deg, #f5222d, #ff7875)';
        nextItem.style.animation = 'shake 0.5s';

        setTimeout(() => {
            nextItem.textContent = '?';
            nextItem.style.background = 'linear-gradient(135deg, #ffd89b, #19547b)';
        }, 1000);
    }
}

function createCelebrationParticles(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];

    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: 6px;
            height: 6px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
        `;

        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / 15;
        const velocity = 80 + Math.random() * 60;
        const endX = rect.left + rect.width / 2 + Math.cos(angle) * velocity;
        const endY = rect.top + rect.height / 2 + Math.sin(angle) * velocity;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - rect.left - rect.width/2}px, ${endY - rect.top - rect.height/2}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => {
            document.body.removeChild(particle);
        };
    }
}
