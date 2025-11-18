<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProblemConcept extends Model
{
    protected $table = 'problem_concepts';

    protected $fillable = [
        'problem_id',
        'concept_id',
        'is_primary',
        'confidence_score',
        'is_ai_suggested',
        'confirmed_by_teacher',
        'confirmed_at',
        'confirmed_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'confidence_score' => 'float',
        'is_ai_suggested' => 'boolean',
        'confirmed_by_teacher' => 'boolean',
    ];

    protected $dates = [
        'confirmed_at',
        'created_at',
    ];

    public $timestamps = false;

    // Relationships
    public function problem()
    {
        return $this->belongsTo(Problem::class);
    }

    public function concept()
    {
        return $this->belongsTo(Concept::class);
    }

    public function confirmedByUser()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
