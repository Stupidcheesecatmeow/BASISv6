const getAuthScript = () => [...document.scripts].find((item) => {
  try { return new URL(item.src).pathname.endsWith('/auth.js'); }
  catch { return false; }
});

/* =========================================================
   BASIS — SHARED LOGOUT HANDLER
========================================================= */

document.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-logout]");

    if (!button || button.disabled) return;

    button.disabled = true;

    try {
        const script = [...document.scripts].find(item => {
            try {
                return new URL(item.src).pathname.endsWith("/auth.js");
            } catch {
                return false;
            }
        });

        if (!script) {
            throw new Error("Authentication script not found.");
        }

        const endpoint = new URL(
            "admin/api/auth_api.php?action=logout",
            script.src
        );

        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server logout request failed.");
        }

    } catch (error) {
        console.error("Logout error:", error);

    } finally {
        sessionStorage.removeItem("basisAuthToken");
        sessionStorage.removeItem("basisCurrentUserId");

        const script = [...document.scripts].find(item => {
            try {
                return new URL(item.src).pathname.endsWith("/auth.js");
            } catch {
                return false;
            }
        });

        if (script) {
            window.location.replace(
                new URL("authentication/login.html", script.src).href
            );
        }
    }
});

const authScript = getAuthScript();
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
      sessionStorage.setItem('basisCurrentUserId', String(data.id));
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
      sessionStorage.setItem('basisCurrentUserId', String(profile.id));
      localStorage.setItem(`basisProfile_${profile.id}`, JSON.stringify(profile));
    }
    if (typeof window.loadPersonalForm === 'function') window.loadPersonalForm(profile);
    if (typeof window.loadFamilyForm === 'function') window.loadFamilyForm(profile);
    if (typeof window.updateProfileHeader === 'function') window.updateProfileHeader(profile);
    window.dispatchEvent(new CustomEvent('basis-profile-loaded', {detail:profile}));
  } catch (error) {
    if (error.message === 'Please sign in.') {
      const script = getAuthScript();
location.href = new URL('login/index.php', script.src).href;
    } else {
      console.error(error);
    }
  }
});
