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

/* =========================================================
   INITIAL ACTIVITY VIEW
========================================================= */

if (typeof ACTIVITY_SUB_VIEWS !== 'undefined') {
    ACTIVITY_SUB_VIEWS.forEach(id => {
        const view = document.getElementById(id);
        if (!view) return;
        view.classList.remove('active');
        view.style.display = 'none';
    });
    if (typeof window.showSubView === 'function') {
        window.showSubView('view-activity-menu');
    }
}

    const applyWelcomeName = (profile) => {
        if (!profile) return;
        const firstName = String(profile.givenName || profile.given_name || String(profile.name || "").trim().split(/\s+/)[0] || "").trim();
        if (!firstName) return;
        document.querySelectorAll(".welcome-text h1, .welcome-copy strong, #headerWelcomeRole").forEach((heading) => {
            heading.textContent = `MABUHAY, ${firstName.toLocaleUpperCase()}!`;
        });
    };
    document.querySelectorAll(".welcome-copy > span, .welcome-text > span").forEach((label) => {
        label.textContent = "WELCOME TO BASIS";
    });
    document.querySelectorAll(".welcome-text h1, .welcome-copy strong, #headerWelcomeRole").forEach((heading) => {
        heading.textContent = "MABUHAY!";
    });

    // Each account has its own profile record on the server. Load that record
    // for every module so the header never falls back to a shared role cache.
    const applyProfileAvatar = (profile) => {
        if (!profile) return;
        applyWelcomeName(profile);
        const composedName = [profile.givenName || profile.given_name, profile.middleName || profile.middle_name, profile.surname, profile.suffix].filter(value => String(value || "").trim()).join(" ");
        const fullName = String(composedName || profile.fullName || profile.full_name || profile.name || "").trim();
        if (fullName) {
            document.querySelectorAll(".sidebar-profile strong, .sidebar-user-name, .sidebar-profile-name, #sidebarProfileName, #sidebarRepName").forEach((nameElement) => {
                nameElement.textContent = fullName;
            });
        }
        if (!profile.id) return;
        sessionStorage.setItem("basisCurrentUserId", String(profile.id));
        localStorage.setItem(`basisProfile_${profile.id}`, JSON.stringify(profile));
        if (!profile.profilePhoto) return;
        document.querySelectorAll(".header-avatar, #topbarProfilePhoto, #sidebarProfilePhoto").forEach((avatar) => {
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
        const isActivityOngoing = (activity, now = new Date()) => {
            const status = String(activity.status || '').trim().toLowerCase();
            if (['ongoing', 'active'].includes(status) || activity.ongoing === true) return true;
            if (['completed', 'cancelled', 'canceled', 'ended'].includes(status)) return false;
            const rawDate = activity.activity_date || activity.activityDate || activity.date;
            if (!rawDate) return false;
            const match = String(rawDate).trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return false;
            const starts = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            const startTime = String(activity.startTime || activity.start_time || '00:00').slice(0, 5);
            const endTime = String(activity.endTime || activity.end_time || '23:59').slice(0, 5);
            const parseTime = (value, fallback) => {
                const parts = value.split(':').map(Number);
                return parts.length >= 2 && parts.every(Number.isFinite) ? [parts[0], parts[1], parts[2] || 0] : fallback;
            };
            const [startHour, startMinute, startSecond] = parseTime(startTime, [0, 0, 0]);
            const [endHour, endMinute, endSecond] = parseTime(endTime, [23, 59, 59]);
            starts.setHours(startHour, startMinute, startSecond, 0);
            const ends = new Date(starts);
            ends.setHours(endHour, endMinute, endSecond, 999);
            if (ends < starts) ends.setDate(ends.getDate() + 1);
            return starts <= now && now <= ends;
        };
        const renderHomeActivities = (activities) => {
            homeActivityBox.replaceChildren();
            if (!activities.length) {
                const empty = document.createElement('div'); empty.className = 'representative-empty rep-empty';
                empty.innerHTML = '<i class="fa-regular fa-calendar"></i><span>No ongoing activity.</span>';
                homeActivityBox.appendChild(empty); return;
            }
            activities.forEach((activity) => {
                const card = document.createElement('article'); card.className = 'dashboard-info-card ongoing-activity-card';
                const content = document.createElement('div'); content.className = 'announcement-content-container activity-content-container';
                const details = document.createElement('div'); details.className = 'announcement-content-details';
                const title = document.createElement('h3'); title.className = 'announcement-content-title'; title.textContent = activity.name || activity.title || 'ACTIVITY';
                const date = document.createElement('span'); date.className = 'announcement-content-date';
                const time = [activity.startTime || activity.start_time || '', activity.endTime || activity.end_time || ''].filter(Boolean).join(' – ');
                date.textContent = [activity.date || activity.activity_date || '', time, activity.venue || activity.venueAddress || activity.venue_address || ''].filter(Boolean).join(' · ');
                const message = document.createElement('p'); message.className = 'announcement-content-message'; message.textContent = activity.description || activity.type || 'Activity is currently in progress.';
                details.append(title, date, message);
                const icon = document.createElement('div'); icon.className = 'announcement-content-image no-image activity-status-icon'; icon.innerHTML = '<i class="fa-solid fa-calendar-check"></i>';
                content.append(details, icon); card.appendChild(content); homeActivityBox.appendChild(card);
            });
        };
        const loadHomeActivities = () => fetch(new URL('admin/api/account_api.php?action=activities', script.src), {credentials:'same-origin', cache:'no-store'})
            .then(async response => { const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load activities.'); const now = new Date(); const activities = (Array.isArray(data.activities) ? data.activities : []).filter(activity => isActivityOngoing(activity, now)); renderHomeActivities(activities); })
            .catch(error => { console.warn('Could not load ongoing activities on home.', error); });
        window.loadBasisHomeActivities = loadHomeActivities;
        loadHomeActivities();
        window.addEventListener('pageshow', loadHomeActivities);
        window.addEventListener('focus', loadHomeActivities);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) loadHomeActivities(); });
        setInterval(loadHomeActivities, 30000);
    }
    const announcementsBox = document.getElementById('announcementsBox');
    if (script && announcementsBox && !window.location.pathname.toLowerCase().includes('/representative/') && !(document.getElementById('openAnnouncementModal') && window.location.pathname.toLowerCase().includes('/admin/'))) {
        const renderAnnouncements = (announcements) => {
            announcementsBox.replaceChildren();
            if (!announcements.length) {
                const empty = document.createElement('div'); empty.className = 'representative-empty';
                const label = document.createElement('span'); label.textContent = 'No announcements yet.'; empty.appendChild(label); announcementsBox.appendChild(empty); return;
            }
            announcements.forEach((announcement) => {
                const card = document.createElement('article'); card.className = 'dashboard-info-card clickable-announcement';
                const content = document.createElement('div'); content.className = 'announcement-content-container';
                const details = document.createElement('div'); details.className = 'announcement-content-details';
                const title = document.createElement('h3'); title.className = 'announcement-content-title'; title.textContent = announcement.title || 'ANNOUNCEMENT';
                const date = document.createElement('span'); date.className = 'announcement-content-date'; date.textContent = announcement.date || announcement.created_at || '';
                const message = document.createElement('p'); message.className = 'announcement-content-message'; message.textContent = announcement.message || '';
                details.append(title, date, message);
                const isImage = String(announcement.attachment_data || '').startsWith('data:image/');
                const media = document.createElement('div'); media.className = `announcement-content-image${isImage ? '' : ' no-image'}`;
                if (isImage) { const image = document.createElement('img'); image.src = announcement.attachment_data; image.alt = announcement.title || 'Announcement attachment'; media.appendChild(image); }
                else { media.innerHTML = '<i class="fa-regular fa-image"></i>'; }
                content.append(details, media); card.appendChild(content);
                if (announcement.attachment_data && !isImage) {
                    const attachment = document.createElement('a'); attachment.className = 'announcement-attachment-link'; attachment.href = announcement.attachment_data; attachment.download = announcement.attachment_name || 'announcement-attachment'; attachment.textContent = `Open attachment: ${announcement.attachment_name || 'file'}`; card.appendChild(attachment);
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
            .then(async response => { const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Announcements could not be loaded.'); const now = new Date(); const announcements = (Array.isArray(data.announcements) ? data.announcements : []).filter(item => { const raw = item.published_at || item.publishedAt || item.created_at || item.createdAt || item.date || item.announcement_date; if (!raw) return false; const value = String(raw).trim(); const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/); const published = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value); if (Number.isNaN(published.getTime()) || published > now) return false; const expires = new Date(published); expires.setDate(expires.getDate() + 14); return now < expires; }); renderAnnouncements(announcements); })
            .catch(error => console.warn('Could not load announcements on home.', error));
        loadAnnouncements();
        window.addEventListener('pageshow', loadAnnouncements);
        window.addEventListener('focus', loadAnnouncements);
        window.addEventListener('storage', event => { if (event.key === 'basisAnnouncementPublished') loadAnnouncements(); });
        setInterval(loadAnnouncements, 30000);
    }
    if (script && (document.querySelector(".header-avatar") || document.querySelector(".welcome-text h1") || document.querySelector(".welcome-copy strong"))) {
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
    
    const historyLinks = [...document.querySelectorAll('a[href*="history"]')]
        .filter(link => !link.querySelector('[data-history-notification-badge]'));
    if (script && historyLinks.length) {
        const updateHistoryNotificationDots = () => fetch(new URL('admin/api/account_api.php?action=notifications', script.src), {credentials:'same-origin',cache:'no-store'})
            .then(response => response.json()).then(data => {
                if (!data.success) return;
                const hasUnread = (data.notifications || []).some(item => !Number(item.isRead));
                historyLinks.forEach(historyLink => {
                    historyLink.classList.toggle('has-new-notifications', hasUnread);
                    if (hasUnread) historyLink.style.position = 'relative';
                    let dot = historyLink.querySelector('.history-notification-dot');
                    if (hasUnread && !dot) {
                        dot = document.createElement('span');
                        dot.className = 'history-notification-dot';
                        dot.setAttribute('aria-label', 'New notifications');
                        historyLink.appendChild(dot);
                    } else if (!hasUnread && dot) {
                        dot.remove();
                    }
                });
            }).catch(() => {});
        updateHistoryNotificationDots();
        document.addEventListener('basis-notifications-updated', updateHistoryNotificationDots);
        window.setInterval(updateHistoryNotificationDots, 15000);
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

    // Specialized modules (such as scholar Activity) own their subview state,
    // including hidden/aria-hidden attributes. Keep this as a fallback only.
    if (typeof window.showSubView !== 'function') {
        window.showSubView = function (viewId) {
            const views = document.querySelectorAll('.page-view');
            views.forEach(view => view.classList.remove('active'));
            const target = document.getElementById(viewId);
            if (target) target.classList.add('active');
            toggleHeaderAvatar(viewId.startsWith('view-profile'));
        };
    }

    // Keep this as a fallback only. Scorecard modules provide a data-aware
    // handler that sets both the academic year and semester for the selected
    // activity period.
    if (typeof window.openScorecardDetail !== 'function') {
        window.openScorecardDetail = function (semesterName) {
            const semTitleElem = document.getElementById('scorecardSemTitle');
            if (semTitleElem) {
                semTitleElem.innerText = String(semesterName || '').toUpperCase();
            }
            showSubView('view-scorecard-detail');
        };
    }

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
    const totalSlides = track ? track.children.length : 0;

    function updateCarousel(index) {
        if (!totalSlides) return;
        index = (index + totalSlides) % totalSlides;
        
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
        if (diffX > 40) {
            updateCarousel(currentIndex + 1);
        } else if (diffX < -40) {
            updateCarousel(currentIndex - 1);
        }
        startX = 0;
        currentX = 0;
    }
});

/* =====================================================
   BASIS — SYNC PROFILE PHOTO TO ALL AVATARS
===================================================== */

(function () {
    const DEFAULT_PHOTO = "../images/profile_default.jpg";

    function getProfileStorageKey() {
        const userId =
            sessionStorage.getItem("basisCurrentUserId") || "guest";

        return `basisProfile_${userId}`;
    }

    function syncProfileAvatars() {
        try {
            const storageKey = getProfileStorageKey();
            const savedProfile = localStorage.getItem(storageKey);

            if (!savedProfile) return;

            const profile = JSON.parse(savedProfile);
            const photo = profile.profilePhoto || "";

            // Update sidebar and topbar avatars only.
            const avatarImages = document.querySelectorAll(
                ".sidebar-profile img, .topbar-avatar img"
            );

            avatarImages.forEach(function (img) {
                if (photo) {
                    img.src = photo;
                } else if (
                    !img.getAttribute("src") ||
                    img.getAttribute("src").trim() === ""
                ) {
                    img.src = DEFAULT_PHOTO;
                }
            });
        } catch (error) {
            console.error("Unable to sync profile avatars:", error);
        }
    }

    // Make the function available to other page scripts.
    window.BASISSyncProfileAvatars = syncProfileAvatars;

    // Load the saved profile picture when a page opens.
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            syncProfileAvatars
        );
    } else {
        syncProfileAvatars();
    }

    // Update avatars immediately after changing the profile photo.
    window.addEventListener(
        "basis:profile-photo-updated",
        syncProfileAvatars
    );

    // Also update if the profile changes in another browser tab.
    window.addEventListener("storage", function (event) {
        if (event.key === getProfileStorageKey()) {
            syncProfileAvatars();
        }
    });
})();
