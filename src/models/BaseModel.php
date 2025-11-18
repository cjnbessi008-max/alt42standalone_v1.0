<?php
/**
 * Base Model Class
 * Provides common database operations
 */

require_once __DIR__ . '/../../config/database.php';

abstract class BaseModel {
    protected $db;
    protected $table;
    protected $primaryKey = 'id';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Find record by ID
     */
    public function find($id) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get all records
     */
    public function all($limit = null, $offset = 0) {
        $sql = "SELECT * FROM {$this->table}";
        if ($limit) {
            $sql .= " LIMIT ? OFFSET ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$limit, $offset]);
        } else {
            $stmt = $this->db->query($sql);
        }
        return $stmt->fetchAll();
    }

    /**
     * Create new record
     */
    public function create(array $data) {
        $fields = array_keys($data);
        $placeholders = array_fill(0, count($fields), '?');

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $this->table,
            implode(', ', $fields),
            implode(', ', $placeholders)
        );

        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($data));

        return $this->db->lastInsertId();
    }

    /**
     * Update record
     */
    public function update($id, array $data) {
        $fields = array_map(function($field) {
            return "$field = ?";
        }, array_keys($data));

        $sql = sprintf(
            "UPDATE %s SET %s WHERE %s = ?",
            $this->table,
            implode(', ', $fields),
            $this->primaryKey
        );

        $values = array_values($data);
        $values[] = $id;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }

    /**
     * Delete record
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Find records by criteria
     */
    public function where(array $criteria, $limit = null) {
        $conditions = array_map(function($field) {
            return "$field = ?";
        }, array_keys($criteria));

        $sql = sprintf(
            "SELECT * FROM %s WHERE %s",
            $this->table,
            implode(' AND ', $conditions)
        );

        if ($limit) {
            $sql .= " LIMIT ?";
            $values = array_values($criteria);
            $values[] = $limit;
        } else {
            $values = array_values($criteria);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);

        return $limit === 1 ? $stmt->fetch() : $stmt->fetchAll();
    }

    /**
     * Count records
     */
    public function count(array $criteria = []) {
        if (empty($criteria)) {
            $sql = "SELECT COUNT(*) as count FROM {$this->table}";
            $stmt = $this->db->query($sql);
        } else {
            $conditions = array_map(function($field) {
                return "$field = ?";
            }, array_keys($criteria));

            $sql = sprintf(
                "SELECT COUNT(*) as count FROM %s WHERE %s",
                $this->table,
                implode(' AND ', $conditions)
            );

            $stmt = $this->db->prepare($sql);
            $stmt->execute(array_values($criteria));
        }

        $result = $stmt->fetch();
        return (int)$result['count'];
    }

    /**
     * Execute custom query
     */
    protected function query($sql, array $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
