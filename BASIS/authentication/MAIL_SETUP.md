# Password reset email on localhost

BASIS sends password reset links through an SMTP relay. PHP's `mail()` function is not used, so XAMPP must have valid SMTP settings before email can be delivered.

In `C:\xampp\apache\conf\httpd.conf`, add these Apache environment settings and replace each placeholder with values from your email provider:

```apache
SetEnv BASIS_SMTP_HOST "smtp.your-provider.example"
SetEnv BASIS_SMTP_PORT "587"
SetEnv BASIS_SMTP_ENCRYPTION "tls"
SetEnv BASIS_SMTP_USERNAME "your-sender@example.com"
SetEnv BASIS_SMTP_PASSWORD "your-mail-provider-password-or-app-password"
SetEnv BASIS_MAIL_FROM "your-sender@example.com"
```

Use `tls` with port `587`, `ssl` with port `465`, or `none` only for a trusted local mail catcher. `BASIS_SMTP_USERNAME` and `BASIS_SMTP_PASSWORD` may both be left unset only when the relay does not require authentication. The sender address must be authorized by the provider.

Restart Apache in the XAMPP Control Panel after changing its configuration, then request a password reset again. The recipient receives a one-time confirmation link that expires after one hour. If SMTP delivery fails, the request is invalidated and the forgot-password page reports that the email could not be sent.

Keep real SMTP credentials out of source control. For production, use a trusted authenticated SMTP service and protect its credentials as secrets.
