/**
 * 인증 관련 함수
 */

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const result = await API.login(username, password);

    if (result.success) {
        showToast('로그인 성공!', 'success');
        setTimeout(() => {
            showAppPage();
        }, 500);
    } else {
        showToast(result.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const full_name = document.getElementById('regFullName').value;
    const grade_level = parseInt(document.getElementById('regGrade').value);

    const result = await API.register(username, email, password, full_name, grade_level);

    if (result.success) {
        showToast('회원가입 성공! 로그인해주세요.', 'success');
        showLoginForm();
    } else {
        showToast(result.message, 'error');
    }
}

async function handleLogout() {
    if (confirm('로그아웃하시겠습니까?')) {
        await API.logout();
        window.location.reload();
    }
}

function showAppPage() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('appPage').classList.add('active');

    // 사용자 정보 로드
    loadUserInfo();

    // 초기 문제 로드
    getRecommendedProblems();
}

async function loadUserInfo() {
    const result = await API.getCurrentUser();

    if (result.success) {
        document.getElementById('userName').textContent = result.data.full_name || result.data.username;

        // 통계 로드
        loadStats();
    }
}

async function loadStats() {
    const result = await API.getStats();

    if (result.success) {
        const stats = result.data;

        document.getElementById('statLevel').textContent = stats.current_level || 1;
        document.getElementById('statTotal').textContent = stats.total_problems || 0;
        document.getElementById('statAccuracy').textContent = (stats.accuracy || 0) + '%';
        document.getElementById('statXP').textContent = (stats.experience_points || 0) + ' XP';

        // 숙련도 바
        updateMasteryBar('masteryArithmetic', stats.arithmetic_mastery || 0);
        updateMasteryBar('masteryGeometric', stats.geometric_mastery || 0);
        updateMasteryBar('masteryFibonacci', stats.fibonacci_mastery || 0);
        updateMasteryBar('masteryPattern', stats.pattern_mastery || 0);
    }
}

function updateMasteryBar(elementId, value) {
    const percentage = Math.round(value * 100);
    const element = document.getElementById(elementId);
    element.style.width = percentage + '%';
    element.textContent = percentage + '%';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
