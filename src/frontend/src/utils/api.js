/**
 * API Client for Geo Spiral Standalone
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Token management
let authToken = localStorage.getItem('geospiral_token');

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('geospiral_token', token);
  } else {
    localStorage.removeItem('geospiral_token');
  }
}

export function getAuthToken() {
  return authToken;
}

export function isAuthenticated() {
  return !!authToken;
}

/**
 * Fetch wrapper with error handling and authentication
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        setAuthToken(null);
        window.location.href = '/login';
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== AUTH API ====================

export async function register(userData) {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  setAuthToken(data.token);
  return data;
}

export async function login(credentials) {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setAuthToken(data.token);
  return data;
}

export async function guestLogin() {
  const data = await fetchAPI('/auth/guest', {
    method: 'POST'
  });
  setAuthToken(data.token);
  return data;
}

export function logout() {
  setAuthToken(null);
  localStorage.removeItem('geospiral_user');
}

// ==================== SEQUENCES API ====================

export async function getSequences() {
  return fetchAPI('/sequences');
}

export async function getSequence(sequenceId) {
  return fetchAPI(`/sequences/${sequenceId}`);
}

export async function getSequencesByLevel(level) {
  return fetchAPI(`/sequences/level/${level}`);
}

// ==================== PROGRESS API ====================

export async function getProgress() {
  return fetchAPI('/progress');
}

export async function saveProgress(sequenceId, progressData) {
  return fetchAPI('/progress', {
    method: 'POST',
    body: JSON.stringify({
      sequence_id: sequenceId,
      ...progressData
    })
  });
}

export async function getProgressStats() {
  return fetchAPI('/progress/stats');
}

// ==================== RECOMMENDATIONS API ====================

export async function getRecommendations() {
  return fetchAPI('/recommendations');
}

export async function getNextRecommendation() {
  return fetchAPI('/recommendations/next');
}

export async function getLearningPath() {
  return fetchAPI('/recommendations/path');
}

// ==================== USERS API ====================

export async function getCurrentUser() {
  return fetchAPI('/users/me');
}

export async function updateProfile(updates) {
  return fetchAPI('/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function getLeaderboard() {
  return fetchAPI('/users/leaderboard');
}
