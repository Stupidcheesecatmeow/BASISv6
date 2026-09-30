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


    const announcements =
        getAnnouncements();


    container.innerHTML = "";


    if (!announcements.length) {

        container.innerHTML = `
            <div class="empty-message">
                No announcements yet.
            </div>
        `;

        return;
    }


    const sorted =
        [...announcements].sort(
            function (a, b) {

                return new Date(
                    b.createdAt ||
                    b.created_at ||
                    b.date ||
                    0
                ) -
                new Date(
                    a.createdAt ||
                    a.created_at ||
                    a.date ||
                    0
                );

            }
        );


    sorted.forEach(function (announcement) {

        const card =
            document.createElement("div");


        card.className =
            "dashboard-info-card";


        const title =
            announcement.title ||
            "ANNOUNCEMENT";


        const description =
            announcement.description ||
            announcement.body ||
            announcement.content ||
            "";


        const date =
            announcement.date ||
            announcement.createdAt ||
            announcement.created_at ||
            "";


        card.innerHTML = `

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(description)}
            </p>

            ${
                date
                    ? `
                        <div class="dashboard-info-meta">
                            ${escapeHtml(formatDate(date))}
                        </div>
                      `
                    : ""
            }

        `;


        container.appendChild(card);

    });
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
