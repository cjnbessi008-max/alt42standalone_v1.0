/**
 * Authentication Manager
 * Handles user registration, login, and session management
 * Fully local - no server required
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'colorUnion_session';
    }

    /**
     * Hash password (simple client-side hashing)
     * Note: In production, use a proper hashing library like bcrypt.js
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Register a new user
     */
    async register(username, email, password, grade) {
        try {
            // Validate input
            if (!username || username.length < 3) {
                throw new Error('사용자명은 최소 3자 이상이어야 합니다');
            }

            if (!email || !this.validateEmail(email)) {
                throw new Error('유효한 이메일 주소를 입력하세요');
            }

            if (!password || password.length < 6) {
                throw new Error('비밀번호는 최소 6자 이상이어야 합니다');
            }

            // Check if username already exists
            const existingUser = await storageManager.getByIndex('users', 'username', username);
            if (existingUser) {
                throw new Error('이미 사용 중인 사용자명입니다');
            }

            // Check if email already exists
            const existingEmail = await storageManager.getByIndex('users', 'email', email);
            if (existingEmail) {
                throw new Error('이미 등록된 이메일 주소입니다');
            }

            // Hash password
            const passwordHash = await this.hashPassword(password);

            // Create user object
            const user = {
                username: username,
                email: email,
                passwordHash: passwordHash,
                grade: grade,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                settings: {
                    notifications: true,
                    soundEffects: true,
                    theme: 'light',
                    language: 'ko'
                }
            };

            // Save user
            const userId = await storageManager.add('users', user);

            // Initialize user progress
            const progress = {
                userId: userId,
                totalSessions: 0,
                totalProblems: 0,
                correctProblems: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0,
                currentStreak: 0,
                longestStreak: 0,
                skillLevel: 1,
                experiencePoints: 0,
                weakAreas: [],
                strongAreas: [],
                learningStyle: 'visual', // Default
                lastActivityAt: new Date().toISOString()
            };

            await storageManager.add('userProgress', progress);

            // Initialize settings
            const settings = {
                userId: userId,
                difficulty: 'adaptive', // adaptive, easy, medium, hard
                problemsPerSession: 10,
                timeLimit: 300,
                enableHints: true,
                enableSound: true,
                enableAnimations: true,
                colorPalette: 'default'
            };

            await storageManager.add('settings', settings);

            return { success: true, userId: userId };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(username, password, rememberMe = false) {
        try {
            // Get user by username
            const user = await storageManager.getByIndex('users', 'username', username);

            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다');
            }

            // Verify password
            const passwordHash = await this.hashPassword(password);
            if (passwordHash !== user.passwordHash) {
                throw new Error('비밀번호가 일치하지 않습니다');
            }

            // Update last login time
            user.lastLoginAt = new Date().toISOString();
            await storageManager.update('users', user);

            // Create session
            const session = {
                userId: user.id,
                username: user.username,
                email: user.email,
                grade: user.grade,
                loginAt: new Date().toISOString(),
                expiresAt: rememberMe
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };

            // Save session to localStorage
            localStorage.setItem(this.sessionKey, JSON.stringify(session));

            // Set current user
            this.currentUser = user;

            return { success: true, user: user };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
        window.location.href = '/';
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const sessionData = localStorage.getItem(this.sessionKey);

        if (!sessionData) {
            return false;
        }

        try {
            const session = JSON.parse(sessionData);

            // Check if session expired
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);

            if (now > expiresAt) {
                this.logout();
                return false;
            }

            // Load user data
            const user = await storageManager.get('users', session.userId);

            if (!user) {
                this.logout();
                return false;
            }

            this.currentUser = user;
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get current session
     */
    getSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('로그인이 필요합니다');
        }

        const user = { ...this.currentUser, ...updates };
        await storageManager.update('users', user);
        this.currentUser = user;

        // Update session
        const session = this.getSession();
        if (session) {
            session.username = user.username;
            session.email = user.email;
            session.grade = user.grade;
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        }

        return user;
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('로그인이 필요합니다');
        }

        // Verify current password
        const currentHash = await this.hashPassword(currentPassword);
        if (currentHash !== this.currentUser.passwordHash) {
            throw new Error('현재 비밀번호가 일치하지 않습니다');
        }

        // Validate new password
        if (newPassword.length < 6) {
            throw new Error('새 비밀번호는 최소 6자 이상이어야 합니다');
        }

        // Hash and save new password
        const newHash = await this.hashPassword(newPassword);
        this.currentUser.passwordHash = newHash;
        await storageManager.update('users', this.currentUser);

        return { success: true };
    }

    /**
     * Delete account
     */
    async deleteAccount(password) {
        if (!this.currentUser) {
            throw new Error('로그인이 필요합니다');
        }

        // Verify password
        const passwordHash = await this.hashPassword(password);
        if (passwordHash !== this.currentUser.passwordHash) {
            throw new Error('비밀번호가 일치하지 않습니다');
        }

        const userId = this.currentUser.id;

        // Delete all user data
        await storageManager.delete('users', userId);
        await storageManager.delete('userProgress', userId);
        await storageManager.delete('settings', userId);

        // Delete all sessions
        const sessions = await storageManager.getAllByIndex('sessions', 'userId', userId);
        for (const session of sessions) {
            await storageManager.delete('sessions', session.id);
        }

        // Delete all attempts
        const attempts = await storageManager.getAllByIndex('attempts', 'userId', userId);
        for (const attempt of attempts) {
            await storageManager.delete('attempts', attempt.id);
        }

        // Logout
        this.logout();

        return { success: true };
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Get user statistics
     */
    async getUserStats(userId = null) {
        const targetUserId = userId || this.currentUser?.id;

        if (!targetUserId) {
            throw new Error('사용자 ID가 필요합니다');
        }

        const progress = await storageManager.get('userProgress', targetUserId);
        const sessions = await storageManager.getAllByIndex('sessions', 'userId', targetUserId);
        const completedSessions = sessions.filter(s => s.isCompleted);

        return {
            progress: progress,
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            averageScore: progress?.averageScore || 0,
            bestScore: progress?.bestScore || 0,
            currentStreak: progress?.currentStreak || 0,
            skillLevel: progress?.skillLevel || 1,
            experiencePoints: progress?.experiencePoints || 0
        };
    }
}

// Create singleton instance
const authManager = new AuthManager();
