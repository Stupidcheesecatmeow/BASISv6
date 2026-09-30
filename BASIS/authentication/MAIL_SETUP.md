# Password reset email on localhost

The reset link is sent with PHP's `mail()` function. On XAMPP for Windows, PHP needs an SMTP relay configured before Apache is started:

1. Configure the SMTP server and sender in XAMPP's `sendmail.ini` (commonly under `C:\xampp\sendmail\sendmail.ini`). Use credentials for a mailbox or a local mail catcher such as Mailpit/MailHog.
2. In `C:\xampp\php\php.ini`, set `sendmail_path` to the XAMPP `sendmail.exe` and restart Apache.
3. Set `BASIS_MAIL_FROM` to the sender address accepted by the relay. If unset, BASIS uses `no-reply@basis.local`.
4. Submit a reset request from the forgot-password page. The email contains a one-time link that expires after one hour.

Without a working relay, the reset request reports that email delivery is unavailable and no usable reset token is retained. For a production deployment, use an authenticated SMTP service and a sender address authorized by that service.
