import React from 'react';
import './Selector.css';
import { getAllModes } from '../models/NotificationMode';
import { saveNotificationMode } from '../utils/storage';

function ModeSelector({ currentMode, onModeChange, theme }) {
  const modes = getAllModes();

  const handleChange = (e) => {
    const newMode = e.target.value;
    saveNotificationMode(newMode);
    onModeChange(newMode);
  };

  return (
    <div
      className="card selector-card fade-in"
      style={{
        backgroundColor: theme.cardBackground,
        color: theme.textColor
      }}
    >
      <h3>🎭 알림 모드</h3>
      <select
        value={currentMode}
        onChange={handleChange}
        className="selector"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderColor: theme.primaryColor
        }}
      >
        {modes.map((mode) => (
          <option key={mode.name} value={mode.name}>
            {mode.emoji} {mode.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModeSelector;
