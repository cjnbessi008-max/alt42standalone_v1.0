<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Concept;
use App\Models\ConceptKeyword;

class ConceptController
{
    /**
     * GET /api/concepts - Get all concepts (tree structure)
     */
    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $format = $params['format'] ?? 'tree'; // tree or flat
        $subject = $params['subject'] ?? null;

        if ($format === 'tree') {
            $query = Concept::whereNull('parent_id')->where('is_active', true);

            if ($subject) {
                $query->where('subject', $subject);
            }

            $concepts = $query->orderBy('order_index')->get();
            $tree = $concepts->map(fn($c) => $c->toTree());

            $data = [
                'success' => true,
                'data' => $tree,
            ];
        } else {
            // Flat list
            $query = Concept::where('is_active', true);

            if ($subject) {
                $query->where('subject', $subject);
            }

            $concepts = $query->orderBy('level')->orderBy('order_index')->get();

            $data = [
                'success' => true,
                'data' => $concepts->map(function ($concept) {
                    return [
                        'id' => $concept->id,
                        'name' => $concept->name,
                        'name_en' => $concept->name_en,
                        'subject' => $concept->subject,
                        'level' => $concept->level,
                        'parent_id' => $concept->parent_id,
                        'full_path' => $concept->getFullPath(),
                        'has_children' => $concept->hasChildren(),
                    ];
                }),
            ];
        }

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/concepts/{id} - Get concept detail
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $concept = Concept::with(['parent', 'children', 'keywords'])->find($id);

        if (!$concept) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Concept not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $data = [
            'success' => true,
            'data' => [
                'id' => $concept->id,
                'name' => $concept->name,
                'name_en' => $concept->name_en,
                'description' => $concept->description,
                'subject' => $concept->subject,
                'level' => $concept->level,
                'parent_id' => $concept->parent_id,
                'parent' => $concept->parent ? [
                    'id' => $concept->parent->id,
                    'name' => $concept->parent->name,
                ] : null,
                'children' => $concept->children->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'level' => $c->level,
                ]),
                'keywords' => $concept->keywords->map(fn($k) => [
                    'keyword' => $k->keyword,
                    'weight' => $k->weight,
                    'language' => $k->language,
                ]),
                'full_path' => $concept->getFullPath(),
                'ancestors' => $concept->getAncestors()->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                ]),
            ],
        ];

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/concepts - Create new concept
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $concept = Concept::create([
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'name_en' => $data['name_en'] ?? null,
            'description' => $data['description'] ?? null,
            'subject' => $data['subject'],
            'level' => $data['level'] ?? 1,
            'order_index' => $data['order_index'] ?? 0,
        ]);

        // Add keywords if provided
        if (!empty($data['keywords'])) {
            foreach ($data['keywords'] as $keyword) {
                ConceptKeyword::create([
                    'concept_id' => $concept->id,
                    'keyword' => $keyword['keyword'],
                    'weight' => $keyword['weight'] ?? 1.0,
                    'language' => $keyword['language'] ?? 'ko',
                ]);
            }
        }

        $responseData = [
            'success' => true,
            'message' => 'Concept created successfully',
            'data' => $concept,
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/concepts/{id} - Update concept
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $concept = Concept::find($id);

        if (!$concept) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Concept not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $data = $request->getParsedBody();
        $concept->update($data);

        $responseData = [
            'success' => true,
            'message' => 'Concept updated successfully',
            'data' => $concept,
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/concepts/{id} - Delete concept
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $concept = Concept::find($id);

        if (!$concept) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Concept not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Soft delete by setting is_active to false
        $concept->update(['is_active' => false]);

        $responseData = [
            'success' => true,
            'message' => 'Concept deleted successfully',
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/concepts/search - Search concepts by keyword
     */
    public function search(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $keyword = $params['q'] ?? '';
        $subject = $params['subject'] ?? null;

        $query = Concept::where('is_active', true)
            ->where(function ($q) use ($keyword) {
                $q->where('name', 'LIKE', "%{$keyword}%")
                  ->orWhere('name_en', 'LIKE', "%{$keyword}%")
                  ->orWhere('description', 'LIKE', "%{$keyword}%");
            });

        if ($subject) {
            $query->where('subject', $subject);
        }

        $concepts = $query->limit(20)->get();

        $data = [
            'success' => true,
            'data' => $concepts->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'full_path' => $c->getFullPath(),
                'subject' => $c->subject,
                'level' => $c->level,
            ]),
        ];

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
