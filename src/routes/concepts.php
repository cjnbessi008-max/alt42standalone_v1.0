<?php

use App\Controllers\ConceptController;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api/concepts', function (RouteCollectorProxy $group) {
    $controller = new ConceptController();

    $group->get('', [$controller, 'index']);
    $group->get('/search', [$controller, 'search']);
    $group->get('/{id}', [$controller, 'show']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
    $group->delete('/{id}', [$controller, 'delete']);
});
