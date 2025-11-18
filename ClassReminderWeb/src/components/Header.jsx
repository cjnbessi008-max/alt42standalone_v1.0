import React from 'react';
import './Header.css';

function Header({ onSettingsClick, theme }) {
  return (
    <header
      className="header"
      style={{
        backgroundColor: theme.primaryColor,
        color: 'white',
        borderBottomColor: theme.secondaryColor
      }}
    >
      <div className="header-content">
        <h1>📚 수업 알리미</h1>
        <button
          className="settings-button"
          onClick={onSettingsClick}
          title="설정"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;
