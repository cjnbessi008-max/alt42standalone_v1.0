import { pgPool } from '../config/database';
import { createError } from '../middleware/errorHandler';

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  id?: string;
  problemId?: string;
  vertices: [Point, Point, Point];
  sides?: [number, number, number];
  angles?: [number, number, number];
  label?: string;
  similarityGroup?: number;
}

interface SimilarityResult {
  isSimilar: boolean;
  ratio?: number;
  method: 'SSS' | 'SAS' | 'AA' | 'None';
  details: string;
}

export class TriangleService {
  private readonly EPSILON = 0.001; // Tolerance for floating point comparison

  /**
   * Detect triangles in geometry data and analyze similarities
   */
  async detectAndAnalyze(problemId: string, geometryData: any): Promise<any> {
    const triangles = this.extractTriangles(geometryData);

    // Calculate properties for each triangle
    triangles.forEach(triangle => {
      triangle.sides = this.calculateSides(triangle.vertices);
      triangle.angles = this.calculateAngles(triangle.vertices);
    });

    // Group similar triangles
    const groups = this.groupSimilarTriangles(triangles);

    // Save to database
    const savedTriangles = await this.saveTriangles(problemId, triangles, groups);

    return {
      triangles: savedTriangles,
      similarityGroups: groups,
      totalTriangles: triangles.length,
      totalGroups: groups.length
    };
  }

  /**
   * Extract triangles from geometry data
   */
  private extractTriangles(geometryData: any): Triangle[] {
    const triangles: Triangle[] = [];

    // Assuming geometryData contains triangles or points to form triangles
    if (geometryData.triangles && Array.isArray(geometryData.triangles)) {
      geometryData.triangles.forEach((tri: any, index: number) => {
        if (tri.vertices && tri.vertices.length === 3) {
          triangles.push({
            vertices: tri.vertices as [Point, Point, Point],
            label: tri.label || `Triangle ${index + 1}`
          });
        }
      });
    }

    // Auto-detect triangles from points and edges
    if (geometryData.points && geometryData.edges) {
      // Implementation for auto-detection would go here
      // For now, we expect explicit triangle definitions
    }

    return triangles;
  }

  /**
   * Calculate side lengths of a triangle
   */
  private calculateSides(vertices: [Point, Point, Point]): [number, number, number] {
    const distance = (p1: Point, p2: Point): number => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    return [
      distance(vertices[0], vertices[1]), // side a
      distance(vertices[1], vertices[2]), // side b
      distance(vertices[2], vertices[0])  // side c
    ];
  }

  /**
   * Calculate angles of a triangle using law of cosines
   */
  private calculateAngles(vertices: [Point, Point, Point]): [number, number, number] {
    const sides = this.calculateSides(vertices);
    const [a, b, c] = sides;

    // Law of cosines: cos(A) = (b² + c² - a²) / (2bc)
    const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c));
    const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c));
    const angleC = Math.acos((a * a + b * b - c * c) / (2 * a * b));

    // Convert to degrees
    return [
      angleA * (180 / Math.PI),
      angleB * (180 / Math.PI),
      angleC * (180 / Math.PI)
    ];
  }

  /**
   * Check if two triangles are similar
   */
  checkSimilarity(tri1: Triangle, tri2: Triangle): SimilarityResult {
    if (!tri1.sides || !tri2.sides) {
      tri1.sides = this.calculateSides(tri1.vertices);
      tri2.sides = this.calculateSides(tri2.vertices);
    }

    if (!tri1.angles || !tri2.angles) {
      tri1.angles = this.calculateAngles(tri1.vertices);
      tri2.angles = this.calculateAngles(tri2.vertices);
    }

    // Check SSS (Side-Side-Side) similarity
    const sssResult = this.checkSSS(tri1.sides, tri2.sides);
    if (sssResult.isSimilar) {
      return sssResult;
    }

    // Check SAS (Side-Angle-Side) similarity
    const sasResult = this.checkSAS(tri1.sides, tri1.angles, tri2.sides, tri2.angles);
    if (sasResult.isSimilar) {
      return sasResult;
    }

    // Check AA (Angle-Angle) similarity
    const aaResult = this.checkAA(tri1.angles, tri2.angles);
    if (aaResult.isSimilar) {
      return aaResult;
    }

    return {
      isSimilar: false,
      method: 'None',
      details: 'Triangles are not similar'
    };
  }

  /**
   * Check SSS (Side-Side-Side) similarity criterion
   */
  private checkSSS(sides1: [number, number, number], sides2: [number, number, number]): SimilarityResult {
    // Sort sides to compare ratios
    const sorted1 = [...sides1].sort((a, b) => a - b);
    const sorted2 = [...sides2].sort((a, b) => a - b);

    const ratio1 = sorted1[0] / sorted2[0];
    const ratio2 = sorted1[1] / sorted2[1];
    const ratio3 = sorted1[2] / sorted2[2];

    // Check if all ratios are equal (within epsilon tolerance)
    if (
      Math.abs(ratio1 - ratio2) < this.EPSILON &&
      Math.abs(ratio2 - ratio3) < this.EPSILON
    ) {
      return {
        isSimilar: true,
        ratio: ratio1,
        method: 'SSS',
        details: `Similar by SSS with ratio 1:${ratio1.toFixed(3)}`
      };
    }

    return {
      isSimilar: false,
      method: 'None',
      details: 'SSS criterion not satisfied'
    };
  }

  /**
   * Check SAS (Side-Angle-Side) similarity criterion
   */
  private checkSAS(
    sides1: [number, number, number],
    angles1: [number, number, number],
    sides2: [number, number, number],
    angles2: [number, number, number]
  ): SimilarityResult {
    // Check all combinations of sides and included angle
    for (let i = 0; i < 3; i++) {
      const angle1 = angles1[i];
      const side1a = sides1[i];
      const side1b = sides1[(i + 1) % 3];

      for (let j = 0; j < 3; j++) {
        const angle2 = angles2[j];
        const side2a = sides2[j];
        const side2b = sides2[(j + 1) % 3];

        // Check if angles are equal
        if (Math.abs(angle1 - angle2) < this.EPSILON) {
          const ratio1 = side1a / side2a;
          const ratio2 = side1b / side2b;

          // Check if side ratios are equal
          if (Math.abs(ratio1 - ratio2) < this.EPSILON) {
            return {
              isSimilar: true,
              ratio: ratio1,
              method: 'SAS',
              details: `Similar by SAS with ratio 1:${ratio1.toFixed(3)}, angle ${angle1.toFixed(1)}°`
            };
          }
        }
      }
    }

    return {
      isSimilar: false,
      method: 'None',
      details: 'SAS criterion not satisfied'
    };
  }

  /**
   * Check AA (Angle-Angle) similarity criterion
   */
  private checkAA(angles1: [number, number, number], angles2: [number, number, number]): SimilarityResult {
    const sorted1 = [...angles1].sort((a, b) => a - b);
    const sorted2 = [...angles2].sort((a, b) => a - b);

    let matchCount = 0;

    for (let i = 0; i < 3; i++) {
      if (Math.abs(sorted1[i] - sorted2[i]) < this.EPSILON) {
        matchCount++;
      }
    }

    // If at least 2 angles match, triangles are similar (third angle is automatically equal)
    if (matchCount >= 2) {
      return {
        isSimilar: true,
        method: 'AA',
        details: `Similar by AA (Angle-Angle) criterion`
      };
    }

    return {
      isSimilar: false,
      method: 'None',
      details: 'AA criterion not satisfied'
    };
  }

  /**
   * Group similar triangles together
   */
  private groupSimilarTriangles(triangles: Triangle[]): number[][] {
    const groups: number[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < triangles.length; i++) {
      if (assigned.has(i)) continue;

      const group = [i];
      assigned.add(i);

      for (let j = i + 1; j < triangles.length; j++) {
        if (assigned.has(j)) continue;

        const similarity = this.checkSimilarity(triangles[i], triangles[j]);
        if (similarity.isSimilar) {
          group.push(j);
          assigned.add(j);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Save triangles to database
   */
  private async saveTriangles(
    problemId: string,
    triangles: Triangle[],
    groups: number[][]
  ): Promise<Triangle[]> {
    const client = await pgPool.connect();

    try {
      // Create a map of triangle index to group number
      const groupMap = new Map<number, number>();
      groups.forEach((group, groupIndex) => {
        group.forEach(triangleIndex => {
          groupMap.set(triangleIndex, groupIndex);
        });
      });

      // Save each triangle
      const savedTriangles: Triangle[] = [];

      for (let i = 0; i < triangles.length; i++) {
        const triangle = triangles[i];
        const groupNumber = groupMap.get(i);

        const result = await client.query(
          `INSERT INTO triangles (problem_id, triangle_data, similarity_group)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [
            problemId,
            JSON.stringify({
              vertices: triangle.vertices,
              sides: triangle.sides,
              angles: triangle.angles,
              label: triangle.label
            }),
            groupNumber
          ]
        );

        savedTriangles.push({
          id: result.rows[0].id,
          problemId: result.rows[0].problem_id,
          vertices: triangle.vertices,
          sides: triangle.sides,
          angles: triangle.angles,
          label: triangle.label,
          similarityGroup: groupNumber
        });
      }

      return savedTriangles;
    } catch (error: any) {
      console.error('Error saving triangles:', error);
      throw createError('Failed to save triangles', 500, error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Get triangles by problem ID
   */
  async getTrianglesByProblem(problemId: string): Promise<Triangle[]> {
    const client = await pgPool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM triangles WHERE problem_id = $1 ORDER BY similarity_group',
        [problemId]
      );

      return result.rows.map(row => ({
        id: row.id,
        problemId: row.problem_id,
        vertices: row.triangle_data.vertices,
        sides: row.triangle_data.sides,
        angles: row.triangle_data.angles,
        label: row.triangle_data.label,
        similarityGroup: row.similarity_group
      }));
    } catch (error: any) {
      console.error('Error fetching triangles:', error);
      throw createError('Failed to fetch triangles', 500, error.message);
    } finally {
      client.release();
    }
  }

  /**
   * Get similar triangle groups
   */
  async getSimilarTriangleGroups(problemId: string): Promise<any[]> {
    const triangles = await this.getTrianglesByProblem(problemId);
    const groups: Map<number, Triangle[]> = new Map();

    triangles.forEach(triangle => {
      if (triangle.similarityGroup !== null && triangle.similarityGroup !== undefined) {
        if (!groups.has(triangle.similarityGroup)) {
          groups.set(triangle.similarityGroup, []);
        }
        groups.get(triangle.similarityGroup)!.push(triangle);
      }
    });

    return Array.from(groups.entries()).map(([groupId, triangles]) => ({
      groupId,
      triangles,
      count: triangles.length
    }));
  }
}
