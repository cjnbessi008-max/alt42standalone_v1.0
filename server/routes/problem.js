/**
 * Problem Routes
 * 문제 관리 API
 */

const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 인증 필요
router.use(authenticateToken);

// 문제 목록 조회
router.get('/', problemController.getProblems);

// 문제 상세 조회
router.get('/:id', problemController.getProblemById);

// 문제 생성 (교사, 관리자만)
router.post('/', authorizeRoles('teacher', 'admin'), problemController.createProblem);

// 문제 수정 (교사, 관리자만)
router.put('/:id', authorizeRoles('teacher', 'admin'), problemController.updateProblem);

// 문제 삭제 (관리자만)
router.delete('/:id', authorizeRoles('admin'), problemController.deleteProblem);

module.exports = router;
