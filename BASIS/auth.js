const getAuthScript = () => [...document.scripts].find((item) => {
  try { return new URL(item.src).pathname.endsWith('/auth.js'); }
  catch { return false; }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-logout]');
  if (!button) return;
  button.disabled = true;
  try {
    const script = getAuthScript();
    const endpoint = new URL('admin/api/auth_api.php?action=logout', script.src);
    await fetch(endpoint, {method:'POST', credentials:'same-origin'});
  } finally {
    const script = getAuthScript();
    location.href = new URL('authentication/login.html', script.src).href;
  }
});

const authScript = getAuthScript();
const logoutStyle = document.createElement('style');
logoutStyle.textContent = '[data-logout]{background:#b42318!important;border-color:#b42318!important;color:#fff!important}[data-logout]:hover{background:#8f1c13!important;border-color:#8f1c13!important}';
document.head.appendChild(logoutStyle);
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
    await this.profileRequest('PUT', data);
    if (data.id) {
      localStorage.setItem('basisCurrentUserId', String(data.id));
      localStorage.setItem(`basisProfile_${data.id}`, JSON.stringify(data));
    }
    window.dispatchEvent(new CustomEvent('basis-profile-updated', {detail:data}));
    return data;
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('saveProfileBtn')) return;
  try {
    const profile = await window.BASISAuth.profileRequest('GET');
    if (profile.id) {
      localStorage.setItem('basisCurrentUserId', String(profile.id));
      localStorage.setItem(`basisProfile_${profile.id}`, JSON.stringify(profile));
    }
    if (typeof window.loadPersonalForm === 'function') window.loadPersonalForm(profile);
    if (typeof window.loadFamilyForm === 'function') window.loadFamilyForm(profile);
    if (typeof window.updateProfileHeader === 'function') window.updateProfileHeader(profile);
    window.dispatchEvent(new CustomEvent('basis-profile-loaded', {detail:profile}));
  } catch (error) {
    if (error.message === 'Please sign in.') {
      const script = getAuthScript();
      location.href = new URL('authentication/login.html', script.src).href;
    } else {
      console.error(error);
    }
  }
});
