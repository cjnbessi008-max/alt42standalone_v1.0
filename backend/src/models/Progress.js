import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id'
  },
  universalQuantifierScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'universal_quantifier_score',
    comment: 'Average score for universal quantifier problems (모든)'
  },
  existentialQuantifierScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'existential_quantifier_score',
    comment: 'Average score for existential quantifier problems (어떤)'
  },
  totalProblemsAttempted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_problems_attempted'
  },
  totalProblemsCorrect: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_problems_correct'
  },
  overallAccuracy: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'overall_accuracy',
    comment: 'Overall accuracy percentage (0-100)'
  },
  averageTimePerProblem: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'average_time_per_problem',
    comment: 'Average time in seconds'
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_streak',
    comment: 'Current streak of correct answers'
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'longest_streak',
    comment: 'Longest streak of correct answers'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Student level based on progress'
  },
  experiencePoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'experience_points',
    comment: 'Total XP earned'
  },
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'List of earned achievements'
  },
  weakAreas: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'weak_areas',
    comment: 'Areas where student needs improvement'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity_at'
  }
}, {
  tableName: 'progress',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['student_id'], unique: true },
    { fields: ['level'] },
    { fields: ['overall_accuracy'] },
    { fields: ['last_activity_at'] }
  ]
});

export default Progress;
