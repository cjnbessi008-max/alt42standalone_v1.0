<?php

use App\Controllers\AuthController;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api/auth', function (RouteCollectorProxy $group) {
    $controller = new AuthController();

    $group->post('/register', [$controller, 'register']);
    $group->post('/login', [$controller, 'login']);
    $group->get('/me', [$controller, 'me']);
});
