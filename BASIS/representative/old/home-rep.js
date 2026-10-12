/* =========================================================
   BASIS REPRESENTATIVE HOME
   User No. 2

   Data source:
   - Active users from the representative's assigned barangay via account API

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

    const PROFILE_KEY = `basisProfile_${sessionStorage.getItem('basisCurrentUserId') || 'guest'}`;

    const barangayEl = document.getElementById('representativeBarangay');
    const totalEl = document.getElementById('totalScholars');
    const maleEl = document.getElementById('maleScholars');
    const femaleEl = document.getElementById('femaleScholars');

    const announcementModal=document.getElementById('announcementModal');
    const announcementForm=document.getElementById('announcementForm');
    const announcementFile=document.getElementById('announcementFile');
    const announcementFileName=document.getElementById('announcementFileName');
    const closeAnnouncement=()=>{announcementModal?.classList.remove('show');announcementModal?.setAttribute('aria-hidden','true');document.body.style.overflow='';};
    document.getElementById('openAnnouncementModal')?.addEventListener('click',()=>{const date=document.getElementById('announcementDate');if(date&&!date.value)date.value=new Date().toISOString().slice(0,10);announcementModal?.classList.add('show');announcementModal?.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';});
    document.getElementById('closeAnnouncementModal')?.addEventListener('click',closeAnnouncement);
    document.getElementById('cancelAnnouncement')?.addEventListener('click',closeAnnouncement);
    announcementFile?.addEventListener('change',()=>{if(announcementFileName)announcementFileName.textContent=announcementFile.files?.[0]?.name||'';});
    announcementForm?.addEventListener('submit',async event=>{event.preventDefault();const submit=announcementForm.querySelector('[type=submit]');submit.disabled=true;try{let attachmentData='';const file=announcementFile?.files?.[0];if(file){if(file.size>5*1024*1024)throw new Error('Attachment must be 5 MB or smaller.');attachmentData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read attachment.'));reader.readAsDataURL(file);});}const response=await fetch('../admin/api/account_api.php?action=announcements',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:document.getElementById('announcementTitle').value.trim(),date:document.getElementById('announcementDate').value,message:document.getElementById('announcementMessage').value.trim(),attachment_name:file?.name||'',attachment_data:attachmentData})});const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Announcement could not be published.');announcementForm.reset();closeAnnouncement();localStorage.setItem('basisAnnouncementPublished',String(Date.now()));window.location.reload();}catch(error){alert(error.message);}finally{submit.disabled=false;}});

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

    function normalize(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[‐‑‒–—−]/g, '-')
            .replace(/\s+/g, ' ');
    }

    function getSex(scholar) {
        return normalize(scholar.sex || scholar.gender);
    }

    async function updateRepresentativeDashboard() {
        barangayEl.textContent = 'LOADING…';
        try {
            const response = await fetch('../admin/api/account_api.php?action=representative-dashboard', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load barangay totals.');

            const assignedBarangay = String(data.assignedBarangay || '').trim();
            if (!assignedBarangay) {
                barangayEl.textContent = 'BARANGAY PENDING';
                totalEl.textContent = '0';
                maleEl.textContent = '0';
                femaleEl.textContent = '0';
                return;
            }

            barangayEl.textContent = assignedBarangay.toUpperCase();
            const members = Array.isArray(data.users) ? data.users : [];
            let male = 0;
            let female = 0;

            members.forEach(function (member) {
                const sex = getSex(member);

                if (sex === 'male' || sex === 'm') {
                    male++;
                } else if (sex === 'female' || sex === 'f') {
                    female++;
                }
            });

            totalEl.textContent = members.length;
            maleEl.textContent = male;
            femaleEl.textContent = female;
        } catch (error) {
            barangayEl.textContent = 'UNAVAILABLE';
            totalEl.textContent = '—';
            maleEl.textContent = '—';
            femaleEl.textContent = '—';
            console.error(error);
        }
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
        if (event.key === PROFILE_KEY) {
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
