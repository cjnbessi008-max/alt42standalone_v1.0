<?php

namespace DualDance\Utils;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;

/**
 * JWT utility class for authentication
 */
class JWT
{
    private static $secret;
    private static $algorithm = 'HS256';
    private static $expiration = 86400; // 24 hours

    /**
     * Initialize JWT secret
     */
    public static function init()
    {
        self::$secret = getenv('JWT_SECRET') ?: 'default-secret-change-this';
        self::$expiration = (int)(getenv('JWT_EXPIRATION') ?: 86400);
    }

    /**
     * Generate JWT token
     */
    public static function encode(array $payload): string
    {
        if (!self::$secret) {
            self::init();
        }

        $issuedAt = time();
        $expire = $issuedAt + self::$expiration;

        $token = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'data' => $payload
        ];

        return FirebaseJWT::encode($token, self::$secret, self::$algorithm);
    }

    /**
     * Decode JWT token
     */
    public static function decode(string $token): ?object
    {
        if (!self::$secret) {
            self::init();
        }

        try {
            $decoded = FirebaseJWT::decode($token, new Key(self::$secret, self::$algorithm));
            return $decoded->data ?? null;
        } catch (\Exception $e) {
            error_log("JWT decode error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate JWT token
     */
    public static function validate(string $token): bool
    {
        return self::decode($token) !== null;
    }

    /**
     * Extract user ID from token
     */
    public static function getUserId(string $token): ?int
    {
        $decoded = self::decode($token);
        return $decoded->user_id ?? null;
    }

    /**
     * Extract token from Authorization header
     */
    public static function extractFromHeader(?string $authHeader): ?string
    {
        if (!$authHeader) {
            return null;
        }

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
