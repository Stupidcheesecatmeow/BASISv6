<?php
declare(strict_types=1);
require_once __DIR__.'/db.php'; require_once __DIR__.'/http.php'; require_once __DIR__.'/qr_code.php';
try {
    $pdo=db(); requireUser($pdo); $id=(int)($_GET['id']??0);
    $stmt=$pdo->prepare('SELECT id,generate_qr FROM activities WHERE id=?');$stmt->execute([$id]);$activity=$stmt->fetch();
    if(!$activity||!in_array(strtolower($activity['generate_qr']),['qr','both'],true)){http_response_code(404);header('Content-Type:text/plain; charset=utf-8');exit('QR code is not enabled for this activity.');}
    header('Content-Type:image/svg+xml; charset=utf-8');header('Cache-Control: private, no-store');header('X-Content-Type-Options:nosniff');
    echo qrSvg('BASIS-A:'.$id);
} catch(Throwable $e){error_log($e->getMessage());http_response_code(500);header('Content-Type:text/plain; charset=utf-8');echo 'Unable to create QR code.';}
