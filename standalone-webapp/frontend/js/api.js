// API Client Module
const API_BASE_URL = window.location.origin + '/api';

export class API {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(API_BASE_URL + endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }

    static async put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}
