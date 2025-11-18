import { query } from '../config/database';
import { Proposition, CreatePropositionRequest, UpdatePropositionRequest } from '../types';

export class PropositionModel {
  static async findAll(): Promise<Proposition[]> {
    const result = await query(`
      SELECT
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM propositions
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  static async findById(id: string): Promise<Proposition | null> {
    const result = await query(
      `
      SELECT
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM propositions
      WHERE id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCreator(userId: string): Promise<Proposition[]> {
    const result = await query(
      `
      SELECT
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM propositions
      WHERE created_by = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows;
  }

  static async create(data: CreatePropositionRequest, userId: string): Promise<Proposition> {
    const defaultVisualConfig = {
      mode: 'venn',
      colors: {
        positive: '#4CAF50',
        negative: '#212121',
        neutral: '#F5F5F5',
      },
      animation: {
        duration: 1000,
        easing: 'ease-in-out',
      },
    };

    const visualConfig = data.visualConfig
      ? { ...defaultVisualConfig, ...data.visualConfig }
      : defaultVisualConfig;

    const result = await query(
      `
      INSERT INTO propositions (title, statement, domain, type, truth_value, visual_config, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      `,
      [
        data.title,
        data.statement,
        data.domain,
        data.type,
        data.truthValue ?? null,
        JSON.stringify(visualConfig),
        userId,
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, data: UpdatePropositionRequest): Promise<Proposition | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.statement !== undefined) {
      fields.push(`statement = $${paramCount++}`);
      values.push(data.statement);
    }
    if (data.domain !== undefined) {
      fields.push(`domain = $${paramCount++}`);
      values.push(data.domain);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(data.type);
    }
    if (data.truthValue !== undefined) {
      fields.push(`truth_value = $${paramCount++}`);
      values.push(data.truthValue);
    }
    if (data.visualConfig !== undefined) {
      fields.push(`visual_config = $${paramCount++}`);
      values.push(JSON.stringify(data.visualConfig));
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `
      UPDATE propositions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      `,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM propositions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async search(keyword: string): Promise<Proposition[]> {
    const result = await query(
      `
      SELECT
        id, title, statement, domain, type, truth_value as "truthValue",
        visual_config as "visualConfig", created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM propositions
      WHERE title ILIKE $1 OR statement ILIKE $1 OR domain ILIKE $1
      ORDER BY created_at DESC
      `,
      [`%${keyword}%`]
    );
    return result.rows;
  }
}
