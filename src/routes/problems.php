<?php

use App\Controllers\ProblemController;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api/problems', function (RouteCollectorProxy $group) {
    $controller = new ProblemController();

    $group->get('', [$controller, 'index']);
    $group->get('/{id}', [$controller, 'show']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
    $group->delete('/{id}', [$controller, 'delete']);

    // Concept mapping endpoints
    $group->post('/{id}/concepts', [$controller, 'attachConcept']);
    $group->delete('/{id}/concepts/{conceptId}', [$controller, 'detachConcept']);
    $group->put('/{id}/concepts/{conceptId}/confirm', [$controller, 'confirmConcept']);
});
