<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Problem extends Model
{
    protected $table = 'problems';

    protected $fillable = [
        'title',
        'content',
        'solution',
        'difficulty',
        'subject',
        'grade_level',
        'points',
        'time_limit',
        'problem_type',
        'metadata',
        'created_by',
        'is_active',
        'view_count',
    ];

    protected $casts = [
        'grade_level' => 'integer',
        'points' => 'float',
        'time_limit' => 'integer',
        'is_active' => 'boolean',
        'view_count' => 'integer',
        'metadata' => 'array',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function concepts()
    {
        return $this->belongsToMany(
            Concept::class,
            'problem_concepts',
            'problem_id',
            'concept_id'
        )->withPivot([
            'is_primary',
            'confidence_score',
            'is_ai_suggested',
            'confirmed_by_teacher',
            'confirmed_at',
            'confirmed_by'
        ])->withTimestamps();
    }

    public function primaryConcepts()
    {
        return $this->concepts()->wherePivot('is_primary', true);
    }

    public function aiSuggestedConcepts()
    {
        return $this->concepts()->wherePivot('is_ai_suggested', true);
    }

    public function confirmedConcepts()
    {
        return $this->concepts()->wherePivot('confirmed_by_teacher', true);
    }

    public function progress()
    {
        return $this->hasMany(StudentProgress::class);
    }

    // Helper methods
    public function incrementViewCount()
    {
        $this->increment('view_count');
    }

    public function getCombinedText(): string
    {
        return $this->title . ' ' . $this->content;
    }

    // Attach concept with AI suggestion
    public function attachConceptWithAI(int $conceptId, float $confidence, bool $isPrimary = false)
    {
        return $this->concepts()->attach($conceptId, [
            'is_primary' => $isPrimary,
            'confidence_score' => $confidence,
            'is_ai_suggested' => true,
            'confirmed_by_teacher' => false,
        ]);
    }

    // Confirm AI suggested concept
    public function confirmConcept(int $conceptId, int $teacherId)
    {
        return $this->concepts()->updateExistingPivot($conceptId, [
            'confirmed_by_teacher' => true,
            'confirmed_by' => $teacherId,
            'confirmed_at' => now(),
        ]);
    }
}
