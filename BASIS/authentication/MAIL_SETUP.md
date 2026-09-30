# Password reset email on localhost

The reset link is sent with PHP's `mail()` function. On localhost, when PHP mail delivery is unavailable, BASIS displays a one-time local confirmation link on the forgot-password page for development. The link expires after one hour and must be opened before setting a new password.

To deliver the reset link to a real inbox from XAMPP, configure an SMTP relay before Apache is started:

1. Configure the SMTP server and sender in XAMPP's `sendmail.ini` (commonly under `C:\xampp\sendmail\sendmail.ini`). Use credentials for a mailbox or a local mail catcher such as Mailpit/MailHog.
2. In `C:\xampp\php\php.ini`, set `sendmail_path` to the XAMPP `sendmail.exe` and restart Apache.
3. Set `BASIS_MAIL_FROM` to the sender address accepted by the relay. If unset, BASIS uses `no-reply@basis.local`.
4. Submit a reset request from the forgot-password page. The email contains a one-time link that expires after one hour.

On non-local hosts, a working relay is required; failed email delivery invalidates the generated token. For a production deployment, use an authenticated SMTP service and a sender address authorized by that service. The localhost link preview is only returned to localhost requests and only when the email matches an active account.
