import axios from 'axios';

class MoodleConnector {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    this.wsToken = process.env.REACT_APP_MOODLE_TOKEN || '';
    this.isConnected = false;
    this.pollInterval = null;
    this.listeners = {
      problemUpdate: []
    };
  }

  /**
   * Connect to Moodle LMS via backend API
   */
  async connect() {
    try {
      const response = await axios.post(`${this.baseURL}/connect`, {
        token: this.wsToken
      });

      if (response.data.success) {
        this.isConnected = true;
        this.startPolling();
        return true;
      }

      throw new Error('Failed to connect to Moodle');
    } catch (error) {
      console.error('Moodle connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Moodle
   */
  disconnect() {
    this.isConnected = false;
    this.stopPolling();
  }

  /**
   * Poll for problem updates from Moodle
   */
  startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        const problems = await this.fetchCurrentProblem();
        if (problems) {
          this.notifyListeners('problemUpdate', problems);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Fetch current problem from Moodle
   */
  async fetchCurrentProblem() {
    try {
      const response = await axios.get(`${this.baseURL}/problems/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      return null;
    }
  }

  /**
   * Submit step validation result to Moodle
   */
  async submitStepValidation(problemId, stepIndex, isCorrect, studentId) {
    try {
      const response = await axios.post(`${this.baseURL}/problems/validate`, {
        problem_id: problemId,
        step_index: stepIndex,
        is_correct: isCorrect,
        student_id: studentId,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting validation:', error);
      throw error;
    }
  }

  /**
   * Fetch student progress from Moodle
   */
  async fetchStudentProgress(studentId) {
    try {
      const response = await axios.get(`${this.baseURL}/progress/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  }

  /**
   * Register event listener
   */
  onProblemUpdate(callback) {
    this.listeners.problemUpdate.push(callback);
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default MoodleConnector;
