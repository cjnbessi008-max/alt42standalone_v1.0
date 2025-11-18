<?php
/**
 * ShapeManager - Handle shape-related operations
 */

defined('AREA_RECOM_APP') or define('AREA_RECOM_APP', true);

class ShapeManager {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Get all shapes
     */
    public function getAllShapes() {
        $sql = "
            SELECT id, shape_name, shape_type, vertices, original_area,
                   difficulty_level, color_code, created_at
            FROM shapes
            ORDER BY difficulty_level ASC, id ASC
        ";

        $shapes = $this->db->fetchAll($sql);
        return $this->parseShapes($shapes);
    }

    /**
     * Get shape by ID
     */
    public function getShapeById($id) {
        $sql = "
            SELECT id, shape_name, shape_type, vertices, original_area,
                   difficulty_level, color_code, created_at
            FROM shapes
            WHERE id = ?
            LIMIT 1
        ";

        $shape = $this->db->fetchOne($sql, [$id]);

        if (!$shape) {
            throw new Exception('Shape not found');
        }

        return $this->parseShape($shape);
    }

    /**
     * Get shapes by difficulty level
     */
    public function getShapesByDifficulty($level) {
        $sql = "
            SELECT id, shape_name, shape_type, vertices, original_area,
                   difficulty_level, color_code, created_at
            FROM shapes
            WHERE difficulty_level = ?
            ORDER BY id ASC
        ";

        $shapes = $this->db->fetchAll($sql, [$level]);
        return $this->parseShapes($shapes);
    }

    /**
     * Parse shapes array (decode JSON vertices)
     */
    private function parseShapes($shapes) {
        return array_map([$this, 'parseShape'], $shapes);
    }

    /**
     * Parse single shape (decode JSON vertices)
     */
    private function parseShape($shape) {
        if (isset($shape['vertices'])) {
            $shape['vertices'] = json_decode($shape['vertices'], true);
        }
        return $shape;
    }

    /**
     * Calculate polygon area using Shoelace formula
     */
    public function calculatePolygonArea($vertices) {
        $n = count($vertices);
        if ($n < 3) {
            return 0;
        }

        $area = 0;
        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $area += $vertices[$i]['x'] * $vertices[$j]['y'];
            $area -= $vertices[$j]['x'] * $vertices[$i]['y'];
        }

        return abs($area / 2);
    }

    /**
     * Validate area conservation across torn pieces
     */
    public function validateAreaConservation($sessionId, $pieces) {
        // Get session info to get original shape
        $sql = "
            SELECT ss.shape_id, s.original_area, ss.attempts
            FROM student_sessions ss
            JOIN shapes s ON ss.shape_id = s.id
            WHERE ss.id = ?
        ";

        $session = $this->db->fetchOne($sql, [$sessionId]);

        if (!$session) {
            throw new Exception('Session not found');
        }

        $originalArea = floatval($session['original_area']);
        $attempts = intval($session['attempts']);

        // Calculate total area of all pieces
        $totalArea = 0;
        foreach ($pieces as $piece) {
            if (isset($piece['vertices']) && is_array($piece['vertices'])) {
                $pieceArea = $this->calculatePolygonArea($piece['vertices']);
                $totalArea += $pieceArea;
            }
        }

        // Check if areas match within tolerance
        $difference = abs($originalArea - $totalArea);
        $tolerance = $originalArea * AREA_TOLERANCE;
        $isValid = $difference <= $tolerance;

        // Calculate score (100 points max, deduct 10 points per attempt)
        $score = max(0, 100 - ($attempts * 10));

        // Bonus points for perfect area conservation
        if ($difference < ($originalArea * 0.01)) { // Within 1%
            $score += 10;
        }

        $score = min(100, $score); // Cap at 100

        return [
            'is_valid' => $isValid,
            'original_area' => $originalArea,
            'calculated_area' => $totalArea,
            'difference' => $difference,
            'tolerance' => $tolerance,
            'score' => $score,
            'attempts' => $attempts + 1,
            'message' => $isValid ?
                '성공! 넓이가 보존되었습니다.' :
                '넓이가 일치하지 않습니다. 다시 시도해보세요.'
        ];
    }

    /**
     * Get shape statistics
     */
    public function getShapeStatistics($shapeId) {
        $sql = "SELECT * FROM v_shape_statistics WHERE id = ?";
        $stats = $this->db->fetchOne($sql, [$shapeId]);

        if (!$stats) {
            return [
                'total_attempts' => 0,
                'completed_count' => 0,
                'average_score' => 0,
                'average_attempts' => 0,
                'avg_duration_seconds' => 0
            ];
        }

        return $stats;
    }

    /**
     * Create custom shape (admin function)
     */
    public function createShape($shapeName, $shapeType, $vertices, $difficultyLevel, $colorCode = '#3498db') {
        // Calculate area
        $area = $this->calculatePolygonArea($vertices);

        $sql = "
            INSERT INTO shapes
            (shape_name, shape_type, vertices, original_area, difficulty_level, color_code)
            VALUES (?, ?, ?, ?, ?, ?)
        ";

        return $this->db->insert($sql, [
            $shapeName,
            $shapeType,
            json_encode($vertices),
            $area,
            $difficultyLevel,
            $colorCode
        ]);
    }

    /**
     * Get random shape by difficulty
     */
    public function getRandomShapeByDifficulty($level) {
        $sql = "
            SELECT id, shape_name, shape_type, vertices, original_area,
                   difficulty_level, color_code, created_at
            FROM shapes
            WHERE difficulty_level = ?
            ORDER BY RAND()
            LIMIT 1
        ";

        $shape = $this->db->fetchOne($sql, [$level]);

        if (!$shape) {
            throw new Exception('No shapes found for this difficulty level');
        }

        return $this->parseShape($shape);
    }
}
