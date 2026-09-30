const resetToken = new URLSearchParams(location.search).get('token');
const requestForm = document.getElementById('resetRequestForm');
const passwordForm = document.getElementById('newPasswordForm');
if (resetToken) { requestForm.hidden = true; passwordForm.hidden = false; }

async function resetApi(action, payload) {
  const response = await fetch(`../admin/api/auth_api.php?action=${action}`, {
    method: 'POST', credentials: 'same-origin',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
  return data;
}

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.getElementById('resetMessage');
  const button = requestForm.querySelector('button'); button.disabled = true;
  message.textContent = 'Sending confirmation email…';
  try {
    const result = await resetApi('reset-request', {email: document.getElementById('resetEmail').value});
    message.replaceChildren(document.createTextNode(result.message));
    if (result.local_preview && result.reset_link) {
      const linkUrl = new URL(result.reset_link, location.href);
      if (linkUrl.origin === location.origin) {
        const link = document.createElement('a');
        link.href = linkUrl.href;
        link.textContent = 'Open local password reset link';
        link.className = 'local-reset-link';
        message.append(document.createElement('br'), link);
      }
    }
  }
  catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.getElementById('passwordMessage');
  const password = document.getElementById('newPassword').value;
  if (password !== document.getElementById('confirmPassword').value) { message.textContent = 'Passwords do not match.'; return; }
  const button = passwordForm.querySelector('button'); button.disabled = true;
  try { await resetApi('reset-password', {token: resetToken, password}); message.textContent = 'Password updated. Redirecting to sign in…'; setTimeout(() => location.href = 'login.html', 1300); }
  catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
