/* =========================================================
   BASIS ADMIN HOME
========================================================= */


/* =========================================================
   BAGAC BARANGAYS
========================================================= */

const BAGAC_BARANGAYS = [
    "Bagumbayan",
    "Banawang",
    "Binuangan",
    "Binukawan",
    "Ibaba",
    "Ibis",
    "Pag-asa",
    "Parang",
    "Paysawan",
    "Quinawan",
    "San Antonio",
    "Saysain",
    "Tabing-ilog",
    "Atilano Ricardo"
];

let dashboardUsers = null;
let dashboardLoadError = "";


/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStorageData(keys, fallback = []) {

    for (const key of keys) {

        const saved = localStorage.getItem(key);

        if (!saved) continue;

        try {

            const data = JSON.parse(saved);

            if (data !== null && data !== undefined) {
                return data;
            }

        } catch (error) {

            console.error(
                "Unable to read:",
                key,
                error
            );

        }
    }

    return fallback;
}


/* =========================================================
   GET SCHOLARS
========================================================= */

function getScholars() {

    if (Array.isArray(dashboardUsers)) {
        return dashboardUsers;
    }
    return [];
}


/* =========================================================
   NORMALIZE SCHOLAR
========================================================= */

function normalizeScholar(scholar) {

    const sex = String(
        scholar.sex ||
        scholar.gender ||
        ""
    )
        .trim()
        .toUpperCase();


    const municipality =
        scholar.municipality ||
        "BAGAC";


    const barangay =
        scholar.barangay ||
        scholar.assignedBarangay ||
        scholar.assigned_barangay ||
        "";


    return {
        ...scholar,

        sex,

        municipality,

        barangay
    };
}


/* =========================================================
   GET ALL REGISTERED USERS
========================================================= */

function getDashboardUsers() {
    return getScholars()
        .map(normalizeScholar)
        .filter(function (user) {
            const status = String(user.status || "ACTIVE").trim().toUpperCase();
            return status === "ACTIVE";
        });
}


/* =========================================================
   OVERALL STATISTICS
========================================================= */

function renderOverallStatistics() {

    if (!Array.isArray(dashboardUsers)) {
        ["totalUsers", "maleUsers", "femaleUsers", "barangaySummaryTotal", "barangaySummaryMale", "barangaySummaryFemale"].forEach(function (id) {
            const element = document.getElementById(id);
            if (element) element.textContent = "—";
        });
        return;
    }

    const users =
        getDashboardUsers();


    // Match User Management while excluding inactive accounts.
    const totalUsers = users.length;


    const male =
        users.filter(function (user) {

            return (
                user.sex === "MALE" ||
                user.sex === "M"
            );

        }).length;


    const female =
        users.filter(function (user) {

            return (
                user.sex === "FEMALE" ||
                user.sex === "F"
            );

        }).length;


    /* -----------------------------------------
       ORIGINAL ADMIN SUMMARY
    ----------------------------------------- */

    const totalElement =
        document.getElementById(
            "totalUsers"
        );

    const maleElement =
        document.getElementById(
            "maleUsers"
        );

    const femaleElement =
        document.getElementById(
            "femaleUsers"
        );


    if (totalElement) {
        totalElement.textContent = totalUsers;
    }


    if (maleElement) {
        maleElement.textContent = male;
    }


    if (femaleElement) {
        femaleElement.textContent = female;
    }


    /* -----------------------------------------
       COMPACT BARANGAY SUMMARY
    ----------------------------------------- */

    const barangayTotal =
        document.getElementById(
            "barangaySummaryTotal"
        );


    const barangayMale =
        document.getElementById(
            "barangaySummaryMale"
        );


    const barangayFemale =
        document.getElementById(
            "barangaySummaryFemale"
        );


    if (barangayTotal) {
        barangayTotal.textContent = totalUsers;
    }


    if (barangayMale) {
        barangayMale.textContent = male;
    }


    if (barangayFemale) {
        barangayFemale.textContent = female;
    }
}


/* =========================================================
   BARANGAY STATISTICS
========================================================= */

function renderBarangayStatistics() {

    const container =
        document.getElementById(
            "barangayContainer"
        );


    if (!container) return;

    if (!Array.isArray(dashboardUsers)) {
        container.innerHTML = `<p class="dashboard-load-error">${escapeHtml(dashboardLoadError || "Loading user totals…")}</p>`;
        return;
    }


    const users =
        getDashboardUsers();


    container.innerHTML = "";


    BAGAC_BARANGAYS.forEach(function (barangay) {

        const barangayUsers =
            users.filter(function (user) {

                return String(
                    user.barangay || ""
                )
                    .trim()
                    .toLowerCase() ===
                    barangay.toLowerCase();

            });


        const total =
            barangayUsers.length;


        const male =
            barangayUsers.filter(function (user) {

                return (
                    user.sex === "MALE" ||
                    user.sex === "M"
                );

            }).length;


        const female =
            barangayUsers.filter(function (user) {

                return (
                    user.sex === "FEMALE" ||
                    user.sex === "F"
                );

            }).length;


        const card =
            document.createElement("div");


        card.className =
            "barangay-card";


        card.innerHTML = `

            <h3>
                ${escapeHtml(barangay)}
            </h3>

            <div class="barangay-numbers">

                <div class="barangay-stat total">

                    <span>TOTAL</span>

                    <strong>
                        ${total}
                    </strong>

                </div>


                <div class="barangay-stat">

                    <span>MALE</span>

                    <strong>
                        ${male}
                    </strong>

                </div>


                <div class="barangay-stat">

                    <span>FEMALE</span>

                    <strong>
                        ${female}
                    </strong>

                </div>

            </div>
        `;


        container.appendChild(card);

    });
}


/* =========================================================
   GET ACTIVITIES
========================================================= */

function getActivities() {

    const data = getStorageData([
        "basisActivities",
        "adminActivities",
        "activities",
        "basisAdminActivities",
        "basisRepresentativeHistory"
    ], []);


    if (Array.isArray(data)) {

        /*
            If history contains mixed records,
            keep activities only.
        */

        return data.filter(function (item) {

            return (
                !item.type ||
                String(item.type)
                    .toLowerCase() ===
                    "activity"
            );

        });

    }


    if (
        data &&
        Array.isArray(data.activities)
    ) {
        return data.activities;
    }


    return [];
}


/* =========================================================
   FIND LATEST ACTIVITY
========================================================= */

function getLatestActivity() {

    const activities =
        getActivities();


    if (!activities.length) {
        return null;
    }


    const sorted =
        [...activities].sort(function (a, b) {

            const dateA = new Date(
                a.createdAt ||
                a.created_at ||
                a.date ||
                a.activityDate ||
                0
            ).getTime();


            const dateB = new Date(
                b.createdAt ||
                b.created_at ||
                b.date ||
                b.activityDate ||
                0
            ).getTime();


            return dateB - dateA;

        });


    return sorted[0];
}


/* =========================================================
   GET ATTENDANCE FOR ACTIVITY
========================================================= */

function getActivityAttendance(activity) {

    /*
        Try attendance stored directly
        inside the activity.
    */

    if (
        Array.isArray(activity.attendance)
    ) {

        return activity.attendance;

    }


    if (
        Array.isArray(activity.participants)
    ) {

        return activity.participants;

    }


    if (
        Array.isArray(activity.attendanceRecords)
    ) {

        return activity.attendanceRecords;

    }


    /*
        Try shared attendance storage.
    */

    const attendance =
        getStorageData([
            "basisAttendance",
            "attendance",
            "adminAttendance",
            "basisAdminAttendance"
        ], []);


    if (!Array.isArray(attendance)) {
        return [];
    }


    const activityId =
        activity.id ||
        activity.activityId;


    const activityTitle =
        String(
            activity.title ||
            activity.name ||
            ""
        )
            .trim()
            .toLowerCase();


    return attendance.filter(
        function (record) {

            const recordActivityId =
                record.activityId ||
                record.activity_id;


            const recordTitle =
                String(
                    record.activityTitle ||
                    record.title ||
                    record.activityName ||
                    record.name ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                activityId !== undefined &&
                activityId !== null &&
                String(recordActivityId) ===
                String(activityId)
            ) {
                return true;
            }


            if (
                activityTitle &&
                recordTitle &&
                activityTitle === recordTitle
            ) {
                return true;
            }


            return false;

        }
    );
}


/* =========================================================
   ATTENDANCE STATUS
========================================================= */

function isAttended(record) {

    const status =
        String(
            record.status ||
            record.attendanceStatus ||
            record.state ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        status === "absent" ||
        status === "not attended"
    ) {
        return false;
    }


    /*
        If the record has a time-in,
        treat it as attended.
    */

    if (
        record.timeIn ||
        record.time_in ||
        record.attended === true ||
        record.present === true
    ) {
        return true;
    }


    /*
        If no status is provided,
        an attendance record itself
        represents an attendee.
    */

    return true;
}


/* =========================================================
   LATEST ACTIVITY PARTICIPATION
========================================================= */

function renderLatestActivity() {

    const titleElement =
        document.getElementById(
            "latestActivityTitle"
        );


    const totalElement =
        document.getElementById(
            "latestTotalParticipants"
        );


    const attendedElement =
        document.getElementById(
            "latestAttended"
        );


    const absentElement =
        document.getElementById(
            "latestAbsent"
        );


    /* Safety check */

    if (
        !titleElement ||
        !totalElement ||
        !attendedElement ||
        !absentElement
    ) {
        return;
    }


    const activity =
        getLatestActivity();


    if (!activity) {

        titleElement.textContent =
            "NO ACTIVITY YET";

        totalElement.textContent = "0";
        attendedElement.textContent = "0";
        absentElement.textContent = "0";

        return;
    }


    const title =
        activity.title ||
        activity.name ||
        "ACTIVITY";


    titleElement.textContent =
        String(title).toUpperCase();


    const attendance =
        getActivityAttendance(activity);


    /*
        If activity already contains
        explicit totals, use them.
    */

    let attended =
        Number(
            activity.attended ??
            activity.attendedCount ??
            NaN
        );


    let absent =
        Number(
            activity.absent ??
            activity.absentCount ??
            NaN
        );


    let total =
        Number(
            activity.totalParticipants ??
            activity.total ??
            activity.participantsCount ??
            NaN
        );


    /*
        Otherwise calculate from records.
    */

    if (
        Number.isNaN(attended)
    ) {

        attended =
            attendance.filter(
                isAttended
            ).length;

    }


    if (
        Number.isNaN(absent)
    ) {

        absent =
            attendance.filter(
                function (record) {

                    return !isAttended(record);

                }
            ).length;

    }


    if (
        Number.isNaN(total)
    ) {

        total =
            attended + absent;

    }


    totalElement.textContent =
        total;


    attendedElement.textContent =
        attended;


    absentElement.textContent =
        absent;
}

async function refreshLatestActivity() {
    try {
        const response = await fetch('api/account_api.php?action=admin-dashboard', {credentials:'same-origin',cache:'no-store'});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not load activity participation.');
        const title=document.getElementById('latestActivityTitle');
        const total=document.getElementById('latestTotalParticipants');
        const attended=document.getElementById('latestAttended');
        const absent=document.getElementById('latestAbsent');
        if(title)title.textContent=data.activity?.name ? String(data.activity.name).toUpperCase() : 'NO ACTIVITY YET';
        if(total)total.textContent=Number(data.totalParticipants||0);
        if(attended)attended.textContent=Number(data.attended||0);
        if(absent)absent.textContent=Number(data.absent||0);
    } catch(error) {
        console.warn('Could not refresh latest activity participation:',error.message);
    }
}


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

function getAnnouncements() {

    const data =
        getStorageData([
            "basisAnnouncements",
            "adminAnnouncements",
            "announcements",
            "basisAdminAnnouncements"
        ], []);


    if (Array.isArray(data)) {
        return data;
    }


    if (
        data &&
        Array.isArray(data.announcements)
    ) {
        return data.announcements;
    }


    return [];
}


function renderAnnouncements() {

    /*
        Support both the original HTML IDs
        and the compact/generated IDs.
    */

    const container =
        document.getElementById(
            "announcementsContainer"
        ) ||
        document.getElementById(
            "announcementsBox"
        );


    if (!container) return;


    container.innerHTML = '<div class="announcement-empty"><span>Loading announcements…</span></div>';
    fetch('api/account_api.php?action=announcements', {credentials:'same-origin',cache:'no-store'})
        .then(async response => { const data=await response.json(); if(!response.ok||!data.success)throw new Error(data.message||'Unable to load announcements.'); return Array.isArray(data.announcements)?data.announcements:[]; })
        .then(announcements => {
    container.innerHTML = "";
    if (!announcements.length) {
        container.innerHTML = '<div class="announcement-empty"><i class="fa-regular fa-bell"></i><span>No announcements yet.</span><small>Click the + button to create an announcement.</small></div>';
        return;
    }
    announcements.forEach(function (announcement) {

        const card =
            document.createElement("div");


        card.className =
            "dashboard-info-card";
        card.classList.add("clickable-announcement");
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        const openAnnouncement = () => {
            if (!announcement.id) return;
            sessionStorage.setItem("basisSelectedAnnouncementId", String(announcement.id));
            window.location.href = "history-admin.html";
        };
        card.addEventListener("click", event => { if (!event.target.closest("a")) openAnnouncement(); });
        card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAnnouncement(); } });


        const title =
            announcement.title ||
            "ANNOUNCEMENT";


        const description =
            announcement.message ||
            announcement.description ||
            announcement.body ||
            announcement.content ||
            "";


        const date =
            announcement.date ||
            announcement.createdAt ||
            announcement.created_at ||
            "";


        // card.innerHTML = `

        //     <h3>
        //         ${escapeHtml(title)}
        //     </h3>

        //     <p>
        //         ${escapeHtml(description)}
        //     </p>

        //     ${
        //         date
        //             ? `
        //                 <div class="dashboard-info-meta">
        //                     ${escapeHtml(formatDate(date))}
        //                 </div>
        //               `
        //             : ""
        //     }

        // `;

                const attachmentName =
            announcement.attachment_name || "";

        const attachmentData =
            announcement.attachment_data || "";

        const isImage =
            attachmentData &&
            /\.(jpg|jpeg|png|gif|webp)$/i.test(
                attachmentName
            );

        card.innerHTML = `
            <div class="announcement-content-container">

                <!-- LEFT SIDE -->
                <div class="announcement-content-details">

                    <h3 class="announcement-content-title">
                        ${escapeHtml(title)}
                    </h3>

                    ${
                        date
                            ? `
                            <span class="announcement-content-date">
                                ${escapeHtml(formatDate(date))}
                            </span>
                            `
                            : ""
                    }

                    <p class="announcement-content-message">
                        ${escapeHtml(description)}
                    </p>

                </div>


                <!-- RIGHT SIDE -->
                ${
                    isImage
                        ? `
                        <div class="announcement-content-image">

                            <img
                                src="${attachmentData}"
                                alt="${escapeHtml(title)}"
                            >

                        </div>
                        `
                        : `
                        <div class="announcement-content-image no-image">

                            <i class="fa-regular fa-image"></i>

                        </div>
                        `
                }

            </div>
        `;

        // if (announcement.attachment_data) {
        //     const link = document.createElement('a');
        //     link.className = 'announcement-attachment';
        //     link.href = announcement.attachment_data;
        //     link.download = announcement.attachment_name || 'announcement-attachment';
        //     link.textContent = `Open attachment: ${announcement.attachment_name || 'file'}`;
        //     card.appendChild(link);
        // }


        container.appendChild(card);

    });
        })
        .catch(error => { console.warn('Unable to load announcements:',error.message); container.replaceChildren(); const status=document.createElement('div');status.className='announcement-empty';status.textContent=error.message||'Unable to load announcements.';container.appendChild(status); });
}


/* =========================================================
   ONGOING ACTIVITIES
========================================================= */

function renderOngoingActivities() {

    /*
        Support both the original HTML IDs
        and the compact/generated IDs.
    */

    const container =
        document.getElementById(
            "ongoingActivityContainer"
        ) ||
        document.getElementById(
            "activityBox"
        );


    if (!container) return;


    const activities =
        getActivities();


    const ongoing =
        activities.filter(
            function (activity) {

                const status =
                    String(
                        activity.status ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    status === "ongoing" ||
                    status === "active" ||
                    activity.ongoing === true
                );

            }
        );


    container.innerHTML = "";


    if (!ongoing.length) {

        container.innerHTML = `
            <div class="empty-message">
                No ongoing activity.
            </div>
        `;

        return;
    }


    ongoing.forEach(function (activity) {

        const card =
            document.createElement("div");


        card.className =
            "dashboard-info-card";


        card.innerHTML = `

            <h3>
                ${escapeHtml(
                    activity.title ||
                    activity.name ||
                    "ACTIVITY"
                )}
            </h3>

            <p>
                ${
                    escapeHtml(
                        activity.description ||
                        activity.venue ||
                        "Activity is currently ongoing."
                    )
                }
            </p>

            <div class="dashboard-info-meta">

                ${
                    escapeHtml(
                        activity.date ||
                        activity.activityDate ||
                        ""
                    )
                }

            </div>

        `;


        container.appendChild(card);

    });
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) return "";


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAdminDashboard() {

    renderOverallStatistics();

    renderBarangayStatistics();

    renderLatestActivity();
    refreshLatestActivity();

    renderAnnouncements();

    renderOngoingActivities();
}

async function refreshDashboardUsers() {
    try {
        const response = await fetch("api/user_api.php?action=list", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.users)) {
            throw new Error(data.message || "Unable to load user data.");
        }

        dashboardUsers = data.users;
        dashboardLoadError = "";
        renderAdminDashboard();
    } catch (error) {
        console.error("Unable to refresh admin dashboard users:", error);
        dashboardUsers = null;
        dashboardLoadError = error.message || "User totals could not be loaded. Check your sign-in.";
        renderAdminDashboard();
    }
}


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderAdminDashboard();
        refreshDashboardUsers();

    }
);


/* =========================================================
   REFRESH WHEN RETURNING TO PAGE
========================================================= */

window.addEventListener(
    "pageshow",
    function () {

        refreshDashboardUsers();

    }
);


/* =========================================================
   AUTOMATIC UPDATE
========================================================= */

window.addEventListener(
    "storage",
    function (event) {

        const watchedKeys = [

            "basisAdminScholars",
            "adminScholars",
            "basisScholars",
            "scholars",

            "basisActivities",
            "adminActivities",
            "activities",
            "basisAdminActivities",

            "basisAttendance",
            "attendance",
            "adminAttendance",

            "basisAnnouncements",
            "adminAnnouncements",
            "announcements"

        ];


        if (
            watchedKeys.includes(
                event.key
            )
        ) {

            renderAdminDashboard();

        }

    }
);


/* =========================================================
   LIVE REFRESH
=========================================================

   This is useful while developing locally.
   It makes the dashboard update even when
   another page modifies localStorage in
   the same browser tab/window flow.
========================================================= */

setInterval(
    refreshDashboardUsers,
    10000
);

/* =========================================================
   CREATE ANNOUNCEMENT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("announcementModal");

    const openBtn =
        document.getElementById("openAnnouncementModal");

    const closeBtn =
        document.getElementById("closeAnnouncementModal");

    const cancelBtn =
        document.getElementById("cancelAnnouncement");

    const overlay =
        document.querySelector(".announcement-modal-overlay");

    const form =
        document.getElementById("announcementForm");

    const fileInput =
        document.getElementById("announcementFile");

    const fileName =
        document.getElementById("announcementFileName");


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openAnnouncementModal() {

        if (!modal) return;

        modal.classList.add("show");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";


        /* Automatically set today's date */

        const dateInput =
            document.getElementById("announcementDate");

        if (dateInput && !dateInput.value) {

            const today =
                new Date().toISOString().split("T")[0];

            dateInput.value = today;

        }

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeAnnouncementModal() {

        if (!modal) return;

        modal.classList.remove("show");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

    }


    /* =====================================================
       BUTTON EVENTS
    ===================================================== */

    if (openBtn) {

        openBtn.addEventListener(
            "click",
            openAnnouncementModal
        );

    }


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeAnnouncementModal
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            closeAnnouncementModal
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeAnnouncementModal
        );

    }


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            modal &&
            modal.classList.contains("show")
        ) {

            closeAnnouncementModal();

        }

    });


    /* =====================================================
       FILE NAME
    ===================================================== */

    if (fileInput) {

        fileInput.addEventListener("change", () => {

            if (
                fileInput.files &&
                fileInput.files.length > 0
            ) {

                fileName.textContent =
                    fileInput.files[0].name;

            } else {

                fileName.textContent =
                    "PNG, JPG, PDF, DOCX and other files";

            }

        });

    }


    /* =====================================================
       PUBLISH
    ===================================================== */

    if (form) {

        form.addEventListener("submit", async (event) => {

            event.preventDefault();


            const title =
                document
                    .getElementById("announcementTitle")
                    .value
                    .trim();

            const date =
                document
                    .getElementById("announcementDate")
                    .value;

            const message =
                document
                    .getElementById("announcementMessage")
                    .value
                    .trim();


            if (!title || !date || !message) {

                alert(
                    "Please complete the announcement details."
                );

                return;

            }


            const publishButton=form.querySelector('[type="submit"]');
            if(publishButton){publishButton.disabled=true;publishButton.textContent='PUBLISHING…';}
            try {
                let attachmentData='',attachmentName='';
                const file=fileInput?.files?.[0];
                if(file){
                    if(file.size>5*1024*1024)throw new Error('Announcement attachments must be 5 MB or smaller.');
                    attachmentName=file.name;
                    attachmentData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Could not read the attachment.'));reader.readAsDataURL(file);});
                }
                const response=await fetch('api/account_api.php?action=announcements',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,date,message,attachment_name:attachmentName,attachment_data:attachmentData})});
                const result=await response.json();
                if(!response.ok||!result.success)throw new Error(result.message||'Announcement could not be published.');
                localStorage.setItem('basisAnnouncementPublished',String(Date.now()));
                renderAnnouncements();
                form.reset();
                if(fileName)fileName.textContent='PNG, JPG, PDF, DOCX and other files (up to 5 MB)';
                closeAnnouncementModal();
            } catch(error) {
                alert(error.message||'Announcement could not be published.');
            } finally {
                if(publishButton){publishButton.disabled=false;publishButton.textContent='PUBLISH';}
            }

        });

    }


    /* =====================================================
       ADD ANNOUNCEMENT CARD
    ===================================================== */

    function addAnnouncementCard(
        title,
        date,
        message,
        fileInput
    ) {

        const container =
            document.getElementById(
                "announcementsBox"
            );

        if (!container) return;


        /* Remove empty state */

        const empty =
            container.querySelector(
                ".announcement-empty"
            );

        if (empty) {

            empty.remove();

        }


        const card =
            document.createElement("div");

        card.className =
            "announcement-card";


        const formattedDate =
            new Date(date).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );


        card.innerHTML = `

            <div class="announcement-card-header">

                <h3 class="announcement-card-title">
                    ${escapeHTML(title)}
                </h3>

                <span class="announcement-card-date">
                    ${formattedDate}
                </span>

            </div>

            <p class="announcement-card-message">
                ${escapeHTML(message)}
            </p>

        `;


        /* Attachment */

        if (
            fileInput &&
            fileInput.files &&
            fileInput.files.length > 0
        ) {

            const file =
                fileInput.files[0];


            const attachment =
                document.createElement("div");


            attachment.className =
                "announcement-attachment";


            attachment.innerHTML = `

                <i class="fa-solid fa-paperclip"></i>

                ${escapeHTML(file.name)}

            `;


            card.appendChild(attachment);

        }


        container.prepend(card);

    }


    /* =====================================================
       BASIC HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }

});
