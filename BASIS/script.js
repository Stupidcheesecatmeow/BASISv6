document.addEventListener("DOMContentLoaded", function () {
    
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

    window.openActivityDetail = function () {
        showSubView('view-activity-detail');
    };

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