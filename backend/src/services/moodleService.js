import axios from 'axios';
import { query } from '../config/database.js';

/**
 * Fetch a question from Moodle database by ID
 */
export const fetchQuestionById = async (questionId) => {
  try {
    const sql = `
      SELECT
        q.id,
        q.name,
        q.questiontext,
        q.qtype,
        q.defaultmark,
        q.penalty,
        q.length,
        q.stamp,
        q.version,
        q.hidden,
        q.timecreated,
        q.timemodified,
        q.createdby,
        q.modifiedby
      FROM mdl_question q
      WHERE q.id = ?
    `;

    const results = await query(sql, [questionId]);

    if (results.length === 0) {
      return null;
    }

    const question = results[0];

    // Fetch additional question data (answers, options, etc.)
    const questionData = await fetchQuestionData(questionId, question.qtype);

    return {
      ...question,
      questiondata: questionData,
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    throw new Error('Failed to fetch question from database');
  }
};

/**
 * Fetch random question from Moodle database
 */
export const fetchRandomQuestion = async (categoryId = null) => {
  try {
    let sql = `
      SELECT
        q.id,
        q.name,
        q.questiontext,
        q.qtype,
        q.defaultmark,
        q.penalty,
        q.length,
        q.stamp,
        q.version,
        q.hidden,
        q.timecreated,
        q.timemodified,
        q.createdby,
        q.modifiedby
      FROM mdl_question q
      WHERE q.hidden = 0
    `;

    const params = [];

    if (categoryId) {
      sql += ' AND q.category = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY RAND() LIMIT 1';

    const results = await query(sql, params);

    if (results.length === 0) {
      // Return a mock question if no questions in database
      return createMockQuestion();
    }

    const question = results[0];

    // Fetch additional question data
    const questionData = await fetchQuestionData(question.id, question.qtype);

    return {
      ...question,
      questiondata: questionData,
    };
  } catch (error) {
    console.error('Error fetching random question:', error);
    // Return mock question on error
    return createMockQuestion();
  }
};

/**
 * Fetch question-specific data based on question type
 */
const fetchQuestionData = async (questionId, qtype) => {
  try {
    // For numerical questions
    if (qtype === 'numerical') {
      const sql = `
        SELECT
          qa.answer,
          qa.fraction,
          qno.tolerance
        FROM mdl_question_answers qa
        LEFT JOIN mdl_question_numerical_options qno ON qa.question = qno.question
        WHERE qa.question = ?
        ORDER BY qa.fraction DESC
        LIMIT 1
      `;

      const results = await query(sql, [questionId]);

      if (results.length > 0) {
        const answer = results[0];
        return {
          correctAnswer: parseFloat(answer.answer),
          tolerance: parseFloat(answer.tolerance || 0.01),
          min: parseFloat(answer.answer) - 10,
          max: parseFloat(answer.answer) + 10,
        };
      }
    }

    // Default data for other question types
    return {
      min: -10,
      max: 10,
      correctAnswer: 0,
      tolerance: 0.1,
    };
  } catch (error) {
    console.error('Error fetching question data:', error);
    return {
      min: -10,
      max: 10,
      correctAnswer: 0,
      tolerance: 0.1,
    };
  }
};

/**
 * Check if an answer is correct
 */
export const checkAnswer = async (questionId, answer) => {
  try {
    const question = await fetchQuestionById(questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    const { correctAnswer, tolerance } = question.questiondata;
    const isCorrect = Math.abs(answer - correctAnswer) <= tolerance;

    return {
      correct: isCorrect,
      feedback: isCorrect
        ? `Correct! You answered ${answer.toFixed(2)}, which is within tolerance of the correct answer ${correctAnswer}.`
        : `Incorrect. You answered ${answer.toFixed(2)}. The correct answer is ${correctAnswer} (±${tolerance}).`,
    };
  } catch (error) {
    console.error('Error checking answer:', error);
    throw new Error('Failed to check answer');
  }
};

/**
 * Create a mock question for testing
 */
const createMockQuestion = () => {
  const correctAnswer = Math.random() * 20 - 10; // Random number between -10 and 10

  return {
    id: 999,
    name: 'Mock Question: Find the Number',
    questiontext: `<p>Find the number approximately equal to <strong>${correctAnswer.toFixed(2)}</strong> on the real number line.</p>`,
    qtype: 'numerical',
    defaultmark: 1,
    penalty: 0.1,
    length: 1,
    stamp: 'mock',
    version: '1',
    hidden: 0,
    timecreated: Math.floor(Date.now() / 1000),
    timemodified: Math.floor(Date.now() / 1000),
    createdby: 1,
    modifiedby: 1,
    questiondata: {
      correctAnswer: correctAnswer,
      tolerance: 0.5,
      min: correctAnswer - 10,
      max: correctAnswer + 10,
    },
  };
};

export default {
  fetchQuestionById,
  fetchRandomQuestion,
  checkAnswer,
};
