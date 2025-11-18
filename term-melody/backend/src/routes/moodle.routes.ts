/**
 * Moodle API 라우터
 */

import { Router } from 'express'
import moodleController from '../controllers/moodle.controller.js'

const router = Router()

// 문제 목록 조회
router.get('/questions', (req, res) => moodleController.getQuestions(req, res))

// 특정 문제 상세 조회
router.get('/question/:id', (req, res) => moodleController.getQuestionById(req, res))

// 카테고리 목록
router.get('/categories', (req, res) => moodleController.getCategories(req, res))

// 통계
router.get('/statistics', (req, res) => moodleController.getStatistics(req, res))

export default router
