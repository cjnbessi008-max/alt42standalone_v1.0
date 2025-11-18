import {
  fetchQuestionById,
  fetchRandomQuestion,
  checkAnswer,
} from '../services/moodleService.js';

/**
 * Get a question by ID
 */
export const getQuestionById = async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.id, 10);

    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid question ID',
          status: 400,
        },
      });
    }

    const question = await fetchQuestionById(questionId);

    if (!question) {
      return res.status(404).json({
        error: {
          message: 'Question not found',
          status: 404,
        },
      });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a random question
 */
export const getRandomQuestion = async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId, 10)
      : null;

    const question = await fetchRandomQuestion(categoryId);

    if (!question) {
      return res.status(404).json({
        error: {
          message: 'No questions found',
          status: 404,
        },
      });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an answer for a question
 */
export const submitAnswer = async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const { answer } = req.body;

    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid question ID',
          status: 400,
        },
      });
    }

    if (answer === undefined || answer === null) {
      return res.status(400).json({
        error: {
          message: 'Answer is required',
          status: 400,
        },
      });
    }

    const result = await checkAnswer(questionId, parseFloat(answer));

    res.json(result);
  } catch (error) {
    next(error);
  }
};
