import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TimelineEvent, SessionSummary } from '../types/timeline';
import { timelineApi } from '../services/api';

interface TimelineVisualizationProps {
  sessionId: string;
}

interface TimelineData {
  session_id: string;
  summary: SessionSummary;
  events: TimelineEvent[];
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ sessionId }) => {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [sessionId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await timelineApi.getSessionTimeline(sessionId);
      setTimeline(data);
    } catch (err) {
      setError('Failed to load timeline data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="timeline-container loading">
        <div className="loading-spinner">Loading timeline...</div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="timeline-container error">
        <div className="error-message">{error || 'No timeline data available'}</div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <TimelineHeader summary={timeline.summary} />
      <div className="timeline-events">
        {timeline.events.map((event, idx) => (
          <TimelineEvent
            key={event.id || idx}
            event={event}
            previousEvent={idx > 0 ? timeline.events[idx - 1] : null}
          />
        ))}
      </div>
      <TimelineAnalytics events={timeline.events} summary={timeline.summary} />
    </div>
  );
};

interface TimelineHeaderProps {
  summary: SessionSummary;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ summary }) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timeline-header">
      <h2>Solution Timeline</h2>
      <div className="summary-stats">
        <div className="stat">
          <span className="label">Status:</span>
          <span className={`value ${summary.is_completed ? 'completed' : 'incomplete'}`}>
            {summary.is_completed ? (summary.is_correct ? '✓ Correct' : '✗ Incorrect') : 'In Progress'}
          </span>
        </div>
        <div className="stat">
          <span className="label">Duration:</span>
          <span className="value">{formatDuration(summary.duration_seconds)}</span>
        </div>
        <div className="stat">
          <span className="label">Attempts:</span>
          <span className="value">{summary.answer_attempts}</span>
        </div>
        <div className="stat">
          <span className="label">Hints Used:</span>
          <span className="value">{summary.hints_used}</span>
        </div>
        <div className="stat">
          <span className="label">Events:</span>
          <span className="value">{summary.total_events}</span>
        </div>
      </div>
    </div>
  );
};

interface TimelineEventProps {
  event: TimelineEvent;
  previousEvent: TimelineEvent | null;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, previousEvent }) => {
  const getEventIcon = (type: string): string => {
    const icons: Record<string, string> = {
      problem_started: '▶️',
      input_changed: '✏️',
      interaction: '👆',
      hint_requested: '💡',
      answer_submitted: '📤',
      answer_validated: '✅',
      problem_completed: '🎉',
      session_paused: '⏸️',
      session_resumed: '▶️'
    };
    return icons[type] || '📍';
  };

  const getEventColor = (type: string): string => {
    const colors: Record<string, string> = {
      problem_started: '#4CAF50',
      input_changed: '#2196F3',
      interaction: '#9C27B0',
      hint_requested: '#FF9800',
      answer_submitted: '#F44336',
      answer_validated: event.event_data.is_correct ? '#4CAF50' : '#F44336',
      problem_completed: '#4CAF50',
      session_paused: '#757575',
      session_resumed: '#4CAF50'
    };
    return colors[type] || '#607D8B';
  };

  const formatEventData = (data: Record<string, any>): string => {
    const { time_since_last_event, ...rest } = data;
    if (Object.keys(rest).length === 0) return '';

    return Object.entries(rest)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  const timeSinceLastEvent = event.event_data.time_since_last_event;

  return (
    <div className="timeline-event" style={{ borderLeftColor: getEventColor(event.event_type) }}>
      <div className="event-icon">{getEventIcon(event.event_type)}</div>
      <div className="event-content">
        <div className="event-header">
          <span className="event-type">{event.event_type.replace(/_/g, ' ')}</span>
          <span className="event-time">
            {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : ''}
          </span>
        </div>
        {timeSinceLastEvent && (
          <div className="event-timing">
            +{(timeSinceLastEvent / 1000).toFixed(1)}s since last event
          </div>
        )}
        <div className="event-data">{formatEventData(event.event_data)}</div>
      </div>
    </div>
  );
};

interface TimelineAnalyticsProps {
  events: TimelineEvent[];
  summary: SessionSummary;
}

const TimelineAnalytics: React.FC<TimelineAnalyticsProps> = ({ events, summary }) => {
  const inputChanges = events.filter(e => e.event_type === 'input_changed').length;
  const interactions = events.filter(e => e.event_type === 'interaction').length;
  const pauses = events.filter(e => e.event_type === 'session_paused').length;

  // Calculate time between events
  const timeBetweenEvents = events.slice(1).map((event, idx) => {
    const prevTime = new Date(events[idx].timestamp || 0).getTime();
    const currTime = new Date(event.timestamp || 0).getTime();
    return currTime - prevTime;
  });

  const avgTimeBetweenEvents = timeBetweenEvents.length > 0
    ? timeBetweenEvents.reduce((a, b) => a + b, 0) / timeBetweenEvents.length
    : 0;

  return (
    <div className="timeline-analytics">
      <h3>Session Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-value">{inputChanges}</div>
          <div className="card-label">Input Changes</div>
        </div>
        <div className="analytics-card">
          <div className="card-value">{interactions}</div>
          <div className="card-label">UI Interactions</div>
        </div>
        <div className="analytics-card">
          <div className="card-value">{pauses}</div>
          <div className="card-label">Pauses</div>
        </div>
        <div className="analytics-card">
          <div className="card-value">{(avgTimeBetweenEvents / 1000).toFixed(1)}s</div>
          <div className="card-label">Avg Time Between Events</div>
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;
