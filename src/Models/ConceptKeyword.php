<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConceptKeyword extends Model
{
    protected $table = 'concept_keywords';

    protected $fillable = [
        'concept_id',
        'keyword',
        'weight',
        'language',
    ];

    protected $casts = [
        'weight' => 'float',
    ];

    public $timestamps = false;

    protected $dates = ['created_at'];

    // Relationships
    public function concept()
    {
        return $this->belongsTo(Concept::class);
    }
}
