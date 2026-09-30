/* =========================================================
   BASIS REPRESENTATIVE HOME
   User No. 2

   Data source:
   - Current scholar: localStorage key `basisScholarProfile`
   - Admin scholar list: localStorage key `basisAdminScholars`

   Expected admin scholar object example:
   {
       fullName: "Juan Dela Cruz",
       barangay: "Banawang",
       sex: "Male",
       registrationStatus: "approved",
       studentStatus: "ACTIVE"
   }
========================================================= */

(function () {
    'use strict';

    const PROFILE_KEY = `basisProfile_${localStorage.getItem('basisCurrentUserId') || 'guest'}`;
    const ADMIN_SCHOLARS_KEY = 'basisAdminScholars';

    const barangayEl = document.getElementById('representativeBarangay');
    const totalEl = document.getElementById('totalScholars');
    const maleEl = document.getElementById('maleScholars');
    const femaleEl = document.getElementById('femaleScholars');

    const BARANGAYS = [
        'Bagumbayan',
        'Banawang',
        'Binuangan',
        'Binukawan',
        'Ibaba',
        'Ibis',
        'Pagasa',
        'Parang',
        'Paysawan',
        'Quinawan',
        'San Antonio',
        'Saysain',
        'Tabing-ilog',
        'Atilano Ricardo'
    ];

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            if (!value) return fallback;
            return JSON.parse(value);
        } catch (error) {
            console.warn('Unable to read localStorage:', key, error);
            return fallback;
        }
    }

    function normalize(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[‐‑‒–—−]/g, '-')
            .replace(/\s+/g, ' ');
    }

    function getCurrentProfile() {
        return readJSON(PROFILE_KEY, null);
    }

    function getAssignedBarangay(profile) {
        if (!profile) return '';

        return String(
            profile.barangay ||
            profile.barangayName ||
            profile.assignedBarangay ||
            ''
        ).trim();
    }

    function getAdminScholars(profile) {
        const list = readJSON(ADMIN_SCHOLARS_KEY, []);

        if (Array.isArray(list) && list.length) {
            return list;
        }

        /*
           Temporary local fallback:
           If the admin list has not been created yet, use the current
           approved profile so the representative page can still display.
        */
        if (profile && profile.registrationStatus === 'approved') {
            return [profile];
        }

        return [];
    }

    function isApproved(scholar) {
        const status = normalize(
            scholar.registrationStatus ||
            scholar.approvalStatus ||
            scholar.status
        );

        return status === 'approved' || status === 'active';
    }

    function getSex(scholar) {
        return normalize(scholar.sex || scholar.gender);
    }

    function updateRepresentativeDashboard() {
        const profile = getCurrentProfile();
        const assignedBarangay = getAssignedBarangay(profile);

        /* No barangay assigned by admin yet */
        if (!assignedBarangay) {
            barangayEl.textContent = 'BARANGAY PENDING';
            totalEl.textContent = '0';
            maleEl.textContent = '0';
            femaleEl.textContent = '0';
            return;
        }

        barangayEl.textContent = assignedBarangay.toUpperCase();

        const scholars = getAdminScholars(profile);
        const target = normalize(assignedBarangay);

        const assignedScholars = scholars.filter(function (scholar) {
            if (!isApproved(scholar)) return false;

            const scholarBarangay = normalize(
                scholar.barangay ||
                scholar.barangayName ||
                scholar.assignedBarangay
            );

            return scholarBarangay === target;
        });

        let male = 0;
        let female = 0;

        assignedScholars.forEach(function (scholar) {
            const sex = getSex(scholar);

            if (sex === 'male' || sex === 'm') {
                male++;
            } else if (sex === 'female' || sex === 'f') {
                female++;
            }
        });

        totalEl.textContent = assignedScholars.length;
        maleEl.textContent = male;
        femaleEl.textContent = female;
    }

    /* =====================================================
       CAROUSEL
    ===================================================== */

    function initCarousel() {
        const track = document.getElementById('carouselTrack');
        const dots = Array.from(document.querySelectorAll('#carouselDots .dot'));
        const prev = document.getElementById('carouselPrev');
        const next = document.getElementById('carouselNext');

        if (!track || !dots.length) return;

        let currentIndex = 0;
        const totalSlides = track.children.length;

        function showSlide(index) {
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;

            currentIndex = index;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';

            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        prev?.addEventListener('click', function () {
            showSlide(currentIndex - 1);
        });

        next?.addEventListener('click', function () {
            showSlide(currentIndex + 1);
        });

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.dataset.index));
            });
        });

        showSlide(0);
    }

    /* =====================================================
       LIVE UPDATE
       Useful while testing with the admin page in another tab.
    ===================================================== */

    window.addEventListener('storage', function (event) {
        if (event.key === PROFILE_KEY || event.key === ADMIN_SCHOLARS_KEY) {
            updateRepresentativeDashboard();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            updateRepresentativeDashboard();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        updateRepresentativeDashboard();
        initCarousel();
    });
})();
