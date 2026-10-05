/* Keep API identity scoped to this browser tab instead of the shared PHP cookie. */
if (!window.__basisFetchIsolated) {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        const rawUrl = input instanceof Request ? input.url : input;
        let target;
        try { target = new URL(rawUrl, window.location.href); } catch { return nativeFetch(input, init); }
        if (target.origin !== window.location.origin) return nativeFetch(input, init);
        const attachToken = (token) => {
            if (!token) return nativeFetch(input, init);
            const headers = new Headers(input instanceof Request ? input.headers : undefined);
            new Headers(init.headers || {}).forEach((value, key) => headers.set(key, value));
            headers.set("X-Basis-Session", token);
            headers.set("Authorization", `Bearer ${token}`);
            return nativeFetch(input, {...init, headers});
        };
        const token = sessionStorage.getItem("basisAuthToken");
        if (token) return attachToken(token);
        if (!window.__basisTabTokenPromise) {
            const appScript = [...document.scripts].find((item) => {
                try { return new URL(item.src).pathname.endsWith("/script.js"); } catch { return false; }
            });
            if (!appScript) return nativeFetch(input, init);
            const authUrl = new URL("admin/api/auth_api.php?action=tab-token", appScript.src);
            window.__basisTabTokenPromise = nativeFetch(authUrl, {credentials:"same-origin", cache:"no-store"})
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok || !data.success || !data.token) return "";
                    sessionStorage.setItem("basisAuthToken", data.token);
                    return data.token;
                })
                .catch(() => "");
        }
        return window.__basisTabTokenPromise.then(attachToken);
    };
    window.__basisFetchIsolated = true;
}

document.addEventListener("DOMContentLoaded", function () {

    // Each account has its own profile record on the server. Load that record
    // for every module so the header never falls back to a shared role cache.
    const applyProfileAvatar = (profile) => {
        if (!profile || !profile.id) return;
        sessionStorage.setItem("basisCurrentUserId", String(profile.id));
        localStorage.setItem(`basisProfile_${profile.id}`, JSON.stringify(profile));
        if (!profile.profilePhoto) return;
        document.querySelectorAll(".header-avatar").forEach((avatar) => {
            avatar.src = profile.profilePhoto;
        });
    };

    window.addEventListener("basis-profile-updated", (event) => {
        applyProfileAvatar(event.detail);
    });

    const script = [...document.scripts].find((item) => {
        try { return new URL(item.src).pathname.endsWith("/script.js"); }
        catch { return false; }
    });
    if (script) {
        const path = window.location.pathname.toLowerCase();
        const expectedRole = path.includes("/admin/") ? "ADMIN" : path.includes("/representative/") ? "REPRESENTATIVE" : "ISKOLAR";
        const loginPage = new URL("authentication/login.html", script.src).href;
        fetch(new URL("admin/api/auth_api.php?action=me", script.src), {credentials:"same-origin", cache:"no-store"})
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || !data.success || !data.user) throw new Error("Sign-in required");
                if (data.user.role !== expectedRole) {
                    window.location.replace(loginPage);
                }
            })
            .catch(() => window.location.replace(loginPage));
    }
    const homeActivityBox = document.getElementById('activityBox');
    if (script && homeActivityBox) {
        fetch(new URL('admin/api/account_api.php?action=activities', script.src), {credentials:'same-origin', cache:'no-store'})
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load activities.');
                const activities = Array.isArray(data.activities) ? data.activities.slice(0, 3) : [];
                homeActivityBox.replaceChildren();
                if (!activities.length) {
                    const empty = document.createElement('div'); empty.className = 'representative-empty';
                    const text = document.createElement('span'); text.textContent = 'No activities yet.'; empty.appendChild(text); homeActivityBox.appendChild(empty); return;
                }
                activities.forEach((activity) => {
                    const item = document.createElement('article'); item.className = 'home-activity-item';
                    const title = document.createElement('h3'); title.textContent = activity.name || 'Activity'; item.appendChild(title);
                    const detail = document.createElement('p');
                    const time = [activity.startTime || '', activity.endTime || ''].filter(Boolean).join(' - ');
                    detail.textContent = [activity.type || '', activity.date || '', time, activity.venue || '', activity.barangay || activity.municipality || ''].filter(Boolean).join(' · ');
                    item.appendChild(detail);
                    if (activity.description) { const description = document.createElement('p'); description.textContent = activity.description; item.appendChild(description); }
                    homeActivityBox.appendChild(item);
                });
            }).catch((error) => { console.warn('Could not load activities on home.', error); });
    }
    const announcementsBox = document.getElementById('announcementsBox');
    if (script && announcementsBox && !document.getElementById('openAnnouncementModal')) {
        const renderAnnouncements = (announcements) => {
            announcementsBox.replaceChildren();
            if (!announcements.length) {
                const empty = document.createElement('div'); empty.className = 'representative-empty';
                const label = document.createElement('span'); label.textContent = 'No announcements yet.'; empty.appendChild(label); announcementsBox.appendChild(empty); return;
            }
            announcements.forEach((announcement) => {
                const card = document.createElement('article'); card.className = 'home-announcement-item';
                const title = document.createElement('h3'); title.textContent = announcement.title || 'Announcement'; card.appendChild(title);
                const date = document.createElement('small'); date.textContent = announcement.date || announcement.created_at || ''; card.appendChild(date);
                const message = document.createElement('p'); message.textContent = announcement.message || ''; card.appendChild(message);
                if (announcement.attachment_data) {
                    const attachment = document.createElement('a'); attachment.href = announcement.attachment_data; attachment.download = announcement.attachment_name || 'announcement-attachment'; attachment.textContent = `Open attachment: ${announcement.attachment_name || 'file'}`; card.appendChild(attachment);
                }
                card.classList.add('clickable-announcement');
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                const openAnnouncement = () => {
                    if (!announcement.id) return;
                    sessionStorage.setItem('basisSelectedAnnouncementId', String(announcement.id));
                    const page = window.location.pathname.toLowerCase().includes('/admin/')
                        ? 'admin/history-admin.html'
                        : window.location.pathname.toLowerCase().includes('/representative/')
                            ? 'representative/history-rep.html'
                            : 'history/history.html';
                    window.location.href = new URL(page, script.src).href;
                };
                card.addEventListener('click', (event) => { if (!event.target.closest('a')) openAnnouncement(); });
                card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAnnouncement(); } });
                announcementsBox.appendChild(card);
            });
        };
        const loadAnnouncements = () => fetch(new URL('admin/api/account_api.php?action=announcements', script.src), {credentials:'same-origin',cache:'no-store'})
            .then(async response => { const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Announcements could not be loaded.'); renderAnnouncements(Array.isArray(data.announcements) ? data.announcements : []); })
            .catch(error => console.warn('Could not load announcements on home.', error));
        loadAnnouncements();
        window.addEventListener('pageshow', loadAnnouncements);
        window.addEventListener('focus', loadAnnouncements);
        window.addEventListener('storage', event => { if (event.key === 'basisAnnouncementPublished') loadAnnouncements(); });
        setInterval(loadAnnouncements, 30000);
    }
    if (script && document.querySelector(".header-avatar")) {
        fetch(new URL("admin/api/account_api.php?action=profile", script.src), {
            credentials: "same-origin",
            cache: "no-store"
        }).then(async (response) => {
            const data = await response.json();
            if (response.ok && data.success) {
                applyProfileAvatar(data.profile);
                window.dispatchEvent(new CustomEvent("basis-account-profile-loaded", {detail: data.profile}));
            }
        }).catch((error) => console.warn("Could not load account avatar.", error));
    }
    
    // Helper function to toggle header avatar visibility
    function toggleHeaderAvatar(isProfileView) {
        const headerAvatar = document.querySelector('.profile-avatar-wrapper');
        if (headerAvatar) {
            headerAvatar.style.display = isProfileView ? 'none' : 'block';
        }
    }

    // View Switcher Function
    window.switchTab = function (tabName) {
        const views = document.querySelectorAll('.page-view');
        views.forEach(view => view.classList.remove('active'));

        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        const targetView = document.getElementById(`view-${tabName}`);
        if (targetView) {
            targetView.classList.add('active');
        }

        const tabMap = { 'home': 0, 'scorecard': 1, 'activity': 2, 'history': 3, 'more': 4 };
        if (tabMap[tabName] !== undefined && navItems[tabMap[tabName]]) {
            navItems[tabMap[tabName]].classList.add('active');
        }

        // HIDE AVATAR IF TAB IS PROFILE, OTHERWISE SHOW IT
        toggleHeaderAvatar(tabName === 'profile');
    };

    window.showSubView = function (viewId) {
        const views = document.querySelectorAll('.page-view');
        views.forEach(view => view.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
        }

        // HIDE AVATAR IF SUBVIEW IS ANY PROFILE STEP
        toggleHeaderAvatar(viewId.startsWith('view-profile'));
    };

    window.openScorecardDetail = function (semesterName) {
        const semTitleElem = document.getElementById('scorecardSemTitle');
        if (semTitleElem) {
            semTitleElem.innerText = semesterName.toUpperCase();
        }
        showSubView('view-scorecard-detail');
    };

    // Activity modules provide a handler that loads the selected activity
    // before opening its detail view. Keep this simple fallback only on pages
    // that do not define that data-aware handler.
    if (typeof window.openActivityDetail !== 'function') {
        window.openActivityDetail = function () {
            showSubView('view-activity-detail');
        };
    }

    window.setSubmissionTab = function (tabType) {
        const btnAttendance = document.getElementById('tabAttendance');
        const btnAbsence = document.getElementById('tabAbsence');

        if (tabType === 'attendance') {
            btnAttendance.classList.add('active');
            btnAbsence.classList.remove('active');
        } else {
            btnAbsence.classList.add('active');
            btnAttendance.classList.remove('active');
        }
    };

    /* Carousel Logic */
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('carouselContainer');
    const dots = document.querySelectorAll('#carouselDots .dot');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    let currentIndex = 0;
    const totalSlides = 6;

    function updateCarousel(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        
        currentIndex = index;
        if (track) {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        }

        dots.forEach((dot, idx) => {
            if (idx === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
        nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));
    }

    dots.forEach((dot) => {
        dot.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            updateCarousel(index);
        });
    });

    /* Touch Swipe functionality for Carousel */
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    if (container) {
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        container.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const diffX = startX - currentX;
        if (diffX > 40 && currentIndex < totalSlides - 1) {
            updateCarousel(currentIndex + 1);
        } else if (diffX < -40 && currentIndex > 0) {
            updateCarousel(currentIndex - 1);
        }
        startX = 0;
        currentX = 0;
    }
});
