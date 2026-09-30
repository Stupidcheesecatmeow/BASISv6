<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';
require_once __DIR__ . '/qr_code.php';
require_once __DIR__ . '/activity_qr_token.php';

try {
    $pdo = db();
    $viewer = requireUser($pdo);
    $activityId = (int)($_GET['id'] ?? $_GET['activity_id'] ?? 0);
    if ($activityId < 1) {
        http_response_code(422);
        header('Content-Type: text/plain; charset=utf-8');
        exit('A valid activity is required.');
    }

    $stmt = $pdo->prepare("SELECT a.id AS activity_id,a.name AS activity_name,a.generate_qr,
                                  u.id AS user_id,u.name,u.control_number,u.barangay
                           FROM activities a JOIN users u ON u.id=?
                           WHERE a.id=? AND u.status='ACTIVE'");
    $stmt->execute([(int)$viewer['id'], $activityId]);
    $record = $stmt->fetch();
    if (!$record || !in_array(strtolower((string)$record['generate_qr']), ['qr', 'both'], true)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        exit('A participant QR code is not available for this activity.');
    }

    $payload = json_encode([
        'kind' => 'BASIS_ACTIVITY_ATTENDANCE',
        'activity_id' => (int)$record['activity_id'],
        'activity_name' => (string)$record['activity_name'],
        'user_id' => (int)$record['user_id'],
        'control_number' => (string)$record['control_number'],
        'name' => (string)$record['name'],
        'barangay' => (string)$record['barangay'],
        'token' => activityQrToken($pdo, (int)$record['activity_id'], (int)$record['user_id'])
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) throw new RuntimeException('Could not encode the participant QR data.');

    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo qrSvg($payload);
} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Unable to create the participant activity QR code.';
}
