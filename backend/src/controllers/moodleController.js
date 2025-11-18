import { Problem } from '../models/index.js';
import { logger } from '../config/logger.js';
import { fetchMoodleQuizzes, fetchMoodleQuestions, sendGradeToMoodle } from '../services/moodleService.js';

// Sync problems from Moodle
export const syncProblemsFromMoodle = async (req, res) => {
  try {
    const { quizId, courseId } = req.body;

    logger.info(`Syncing problems from Moodle quiz: ${quizId}`);

    // Fetch questions from Moodle
    const moodleQuestions = await fetchMoodleQuestions(quizId);

    const syncedProblems = [];

    for (const question of moodleQuestions) {
      // Transform Moodle question to our problem format
      const problemData = transformMoodleQuestion(question);

      // Check if problem already exists (by moodleId)
      let problem = await Problem.findOne({
        where: { moodleId: question.id }
      });

      if (problem) {
        // Update existing problem
        await problem.update(problemData);
      } else {
        // Create new problem
        problem = await Problem.create({
          ...problemData,
          moodleId: question.id
        });
      }

      syncedProblems.push(problem);
    }

    logger.info(`Synced ${syncedProblems.length} problems from Moodle`);

    res.json({
      message: 'Problems synced successfully',
      count: syncedProblems.length,
      problems: syncedProblems
    });
  } catch (error) {
    logger.error('Error syncing from Moodle:', error);
    res.status(500).json({ error: 'Failed to sync problems from Moodle' });
  }
};

// Send results back to Moodle
export const sendResultsToMoodle = async (req, res) => {
  try {
    const { submissionId, moodleUserId, moodleQuizId } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: ['problem']
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Send grade to Moodle
    const result = await sendGradeToMoodle({
      userId: moodleUserId,
      quizId: moodleQuizId,
      questionId: submission.problem.moodleId,
      grade: submission.score,
      feedback: submission.feedback
    });

    logger.info(`Results sent to Moodle for submission: ${submissionId}`);

    res.json({
      message: 'Results sent to Moodle successfully',
      moodleResponse: result
    });
  } catch (error) {
    logger.error('Error sending results to Moodle:', error);
    res.status(500).json({ error: 'Failed to send results to Moodle' });
  }
};

// Get available quizzes from Moodle
export const getMoodleQuizzes = async (req, res) => {
  try {
    const { courseId } = req.query;

    const quizzes = await fetchMoodleQuizzes(courseId);

    res.json({ quizzes });
  } catch (error) {
    logger.error('Error fetching Moodle quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes from Moodle' });
  }
};

// Helper function to transform Moodle question to our format
function transformMoodleQuestion(moodleQuestion) {
  // Detect quantifier type from question text
  const questionText = moodleQuestion.questiontext || '';
  const hasUniversal = /모든|all|every|each/i.test(questionText);
  const hasExistential = /어떤|some|exists|there is/i.test(questionText);

  const quantifierType = hasUniversal ? 'universal' :
                         hasExistential ? 'existential' :
                         'universal'; // default

  return {
    title: moodleQuestion.name || 'Untitled Problem',
    description: stripHtml(moodleQuestion.questiontext || ''),
    quantifierType,
    statement: stripHtml(questionText),
    options: moodleQuestion.answers || [],
    correctAnswer: moodleQuestion.correctanswer || [],
    difficulty: 'medium', // Could be enhanced with better detection
    explanation: stripHtml(moodleQuestion.generalfeedback || ''),
    tags: [moodleQuestion.category || 'general']
  };
}

// Helper to strip HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}
