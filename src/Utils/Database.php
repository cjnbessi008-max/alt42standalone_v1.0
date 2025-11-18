<?php

namespace App\Utils;

use Illuminate\Database\Capsule\Manager as Capsule;

class Database
{
    private static $capsule;

    public static function init()
    {
        if (self::$capsule !== null) {
            return self::$capsule;
        }

        $config = require __DIR__ . '/../../config/database.php';

        self::$capsule = new Capsule;

        self::$capsule->addConnection([
            'driver' => $config['driver'],
            'host' => $config['host'],
            'port' => $config['port'],
            'database' => $config['database'],
            'username' => $config['username'],
            'password' => $config['password'],
            'charset' => $config['charset'],
            'collation' => $config['collation'],
            'prefix' => $config['prefix'],
            'options' => $config['options'],
        ]);

        self::$capsule->setAsGlobal();
        self::$capsule->bootEloquent();

        return self::$capsule;
    }

    public static function getConnection()
    {
        if (self::$capsule === null) {
            self::init();
        }
        return self::$capsule->getConnection();
    }
}
