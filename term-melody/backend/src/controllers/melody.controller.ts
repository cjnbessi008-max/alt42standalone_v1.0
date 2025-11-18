/**
 * 멜로디 생성 API 컨트롤러
 */

import { Request, Response } from 'express'
import melodyService from '../services/melody.service.js'

export class MelodyController {
  /**
   * POST /api/melody/generate
   * 항 변화를 음악으로 변환
   */
  async generateMelody(req: Request, res: Response) {
    try {
      const { questionId, terms, options } = req.body

      if (!terms || !Array.isArray(terms)) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'terms array is required',
        })
        return
      }

      const melody = melodyService.generateMelody(terms, options || {})

      // 시각화 데이터 생성
      const visualization = {
        termChanges: terms.map((term: any, index: number) => {
          if (index === 0) return null

          const prevTerm = terms[index - 1]
          const currCoeff = term.coefficient || term.constant || 0
          const prevCoeff = prevTerm.coefficient || prevTerm.constant || 0

          return {
            from: this.termToString(prevTerm),
            to: this.termToString(term),
            direction: currCoeff > prevCoeff ? 'up' : currCoeff < prevCoeff ? 'down' : 'same',
            musicalInterpretation: currCoeff > prevCoeff ? '상승 멜로디' : currCoeff < prevCoeff ? '하강 멜로디' : '동일 음높이',
          }
        }).filter(Boolean),
        patterns: ['항 변화 패턴 감지됨'],
      }

      res.json({
        melody,
        visualization,
      })
    } catch (error) {
      console.error('Error generating melody:', error)
      res.status(500).json({
        error: 'Failed to generate melody',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/melody/analyze
   * 항 변화 패턴 분석
   */
  async analyzeTerms(req: Request, res: Response) {
    try {
      const { expressions } = req.body

      if (!expressions || !Array.isArray(expressions)) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'expressions array is required',
        })
        return
      }

      const analysis = melodyService.analyzeTermChanges(expressions)

      res.json(analysis)
    } catch (error) {
      console.error('Error analyzing terms:', error)
      res.status(500).json({
        error: 'Failed to analyze terms',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * 항을 문자열로 변환
   */
  private termToString(term: any): string {
    if (term.variable) {
      const coeff = term.coefficient === 1 ? '' : term.coefficient === -1 ? '-' : term.coefficient
      return `${coeff}${term.variable}${term.constant ? (term.constant > 0 ? '+' : '') + term.constant : ''}`
    }
    return String(term.constant || 0)
  }
}

export default new MelodyController()
