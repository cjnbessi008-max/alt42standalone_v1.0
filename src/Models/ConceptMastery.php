<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConceptMastery extends Model
{
    protected $table = 'concept_mastery';

    protected $fillable = [
        'student_id',
        'concept_id',
        'mastery_level',
        'problems_attempted',
        'problems_correct',
        'last_practiced_at',
    ];

    protected $casts = [
        'mastery_level' => 'float',
        'problems_attempted' => 'integer',
        'problems_correct' => 'integer',
    ];

    protected $dates = [
        'last_practiced_at',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class);
    }

    // Helper methods
    public function getAccuracyRate(): float
    {
        if ($this->problems_attempted == 0) {
            return 0.0;
        }
        return round(($this->problems_correct / $this->problems_attempted) * 100, 2);
    }

    public function isMastered(): bool
    {
        return $this->mastery_level >= 80.0;
    }

    public function getMasteryLabel(): string
    {
        if ($this->mastery_level >= 80) return 'Mastered';
        if ($this->mastery_level >= 60) return 'Proficient';
        if ($this->mastery_level >= 40) return 'Developing';
        if ($this->mastery_level >= 20) return 'Beginning';
        return 'Not Started';
    }
}
