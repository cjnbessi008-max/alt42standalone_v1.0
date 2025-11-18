const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogEntry = sequelize.define('LogEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  moodleLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Moodle log ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '사용자 ID'
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '코스 ID'
  },
  eventName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '이벤트 이름 (예: course_viewed, quiz_attempted)'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '액션 타입 (viewed, created, updated, deleted)'
  },
  target: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '대상 (course, quiz, assignment 등)'
  },
  objectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '대상 객체 ID'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '로그 발생 시각'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP 주소'
  },
  rawData: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Moodle에서 받아온 원본 데이터'
  }
}, {
  tableName: 'log_entries',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['courseId'] },
    { fields: ['timestamp'] },
    { fields: ['eventName'] },
    { fields: ['moodleLogId'], unique: true }
  ]
});

module.exports = LogEntry;
