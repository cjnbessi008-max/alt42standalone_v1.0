<?php
/**
 * Simple PSR-4 Compatible Autoloader
 *
 * PHP 7.1.9 compatible autoloader for MoodleIntegration namespace
 */

spl_autoload_register(function ($class) {
    // Project namespace prefix
    $prefix = 'MoodleIntegration\\';

    // Base directory for the namespace prefix
    $baseDir = __DIR__ . '/';

    // Check if the class uses the namespace prefix
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // No, move to the next registered autoloader
        return;
    }

    // Get the relative class name
    $relativeClass = substr($class, $len);

    // Replace namespace separators with directory separators
    // and append .php
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});
