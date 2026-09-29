<?php
declare(strict_types=1);

require_once __DIR__ . '/api/db.php';

try {
    db();

    echo '<h2>BASIS User Management Database Ready</h2>';
    echo '<p>The <strong>users</strong> table is ready in attendance.db.</p>';
    echo '<p>You can now open <strong>user-admin.html</strong>.</p>';

} catch (Throwable $e) {

    http_response_code(500);

    echo '<h2>Database setup failed</h2>';
    echo '<pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
}
