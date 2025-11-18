<?php

namespace App\Models;

use App\Database;
use PDO;

class User
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $data): ?int
    {
        $sql = "INSERT INTO users (email, password, name, role, grade_level, institution)
                VALUES (:email, :password, :name, :role, :grade_level, :institution)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':email' => $data['email'],
            ':password' => password_hash($data['password'], PASSWORD_DEFAULT),
            ':name' => $data['name'],
            ':role' => $data['role'] ?? 'student',
            ':grade_level' => $data['grade_level'] ?? null,
            ':institution' => $data['institution'] ?? null
        ]);

        return $this->db->lastInsertId() ?: null;
    }

    public function findByEmail(string $email): ?object
    {
        $sql = "SELECT * FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function findById(int $id): ?object
    {
        $sql = "SELECT id, email, name, role, grade_level, institution, avatar_url, is_active, created_at
                FROM users WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = [':id' => $id];

        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'grade_level', 'institution', 'avatar_url'])) {
                $fields[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function getEnrolledCourses(int $studentId): array
    {
        $sql = "SELECT c.*, u.name as teacher_name
                FROM courses c
                JOIN course_enrollments ce ON c.id = ce.course_id
                JOIN users u ON c.teacher_id = u.id
                WHERE ce.student_id = :student_id AND c.is_active = 1
                ORDER BY c.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':student_id' => $studentId]);
        return $stmt->fetchAll();
    }

    public function getTaughtCourses(int $teacherId): array
    {
        $sql = "SELECT c.*,
                (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
                FROM courses c
                WHERE c.teacher_id = :teacher_id
                ORDER BY c.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':teacher_id' => $teacherId]);
        return $stmt->fetchAll();
    }
}
