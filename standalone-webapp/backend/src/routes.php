<?php

use DualDance\Controllers\AuthController;
use DualDance\Controllers\ProblemController;
use DualDance\Controllers\AttemptController;
use DualDance\Controllers\StatsController;

return function ($app, $middleware) {
    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'healthy', 'timestamp' => time()]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // API routes
    $app->group('/api', function () use ($app, $middleware) {
        // Authentication routes (public)
        $app->group('/auth', function () use ($app) {
            $auth = new AuthController();

            $app->post('/register', [$auth, 'register']);
            $app->post('/login', [$auth, 'login']);
            $app->post('/logout', [$auth, 'logout']);
        });

        // Protected routes (require authentication)
        $app->group('', function () use ($app) {
            $auth = new AuthController();
            $problem = new ProblemController();
            $attempt = new AttemptController();
            $stats = new StatsController();

            // Auth
            $app->get('/auth/me', [$auth, 'me']);

            // Problems
            $app->post('/problems/generate', [$problem, 'generate']);
            $app->get('/problems/{id}', [$problem, 'get']);
            $app->get('/problems', [$problem, 'list']);

            // Attempts
            $app->post('/attempts', [$attempt, 'submit']);
            $app->get('/attempts', [$attempt, 'list']);
            $app->get('/attempts/{id}', [$attempt, 'get']);

            // Statistics
            $app->get('/stats/user', [$stats, 'userStats']);
            $app->get('/stats/leaderboard', [$stats, 'leaderboard']);
            $app->get('/stats/activity', [$stats, 'recentActivity']);

        })->add($middleware['auth']);

    })->add($middleware['jsonBodyParser']);

    // 404 handler
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        $response->getBody()->write(json_encode(['error' => 'Not Found']));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(404);
    });
};
