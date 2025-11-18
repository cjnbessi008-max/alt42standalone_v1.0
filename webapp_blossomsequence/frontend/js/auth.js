/**
 * Authentication Management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    async init() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const userData = await api.getCurrentUser();
                this.currentUser = userData.user;
                this.isAuthenticated = true;
                this.updateUI();
                return true;
            } catch (error) {
                console.error('Auth init failed:', error);
                await this.logout();
                return false;
            }
        }
        return false;
    }

    async login(username, password) {
        try {
            const response = await api.login(username, password);
            this.currentUser = response.user;
            this.isAuthenticated = true;
            localStorage.setItem('userId', response.user.id);
            localStorage.setItem('username', response.user.username);
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async register(username, password, email) {
        try {
            await api.register(username, password, email);
            // Auto-login after registration
            return await this.login(username, password);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async logout() {
        await api.logout();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
        app.showScreen('loginScreen');
    }

    updateUI() {
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.isAuthenticated && this.currentUser) {
            userName.textContent = this.currentUser.username;
            logoutBtn.style.display = 'block';
        } else {
            userName.textContent = 'Guest';
            logoutBtn.style.display = 'none';
        }
    }

    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : localStorage.getItem('userId');
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }
}

const authManager = new AuthManager();
