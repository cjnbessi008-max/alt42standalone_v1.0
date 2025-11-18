import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import functionParserService from '../services/function-parser.service';
import databaseService from '../services/database.service';

const router = Router();

/**
 * POST /api/functions/parse
 * 수식을 파싱하여 트리 구조로 변환
 */
router.post(
  '/parse',
  [
    body('expression')
      .isString()
      .notEmpty()
      .withMessage('Expression is required'),
    body('problemId')
      .optional()
      .isUUID()
      .withMessage('Invalid problem ID'),
    body('save')
      .optional()
      .isBoolean()
      .withMessage('Save must be a boolean'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expression, problemId, save } = req.body;

      // Parse the expression
      const tree = functionParserService.parse(expression);

      // D3.js 호환 형식으로 변환
      const d3Tree = functionParserService.toD3Format(tree);

      // Save to database if requested
      let treeId = null;
      if (save && problemId) {
        treeId = await databaseService.saveFunctionTree(
          problemId,
          expression,
          tree
        );
      }

      res.json({
        success: true,
        data: {
          tree,
          d3Tree,
          treeId,
        },
      });
    } catch (error) {
      console.error('Error parsing function:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse function',
      });
    }
  }
);

/**
 * GET /api/functions/:id
 * 저장된 함수 트리 조회
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid tree ID'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const tree = await databaseService.getFunctionTree(id);

      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      console.error('Error fetching function tree:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Function tree not found',
      });
    }
  }
);

/**
 * GET /api/functions/problem/:problemId
 * 특정 문제의 함수 트리 목록 조회
 */
router.get(
  '/problem/:problemId',
  [
    param('problemId')
      .isUUID()
      .withMessage('Invalid problem ID'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { problemId } = req.params;
      const trees = await databaseService.getFunctionTreesByProblem(problemId);

      res.json({
        success: true,
        data: trees,
      });
    } catch (error) {
      console.error('Error fetching function trees:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch function trees',
      });
    }
  }
);

/**
 * POST /api/functions/validate
 * 수식 유효성 검사
 */
router.post(
  '/validate',
  [
    body('expression')
      .isString()
      .notEmpty()
      .withMessage('Expression is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expression } = req.body;

      // Try to parse - if it works, it's valid
      functionParserService.parse(expression);

      res.json({
        success: true,
        valid: true,
        message: 'Expression is valid',
      });
    } catch (error) {
      res.json({
        success: true,
        valid: false,
        message: error instanceof Error ? error.message : 'Invalid expression',
      });
    }
  }
);

export default router;
