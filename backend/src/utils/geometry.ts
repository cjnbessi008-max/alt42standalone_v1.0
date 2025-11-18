import { Point, SimilarityAnalysis } from '../models/types';

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle in degrees between three points (vertex at p2)
 */
export function calculateAngle(p1: Point, p2: Point, p3: Point): number {
    const a = distance(p2, p3);
    const b = distance(p1, p3);
    const c = distance(p1, p2);

    // Law of cosines: cos(angle) = (a² + c² - b²) / (2ac)
    const cosAngle = (a * a + c * c - b * b) / (2 * a * c);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return (angleRad * 180) / Math.PI;
}

/**
 * Get all side lengths of a triangle
 */
export function getTriangleSides(vertices: Point[]): number[] {
    if (vertices.length !== 3) {
        throw new Error('Triangle must have exactly 3 vertices');
    }
    return [
        distance(vertices[0], vertices[1]),
        distance(vertices[1], vertices[2]),
        distance(vertices[2], vertices[0])
    ];
}

/**
 * Get all angles of a triangle
 */
export function getTriangleAngles(vertices: Point[]): number[] {
    if (vertices.length !== 3) {
        throw new Error('Triangle must have exactly 3 vertices');
    }
    return [
        calculateAngle(vertices[2], vertices[0], vertices[1]),
        calculateAngle(vertices[0], vertices[1], vertices[2]),
        calculateAngle(vertices[1], vertices[2], vertices[0])
    ];
}

/**
 * Check if two triangles are similar and determine similarity type
 */
export function analyzeSimilarity(vertices1: Point[], vertices2: Point[]): SimilarityAnalysis {
    if (vertices1.length !== 3 || vertices2.length !== 3) {
        return {
            is_similar: false,
            similarity_type: 'none',
            confidence: 0
        };
    }

    const sides1 = getTriangleSides(vertices1).sort((a, b) => a - b);
    const sides2 = getTriangleSides(vertices2).sort((a, b) => a - b);
    const angles1 = getTriangleAngles(vertices1).sort((a, b) => a - b);
    const angles2 = getTriangleAngles(vertices2).sort((a, b) => a - b);

    // Calculate side ratios
    const ratios = sides1.map((side, i) => sides2[i] / side);
    const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    const ratioVariance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;

    // Calculate angle differences
    const angleDiffs = angles1.map((angle, i) => Math.abs(angle - angles2[i]));
    const maxAngleDiff = Math.max(...angleDiffs);

    // Tolerance for floating point comparison
    const RATIO_TOLERANCE = 0.05; // 5% tolerance
    const ANGLE_TOLERANCE = 2; // 2 degrees tolerance

    // Check SSS (Side-Side-Side) similarity
    if (ratioVariance < RATIO_TOLERANCE) {
        return {
            is_similar: true,
            similarity_ratio: avgRatio,
            similarity_type: 'SSS',
            side_ratios: ratios,
            angle_differences: angleDiffs,
            confidence: Math.max(0, 1 - ratioVariance * 10)
        };
    }

    // Check AA (Angle-Angle) similarity
    if (maxAngleDiff < ANGLE_TOLERANCE) {
        return {
            is_similar: true,
            similarity_ratio: avgRatio,
            similarity_type: 'AA',
            side_ratios: ratios,
            angle_differences: angleDiffs,
            confidence: Math.max(0, 1 - maxAngleDiff / 10)
        };
    }

    // Check SAS (Side-Angle-Side) similarity
    // Check if any two consecutive side ratios are equal and angle between them matches
    for (let i = 0; i < 3; i++) {
        const ratio1 = ratios[i];
        const ratio2 = ratios[(i + 1) % 3];
        const angleDiff = angleDiffs[i];

        if (Math.abs(ratio1 - ratio2) < avgRatio * RATIO_TOLERANCE && angleDiff < ANGLE_TOLERANCE) {
            return {
                is_similar: true,
                similarity_ratio: (ratio1 + ratio2) / 2,
                similarity_type: 'SAS',
                side_ratios: ratios,
                angle_differences: angleDiffs,
                confidence: 0.85
            };
        }
    }

    return {
        is_similar: false,
        similarity_type: 'none',
        side_ratios: ratios,
        angle_differences: angleDiffs,
        confidence: 0
    };
}

/**
 * Normalize vertices to fit within a bounding box
 */
export function normalizeVertices(vertices: Point[], width: number, height: number, padding: number = 20): Point[] {
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const shapeWidth = maxX - minX;
    const shapeHeight = maxY - minY;

    const scale = Math.min(
        (width - 2 * padding) / shapeWidth,
        (height - 2 * padding) / shapeHeight
    );

    return vertices.map(v => ({
        x: (v.x - minX) * scale + padding,
        y: (v.y - minY) * scale + padding
    }));
}
