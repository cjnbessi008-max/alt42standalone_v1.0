<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace local_dmnrest;

defined('MOODLE_INTERNAL') || die();

/**
 * API client for DMN Rest Routine system
 */
class api_client {

    private $endpoint;
    private $api_key;

    public function __construct() {
        $this->endpoint = get_config('local_dmnrest', 'api_endpoint');
        $this->api_key = get_config('local_dmnrest', 'api_key');
    }

    /**
     * Make HTTP request to API
     * @param string $path API path
     * @param string $method HTTP method
     * @param array|null $data Request data
     * @return object|null Response data or null on error
     */
    private function request($path, $method = 'GET', $data = null) {
        $url = rtrim($this->endpoint, '/') . '/' . ltrim($path, '/');

        $options = [
            'CURLOPT_RETURNTRANSFER' => true,
            'CURLOPT_TIMEOUT' => 10,
            'CURLOPT_HTTPHEADER' => [
                'X-API-Key: ' . $this->api_key,
                'Content-Type: application/json',
            ],
        ];

        if ($method === 'POST' && $data !== null) {
            $options['CURLOPT_POST'] = true;
            $options['CURLOPT_POSTFIELDS'] = json_encode($data);
        }

        try {
            $curl = new \curl();
            $response = $curl->post($url, json_encode($data), $options);

            $result = json_decode($response);

            if ($result === null) {
                debugging('DMN API: Invalid JSON response', DEBUG_DEVELOPER);
                return null;
            }

            return $result;

        } catch (\Exception $e) {
            debugging('DMN API Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return null;
        }
    }

    /**
     * Get routine suggestion from API
     * @param array $context Context data for recommendation
     * @return object|null Routine data or null
     */
    public function get_suggestion($context) {
        return $this->request('suggest', 'POST', $context);
    }

    /**
     * Record routine completion
     * @param string $event_id Event ID from suggestion
     * @param bool $completed Whether routine was completed
     * @param int|null $duration Actual duration in seconds
     * @param int|null $feedback Student feedback 1-5
     * @return object|null Response or null
     */
    public function record_completion($event_id, $completed, $duration = null, $feedback = null) {
        $data = [
            'event_id' => $event_id,
            'completed' => $completed,
        ];

        if ($duration !== null) {
            $data['actual_duration_seconds'] = intval($duration);
        }

        if ($feedback !== null) {
            $data['student_feedback'] = intval($feedback);
        }

        return $this->request('complete', 'POST', $data);
    }

    /**
     * Get available routines
     * @param bool $active_only Only get active routines
     * @return array|null Array of routines or null
     */
    public function get_routines($active_only = true) {
        $path = 'routines' . ($active_only ? '?active_only=true' : '');
        $result = $this->request($path, 'GET');

        if ($result && isset($result->success) && $result->success) {
            return $result->routines;
        }

        return null;
    }

    /**
     * Get analytics data
     * @param array $filters Filter parameters
     * @return object|null Analytics data or null
     */
    public function get_analytics($filters = []) {
        $query = http_build_query($filters);
        $path = 'analytics' . ($query ? '?' . $query : '');

        $result = $this->request($path, 'GET');

        if ($result && isset($result->success) && $result->success) {
            return $result->analytics;
        }

        return null;
    }
}
