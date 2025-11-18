// Authentication Module
import { API } from './api.js';

export class Auth {
    static async login(username, password) {
        try {
            const result = await API.post('/auth/login', { username, password });
            if (result.success && result.token) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                return result;
            }
            return { success: false, error: 'Login failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async register(userData) {
        try {
            const result = await API.post('/auth/register', userData);
            if (result.success && result.token) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                return result;
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    static isLoggedIn() {
        return !!localStorage.getItem('auth_token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}
