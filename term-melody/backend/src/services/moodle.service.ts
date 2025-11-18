/**
 * Moodle 데이터베이스 조회 서비스
 */

import { pool } from '../config/database.js'
import { RowDataPacket } from 'mysql2'

interface MoodleQuestionRow extends RowDataPacket {
  id: number
  name: string
  questiontext: string
  qtype: string
  category: number
  timecreated: number
  timemodified: number
}

interface MoodleAnswerRow extends RowDataPacket {
  id: number
  question: number
  answer: string
  fraction: string
  feedback: string
}

export class MoodleService {
  /**
   * 문제 목록 조회 (페이지네이션)
   */
  async getQuestions(params: {
    category?: number
    qtype?: string
    limit?: number
    offset?: number
  }) {
    const {
      category,
      qtype,
      limit = 20,
      offset = 0,
    } = params

    let query = `
      SELECT
        id,
        name,
        questiontext,
        qtype,
        category,
        timecreated,
        timemodified
      FROM mdl_question
      WHERE 1=1
    `

    const queryParams: any[] = []

    if (category) {
      query += ' AND category = ?'
      queryParams.push(category)
    }

    if (qtype) {
      query += ' AND qtype = ?'
      queryParams.push(qtype)
    }

    // 총 개수 조회
    const countQuery = query.replace(
      'SELECT id, name, questiontext, qtype, category, timecreated, timemodified',
      'SELECT COUNT(*) as total'
    )

    const [countResult] = await pool.query<RowDataPacket[]>(
      countQuery,
      queryParams
    )
    const total = countResult[0]?.total || 0

    // 페이지네이션 적용
    query += ' ORDER BY timecreated DESC LIMIT ? OFFSET ?'
    queryParams.push(limit, offset)

    const [rows] = await pool.query<MoodleQuestionRow[]>(query, queryParams)

    return {
      questions: rows.map((row) => ({
        id: row.id,
        name: row.name,
        questiontext: this.stripHtmlTags(row.questiontext),
        qtype: row.qtype,
        category: row.category,
        createdAt: new Date(row.timecreated * 1000).toISOString(),
        modifiedAt: row.timemodified
          ? new Date(row.timemodified * 1000).toISOString()
          : undefined,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    }
  }

  /**
   * 특정 문제 상세 조회
   */
  async getQuestionById(id: number) {
    // 문제 기본 정보
    const [questionRows] = await pool.query<MoodleQuestionRow[]>(
      `SELECT
        id, name, questiontext, qtype, category,
        timecreated, timemodified
      FROM mdl_question
      WHERE id = ?`,
      [id]
    )

    if (questionRows.length === 0) {
      return null
    }

    const question = questionRows[0]

    // 답안 정보
    const [answerRows] = await pool.query<MoodleAnswerRow[]>(
      `SELECT id, question, answer, fraction, feedback
      FROM mdl_question_answers
      WHERE question = ?
      ORDER BY id`,
      [id]
    )

    // 수학 표현식에서 항 추출
    const terms = this.extractTerms(question.questiontext)

    return {
      id: question.id,
      name: question.name,
      questiontext: this.stripHtmlTags(question.questiontext),
      qtype: question.qtype,
      category: question.category,
      createdAt: new Date(question.timecreated * 1000).toISOString(),
      modifiedAt: question.timemodified
        ? new Date(question.timemodified * 1000).toISOString()
        : undefined,
      answers: answerRows.map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        fraction: parseFloat(row.fraction),
        feedback: this.stripHtmlTags(row.feedback),
      })),
      terms,
    }
  }

  /**
   * 문제 카테고리 목록 조회
   */
  async getCategories() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT category, COUNT(*) as count
      FROM mdl_question
      GROUP BY category
      ORDER BY category`
    )

    return rows.map((row) => ({
      category: row.category,
      count: row.count,
    }))
  }

  /**
   * HTML 태그 제거
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim()
  }

  /**
   * 수학 표현식에서 항 추출 (간단한 파서)
   * 예: "x + 3 = 7" -> [{ coefficient: 1, variable: 'x', ... }, ...]
   */
  private extractTerms(questionText: string): any[] {
    const text = this.stripHtmlTags(questionText)

    // 수학 표현식 패턴 매칭
    const mathPattern = /([+-]?\d*\.?\d*)[a-z]?|([+-]?\d+)/gi
    const matches = text.matchAll(mathPattern)

    const terms: any[] = []
    let position = 0

    for (const match of matches) {
      const fullMatch = match[0].trim()
      if (!fullMatch) continue

      // 계수와 변수 분리
      const coeffMatch = fullMatch.match(/([+-]?\d*\.?\d*)([a-z]?)/)
      if (coeffMatch) {
        const [, coeff, variable] = coeffMatch

        const term: any = {
          position: position++,
        }

        if (variable) {
          term.coefficient = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff)
          term.variable = variable
        } else if (coeff) {
          term.constant = parseFloat(coeff)
        }

        if (Object.keys(term).length > 1) {
          terms.push(term)
        }
      }
    }

    return terms
  }

  /**
   * 문제 유형별 통계
   */
  async getStatistics() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        qtype,
        COUNT(*) as count
      FROM mdl_question
      GROUP BY qtype
      ORDER BY count DESC`
    )

    return {
      byType: rows.map((row) => ({
        type: row.qtype,
        count: row.count,
      })),
      total: rows.reduce((sum, row) => sum + row.count, 0),
    }
  }
}

export default new MoodleService()
