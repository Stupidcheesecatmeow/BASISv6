# Password reset email on localhost

BASIS sends password reset links through Gmail SMTP. PHP's `mail()` function is not used, so XAMPP must have valid Gmail sender credentials before email can be delivered.

In `C:\xampp\apache\conf\httpd.conf`, add these Apache environment settings and replace each placeholder with values from your email provider:

```apache
SetEnv BASIS_SMTP_HOST "smtp.gmail.com"
SetEnv BASIS_SMTP_PORT "587"
SetEnv BASIS_SMTP_ENCRYPTION "tls"
SetEnv BASIS_SMTP_USERNAME "your-basis-sender@gmail.com"
SetEnv BASIS_SMTP_PASSWORD "your-16-character-google-app-password"
SetEnv BASIS_MAIL_FROM "your-basis-sender@gmail.com"
```

Create a dedicated Gmail sender account, enable 2-Step Verification, and create an App Password for BASIS. Use that App Password as `BASIS_SMTP_PASSWORD`; do not use the account's regular password. Gmail SMTP uses `smtp.gmail.com`, port `587`, and TLS. The sender address and username should be the same Gmail account.

Restart Apache in the XAMPP Control Panel after changing its configuration, then request a password reset again. The recipient receives a one-time confirmation link that expires after one hour. If SMTP delivery fails, the request is invalidated and the forgot-password page reports that the email could not be sent.

Restart Apache in the XAMPP Control Panel after changing its configuration, then request a password reset again. The recipient receives a one-time confirmation link that expires after one hour. If SMTP delivery fails, the request is invalidated and the forgot-password page reports that the email could not be sent.

Keep the App Password out of source control and chat. For production, use a trusted transactional SMTP service and protect its credentials as secrets.
