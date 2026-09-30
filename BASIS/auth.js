document.addEventListener('click', async (event) => {
  const qrButton = event.target.closest('[data-account-qr]');
  if (qrButton) {
    const dialog = document.getElementById('accountQrDialog');
    const image = document.querySelector('[data-account-qr-image]');
    if (image) image.src = new URL('admin/api/user_qr.php', authScript.src).href;
    if (dialog?.showModal) dialog.showModal();
    return;
  }
  const button = event.target.closest('[data-logout]');
  if (!button) return;
  button.disabled = true;
  try {
    const script = [...document.scripts].find(item => item.src.endsWith('/auth.js'));
    const endpoint = new URL('admin/api/auth_api.php?action=logout', script.src);
    await fetch(endpoint, {method:'POST', credentials:'same-origin'});
  } finally {
    const script = [...document.scripts].find(item => item.src.endsWith('/auth.js'));
    location.href = new URL('authentication/login.html', script.src).href;
  }
});

const authScript = [...document.scripts].find(item => item.src.endsWith('/auth.js'));
const accountEndpoint = new URL('admin/api/account_api.php', authScript.src);
window.BASISAuth = {
  async profileRequest(method, profile) {
    const response = await fetch(new URL('account_api.php?action=profile', accountEndpoint), {
      method, credentials:'same-origin',
      headers: method === 'PUT' ? {'Content-Type':'application/json'} : undefined,
      body: method === 'PUT' ? JSON.stringify({profile}) : undefined
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Account request failed.');
    return data.profile;
  },
  async saveProfile(profile, storageKey) {
    const data = {...profile};
    delete data.cluster;
    await this.profileRequest('PUT', data);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('saveProfileBtn')) return;
  try {
    const profile = await window.BASISAuth.profileRequest('GET');
    const storageByRole = {ISKOLAR:'basisScholarProfile', REPRESENTATIVE:'basisRepresentativeProfile', ADMIN:'basisAdminProfile'};
    const storageKey = storageByRole[String(profile.role||'').toUpperCase()];
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(profile));
    if (typeof window.loadPersonalForm === 'function') window.loadPersonalForm(profile);
    if (typeof window.loadFamilyForm === 'function') window.loadFamilyForm(profile);
    if (typeof window.updateProfileHeader === 'function') window.updateProfileHeader(profile);
    window.dispatchEvent(new CustomEvent('basis-profile-loaded', {detail:profile}));
  } catch (error) {
    if (error.message === 'Please sign in.') {
      const script = [...document.scripts].find(item => item.src.endsWith('/auth.js'));
      location.href = new URL('authentication/login.html', script.src).href;
    } else {
      console.error(error);
    }
  }
});
