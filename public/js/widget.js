/**
 * Widget Controller
 * Handles widget UI state and navigation
 */

class MathSpiritWidget {
    constructor() {
        this.container = document.getElementById('math-spirit-widget');
        this.minimizedIcon = document.getElementById('minimized-icon');
        this.screens = {};
        this.currentScreen = null;
        this.studentData = null;

        this.init();
    }

    init() {
        // Cache all screens
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id] = screen;
        });

        // Set up event listeners
        this.setupEventListeners();

        // Check if already logged in
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Minimize/Maximize
        document.getElementById('minimize-btn').addEventListener('click', () => this.minimize());
        document.getElementById('close-btn').addEventListener('click', () => this.minimize());
        this.minimizedIcon.addEventListener('click', () => this.maximize());

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register link
        document.getElementById('register-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterDialog();
        });

        // Main navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.navigateTo(`${screen}-screen`);
                this.loadScreenContent(screen);
            });
        });

        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo('main-menu'));
        });

        // Home button
        document.querySelector('.smartphone-home-btn')?.addEventListener('click', () => {
            this.navigateTo('main-menu');
        });
    }

    minimize() {
        this.container.classList.add('minimized');
    }

    maximize() {
        this.container.classList.remove('minimized');
    }

    navigateTo(screenId) {
        // Hide current screen
        if (this.currentScreen) {
            this.screens[this.currentScreen].classList.remove('active');
        }

        // Show new screen
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
            this.currentScreen = screenId;
        }
    }

    async checkAuthentication() {
        try {
            const student = await API.auth.me();
            this.studentData = student;
            this.updateStudentInfo();
            this.navigateTo('main-menu');
        } catch (error) {
            // Not logged in, stay on login screen
            this.navigateTo('login-screen');
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;

        try {
            const result = await API.auth.login(username);
            this.studentData = result.student;
            this.updateStudentInfo();
            this.navigateTo('main-menu');
            this.showNotification('환영합니다! 👋');
        } catch (error) {
            alert('로그인에 실패했습니다: ' + error.message);
        }
    }

    showRegisterDialog() {
        const username = prompt('사용자 이름을 입력하세요:');
        if (!username) return;

        const fullName = prompt('이름을 입력하세요:');
        if (!fullName) return;

        const gradeLevel = prompt('학년을 입력하세요 (1-6):');
        if (!gradeLevel || gradeLevel < 1 || gradeLevel > 6) {
            alert('올바른 학년을 입력하세요 (1-6)');
            return;
        }

        API.auth.register(username, fullName, parseInt(gradeLevel), null)
            .then(() => {
                alert('등록되었습니다! 이제 로그인하세요.');
            })
            .catch(error => {
                alert('등록에 실패했습니다: ' + error.message);
            });
    }

    updateStudentInfo() {
        if (!this.studentData) return;

        document.getElementById('student-name').textContent = this.studentData.full_name || this.studentData.username;

        // Load student stats
        API.progress.getSummary()
            .then(data => {
                const points = data.stats?.total_points || 0;
                document.getElementById('student-stats').textContent = `⭐ ${points} points`;
            })
            .catch(error => console.error('Failed to load stats:', error));
    }

    loadScreenContent(screen) {
        switch (screen) {
            case 'games':
                this.loadGames();
                break;
            case 'cards':
                this.loadCards();
                break;
            case 'progress':
                this.loadProgress();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadGames() {
        const container = document.getElementById('games-list');
        container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

        try {
            const games = await API.games.list();
            container.innerHTML = '';

            games.forEach(game => {
                const card = this.createGameCard(game);
                container.appendChild(card);
            });
        } catch (error) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Failed to load games</div>';
        }
    }

    createGameCard(game) {
        const div = document.createElement('div');
        div.className = 'game-card';
        div.style.backgroundColor = game.card_background_color || '#f0f0f0';

        // Create stage dots
        const stageDots = [];
        for (let i = 1; i <= 5; i++) {
            const completed = game[`stage_${i}_completed`];
            stageDots.push(`<div class="stage-dot ${completed ? 'completed' : ''}"></div>`);
        }

        div.innerHTML = `
            <div class="game-icon">${this.getGameEmoji(game.concept_name)}</div>
            <div class="game-info">
                <div class="game-name">${game.spirit_name}</div>
                <div class="game-alias">${game.spirit_alias || ''}</div>
                <div class="game-progress">${stageDots.join('')}</div>
            </div>
        `;

        div.addEventListener('click', () => this.launchGame(game));

        return div;
    }

    getGameEmoji(conceptName) {
        const emojis = {
            'fractions': '🍕',
            'decimals': '💰',
            'ratios': '🎨',
            'geometry': '🏠',
            'sequences': '🎵',
            'division': '🍦',
            'time': '⏰',
            'units': '🎒',
            'probability': '🎲',
            'graphs': '🌡️',
            'wordproblems': '📖',
            'logic': '📝'
        };
        return emojis[conceptName] || '🎮';
    }

    async launchGame(game) {
        try {
            const result = await API.games.launch(game.concept_name);

            // Navigate to game play screen
            this.navigateTo('game-play-screen');
            document.getElementById('game-title').textContent = game.spirit_name;

            // Load game in iframe
            const iframe = document.getElementById('game-iframe');
            iframe.src = result.game_url + `?session=${result.session_id}`;

            // Store current session
            this.currentSession = result.session_id;
            this.currentGame = game;

        } catch (error) {
            alert('게임을 시작할 수 없습니다: ' + error.message);
        }
    }

    async loadCards() {
        const container = document.getElementById('cards-collection');
        container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

        try {
            const data = await API.cards.getCollection();
            container.innerHTML = '';

            if (data.cards.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">아직 획득한 카드가 없어요!<br>게임을 플레이하고 카드를 모아보세요!</div>';
                return;
            }

            data.cards.forEach(card => {
                const cardEl = this.createCardItem(card);
                container.appendChild(cardEl);
            });
        } catch (error) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Failed to load cards</div>';
        }
    }

    createCardItem(card) {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.style.background = card.card_background_color || 'white';

        div.innerHTML = `
            <div class="card-spirit">${this.getGameEmoji(card.concept_name)}</div>
            <div class="card-name">${card.spirit_name}</div>
            <div class="card-level">Lv.${card.current_level} / ${card.max_level}</div>
        `;

        div.addEventListener('click', () => this.showCardDetail(card));

        return div;
    }

    showCardDetail(card) {
        alert(`${card.spirit_name}\n\n${card.spirit_personality}\n\n레벨: ${card.current_level}/${card.max_level}\n포인트: ${card.total_points_earned}`);
    }

    async loadProgress() {
        const container = document.getElementById('progress-content');
        container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

        try {
            const data = await API.progress.getSummary();
            container.innerHTML = `
                <div class="progress-stats">
                    <div class="stat-item">
                        <div class="stat-label">도전한 게임</div>
                        <div class="stat-value">${data.stats?.games_attempted || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">완료한 게임</div>
                        <div class="stat-value">${data.stats?.games_completed || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">총 포인트</div>
                        <div class="stat-value">${data.stats?.total_points || 0}</div>
                    </div>
                </div>
            `;

            // Add game-specific progress
            if (data.game_progress && data.game_progress.length > 0) {
                const progressList = document.createElement('div');
                progressList.style.marginTop = '20px';

                data.game_progress.forEach(game => {
                    const item = document.createElement('div');
                    item.style.cssText = 'background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px;';
                    item.innerHTML = `
                        <div style="font-weight: 600; margin-bottom: 5px;">${game.spirit_name}</div>
                        <div style="font-size: 13px; color: #666;">Stage ${game.current_stage} / 5</div>
                        <div style="font-size: 13px; color: #667eea; margin-top: 5px;">${game.total_points_earned} points</div>
                    `;
                    progressList.appendChild(item);
                });

                container.appendChild(progressList);
            }

        } catch (error) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">Failed to load progress</div>';
        }
    }

    loadSettings() {
        const container = document.getElementById('progress-content');
        container.innerHTML = `
            <div style="padding: 20px;">
                <h3>설정</h3>
                <button onclick="widget.handleLogout()" style="margin-top: 20px; padding: 10px 20px; background: #ff4757; color: white; border: none; border-radius: 8px; cursor: pointer;">로그아웃</button>
            </div>
        `;
    }

    async handleLogout() {
        try {
            await API.auth.logout();
            this.studentData = null;
            this.navigateTo('login-screen');
            this.showNotification('로그아웃되었습니다');
        } catch (error) {
            alert('로그아웃 실패: ' + error.message);
        }
    }

    showNotification(message) {
        const badge = document.getElementById('notification-badge');
        badge.style.display = 'block';
        badge.querySelector('#notification-count').textContent = '!';

        setTimeout(() => {
            badge.style.display = 'none';
        }, 3000);
    }
}

// Initialize widget when DOM is ready
let widget;
document.addEventListener('DOMContentLoaded', () => {
    widget = new MathSpiritWidget();
});
