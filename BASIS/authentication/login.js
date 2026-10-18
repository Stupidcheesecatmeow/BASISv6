const loginForm = document.getElementById('loginForm');
const acceptTerms = document.getElementById('acceptTerms');
const signInButton = document.getElementById('signInButton');
const termsModal = document.getElementById('termsModal');
const termsContent = document.getElementById('termsDialogContent');
const termsDone = document.getElementById('termsDone');
const termsReadHint = document.getElementById('termsReadHint');
let termsLoaded = false;
let termsReadToEnd = false;

function closeTermsModal() {
  termsModal.hidden = true;
  termsModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('terms-open');
  document.getElementById('openTerms').focus();
}

function checkTermsScroll() {
  if (termsReadToEnd || !termsLoaded) return;
  const atBottom = termsContent.scrollTop + termsContent.clientHeight >= termsContent.scrollHeight - 12;
  if (atBottom) {
    termsReadToEnd = true;
    acceptTerms.disabled = false;
    termsDone.disabled = false;
    termsReadHint.textContent = 'You have reached the end. You may now agree to the terms.';
  }
}

document.getElementById('openTerms').addEventListener('click', async () => {
  termsModal.hidden = false;
  termsModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('terms-open');
  termsContent.focus();
  if (termsLoaded) return;

  try {
    const response = await fetch('../more/more.html', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Unable to load Terms and Conditions.');
    const html = await response.text();
    const documentCopy = new DOMParser().parseFromString(html, 'text/html');
    const source = documentCopy.querySelector('#termsView .terms-content');
    if (!source) throw new Error('Terms and Conditions content was not found.');
    termsContent.replaceChildren(...Array.from(source.childNodes, node => document.importNode(node, true)));
    termsLoaded = true;
    termsContent.scrollTop = 0;
    termsReadHint.textContent = 'Scroll to the bottom to enable the agreement checkbox.';
    requestAnimationFrame(checkTermsScroll);
  } catch (error) {
    termsContent.innerHTML = '<p class="terms-loading">Terms could not be loaded. Please try again.</p>';
    termsReadHint.textContent = 'The terms must load before you can continue.';
  }
});

termsContent.addEventListener('scroll', checkTermsScroll);
termsDone.addEventListener('click', () => {
  if (termsReadToEnd) closeTermsModal();
});
document.getElementById('closeTerms').addEventListener('click', closeTermsModal);
termsModal.querySelector('[data-close-terms]').addEventListener('click', closeTermsModal);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !termsModal.hidden) closeTermsModal();
});
acceptTerms.addEventListener('change', () => {
  signInButton.disabled = !acceptTerms.checked;
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!termsReadToEnd || !acceptTerms.checked) return;
  const form = event.currentTarget;
  const message = document.getElementById('loginMessage');
  message.textContent = 'Signing in…'; signInButton.disabled = true;
  try {
    const response = await fetch('../admin/api/auth_api.php?action=login', {
      method: 'POST', credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: form.email.value, password: form.password.value})
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Sign in failed.');
    if (data.token) sessionStorage.setItem('basisAuthToken', data.token);
    if (data.user && data.user.id) sessionStorage.setItem('basisCurrentUserId', String(data.user.id));
    if (Number(data.user.must_change_password) === 1) { window.location.href = 'change-password.html'; return; }
    const destinations = {ADMIN: '../admin/home-admin.html', REPRESENTATIVE: '../representative/home-rep.html', ISKOLAR: '../home/home.html'};
    window.location.href = destinations[data.user.role] || '../home/home.html';
  } catch (error) { message.textContent = error.message; }
  finally { signInButton.disabled = !acceptTerms.checked; }
});
