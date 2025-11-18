<?php
/**
 * Simple Router Class
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

class Router {
    private $routes = [];
    private $middleware = [];

    /**
     * Add GET route
     */
    public function get($path, $handler, $middleware = []) {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    /**
     * Add POST route
     */
    public function post($path, $handler, $middleware = []) {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    /**
     * Add route
     */
    private function addRoute($method, $path, $handler, $middleware = []) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    /**
     * Add global middleware
     */
    public function addMiddleware($middleware) {
        $this->middleware[] = $middleware;
    }

    /**
     * Dispatch request
     */
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getCurrentPath();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = $this->convertPathToRegex($route['path']);

            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches); // Remove full match

                // Run global middleware
                foreach ($this->middleware as $mw) {
                    $result = $this->callMiddleware($mw);
                    if ($result === false) {
                        return;
                    }
                }

                // Run route-specific middleware
                foreach ($route['middleware'] as $mw) {
                    $result = $this->callMiddleware($mw);
                    if ($result === false) {
                        return;
                    }
                }

                // Call handler
                $this->callHandler($route['handler'], $matches);
                return;
            }
        }

        // No route found - 404
        $this->notFound();
    }

    /**
     * Get current path
     */
    private function getCurrentPath() {
        $path = $_SERVER['REQUEST_URI'] ?? '/';

        // Remove query string
        if (($pos = strpos($path, '?')) !== false) {
            $path = substr($path, 0, $pos);
        }

        return $path;
    }

    /**
     * Convert path pattern to regex
     */
    private function convertPathToRegex($path) {
        // Escape forward slashes
        $pattern = str_replace('/', '\/', $path);

        // Convert :param to named capture group
        $pattern = preg_replace('/:(\w+)/', '(?P<$1>[^\/]+)', $pattern);

        return '/^' . $pattern . '$/';
    }

    /**
     * Call middleware
     */
    private function callMiddleware($middleware) {
        if (is_callable($middleware)) {
            return call_user_func($middleware);
        }

        if (is_string($middleware) && class_exists($middleware)) {
            $instance = new $middleware();
            if (method_exists($instance, 'handle')) {
                return $instance->handle();
            }
        }

        return true;
    }

    /**
     * Call handler
     */
    private function callHandler($handler, $params = []) {
        if (is_callable($handler)) {
            call_user_func_array($handler, $params);
            return;
        }

        if (is_string($handler)) {
            $parts = explode('@', $handler);

            if (count($parts) === 2) {
                list($controllerName, $method) = $parts;

                if (class_exists($controllerName)) {
                    $controller = new $controllerName();

                    if (method_exists($controller, $method)) {
                        call_user_func_array([$controller, $method], $params);
                        return;
                    }
                }
            }
        }

        $this->notFound();
    }

    /**
     * 404 Not Found
     */
    private function notFound() {
        http_response_code(404);
        View::render('errors/404', [
            'title' => '404 Not Found',
            'message' => 'The page you are looking for could not be found.'
        ]);
    }

    /**
     * Redirect
     */
    public static function redirect($path, $statusCode = 302) {
        header("Location: " . BASE_URL . $path, true, $statusCode);
        exit;
    }

    /**
     * Get URL for named route
     */
    public static function url($path) {
        return BASE_URL . $path;
    }
}
