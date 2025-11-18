<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Concept extends Model
{
    protected $table = 'concepts';

    protected $fillable = [
        'parent_id',
        'name',
        'name_en',
        'description',
        'subject',
        'level',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'level' => 'integer',
        'order_index' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function parent()
    {
        return $this->belongsTo(Concept::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Concept::class, 'parent_id')->orderBy('order_index');
    }

    public function keywords()
    {
        return $this->hasMany(ConceptKeyword::class);
    }

    public function problems()
    {
        return $this->belongsToMany(
            Problem::class,
            'problem_concepts',
            'concept_id',
            'problem_id'
        )->withPivot(['is_primary', 'confidence_score', 'is_ai_suggested', 'confirmed_by_teacher']);
    }

    // Recursive: Get all descendants
    public function getAllDescendants()
    {
        $descendants = collect();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }

        return $descendants;
    }

    // Get ancestors (path to root)
    public function getAncestors()
    {
        $ancestors = collect();
        $parent = $this->parent;

        while ($parent) {
            $ancestors->prepend($parent);
            $parent = $parent->parent;
        }

        return $ancestors;
    }

    // Get full path as string
    public function getFullPath(): string
    {
        $ancestors = $this->getAncestors();
        $path = $ancestors->pluck('name')->implode(' > ');

        return $path ? $path . ' > ' . $this->name : $this->name;
    }

    // Check if this concept is root
    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    // Check if this concept has children
    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    // Get tree structure (with children)
    public function toTree()
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'name_en' => $this->name_en,
            'description' => $this->description,
            'subject' => $this->subject,
            'level' => $this->level,
            'order_index' => $this->order_index,
            'children' => $this->children->map(function ($child) {
                return $child->toTree();
            }),
        ];
    }

    // Static method: Get root concepts
    public static function getRoots()
    {
        return self::whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get();
    }

    // Static method: Get all as tree
    public static function getTree()
    {
        $roots = self::getRoots();

        return $roots->map(function ($root) {
            return $root->toTree();
        });
    }
}
