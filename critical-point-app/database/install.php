<?php
/**
 * Database Installation Script
 * Run this script once to set up the database tables
 */

// Check if running from command line or web
$isCLI = (php_sapi_name() === 'cli');

if (!$isCLI) {
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    echo "<title>Database Installation</title>";
    echo "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:50px auto;padding:20px;}";
    echo ".success{color:green;} .error{color:red;} .info{color:blue;}</style></head><body>";
    echo "<h1>Critical Point App - Database Installation</h1>";
}

require_once __DIR__ . '/../api/config.php';

function output($message, $type = 'info') {
    global $isCLI;

    if ($isCLI) {
        echo "[$type] $message\n";
    } else {
        echo "<p class='$type'>$message</p>";
    }
}

try {
    output("Starting database installation...", 'info');

    // Read SQL file
    $sqlFile = __DIR__ . '/schema.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }

    output("Reading SQL file: $sqlFile", 'info');
    $sql = file_get_contents($sqlFile);

    // Connect to database
    output("Connecting to database...", 'info');
    $pdo = getDBConnection();

    // Split SQL into individual statements
    $statements = preg_split('/;\s*$/m', $sql);
    $executedCount = 0;
    $skippedCount = 0;

    foreach ($statements as $statement) {
        $statement = trim($statement);

        // Skip empty statements and comments
        if (empty($statement) ||
            strpos($statement, '--') === 0 ||
            strpos($statement, '/*') === 0) {
            continue;
        }

        try {
            // Special handling for DELIMITER statements
            if (stripos($statement, 'DELIMITER') !== false) {
                $skippedCount++;
                continue;
            }

            $pdo->exec($statement);
            $executedCount++;

            // Show progress for table creation
            if (stripos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\S+)/i', $statement, $matches);
                if (isset($matches[1])) {
                    output("Created table: " . $matches[1], 'success');
                }
            } elseif (stripos($statement, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO\s+(\S+)/i', $statement, $matches);
                if (isset($matches[1])) {
                    output("Inserted sample data into: " . $matches[1], 'success');
                }
            } elseif (stripos($statement, 'CREATE VIEW') !== false ||
                      stripos($statement, 'CREATE OR REPLACE VIEW') !== false) {
                preg_match('/VIEW\s+(\S+)/i', $statement, $matches);
                if (isset($matches[1])) {
                    output("Created view: " . $matches[1], 'success');
                }
            } elseif (stripos($statement, 'CREATE PROCEDURE') !== false) {
                preg_match('/PROCEDURE\s+(\S+)/i', $statement, $matches);
                if (isset($matches[1])) {
                    output("Created procedure: " . $matches[1], 'success');
                }
            } elseif (stripos($statement, 'CREATE TRIGGER') !== false) {
                preg_match('/TRIGGER\s+(\S+)/i', $statement, $matches);
                if (isset($matches[1])) {
                    output("Created trigger: " . $matches[1], 'success');
                }
            }

        } catch (PDOException $e) {
            // Check if error is about existing object
            if (strpos($e->getMessage(), 'already exists') !== false) {
                $skippedCount++;
            } else {
                output("Error executing statement: " . $e->getMessage(), 'error');
                throw $e;
            }
        }
    }

    output("", 'info');
    output("Installation completed successfully!", 'success');
    output("Executed statements: $executedCount", 'info');
    output("Skipped statements: $skippedCount", 'info');

    // Verify installation
    output("", 'info');
    output("Verifying installation...", 'info');

    $tables = [
        TABLE_CRITICAL_POINT_PROBLEMS,
        TABLE_CRITICAL_POINT_SESSIONS,
        TABLE_CRITICAL_POINT_ATTEMPTS,
        TABLE_PREFIX . 'critical_point_analytics'
    ];

    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            // Count records
            $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            output("✓ Table '$table' exists ($count records)", 'success');
        } else {
            output("✗ Table '$table' not found", 'error');
        }
    }

    output("", 'info');
    output("Installation verification complete!", 'success');
    output("You can now use the Critical Point Highlight application.", 'info');

} catch (Exception $e) {
    output("Installation failed: " . $e->getMessage(), 'error');
    output("Stack trace: " . $e->getTraceAsString(), 'error');
    exit(1);
}

if (!$isCLI) {
    echo "<hr><p><a href='../public/index.html'>Go to Application</a></p>";
    echo "</body></html>";
}
