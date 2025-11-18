import { Request, Response } from 'express';
import { db } from '../database/db';
import { GeometricShape, Point } from '../models/types';

export const getAllShapes = (req: Request, res: Response) => {
    try {
        const shapes = db.prepare('SELECT * FROM geometric_shapes ORDER BY created_at DESC').all();

        const shapesWithParsedVertices = shapes.map((shape: any) => ({
            ...shape,
            vertices: JSON.parse(shape.vertices)
        }));

        res.json({ success: true, data: shapesWithParsedVertices });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch shapes' });
    }
};

export const getShapeById = (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const shape = db.prepare('SELECT * FROM geometric_shapes WHERE id = ?').get(id) as any;

        if (!shape) {
            return res.status(404).json({ success: false, error: 'Shape not found' });
        }

        res.json({
            success: true,
            data: {
                ...shape,
                vertices: JSON.parse(shape.vertices)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch shape' });
    }
};

export const createShape = (req: Request, res: Response) => {
    try {
        const { name, shape_type, vertices }: GeometricShape = req.body;

        if (!name || !shape_type || !vertices || !Array.isArray(vertices)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, shape_type, vertices'
            });
        }

        const verticesJson = JSON.stringify(vertices);

        const stmt = db.prepare(
            'INSERT INTO geometric_shapes (name, shape_type, vertices) VALUES (?, ?, ?)'
        );

        const result = stmt.run(name, shape_type, verticesJson);

        res.status(201).json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                name,
                shape_type,
                vertices
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create shape' });
    }
};

export const deleteShape = (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare('DELETE FROM geometric_shapes WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Shape not found' });
        }

        res.json({ success: true, message: 'Shape deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete shape' });
    }
};
