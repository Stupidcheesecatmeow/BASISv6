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
                                  u.id AS user_id,u.name,u.given_name,u.middle_name,u.surname,u.suffix,u.barangay
                           FROM activities a JOIN users u ON u.id=? AND u.status='ACTIVE'
                           WHERE a.id=? AND u.status='ACTIVE'");
    $stmt->execute([(int)$viewer['id'], $activityId]);
    $record = $stmt->fetch();
    if (!$record || !in_array(strtolower((string)$record['generate_qr']), ['qr', 'both'], true)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        exit('A participant QR code is not available for this activity.');
    }

    // QR contents are limited to the three details requested for the participant.
    $profileName = trim(implode(' ', array_filter([
        trim((string)($record['given_name'] ?? '')),
        trim((string)($record['middle_name'] ?? '')),
        trim((string)($record['surname'] ?? '')),
        trim((string)($record['suffix'] ?? '')),
    ], static fn(string $part): bool => $part !== '')));
    // Keep the QR human-readable and minimal: activity, participant, barangay.
    $payload = implode("\n", [
        (string)$record['activity_name'],
        $profileName !== '' ? $profileName : (string)$record['name'],
        (string)$record['barangay']
    ]);

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
