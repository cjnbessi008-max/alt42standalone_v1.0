<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Problem;
use App\Models\Concept;

class ProblemController
{
    /**
     * GET /api/problems - Get all problems
     */
    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = min((int)($params['limit'] ?? 20), 100);
        $subject = $params['subject'] ?? null;
        $difficulty = $params['difficulty'] ?? null;

        $query = Problem::with(['creator', 'concepts'])->where('is_active', true);

        if ($subject) {
            $query->where('subject', $subject);
        }

        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        $total = $query->count();
        $problems = $query->skip(($page - 1) * $limit)->take($limit)->get();

        $data = [
            'success' => true,
            'data' => $problems->map(function ($problem) {
                return [
                    'id' => $problem->id,
                    'title' => $problem->title,
                    'content' => $problem->content,
                    'difficulty' => $problem->difficulty,
                    'subject' => $problem->subject,
                    'points' => $problem->points,
                    'created_by' => $problem->creator->full_name ?? 'Unknown',
                    'concepts' => $problem->concepts->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'is_primary' => $c->pivot->is_primary,
                        'is_ai_suggested' => $c->pivot->is_ai_suggested,
                        'confirmed' => $c->pivot->confirmed_by_teacher,
                        'confidence_score' => $c->pivot->confidence_score,
                    ]),
                    'created_at' => $problem->created_at->toIso8601String(),
                ];
            }),
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit),
            ],
        ];

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/problems/{id} - Get problem detail
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $problem = Problem::with(['creator', 'concepts'])->find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Increment view count
        $problem->incrementViewCount();

        $data = [
            'success' => true,
            'data' => [
                'id' => $problem->id,
                'title' => $problem->title,
                'content' => $problem->content,
                'solution' => $problem->solution,
                'difficulty' => $problem->difficulty,
                'subject' => $problem->subject,
                'grade_level' => $problem->grade_level,
                'points' => $problem->points,
                'time_limit' => $problem->time_limit,
                'problem_type' => $problem->problem_type,
                'metadata' => $problem->metadata,
                'view_count' => $problem->view_count,
                'created_by' => [
                    'id' => $problem->creator->id,
                    'name' => $problem->creator->full_name,
                ],
                'concepts' => $problem->concepts->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'full_path' => $c->getFullPath(),
                    'is_primary' => $c->pivot->is_primary,
                    'is_ai_suggested' => $c->pivot->is_ai_suggested,
                    'confirmed_by_teacher' => $c->pivot->confirmed_by_teacher,
                    'confidence_score' => $c->pivot->confidence_score,
                    'confirmed_at' => $c->pivot->confirmed_at,
                ]),
                'created_at' => $problem->created_at->toIso8601String(),
                'updated_at' => $problem->updated_at->toIso8601String(),
            ],
        ];

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/problems - Create new problem
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $problem = Problem::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'solution' => $data['solution'] ?? null,
            'difficulty' => $data['difficulty'] ?? 'medium',
            'subject' => $data['subject'],
            'grade_level' => $data['grade_level'] ?? null,
            'points' => $data['points'] ?? 10.0,
            'time_limit' => $data['time_limit'] ?? null,
            'problem_type' => $data['problem_type'] ?? 'multiple_choice',
            'metadata' => $data['metadata'] ?? null,
            'created_by' => $data['created_by'] ?? 1, // TODO: Get from JWT token
        ]);

        // Attach concepts if provided
        if (!empty($data['concepts'])) {
            foreach ($data['concepts'] as $conceptData) {
                $problem->concepts()->attach($conceptData['concept_id'], [
                    'is_primary' => $conceptData['is_primary'] ?? false,
                    'confidence_score' => $conceptData['confidence_score'] ?? 1.0,
                    'is_ai_suggested' => $conceptData['is_ai_suggested'] ?? false,
                    'confirmed_by_teacher' => $conceptData['confirmed_by_teacher'] ?? true,
                ]);
            }
        }

        $responseData = [
            'success' => true,
            'message' => 'Problem created successfully',
            'data' => $problem->load('concepts'),
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/problems/{id} - Update problem
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $data = $request->getParsedBody();
        $problem->update($data);

        $responseData = [
            'success' => true,
            'message' => 'Problem updated successfully',
            'data' => $problem,
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/problems/{id} - Delete problem
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $problem->update(['is_active' => false]);

        $responseData = [
            'success' => true,
            'message' => 'Problem deleted successfully',
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/problems/{id}/concepts - Attach concept to problem
     */
    public function attachConcept(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $data = $request->getParsedBody();
        $conceptId = $data['concept_id'];

        // Check if concept exists
        if (!Concept::find($conceptId)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Concept not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Attach or update
        $problem->concepts()->syncWithoutDetaching([
            $conceptId => [
                'is_primary' => $data['is_primary'] ?? false,
                'confidence_score' => $data['confidence_score'] ?? 1.0,
                'is_ai_suggested' => $data['is_ai_suggested'] ?? false,
                'confirmed_by_teacher' => $data['confirmed_by_teacher'] ?? true,
            ]
        ]);

        $responseData = [
            'success' => true,
            'message' => 'Concept attached successfully',
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/problems/{id}/concepts/{conceptId} - Detach concept from problem
     */
    public function detachConcept(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $conceptId = (int)$args['conceptId'];

        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $problem->concepts()->detach($conceptId);

        $responseData = [
            'success' => true,
            'message' => 'Concept detached successfully',
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/problems/{id}/concepts/{conceptId}/confirm - Confirm AI suggested concept
     */
    public function confirmConcept(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $conceptId = (int)$args['conceptId'];

        $problem = Problem::find($id);

        if (!$problem) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Problem not found',
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $teacherId = 1; // TODO: Get from JWT token

        $problem->confirmConcept($conceptId, $teacherId);

        $responseData = [
            'success' => true,
            'message' => 'Concept confirmed successfully',
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
