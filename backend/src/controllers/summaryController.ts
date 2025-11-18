import { Request, Response } from 'express';
import dailySummaryService from '../services/dailySummaryService';
import { generateYesterdaySummaries } from '../jobs/dailySummaryJob';
import logger from '../utils/logger';

export class SummaryController {
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({ error: 'Date query parameter is required' });
        return;
      }

      const summaryDate = new Date(date as string);
      const summary = await dailySummaryService.getDailySummary(studentId, summaryDate);

      if (!summary) {
        res.status(404).json({ error: 'Summary not found' });
        return;
      }

      res.json(summary);
    } catch (error) {
      logger.error('Error in getDailySummary:', error);
      res.status(500).json({ error: 'Failed to fetch daily summary' });
    }
  }

  async getDailySummaries(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate query parameters are required' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const summaries = await dailySummaryService.getDailySummaries(studentId, start, end);
      res.json(summaries);
    } catch (error) {
      logger.error('Error in getDailySummaries:', error);
      res.status(500).json({ error: 'Failed to fetch daily summaries' });
    }
  }

  async generateDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { date } = req.body;

      if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      const summaryDate = new Date(date);
      const summary = await dailySummaryService.generateDailySummary(studentId, summaryDate);

      res.status(201).json(summary);
    } catch (error) {
      logger.error('Error in generateDailySummary:', error);
      res.status(500).json({ error: 'Failed to generate daily summary' });
    }
  }

  async generateAllSummaries(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.body;
      const summaryDate = date ? new Date(date) : new Date();
      summaryDate.setDate(summaryDate.getDate() - 1); // Yesterday by default

      const summaries = await dailySummaryService.generateAllDailySummaries(summaryDate);

      res.status(201).json({
        message: `Generated ${summaries.length} summaries`,
        summaries,
      });
    } catch (error) {
      logger.error('Error in generateAllSummaries:', error);
      res.status(500).json({ error: 'Failed to generate summaries' });
    }
  }

  async triggerYesterdaySummaries(req: Request, res: Response): Promise<void> {
    try {
      const summaries = await generateYesterdaySummaries();
      res.json({
        message: `Generated ${summaries.length} summaries for yesterday`,
        count: summaries.length,
      });
    } catch (error) {
      logger.error('Error in triggerYesterdaySummaries:', error);
      res.status(500).json({ error: 'Failed to trigger summary generation' });
    }
  }
}

export default new SummaryController();
