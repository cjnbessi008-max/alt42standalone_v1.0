/**
 * LMS Time Tracking SDK
 * LMS 시스템에서 문제당 소비시간을 추적하기 위한 JavaScript SDK
 *
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  class LMSTimeTrackingSDK {
    constructor(config) {
      this.config = {
        apiUrl: config.apiUrl || 'http://localhost:3000/api',
        studentId: config.studentId,
        autoTrack: config.autoTrack !== false,
        debug: config.debug || false,
      };

      this.activeAttempts = new Map();
      this.visibilityEventsBound = false;

      if (this.config.autoTrack) {
        this._setupAutoTracking();
      }

      this._log('SDK initialized', this.config);
    }

    _log(...args) {
      if (this.config.debug) {
        console.log('[LMS Time Tracking]', ...args);
      }
    }

    _error(...args) {
      console.error('[LMS Time Tracking Error]', ...args);
    }

    async _request(endpoint, method = 'GET', data = null) {
      const url = `${this.config.apiUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Request failed');
        }

        return result;
      } catch (error) {
        this._error('Request failed:', error);
        throw error;
      }
    }

    /**
     * 문제 시도 시작
     */
    async startProblem(problemId, options = {}) {
      try {
        const result = await this._request('/time-tracking/start', 'POST', {
          student_id: this.config.studentId,
          problem_id: problemId,
        });

        const attemptId = result.data.id;
        this.activeAttempts.set(problemId, {
          attemptId,
          startTime: Date.now(),
          problemId,
        });

        this._log('Problem started:', problemId, attemptId);

        // Setup visibility tracking
        if (!this.visibilityEventsBound) {
          this._setupVisibilityTracking();
        }

        return result.data;
      } catch (error) {
        this._error('Failed to start problem:', error);
        throw error;
      }
    }

    /**
     * 상호작용 기록
     */
    async recordInteraction(problemId, interactionData = null) {
      const attempt = this.activeAttempts.get(problemId);
      if (!attempt) {
        this._log('No active attempt for problem:', problemId);
        return;
      }

      try {
        await this._request('/time-tracking/event', 'POST', {
          attempt_id: attempt.attemptId,
          event_type: 'interaction',
          event_data: interactionData,
        });

        this._log('Interaction recorded:', problemId);
      } catch (error) {
        this._error('Failed to record interaction:', error);
      }
    }

    /**
     * 힌트 요청 기록
     */
    async recordHintRequest(problemId, hintData = null) {
      const attempt = this.activeAttempts.get(problemId);
      if (!attempt) {
        this._log('No active attempt for problem:', problemId);
        return;
      }

      try {
        await this._request('/time-tracking/event', 'POST', {
          attempt_id: attempt.attemptId,
          event_type: 'hint_request',
          event_data: hintData,
        });

        this._log('Hint request recorded:', problemId);
      } catch (error) {
        this._error('Failed to record hint request:', error);
      }
    }

    /**
     * 답안 제출 및 완료
     */
    async submitAnswer(problemId, isCorrect, answerData = null) {
      const attempt = this.activeAttempts.get(problemId);
      if (!attempt) {
        this._error('No active attempt for problem:', problemId);
        throw new Error('No active attempt found');
      }

      try {
        const result = await this._request('/time-tracking/complete', 'POST', {
          attempt_id: attempt.attemptId,
          is_correct: isCorrect,
          answer_data: answerData,
        });

        this.activeAttempts.delete(problemId);
        this._log('Answer submitted:', problemId, result.data);

        return result.data;
      } catch (error) {
        this._error('Failed to submit answer:', error);
        throw error;
      }
    }

    /**
     * 학생의 시도 기록 조회
     */
    async getAttempts(problemId = null) {
      try {
        const endpoint = `/time-tracking/attempts/${this.config.studentId}${
          problemId ? `?problem_id=${problemId}` : ''
        }`;
        const result = await this._request(endpoint);
        return result.data;
      } catch (error) {
        this._error('Failed to get attempts:', error);
        throw error;
      }
    }

    /**
     * 문제별 통계 조회
     */
    async getProblemStatistics(problemId) {
      try {
        const result = await this._request(`/time-tracking/statistics/${problemId}`);
        return result.data;
      } catch (error) {
        this._error('Failed to get statistics:', error);
        throw error;
      }
    }

    /**
     * 자동 추적 설정 (DOM 요소 클릭 등)
     */
    _setupAutoTracking() {
      // Track clicks on problem elements
      document.addEventListener('click', (e) => {
        const problemElement = e.target.closest('[data-problem-id]');
        if (problemElement) {
          const problemId = problemElement.dataset.problemId;
          const attempt = this.activeAttempts.get(problemId);

          if (attempt) {
            this.recordInteraction(problemId, {
              element: e.target.tagName,
              x: e.clientX,
              y: e.clientY,
            });
          }
        }
      });

      this._log('Auto-tracking enabled');
    }

    /**
     * 페이지 가시성 추적 (탭 전환 등)
     */
    _setupVisibilityTracking() {
      document.addEventListener('visibilitychange', async () => {
        const eventType = document.hidden ? 'blur' : 'focus';

        for (const [problemId, attempt] of this.activeAttempts) {
          try {
            await this._request('/time-tracking/event', 'POST', {
              attempt_id: attempt.attemptId,
              event_type: eventType,
            });
            this._log('Visibility event:', eventType, problemId);
          } catch (error) {
            this._error('Failed to record visibility event:', error);
          }
        }
      });

      this.visibilityEventsBound = true;
      this._log('Visibility tracking enabled');
    }

    /**
     * 경과 시간 가져오기 (초)
     */
    getElapsedTime(problemId) {
      const attempt = this.activeAttempts.get(problemId);
      if (!attempt) {
        return 0;
      }

      return Math.floor((Date.now() - attempt.startTime) / 1000);
    }

    /**
     * 현재 활성 시도 목록
     */
    getActiveAttempts() {
      return Array.from(this.activeAttempts.keys());
    }
  }

  // Global factory function
  window.LMSTimeTracking = {
    init: function(config) {
      return new LMSTimeTrackingSDK(config);
    },
    version: '1.0.0',
  };

  // AMD/CommonJS support
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return window.LMSTimeTracking;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LMSTimeTracking;
  }

})(window);
