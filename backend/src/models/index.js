const LogEntry = require('./LogEntry');
const LogHeat = require('./LogHeat');

// 모델 간 관계 설정
LogEntry.hasMany(LogHeat, {
  foreignKey: 'userId',
  sourceKey: 'userId',
  as: 'heats'
});

module.exports = {
  LogEntry,
  LogHeat
};
