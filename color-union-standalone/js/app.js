/**
 * Main Application Controller
 * Handles app initialization and routing
 */

class App {
    constructor() {
        this.currentPage = null;
        this.isAuthenticated = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('[App] Initializing...');

        // Check if user is authenticated
        this.isAuthenticated = await authManager.isAuthenticated();

        if (this.isAuthenticated) {
            // Redirect to app
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                window.location.href = '/app.html';
            }
        } else {
            // Show landing page
            this.initLandingPage();
        }
    }

    /**
     * Initialize landing page
     */
    initLandingPage() {
        console.log('[App] Initializing landing page');

        // Get Started button
        const btnGetStarted = document.getElementById('btnGetStarted');
        if (btnGetStarted) {
            btnGetStarted.addEventListener('click', () => {
                this.showRegisterModal();
            });
        }

        // Login button
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        // Initialize modals
        this.initLoginModal();
        this.initRegisterModal();
    }

    /**
     * Initialize login modal
     */
    initLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const closeLoginModal = document.getElementById('closeLoginModal');
        const showRegisterModal = document.getElementById('showRegisterModal');
        const loginForm = document.getElementById('loginForm');

        if (closeLoginModal) {
            closeLoginModal.addEventListener('click', () => {
                this.hideModal(loginModal);
            });
        }

        if (showRegisterModal) {
            showRegisterModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal(loginModal);
                this.showRegisterModal();
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }

        // Close on outside click
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideModal(loginModal);
                }
            });
        }
    }

    /**
     * Initialize register modal
     */
    initRegisterModal() {
        const registerModal = document.getElementById('registerModal');
        const closeRegisterModal = document.getElementById('closeRegisterModal');
        const showLoginModal = document.getElementById('showLoginModal');
        const registerForm = document.getElementById('registerForm');

        if (closeRegisterModal) {
            closeRegisterModal.addEventListener('click', () => {
                this.hideModal(registerModal);
            });
        }

        if (showLoginModal) {
            showLoginModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal(registerModal);
                this.showLoginModal();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });

            // Validate password match
            const password = document.getElementById('registerPassword');
            const passwordConfirm = document.getElementById('registerPasswordConfirm');

            if (passwordConfirm) {
                passwordConfirm.addEventListener('input', () => {
                    if (password.value !== passwordConfirm.value) {
                        passwordConfirm.setCustomValidity('비밀번호가 일치하지 않습니다');
                    } else {
                        passwordConfirm.setCustomValidity('');
                    }
                });
            }
        }

        // Close on outside click
        if (registerModal) {
            registerModal.addEventListener('click', (e) => {
                if (e.target === registerModal) {
                    this.hideModal(registerModal);
                }
            });
        }
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Show register modal
     */
    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide modal
     */
    hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(form) {
        const username = form.username.value;
        const password = form.password.value;
        const rememberMe = form.rememberMe?.checked || false;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const result = await authManager.login(username, password, rememberMe);

            if (result.success) {
                notificationManager.success('로그인 성공!');

                // Redirect to app
                setTimeout(() => {
                    window.location.href = '/app.html';
                }, 1000);
            }
        } catch (error) {
            notificationManager.error(error.message || '로그인에 실패했습니다');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister(form) {
        const username = form.username.value;
        const email = form.email.value;
        const password = form.password.value;
        const passwordConfirm = form.passwordConfirm.value;
        const grade = form.grade.value;

        // Validate password match
        if (password !== passwordConfirm) {
            notificationManager.error('비밀번호가 일치하지 않습니다');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const result = await authManager.register(username, email, password, grade);

            if (result.success) {
                notificationManager.success('회원가입 성공! 로그인해주세요.');

                // Hide register modal and show login modal
                const registerModal = document.getElementById('registerModal');
                this.hideModal(registerModal);

                setTimeout(() => {
                    this.showLoginModal();

                    // Pre-fill username
                    const loginUsername = document.getElementById('loginUsername');
                    if (loginUsername) {
                        loginUsername.value = username;
                    }
                }, 500);
            }
        } catch (error) {
            notificationManager.error(error.message || '회원가입에 실패했습니다');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new App();
    await app.init();
});
