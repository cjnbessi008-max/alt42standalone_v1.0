<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\LTIService;
use App\Utils\JWTHelper;

class LTIController
{
    private $ltiService;

    public function __construct()
    {
        $this->ltiService = new LTIService();
    }

    /**
     * POST /lti/launch - LTI launch endpoint
     */
    public function launch(Request $request, Response $response): Response
    {
        $params = $request->getParsedBody();

        // Validate LTI request
        if (!$this->ltiService->validateLaunchRequest($params)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Invalid LTI launch request',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Handle launch and create/update user
            $sessionData = $this->ltiService->handleLaunch($params);

            $user = $sessionData['user'];

            // Generate JWT token for the session
            $token = JWTHelper::createUserToken($user->id, $user->role);

            // Return token and redirect URL
            $redirectUrl = $_ENV['APP_URL'] . '/dashboard?token=' . $token;

            // For POST response, return HTML that redirects
            $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Launching...</title>
</head>
<body>
    <p>Launching LMS Concept System...</p>
    <script>
        window.location.href = '{$redirectUrl}';
    </script>
</body>
</html>
HTML;

            $response->getBody()->write($html);
            return $response->withHeader('Content-Type', 'text/html');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'LTI launch failed: ' . $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * GET /lti/config - Get LTI tool configuration
     */
    public function config(Request $request, Response $response): Response
    {
        $config = $this->ltiService->getToolConfiguration();

        $response->getBody()->write(json_encode($config, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /lti/grade-passback - Send grade back to Moodle
     */
    public function gradePassback(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $sourcedId = $data['sourced_id'] ?? '';
        $score = (float)($data['score'] ?? 0);
        $maxScore = (float)($data['max_score'] ?? 100);

        if (empty($sourcedId)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'sourced_id is required',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $success = $this->ltiService->sendGradePassback($sourcedId, $score, $maxScore);

            $responseData = [
                'success' => $success,
                'message' => $success ? 'Grade sent successfully' : 'Failed to send grade',
            ];

            $response->getBody()->write(json_encode($responseData));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Grade passback failed: ' . $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
