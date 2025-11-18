<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProgress extends Model
{
    protected $table = 'student_progress';

    protected $fillable = [
        'student_id',
        'problem_id',
        'concept_id',
        'status',
        'score',
        'max_score',
        'attempts',
        'time_spent',
        'last_attempt_at',
        'completed_at',
    ];

    protected $casts = [
        'score' => 'float',
        'max_score' => 'float',
        'attempts' => 'integer',
        'time_spent' => 'integer',
    ];

    protected $dates = [
        'last_attempt_at',
        'completed_at',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function problem()
    {
        return $this->belongsTo(Problem::class);
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class);
    }

    // Helper methods
    public function isCompleted(): bool
    {
        return $this->status === 'completed' || $this->status === 'mastered';
    }

    public function getPercentage(): float
    {
        if (!$this->max_score || $this->max_score == 0) {
            return 0.0;
        }
        return round(($this->score / $this->max_score) * 100, 2);
    }
}
