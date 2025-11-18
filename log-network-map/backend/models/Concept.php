<?php
/**
 * Concept Model
 * Handles educational concept data and relationships
 */

class Concept {
    private $conn;
    private $table_name = "concepts";

    public $id;
    public $name;
    public $description;
    public $category;
    public $difficulty_level;
    public $color;
    public $icon;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all concepts
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get concept by ID
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get concepts by category
     */
    public function getByCategory($category) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE category = ? ORDER BY difficulty_level, name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $category);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get all relationships for network visualization
     */
    public function getAllRelationships() {
        $query = "SELECT cr.*,
                         c1.name as source_name, c1.color as source_color,
                         c2.name as target_name, c2.color as target_color
                  FROM concept_relationships cr
                  JOIN concepts c1 ON cr.source_concept_id = c1.id
                  JOIN concepts c2 ON cr.target_concept_id = c2.id
                  ORDER BY cr.strength DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get relationships for a specific concept
     */
    public function getRelationshipsById($concept_id) {
        $query = "SELECT cr.*,
                         c1.name as source_name, c2.name as target_name
                  FROM concept_relationships cr
                  JOIN concepts c1 ON cr.source_concept_id = c1.id
                  JOIN concepts c2 ON cr.target_concept_id = c2.id
                  WHERE cr.source_concept_id = ? OR cr.target_concept_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $concept_id);
        $stmt->bindParam(2, $concept_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Create new concept
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET name = :name,
                      description = :description,
                      category = :category,
                      difficulty_level = :difficulty_level,
                      color = :color,
                      icon = :icon";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->difficulty_level = htmlspecialchars(strip_tags($this->difficulty_level));
        $this->color = htmlspecialchars(strip_tags($this->color));
        $this->icon = htmlspecialchars(strip_tags($this->icon));

        // Bind values
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":difficulty_level", $this->difficulty_level);
        $stmt->bindParam(":color", $this->color);
        $stmt->bindParam(":icon", $this->icon);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Create relationship between concepts
     */
    public function createRelationship($source_id, $target_id, $type = 'related', $strength = 1.0, $description = '') {
        $query = "INSERT INTO concept_relationships
                  SET source_concept_id = :source_id,
                      target_concept_id = :target_id,
                      relationship_type = :type,
                      strength = :strength,
                      description = :description";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":source_id", $source_id);
        $stmt->bindParam(":target_id", $target_id);
        $stmt->bindParam(":type", $type);
        $stmt->bindParam(":strength", $strength);
        $stmt->bindParam(":description", $description);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }
}
