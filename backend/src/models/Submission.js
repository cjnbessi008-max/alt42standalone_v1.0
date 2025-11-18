import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Problem from './Problem.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'problem_id',
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
    comment: 'Student identifier from Moodle or external system'
  },
  studentAnswer: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'student_answer',
    comment: 'The answer submitted by the student'
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_correct'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score percentage (0-100)'
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'time_spent',
    comment: 'Time spent on problem in seconds'
  },
  hintsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'hints_used',
    comment: 'Number of hints viewed'
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of attempts for this problem'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Feedback shown to student'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata (device info, session data, etc.)'
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] },
    { fields: ['student_id'] },
    { fields: ['is_correct'] },
    { fields: ['created_at'] }
  ]
});

// Associations
Submission.belongsTo(Problem, { foreignKey: 'problem_id', as: 'problem' });
Problem.hasMany(Submission, { foreignKey: 'problem_id', as: 'submissions' });

export default Submission;
