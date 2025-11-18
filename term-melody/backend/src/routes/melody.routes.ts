/**
 * 멜로디 생성 API 라우터
 */

import { Router } from 'express'
import melodyController from '../controllers/melody.controller.js'

const router = Router()

// 멜로디 생성
router.post('/generate', (req, res) => melodyController.generateMelody(req, res))

// 항 변화 분석
router.post('/analyze', (req, res) => melodyController.analyzeTerms(req, res))

export default router
