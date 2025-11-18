<?php

use App\Controllers\AIController;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api/ai', function (RouteCollectorProxy $group) {
    $controller = new AIController();

    // Analyze problem text
    $group->post('/analyze', [$controller, 'analyze']);

    // Suggest concepts for existing problem
    $group->post('/suggest-for-problem/{id}', [$controller, 'suggestForProblem']);

    // Batch analyze multiple problems
    $group->post('/batch-analyze', [$controller, 'batchAnalyze']);
});
