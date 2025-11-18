<?php
/**
 * Shape Model
 * Handles shape types, properties, and animations
 */

require_once __DIR__ . '/../config/database.php';

class ShapeModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all shape types
     */
    public function getAllShapes($category = null) {
        $sql = "SELECT * FROM shape_types";
        $params = [];

        if ($category) {
            $sql .= " WHERE category = :category";
            $params['category'] = $category;
        }

        $sql .= " ORDER BY id";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get shape by ID
     */
    public function getShapeById($shapeId) {
        $sql = "SELECT * FROM shape_types WHERE id = :id";
        return $this->db->fetchOne($sql, ['id' => $shapeId]);
    }

    /**
     * Get shape properties
     */
    public function getShapeProperties($shapeId) {
        $sql = "
            SELECT * FROM shape_properties
            WHERE shape_type_id = :shape_id
            ORDER BY display_order, id
        ";

        return $this->db->fetchAll($sql, ['shape_id' => $shapeId]);
    }

    /**
     * Get animation steps for a shape
     */
    public function getAnimationSteps($shapeId) {
        $sql = "
            SELECT * FROM animation_steps
            WHERE shape_type_id = :shape_id
            ORDER BY step_number
        ";

        return $this->db->fetchAll($sql, ['shape_id' => $shapeId]);
    }

    /**
     * Get complete shape data (shape + properties + animations)
     */
    public function getCompleteShapeData($shapeId) {
        $shape = $this->getShapeById($shapeId);

        if (!$shape) {
            return null;
        }

        $shape['properties'] = $this->getShapeProperties($shapeId);
        $shape['animation_steps'] = $this->getAnimationSteps($shapeId);

        return $shape;
    }

    /**
     * Create new shape type
     */
    public function createShape($data) {
        $requiredFields = ['name_ko', 'name_en', 'category'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("필수 필드가 누락되었습니다: {$field}");
            }
        }

        return $this->db->insert('shape_types', $data);
    }

    /**
     * Add property to shape
     */
    public function addProperty($shapeId, $propertyData) {
        $propertyData['shape_type_id'] = $shapeId;
        return $this->db->insert('shape_properties', $propertyData);
    }

    /**
     * Add animation step
     */
    public function addAnimationStep($shapeId, $stepData) {
        $stepData['shape_type_id'] = $shapeId;

        // Convert step_config array to JSON if needed
        if (isset($stepData['step_config']) && is_array($stepData['step_config'])) {
            $stepData['step_config'] = json_encode($stepData['step_config']);
        }

        return $this->db->insert('animation_steps', $stepData);
    }

    /**
     * Update shape
     */
    public function updateShape($shapeId, $data) {
        return $this->db->update(
            'shape_types',
            $data,
            'id = :id',
            ['id' => $shapeId]
        );
    }

    /**
     * Delete shape (cascades to properties and animations)
     */
    public function deleteShape($shapeId) {
        return $this->db->delete('shape_types', 'id = :id', ['id' => $shapeId]);
    }

    /**
     * Search shapes by name
     */
    public function searchShapes($query, $language = 'ko') {
        $field = $language === 'en' ? 'name_en' : 'name_ko';

        $sql = "
            SELECT * FROM shape_types
            WHERE {$field} LIKE :query
            ORDER BY {$field}
        ";

        return $this->db->fetchAll($sql, ['query' => "%{$query}%"]);
    }
}
