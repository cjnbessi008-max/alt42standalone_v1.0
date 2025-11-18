import { query } from '../config/database';
import { Counterexample, CreateCounterexampleRequest } from '../types';

export class CounterexampleModel {
  static async findByPropositionId(propositionId: string): Promise<Counterexample[]> {
    const result = await query(
      `
      SELECT
        id, proposition_id as "propositionId", value, explanation,
        visual_position as "visualPosition", shadow_intensity as "shadowIntensity",
        created_at as "createdAt"
      FROM counterexamples
      WHERE proposition_id = $1
      ORDER BY created_at ASC
      `,
      [propositionId]
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Counterexample | null> {
    const result = await query(
      `
      SELECT
        id, proposition_id as "propositionId", value, explanation,
        visual_position as "visualPosition", shadow_intensity as "shadowIntensity",
        created_at as "createdAt"
      FROM counterexamples
      WHERE id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(
    propositionId: string,
    data: CreateCounterexampleRequest
  ): Promise<Counterexample> {
    const visualPosition = data.visualPosition ?? { x: 0, y: 0 };
    const shadowIntensity = data.shadowIntensity ?? 0.8;

    const result = await query(
      `
      INSERT INTO counterexamples (proposition_id, value, explanation, visual_position, shadow_intensity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id, proposition_id as "propositionId", value, explanation,
        visual_position as "visualPosition", shadow_intensity as "shadowIntensity",
        created_at as "createdAt"
      `,
      [
        propositionId,
        JSON.stringify(data.value),
        data.explanation,
        JSON.stringify(visualPosition),
        shadowIntensity,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: string,
    data: Partial<CreateCounterexampleRequest>
  ): Promise<Counterexample | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.value !== undefined) {
      fields.push(`value = $${paramCount++}`);
      values.push(JSON.stringify(data.value));
    }
    if (data.explanation !== undefined) {
      fields.push(`explanation = $${paramCount++}`);
      values.push(data.explanation);
    }
    if (data.visualPosition !== undefined) {
      fields.push(`visual_position = $${paramCount++}`);
      values.push(JSON.stringify(data.visualPosition));
    }
    if (data.shadowIntensity !== undefined) {
      fields.push(`shadow_intensity = $${paramCount++}`);
      values.push(data.shadowIntensity);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `
      UPDATE counterexamples
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id, proposition_id as "propositionId", value, explanation,
        visual_position as "visualPosition", shadow_intensity as "shadowIntensity",
        created_at as "createdAt"
      `,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM counterexamples WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async deleteByPropositionId(propositionId: string): Promise<number> {
    const result = await query('DELETE FROM counterexamples WHERE proposition_id = $1', [
      propositionId,
    ]);
    return result.rowCount ?? 0;
  }
}
