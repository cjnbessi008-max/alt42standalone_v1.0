<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'role',
        'full_name',
        'moodle_user_id',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function problems()
    {
        return $this->hasMany(Problem::class, 'created_by');
    }

    public function progress()
    {
        return $this->hasMany(StudentProgress::class, 'student_id');
    }

    public function conceptMastery()
    {
        return $this->hasMany(ConceptMastery::class, 'student_id');
    }

    // Helper methods
    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password_hash);
    }
}
