<?php
declare(strict_types=1);

function activityQrToken(PDO $pdo, int $activityId, int $userId): string
{
    $find = $pdo->prepare('SELECT token FROM activity_qr_tokens WHERE activity_id=? AND user_id=?');
    $find->execute([$activityId, $userId]);
    $token = $find->fetchColumn();
    if ($token !== false) return (string)$token;

    $token = bin2hex(random_bytes(24));
    try {
        $insert = $pdo->prepare('INSERT INTO activity_qr_tokens(activity_id,user_id,token) VALUES(?,?,?)');
        $insert->execute([$activityId, $userId, $token]);
        return $token;
    } catch (PDOException $e) {
        $find->execute([$activityId, $userId]);
        $token = $find->fetchColumn();
        if ($token !== false) return (string)$token;
        throw $e;
    }
}
