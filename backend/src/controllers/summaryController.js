const claudeService = require('../services/claudeService');
const lmsService = require('../services/lmsService');

class SummaryController {
  /**
   * 단일 문제 요약
   * POST /api/summarize
   * Body: { problemText: string, language?: 'ko'|'en' }
   */
  async summarizeProblem(req, res) {
    try {
      const { problemText, language = 'ko' } = req.body;

      if (!problemText) {
        return res.status(400).json({
          success: false,
          error: 'problemText is required'
        });
      }

      const result = await claudeService.summarizeProblem(problemText, {
        language,
        includeMetadata: true
      });

      return res.json(result);
    } catch (error) {
      console.error('Error in summarizeProblem:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * LMS 문제 ID로 요약
   * POST /api/summarize/lms
   * Body: { problemId: string, language?: 'ko'|'en', saveSummary?: boolean }
   */
  async summarizeLMSProblem(req, res) {
    try {
      const { problemId, language = 'ko', saveSummary = false } = req.body;

      if (!problemId) {
        return res.status(400).json({
          success: false,
          error: 'problemId is required'
        });
      }

      // LMS에서 문제 가져오기
      const problem = await lmsService.getProblem(problemId);

      if (!problem || !problem.content) {
        return res.status(404).json({
          success: false,
          error: 'Problem not found or has no content'
        });
      }

      // 문제 요약
      const result = await claudeService.summarizeProblem(problem.content, {
        language,
        includeMetadata: true
      });

      // 요약을 LMS에 저장 (옵션)
      if (saveSummary && result.success) {
        await lmsService.saveSummary(problemId, result.summary);
      }

      return res.json({
        ...result,
        problem: {
          id: problem.id,
          title: problem.title,
          difficulty: problem.difficulty,
          grade: problem.grade
        }
      });
    } catch (error) {
      console.error('Error in summarizeLMSProblem:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 여러 문제 배치 요약
   * POST /api/summarize/batch
   * Body: { problems: [{id: string, text: string}], language?: 'ko'|'en' }
   */
  async summarizeBatch(req, res) {
    try {
      const { problems, language = 'ko' } = req.body;

      if (!problems || !Array.isArray(problems) || problems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'problems array is required'
        });
      }

      const results = await claudeService.summarizeProblemsInBatch(problems, {
        language,
        includeMetadata: true
      });

      return res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error in summarizeBatch:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 모듈의 모든 문제 요약
   * POST /api/summarize/module
   * Body: { moduleId: string, language?: 'ko'|'en' }
   */
  async summarizeModule(req, res) {
    try {
      const { moduleId, language = 'ko' } = req.body;

      if (!moduleId) {
        return res.status(400).json({
          success: false,
          error: 'moduleId is required'
        });
      }

      // 모듈의 모든 문제 가져오기
      const problems = await lmsService.getProblemsByModule(moduleId);

      if (!problems || problems.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No problems found in module'
        });
      }

      // 문제들을 배치로 요약
      const problemsToSummarize = problems.map(p => ({
        id: p.id,
        text: p.content
      }));

      const results = await claudeService.summarizeProblemsInBatch(
        problemsToSummarize,
        { language, includeMetadata: true }
      );

      return res.json({
        success: true,
        moduleId,
        totalProblems: problems.length,
        results
      });
    } catch (error) {
      console.error('Error in summarizeModule:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 헬스 체크
   * GET /api/health
   */
  async healthCheck(req, res) {
    return res.json({
      status: 'ok',
      service: 'LMS Problem Summarizer',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new SummaryController();
