<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';
require_once __DIR__ . '/smtp_mailer.php';
session_start();

try {
    $pdo = db();
    $action = $_GET['action'] ?? '';
    $input = requestInput();
    if ($action === 'tab-token') {
        $id=(int)($_SESSION['user_id']??0);
        if(!$id) jsonResponse(false,'Please sign in.',401);
        $stmt=$pdo->prepare("SELECT id FROM users WHERE id=? AND status='ACTIVE'");
        $stmt->execute([$id]);
        if(!$stmt->fetchColumn()) jsonResponse(false,'Account is unavailable.',403);
        $token=bin2hex(random_bytes(32));
        $pdo->prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))")->execute([hash('sha256',$token),$id]);
        jsonResponse(true,'',200,['token'=>$token]);
    }
    if ($action === 'me') {
        require_once __DIR__ . '/http.php';
        $auth = authenticatedUser($pdo, true);
        $stmt = $pdo->prepare('SELECT id,control_number,name,email,role,status,municipality,barangay,profile_completed,must_change_password FROM users WHERE id=?');
        $stmt->execute([(int)$auth['id']]);
        $user = $stmt->fetch();
        if (!$user || $user['status'] !== 'ACTIVE') jsonResponse(false, 'Account is unavailable.', 403);
        jsonResponse(true, '', 200, ['user' => $user]);
    }
    if ($action === 'logout') { $token=bearerToken(); if($token!=='') $pdo->prepare('DELETE FROM auth_sessions WHERE token_hash=?')->execute([hash('sha256',$token)]); $_SESSION = []; session_destroy(); jsonResponse(true, 'Signed out.'); }
    if ($action === 'change-password') {
        require_once __DIR__ . '/http.php';
        $id = (int)authenticatedUser($pdo, true)['id'];
        $current = (string)($input['current_password'] ?? '');
        $password = (string)($input['password'] ?? '');
        if (strlen($password) < 8) jsonResponse(false, 'Password must be at least 8 characters.', 422);
        if ($password !== (string)($input['confirm_password'] ?? '')) jsonResponse(false, 'Passwords do not match.', 422);
        $stmt = $pdo->prepare('SELECT password_hash,status FROM users WHERE id=?');
        $stmt->execute([$id]); $account = $stmt->fetch();
        if (!$account || $account['status'] !== 'ACTIVE') jsonResponse(false, 'Account is unavailable.', 403);
        if (!password_verify($current, $account['password_hash'])) jsonResponse(false, 'Current password is incorrect.', 422);
        $pdo->prepare("UPDATE users SET password_hash=?,must_change_password=0,initial_password='',updated_at=CURRENT_TIMESTAMP WHERE id=?")
            ->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
        jsonResponse(true, 'Password changed.');
    }
    if ($action === 'reset-request') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(false, 'Enter a valid email address.', 422);
        $stmt=$pdo->prepare("SELECT id FROM users WHERE LOWER(email)=? AND status='ACTIVE'"); $stmt->execute([$email]); $userId=$stmt->fetchColumn();
        if ($userId) {
            $token=bin2hex(random_bytes(32)); $tokenHash=hash('sha256',$token);
            $pdo->prepare('UPDATE password_resets SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND used_at IS NULL')->execute([$userId]);
            $pdo->prepare('INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES(?,?,?)')->execute([$userId,$tokenHash,gmdate('Y-m-d H:i:s',time()+3600)]);
            $base=((!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')?'https':'http').'://'.($_SERVER['HTTP_HOST']??'localhost');
            $appPath=rtrim(dirname(dirname(dirname($_SERVER['SCRIPT_NAME']??'/BASIS/admin/api/auth_api.php'))),'/\\');
            $link=$base.$appPath.'/authentication/forgot-password.html?token='.urlencode($token);
            try {
                sendSmtpMail(
                    $email,
                    'BASIS password reset',
                    "We received a request to reset your BASIS password. Open this link within 1 hour to choose a new password:\n\n{$link}\n\nIf you did not request this, ignore this email."
                );
            } catch (Throwable $mailError) {
                error_log('BASIS password reset SMTP delivery failed: ' . $mailError->getMessage());
                $pdo->prepare('UPDATE password_resets SET used_at=CURRENT_TIMESTAMP WHERE token_hash=?')->execute([$tokenHash]);
                $message = str_contains($mailError->getMessage(), 'SMTP host and sender address are required')
                    ? 'Gmail SMTP sender is not configured yet. Add BASIS_SMTP_USERNAME, BASIS_SMTP_PASSWORD, and BASIS_MAIL_FROM to Apache httpd.conf, then restart Apache.'
                    : (str_contains($mailError->getMessage(), 'App Password (535)')
                        ? 'Gmail rejected the SMTP login. Use the full sender Gmail address as BASIS_SMTP_USERNAME and its 16-character App Password as BASIS_SMTP_PASSWORD. The App Password may be pasted with or without spaces; BASIS removes the spaces automatically.'
                        : 'We could not send the confirmation email. Check the SMTP host, port, encryption, sender, and account credentials, then try again.');
                jsonResponse(false, $message, 503);
            }
        }
        jsonResponse(true,'If an active account uses that email, a password reset link has been sent.');
    }
    if ($action === 'reset-password') {
        $token=(string)($input['token']??''); $password=(string)($input['password']??'');
        if(strlen($token)!==64 || !ctype_xdigit($token)) jsonResponse(false,'This reset link is invalid or expired.',400);
        if(strlen($password)<8) jsonResponse(false,'Password must be at least 8 characters.',422);
        $stmt=$pdo->prepare("SELECT id,user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP"); $stmt->execute([hash('sha256',$token)]); $reset=$stmt->fetch();
        if(!$reset) jsonResponse(false,'This reset link is invalid or expired.',400);
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE users SET password_hash=?,initial_password=\'\',must_change_password=0,updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$reset['user_id']]);
        $pdo->prepare('UPDATE password_resets SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND used_at IS NULL')->execute([$reset['user_id']]);
        $pdo->commit(); jsonResponse(true,'Password updated. You can now sign in.');
    }
    if ($action === 'login') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $stmt = $pdo->prepare('SELECT id,password_hash,status FROM users WHERE LOWER(email)=?');
        $stmt->execute([$email]); $user = $stmt->fetch();
        if (!$user || !password_verify((string)($input['password'] ?? ''), $user['password_hash'])) jsonResponse(false, 'Email or password is incorrect.', 401);
        if ($user['status'] !== 'ACTIVE') jsonResponse(false, 'This account is inactive. Contact an administrator.', 403);
        session_regenerate_id(true); $_SESSION['user_id'] = (int)$user['id'];
        $token=bin2hex(random_bytes(32));
        $pdo->prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))")->execute([hash('sha256',$token),(int)$user['id']]);
        jsonResponse(true, 'Signed in.', 200, ['user' => currentUser($pdo, (int)$user['id']), 'token'=>$token]);
    }
    jsonResponse(false, 'Unknown action.', 400);
} catch (PDOException $e) {
    if (str_contains(strtolower($e->getMessage()), 'unique')) jsonResponse(false, 'That email or control number is already registered.', 409);
    error_log($e->getMessage()); jsonResponse(false, 'Database request failed.', 500);
} catch (Throwable $e) { error_log($e->getMessage()); jsonResponse(false, 'Server error.', 500); }

function currentUser(PDO $pdo, int $id): array { $s=$pdo->prepare('SELECT id,control_number,name,email,role,status,must_change_password FROM users WHERE id=?'); $s->execute([$id]); return $s->fetch() ?: []; }
