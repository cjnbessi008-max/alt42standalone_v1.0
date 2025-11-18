import React from 'react';
import './CourseItem.css';

function CourseItem({ course, onDelete, theme }) {
  return (
    <div
      className="course-item card"
      style={{
        backgroundColor: theme.cardBackground,
        color: theme.textColor,
        borderLeft: `4px solid ${course.color}`
      }}
    >
      <div className="course-header">
        <h3 className="course-name">{course.name}</h3>
        <button
          className="delete-button"
          onClick={() => onDelete(course.id)}
          title="삭제"
        >
          🗑️
        </button>
      </div>

      <div className="course-details">
        <div className="detail-row">
          <span className="detail-icon">👨‍🏫</span>
          <span>교수: {course.instructor}</span>
        </div>

        <div className="detail-row">
          <span className="detail-icon">📅</span>
          <span>{course.getDayName()} {course.getTimeString()}</span>
        </div>

        <div className="detail-row">
          <span className="detail-icon">📍</span>
          <span>강의실: {course.room}</span>
        </div>

        <div className="detail-row reminder-info">
          <span className="detail-icon">⏰</span>
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
            다음 알림: {course.getNextReminderTime().toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CourseItem;
