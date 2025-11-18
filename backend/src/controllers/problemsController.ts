import { Request, Response } from 'express';
import { db } from '../database/db';
import { analyzeSimilarity } from '../utils/geometry';

export const getAllProblems = (req: Request, res: Response) => {
    try {
        const problems = db.prepare(`
            SELECT
                p.*,
                sa.name as shape_a_name,
                sa.vertices as shape_a_vertices,
                sb.name as shape_b_name,
                sb.vertices as shape_b_vertices
            FROM similarity_problems p
            JOIN geometric_shapes sa ON p.shape_a_id = sa.id
            JOIN geometric_shapes sb ON p.shape_b_id = sb.id
            ORDER BY p.created_at DESC
        `).all();

        const problemsWithParsedData = problems.map((problem: any) => ({
            ...problem,
            shape_a_vertices: JSON.parse(problem.shape_a_vertices),
            shape_b_vertices: JSON.parse(problem.shape_b_vertices)
        }));

        res.json({ success: true, data: problemsWithParsedData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch problems' });
    }
};

export const getProblemById = (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const problem = db.prepare(`
            SELECT
                p.*,
                sa.name as shape_a_name,
                sa.vertices as shape_a_vertices,
                sa.shape_type as shape_a_type,
                sb.name as shape_b_name,
                sb.vertices as shape_b_vertices,
                sb.shape_type as shape_b_type
            FROM similarity_problems p
            JOIN geometric_shapes sa ON p.shape_a_id = sa.id
            JOIN geometric_shapes sb ON p.shape_b_id = sb.id
            WHERE p.id = ?
        `).get(id) as any;

        if (!problem) {
            return res.status(404).json({ success: false, error: 'Problem not found' });
        }

        res.json({
            success: true,
            data: {
                ...problem,
                shape_a_vertices: JSON.parse(problem.shape_a_vertices),
                shape_b_vertices: JSON.parse(problem.shape_b_vertices)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch problem' });
    }
};

export const analyzeProblem = (req: Request, res: Response) => {
    try {
        const { shape_a_id, shape_b_id } = req.body;

        if (!shape_a_id || !shape_b_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: shape_a_id, shape_b_id'
            });
        }

        const shapeA = db.prepare('SELECT * FROM geometric_shapes WHERE id = ?').get(shape_a_id) as any;
        const shapeB = db.prepare('SELECT * FROM geometric_shapes WHERE id = ?').get(shape_b_id) as any;

        if (!shapeA || !shapeB) {
            return res.status(404).json({ success: false, error: 'One or both shapes not found' });
        }

        const verticesA = JSON.parse(shapeA.vertices);
        const verticesB = JSON.parse(shapeB.vertices);

        const analysis = analyzeSimilarity(verticesA, verticesB);

        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to analyze similarity' });
    }
};

export const createProblem = (req: Request, res: Response) => {
    try {
        const { title, description, shape_a_id, shape_b_id } = req.body;

        if (!title || !shape_a_id || !shape_b_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, shape_a_id, shape_b_id'
            });
        }

        // Analyze similarity automatically
        const shapeA = db.prepare('SELECT * FROM geometric_shapes WHERE id = ?').get(shape_a_id) as any;
        const shapeB = db.prepare('SELECT * FROM geometric_shapes WHERE id = ?').get(shape_b_id) as any;

        if (!shapeA || !shapeB) {
            return res.status(404).json({ success: false, error: 'One or both shapes not found' });
        }

        const verticesA = JSON.parse(shapeA.vertices);
        const verticesB = JSON.parse(shapeB.vertices);
        const analysis = analyzeSimilarity(verticesA, verticesB);

        const stmt = db.prepare(`
            INSERT INTO similarity_problems
            (title, description, shape_a_id, shape_b_id, is_similar, similarity_ratio, similarity_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            title,
            description || null,
            shape_a_id,
            shape_b_id,
            analysis.is_similar ? 1 : 0,
            analysis.similarity_ratio || null,
            analysis.similarity_type
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                title,
                description,
                shape_a_id,
                shape_b_id,
                analysis
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create problem' });
    }
};
