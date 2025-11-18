<?php
/**
 * API Endpoint
 * AJAX 요청을 처리하는 진입점
 */

require_once __DIR__ . '/../app/config/config.php';

// API 컨트롤러 인스턴스 생성 및 요청 처리
$controller = new ApiController();
$controller->handleRequest();
