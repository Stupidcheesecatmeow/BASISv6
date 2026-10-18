document.querySelectorAll('.password-toggle').forEach((toggle) => {
    const eyeIcon = '<svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeOffIcon = '<svg class="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3 21 21"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.2 17.2 0 0 1-4 4.7"/><path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10.8 10.8 0 0 0 2.2-.2"/></svg>';

    toggle.addEventListener('click', () => {
        const password = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!password) return;

        const showPassword = password.type === 'password';
        password.type = showPassword ? 'text' : 'password';
        toggle.setAttribute('aria-label', `${showPassword ? 'Hide' : 'Show'} password`);
        toggle.title = `${showPassword ? 'Hide' : 'Show'} password`;
        toggle.setAttribute('aria-pressed', String(showPassword));
        toggle.innerHTML = showPassword ? eyeOffIcon : eyeIcon;
        password.focus();
    });
});
