<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor-qr/phpqrcode-master/qrlib.php';

function qrSvg(string $content): string
{
    ob_start();
    QRcode::svg($content, false, QR_ECLEVEL_M, 5, 4);
    $svg = ob_get_clean();
    if (!is_string($svg) || !str_contains($svg, '<svg')) {
        throw new RuntimeException('Unable to encode QR payload.');
    }
    return $svg;
}
