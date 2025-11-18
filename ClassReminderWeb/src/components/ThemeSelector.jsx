import React from 'react';
import './Selector.css';
import { getAllThemes } from '../models/AppTheme';
import { saveAppTheme } from '../utils/storage';

function ThemeSelector({ currentTheme, onThemeChange, theme }) {
  const themes = getAllThemes();

  const handleChange = (e) => {
    const newTheme = e.target.value;
    saveAppTheme(newTheme);
    onThemeChange(newTheme);
  };

  return (
    <div
      className="card selector-card fade-in"
      style={{
        backgroundColor: theme.cardBackground,
        color: theme.textColor
      }}
    >
      <h3>🎨 앱 테마</h3>
      <select
        value={currentTheme}
        onChange={handleChange}
        className="selector"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderColor: theme.primaryColor
        }}
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.emoji} {t.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSelector;
