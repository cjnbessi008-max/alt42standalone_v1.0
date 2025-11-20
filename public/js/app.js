/**
 * Main Application Logic
 * Global utilities and helpers
 */

// Game completion event listener (for iframe communication)
window.addEventListener('message', function(event) {
    // Verify origin if needed
    // if (event.origin !== 'expected-origin') return;

    if (event.data.type === 'GAME_COMPLETE') {
        handleGameCompletion(event.data);
    } else if (event.data.type === 'GAME_PROGRESS') {
        updateGameProgress(event.data);
    }
});

async function handleGameCompletion(data) {
    const { session_id, stage, score, time_spent } = data;

    try {
        const result = await API.games.completeStage(session_id, stage, score, time_spent);

        // Show completion feedback
        if (result.card_unlocked) {
            showCardUnlockAnimation(result);
        } else {
            showStageCompleteAnimation(result);
        }

        // Refresh student stats
        if (window.widget) {
            window.widget.updateStudentInfo();
        }

    } catch (error) {
        console.error('Failed to complete stage:', error);
        alert('스테이지 완료 처리 중 오류가 발생했습니다.');
    }
}

function showCardUnlockAnimation(result) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
    `;

    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; animation: bounceIn 0.5s;">
            <div style="font-size: 80px;">🎉</div>
            <h2 style="margin: 20px 0; color: #333;">카드 획득!</h2>
            <p style="color: #666; margin-bottom: 20px;">새로운 정령 친구를 만났어요!</p>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 16px; cursor: pointer;">확인</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

function showStageCompleteAnimation(result) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    overlay.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; text-align: center;">
            <div style="font-size: 60px;">✨</div>
            <h3 style="margin: 15px 0; color: #333;">스테이지 완료!</h3>
            <p style="color: #666;">점수: ${result.score.toFixed(1)}</p>
            <p style="color: #667eea; font-weight: 600;">+${Math.floor(result.score / 5)} 포인트</p>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 10px 25px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">계속하기</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Auto-close after 3 seconds
    setTimeout(() => {
        overlay.remove();
    }, 3000);
}

function updateGameProgress(data) {
    console.log('Game progress:', data);
    // Update UI with real-time progress if needed
}

// Utility functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);
