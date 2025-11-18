const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogHeat = sequelize.define('LogHeat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '특정 사용자의 히트 (null이면 전체)'
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '특정 코스의 히트 (null이면 전체)'
  },
  timeWindow: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1h',
    comment: '시간 윈도우 (1h, 6h, 24h, 7d)'
  },
  windowStart: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '시간 윈도우 시작 시각'
  },
  windowEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '시간 윈도우 종료 시각'
  },
  logCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '해당 윈도우의 로그 개수'
  },
  changeRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: '이전 윈도우 대비 변화율 (0-100)'
  },
  heatScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: '히트 스코어 (0-100)'
  },
  colorTemperature: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: '색 온도 (HEX color code)'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '추가 메타데이터 (이벤트별 카운트 등)'
  }
}, {
  tableName: 'log_heats',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['courseId'] },
    { fields: ['windowStart'] },
    { fields: ['windowEnd'] },
    { fields: ['timeWindow'] },
    {
      fields: ['userId', 'courseId', 'timeWindow', 'windowStart'],
      unique: true
    }
  ]
});

module.exports = LogHeat;
