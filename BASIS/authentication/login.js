document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById('loginMessage');
  const button = form.querySelector('button[type="submit"]');
  message.textContent = 'Signing in…'; button.disabled = true;
  try {
    const response = await fetch('../admin/api/auth_api.php?action=login', {
      method: 'POST', credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: form.email.value, password: form.password.value})
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Sign in failed.');
    if (Number(data.user.must_change_password) === 1) { window.location.href = 'change-password.html'; return; }
    const destinations = {ADMIN: '../admin/home-admin.html', REPRESENTATIVE: '../representative/home-rep.html', ISKOLAR: '../home/home.html'};
    window.location.href = destinations[data.user.role] || '../home/home.html';
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
