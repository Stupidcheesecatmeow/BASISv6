<?php
declare(strict_types=1);
require_once __DIR__.'/db.php'; require_once __DIR__.'/http.php'; require_once __DIR__.'/qr_code.php';
try {
    $pdo=db();$user=requireUser($pdo);$stmt=$pdo->prepare('SELECT control_number FROM users WHERE id=?');$stmt->execute([$user['id']]);$control=(string)$stmt->fetchColumn();
    header('Content-Type:image/svg+xml; charset=utf-8');header('Cache-Control: private, no-store');header('X-Content-Type-Options:nosniff');
    echo qrSvg('BASIS-U:'.$user['id']);
} catch(Throwable $e){error_log($e->getMessage());http_response_code(500);header('Content-Type:text/plain; charset=utf-8');echo 'Unable to create account QR code.';}
