<?php
declare(strict_types=1);

/** Send a UTF-8 plain-text message using the configured SMTP relay. */
function sendSmtpMail(string $recipient, string $subject, string $body): void
{
    $host = trim((string)(getenv('BASIS_SMTP_HOST') ?: 'smtp.gmail.com'));
    $username = trim((string)(getenv('BASIS_SMTP_USERNAME') ?: ''));
    $password = (string)(getenv('BASIS_SMTP_PASSWORD') ?: '');
    // Google displays App Passwords in groups separated by spaces.
    $password = preg_replace('/\s+/', '', $password) ?? $password;
    $encryption = strtolower(trim((string)(getenv('BASIS_SMTP_ENCRYPTION') ?: 'tls')));
    $port = (int)(getenv('BASIS_SMTP_PORT') ?: ($encryption === 'ssl' ? 465 : 587));
    $from = trim((string)(getenv('BASIS_MAIL_FROM') ?: $username));

    if ($host === '' || $from === '') {
        throw new RuntimeException('SMTP host and sender address are required.');
    }
    if (!in_array($encryption, ['tls', 'ssl', 'none'], true)) {
        throw new RuntimeException('SMTP encryption must be tls, ssl, or none.');
    }
    if ($port < 1 || $port > 65535 || preg_match('/[\r\n\s]/', $host)) {
        throw new RuntimeException('SMTP host or port is invalid.');
    }
    if (($username === '') !== ($password === '')) {
        throw new RuntimeException('Set both SMTP username and password, or neither for a local relay.');
    }
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('SMTP recipient or sender address is invalid.');
    }

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'peer_name' => $host,
            'allow_self_signed' => false
        ]
    ]);
    $target = ($encryption === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $socket = @stream_socket_client($target, $errno, $error, 15, STREAM_CLIENT_CONNECT, $context);
    if (!is_resource($socket)) {
        throw new RuntimeException("Unable to connect to SMTP server ({$errno}).");
    }

    stream_set_timeout($socket, 15);

    try {
        smtpExpect($socket, [220]);
        $hostname = preg_replace('/[^A-Za-z0-9.-]/', '', gethostname() ?: 'localhost') ?: 'localhost';
        smtpCommand($socket, 'EHLO ' . $hostname, [250]);

        if ($encryption === 'tls') {
            smtpCommand($socket, 'STARTTLS', [220]);
            $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($crypto !== true) {
                throw new RuntimeException('Unable to establish encrypted SMTP connection.');
            }
            smtpCommand($socket, 'EHLO ' . $hostname, [250]);
        }

        if ($username !== '') {
            smtpCommand($socket, 'AUTH LOGIN', [334]);
            smtpCommand($socket, base64_encode($username), [334]);
            smtpCommand($socket, base64_encode($password), [235]);
        }

        smtpCommand($socket, 'MAIL FROM:<' . $from . '>', [250]);
        smtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        smtpCommand($socket, 'DATA', [354]);

        $domain = substr(strrchr($from, '@') ?: 'localhost', 1) ?: 'localhost';
        $headers = [
            'From: BASIS <' . $from . '>',
            'To: <' . $recipient . '>',
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit'
        ];
        $message = implode("\r\n", $headers) . "\r\n\r\n";
        $message .= str_replace(["\r\n", "\r", "\n"], "\r\n", $body);
        $message = preg_replace('/(?m)^\./', '..', $message) ?? $message;
        smtpWrite($socket, $message . "\r\n.\r\n");
        smtpExpect($socket, [250]);
        smtpCommand($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}

/** Send an SMTP command and require one of the expected reply codes. */
function smtpCommand($socket, string $command, array $expected): string
{
    smtpWrite($socket, $command . "\r\n");
    return smtpExpect($socket, $expected);
}

/** Write the complete SMTP command or message, including partial writes. */
function smtpWrite($socket, string $data): void
{
    $length = strlen($data);
    $written = 0;
    while ($written < $length) {
        $count = fwrite($socket, substr($data, $written));
        if ($count === false || $count === 0) {
            throw new RuntimeException('Unable to write to SMTP server.');
        }
        $written += $count;
    }
}

/** Read one complete (possibly multiline) SMTP response. */
function smtpExpect($socket, array $expected): string
{
    $response = '';
    do {
        $line = fgets($socket, 2048);
        if ($line === false) {
            $meta = stream_get_meta_data($socket);
            throw new RuntimeException(!empty($meta['timed_out']) ? 'SMTP server timed out.' : 'SMTP server closed the connection.');
        }
        $response .= $line;
        $complete = preg_match('/^(\d{3}) /', $line, $matches) === 1;
    } while (!$complete);

    $code = (int)substr($matches[1], 0, 3);
    if (!in_array($code, $expected, true)) {
        if ($code === 535) {
            throw new RuntimeException('Gmail rejected the SMTP username or App Password (535).');
        }
        throw new RuntimeException('SMTP server rejected a mail command with response ' . $code . '.');
    }
    return $response;
}
