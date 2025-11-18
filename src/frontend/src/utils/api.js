/**
 * API Client for Geo Spiral Moodle Integration
 */

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/blocks/geospiral';
const COURSE_ID = process.env.REACT_APP_COURSE_ID || 1;

// Mock mode for development
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

/**
 * Mock data for development
 */
const MOCK_SEQUENCES = [
  {
    id: 1,
    name: 'Basic Geometric Sequence',
    description: '첫 항 2, 공비 2의 등비수열',
    sequence_type: 'geometric',
    first_term: 2.0,
    common_ratio: 2.0,
    num_terms: 8,
    spiral_type: 'logarithmic'
  },
  {
    id: 2,
    name: 'Golden Ratio Spiral',
    description: '황금비를 이용한 나선',
    sequence_type: 'geometric',
    first_term: 1.0,
    common_ratio: 1.618034,
    num_terms: 12,
    spiral_type: 'logarithmic'
  },
  {
    id: 3,
    name: 'Fibonacci Spiral',
    description: '피보나치 수열 나선',
    sequence_type: 'fibonacci',
    first_term: 1.0,
    common_ratio: null,
    num_terms: 15,
    spiral_type: 'fibonacci'
  },
  {
    id: 4,
    name: 'Small Ratio Spiral',
    description: '공비 1.5의 나선',
    sequence_type: 'geometric',
    first_term: 1.0,
    common_ratio: 1.5,
    num_terms: 10,
    spiral_type: 'logarithmic'
  }
];

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include' // Include cookies for Moodle session
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Get all sequences
 * @returns {Promise<Array>} Array of sequences
 */
export async function getSequences() {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_SEQUENCES);
  }

  return fetchAPI(`/api.php?action=get_sequences&courseid=${COURSE_ID}`);
}

/**
 * Get single sequence by ID
 * @param {number} sequenceId - Sequence ID
 * @returns {Promise<Object>} Sequence object
 */
export async function getSequence(sequenceId) {
  if (USE_MOCK) {
    const sequence = MOCK_SEQUENCES.find(s => s.id === sequenceId);
    return Promise.resolve(sequence || null);
  }

  return fetchAPI(`/api.php?action=get_sequence&sequenceid=${sequenceId}&courseid=${COURSE_ID}`);
}

/**
 * Get user progress for a sequence
 * @param {number} sequenceId - Sequence ID
 * @returns {Promise<Object>} Progress object
 */
export async function getProgress(sequenceId) {
  if (USE_MOCK) {
    return Promise.resolve(null);
  }

  return fetchAPI(`/api.php?action=get_progress&sequenceid=${sequenceId}&courseid=${COURSE_ID}`);
}

/**
 * Save user progress
 * @param {number} sequenceId - Sequence ID
 * @param {Object} progressData - Progress data
 * @returns {Promise<Object>} Saved progress object
 */
export async function saveProgress(sequenceId, progressData = {}) {
  if (USE_MOCK) {
    console.log('Mock: Saving progress', sequenceId, progressData);
    return Promise.resolve({ id: 1, ...progressData });
  }

  const params = new URLSearchParams({
    action: 'save_progress',
    sequenceid: sequenceId,
    courseid: COURSE_ID,
    ...progressData
  });

  return fetchAPI(`/api.php?${params.toString()}`, {
    method: 'POST'
  });
}

/**
 * Log user interaction
 * @param {number} sequenceId - Sequence ID
 * @param {string} type - Interaction type
 * @param {Object} data - Interaction data
 * @returns {Promise<Object>} Logged interaction
 */
export async function logInteraction(sequenceId, type, data = {}) {
  if (USE_MOCK) {
    console.log('Mock: Logging interaction', sequenceId, type, data);
    return Promise.resolve({ id: 1 });
  }

  const params = new URLSearchParams({
    action: 'log_interaction',
    sequenceid: sequenceId,
    courseid: COURSE_ID,
    type: type,
    data: JSON.stringify(data)
  });

  return fetchAPI(`/api.php?${params.toString()}`, {
    method: 'POST'
  });
}
