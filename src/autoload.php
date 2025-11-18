<?php
/**
 * Simple Autoloader for PHP 7.1
 */

spl_autoload_register(function ($class) {
    $paths = [
        SRC_PATH . '/lib/',
        SRC_PATH . '/models/',
        SRC_PATH . '/controllers/'
    ];

    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});
