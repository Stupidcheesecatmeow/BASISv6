const form = document.getElementById('changePasswordForm');
const message = document.getElementById('changePasswordMessage');
const endpoint = '../admin/api/auth_api.php';

document.getElementById('signOutLink').addEventListener('click', async (event) => {
  event.preventDefault();
  await fetch(`${endpoint}?action=logout`, {method:'POST', credentials:'same-origin'});
  window.location.href = 'login.html';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  message.textContent = 'Saving password…';
  try {
    const response = await fetch(`${endpoint}?action=change-password`, {
      method:'POST', credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        current_password:document.getElementById('currentPassword').value,
        password:document.getElementById('newPassword').value,
        confirm_password:document.getElementById('confirmPassword').value
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Could not change password.');
    const session = await fetch(`${endpoint}?action=me`, {credentials:'same-origin'}).then(r => r.json());
    const destinations = {ADMIN:'../admin/home-admin.html', REPRESENTATIVE:'../representative/home-rep.html', ISKOLAR:'../home/home.html'};
    window.location.href = destinations[session.user?.role] || 'login.html';
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
