<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTHelper
{
    private static function getConfig()
    {
        $config = require __DIR__ . '/../../config/app.php';
        return $config['jwt'];
    }

    public static function encode(array $payload): string
    {
        $config = self::getConfig();

        $issuedAt = time();
        $expire = $issuedAt + $config['expiration'];

        $tokenPayload = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $expire,
        ]);

        return JWT::encode($tokenPayload, $config['secret'], $config['algorithm']);
    }

    public static function decode(string $token): object
    {
        $config = self::getConfig();

        try {
            return JWT::decode($token, new Key($config['secret'], $config['algorithm']));
        } catch (Exception $e) {
            throw new Exception('Invalid token: ' . $e->getMessage());
        }
    }

    public static function getUserIdFromToken(string $token): ?int
    {
        try {
            $decoded = self::decode($token);
            return $decoded->user_id ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function createUserToken(int $userId, string $role): string
    {
        return self::encode([
            'user_id' => $userId,
            'role' => $role,
        ]);
    }
}
