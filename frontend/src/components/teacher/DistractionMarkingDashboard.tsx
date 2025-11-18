/**
 * Distraction Marking Dashboard
 *
 * Teacher dashboard for viewing and marking student distraction events
 *
 * Features:
 * - View unmarked distraction events
 * - Filter by student, problem, date, event type
 * - Mark events with category, severity, notes
 * - Add root cause analysis
 * - Recommend interventions
 * - Bulk operations support
 * - Analytics visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ============================================================================
// Types
// ============================================================================

interface DistractionEvent {
  id: string;
  studentId: string;
  moduleId: string;
  problemId?: string;
  eventType: string;
  severityLevel: string;
  durationSeconds: number;
  metadata: Record<string, any>;
  eventTimestamp: Date;
  studentEmail?: string;
  moduleName?: string;
  markId?: string;
}

interface DistractionMark {
  id?: string;
  distractionEventId: string;
  studentId: string;
  moduleId: string;
  problemId?: string;
  category: string;
  severity: string;
  contextNotes?: string;
  rootCauseAnalysis?: string;
  actionTaken?: string;
  interventionRecommended?: boolean;
  interventionType?: string;
}

interface Filters {
  studentId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  unmarkedOnly: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const DistractionMarkingDashboard: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const [events, setEvents] = useState<DistractionEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<DistractionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DistractionEvent | null>(null);
  const [filters, setFilters] = useState<Filters>({
    unmarkedOnly: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMarkingModal, setShowMarkingModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
        unmarkedOnly: filters.unmarkedOnly.toString(),
      });

      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/modules/${moduleId}/distraction-events?${params}`);

      setEvents(response.data.data);
      setFilteredEvents(response.data.data);
      setTotalCount(response.data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch distraction events');
    } finally {
      setLoading(false);
    }
  }, [moduleId, page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleMarkEvent = (event: DistractionEvent) => {
    setSelectedEvent(event);
    setShowMarkingModal(true);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(0); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="distraction-marking-dashboard">
      <div className="dashboard-header">
        <h1>산만함 감지 대시보드</h1>
        <p className="subtitle">학생들의 산만한 행동을 검토하고 표시하세요</p>
      </div>

      {/* Filters */}
      <DistractionFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Statistics Summary */}
      <DistractionStatistics events={filteredEvents} />

      {/* Event List */}
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <DistractionEventList
            events={filteredEvents}
            onMarkEvent={handleMarkEvent}
          />

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Marking Modal */}
      {showMarkingModal && selectedEvent && (
        <DistractionMarkingModal
          event={selectedEvent}
          moduleId={moduleId}
          onClose={() => {
            setShowMarkingModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setShowMarkingModal(false);
            setSelectedEvent(null);
            fetchEvents(); // Refresh list
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// Filter Component
// ============================================================================

const DistractionFilters: React.FC<{
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: any) => void;
}> = ({ filters, onFilterChange }) => {
  return (
    <div className="filters-container">
      <div className="filter-group">
        <label>이벤트 유형</label>
        <select
          value={filters.eventType || ''}
          onChange={(e) => onFilterChange('eventType', e.target.value || undefined)}
        >
          <option value="">전체</option>
          <option value="page_blur">페이지 블러</option>
          <option value="tab_switch">탭 전환</option>
          <option value="mouse_idle">마우스 비활성</option>
          <option value="keyboard_idle">키보드 비활성</option>
          <option value="inactivity">비활성</option>
          <option value="window_resize">창 크기 조정</option>
          <option value="copy_paste">복사/붙여넣기</option>
          <option value="devtools_open">개발자 도구</option>
        </select>
      </div>

      <div className="filter-group">
        <label>시작 날짜</label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => onFilterChange('startDate', e.target.value || undefined)}
        />
      </div>

      <div className="filter-group">
        <label>종료 날짜</label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => onFilterChange('endDate', e.target.value || undefined)}
        />
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={filters.unmarkedOnly}
            onChange={(e) => onFilterChange('unmarkedOnly', e.target.checked)}
          />
          표시되지 않은 항목만 보기
        </label>
      </div>
    </div>
  );
};

// ============================================================================
// Statistics Component
// ============================================================================

const DistractionStatistics: React.FC<{ events: DistractionEvent[] }> = ({ events }) => {
  const stats = {
    total: events.length,
    critical: events.filter((e) => e.severityLevel === 'critical').length,
    major: events.filter((e) => e.severityLevel === 'major').length,
    moderate: events.filter((e) => e.severityLevel === 'moderate').length,
    minor: events.filter((e) => e.severityLevel === 'minor').length,
    unmarked: events.filter((e) => !e.markId).length,
  };

  return (
    <div className="statistics-container">
      <div className="stat-card">
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">전체 이벤트</div>
      </div>
      <div className="stat-card critical">
        <div className="stat-value">{stats.critical}</div>
        <div className="stat-label">심각</div>
      </div>
      <div className="stat-card major">
        <div className="stat-value">{stats.major}</div>
        <div className="stat-label">주요</div>
      </div>
      <div className="stat-card moderate">
        <div className="stat-value">{stats.moderate}</div>
        <div className="stat-label">보통</div>
      </div>
      <div className="stat-card minor">
        <div className="stat-value">{stats.minor}</div>
        <div className="stat-label">경미</div>
      </div>
      <div className="stat-card unmarked">
        <div className="stat-value">{stats.unmarked}</div>
        <div className="stat-label">미표시</div>
      </div>
    </div>
  );
};

// ============================================================================
// Event List Component
// ============================================================================

const DistractionEventList: React.FC<{
  events: DistractionEvent[];
  onMarkEvent: (event: DistractionEvent) => void;
}> = ({ events, onMarkEvent }) => {
  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      page_blur: '페이지 블러',
      tab_switch: '탭 전환',
      mouse_idle: '마우스 비활성',
      keyboard_idle: '키보드 비활성',
      inactivity: '비활성',
      window_resize: '창 크기 조정',
      copy_paste: '복사/붙여넣기',
      context_menu: '우클릭',
      devtools_open: '개발자 도구',
    };
    return types[type] || type;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      major: '#ea580c',
      moderate: '#facc15',
      minor: '#22c55e',
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="event-list-container">
      <table className="event-table">
        <thead>
          <tr>
            <th>시간</th>
            <th>학생</th>
            <th>이벤트 유형</th>
            <th>심각도</th>
            <th>지속 시간</th>
            <th>문제</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.eventTimestamp).toLocaleString('ko-KR')}</td>
              <td>{event.studentEmail || event.studentId}</td>
              <td>{formatEventType(event.eventType)}</td>
              <td>
                <span
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(event.severityLevel) }}
                >
                  {event.severityLevel}
                </span>
              </td>
              <td>{formatDuration(event.durationSeconds)}</td>
              <td>{event.problemId || '-'}</td>
              <td>
                {event.markId ? (
                  <span className="status-badge marked">표시됨</span>
                ) : (
                  <span className="status-badge unmarked">미표시</span>
                )}
              </td>
              <td>
                {!event.markId && (
                  <button className="mark-button" onClick={() => onMarkEvent(event)}>
                    표시하기
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Marking Modal Component
// ============================================================================

const DistractionMarkingModal: React.FC<{
  event: DistractionEvent;
  moduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ event, moduleId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<DistractionMark>({
    distractionEventId: event.id,
    studentId: event.studentId,
    moduleId: moduleId,
    problemId: event.problemId,
    category: 'off_task',
    severity: 'moderate',
    contextNotes: '',
    rootCauseAnalysis: '',
    actionTaken: '',
    interventionRecommended: false,
    interventionType: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post(`/api/modules/${moduleId}/distraction-marks`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '표시를 저장하는 데 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (key: keyof DistractionMark, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>산만함 이벤트 표시</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Event Info */}
          <div className="event-info">
            <h3>이벤트 정보</h3>
            <p>
              <strong>학생:</strong> {event.studentEmail || event.studentId}
            </p>
            <p>
              <strong>시간:</strong> {new Date(event.eventTimestamp).toLocaleString('ko-KR')}
            </p>
            <p>
              <strong>유형:</strong> {event.eventType}
            </p>
            <p>
              <strong>지속 시간:</strong> {event.durationSeconds}초
            </p>
          </div>

          {/* Marking Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>카테고리 *</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              >
                <option value="legitimate_break">정당한 휴식</option>
                <option value="off_task">작업 이탈</option>
                <option value="technical_issue">기술적 문제</option>
                <option value="external_interruption">외부 방해</option>
                <option value="confusion">혼란/이해 부족</option>
                <option value="cheating_attempt">부정행위 시도</option>
                <option value="false_positive">오탐지</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label>심각도 *</label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                required
              >
                <option value="critical">심각</option>
                <option value="major">주요</option>
                <option value="moderate">보통</option>
                <option value="minor">경미</option>
              </select>
            </div>

            <div className="form-group">
              <label>상황 메모</label>
              <textarea
                value={formData.contextNotes}
                onChange={(e) => handleChange('contextNotes', e.target.value)}
                rows={3}
                placeholder="이 산만함 이벤트에 대한 관찰 사항을 입력하세요..."
              />
            </div>

            <div className="form-group">
              <label>근본 원인 분석</label>
              <textarea
                value={formData.rootCauseAnalysis}
                onChange={(e) => handleChange('rootCauseAnalysis', e.target.value)}
                rows={3}
                placeholder="왜 이런 일이 발생했다고 생각하십니까?"
              />
            </div>

            <div className="form-group">
              <label>취한 조치</label>
              <input
                type="text"
                value={formData.actionTaken}
                onChange={(e) => handleChange('actionTaken', e.target.value)}
                placeholder="예: 학생과 대화, 학부모 연락 등"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.interventionRecommended}
                  onChange={(e) => handleChange('interventionRecommended', e.target.checked)}
                />
                개입 권장
              </label>
            </div>

            {formData.interventionRecommended && (
              <div className="form-group">
                <label>개입 유형</label>
                <input
                  type="text"
                  value={formData.interventionType}
                  onChange={(e) => handleChange('interventionType', e.target.value)}
                  placeholder="예: 1:1 상담, 학습 전략 지도 등"
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={onClose} disabled={submitting}>
                취소
              </button>
              <button type="submit" disabled={submitting} className="primary">
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Pagination Component
// ============================================================================

const Pagination: React.FC<{
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalCount, pageSize, onPageChange }) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="pagination">
      <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>
        이전
      </button>
      <span>
        {currentPage + 1} / {totalPages}
      </span>
      <button
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </div>
  );
};

export default DistractionMarkingDashboard;
