import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Problem = sequelize.define('Problem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  moodleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    field: 'moodle_id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quantifierType: {
    type: DataTypes.ENUM('universal', 'existential'),
    allowNull: false,
    comment: 'universal: 모든, existential: 어떤',
    field: 'quantifier_type'
  },
  statement: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'The logical statement to be evaluated'
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Multiple choice options or elements to evaluate'
  },
  correctAnswer: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'correct_answer',
    comment: 'The correct answer(s)'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  characterId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'character_id',
    comment: 'ID of the character that explains this problem'
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explanation shown after solving'
  },
  hints: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Progressive hints for the problem'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'problems',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['moodle_id'] },
    { fields: ['quantifier_type'] },
    { fields: ['difficulty'] },
    { fields: ['is_active'] }
  ]
});

export default Problem;
