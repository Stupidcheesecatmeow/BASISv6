/* =========================================================
   BASIS - ADMIN SCORECARD
   SAME LOGIC AS REPRESENTATIVE SCORECARD
   ADMIN PROFILE ONLY
   ========================================================= */


/* =========================================================
   GET REGISTERED ADMIN
========================================================= */

function getRegisteredAdmin() {

    /*
        Admin profile/registration
        should be saved in localStorage.

        Supported keys:

        basisAdminProfile
        adminProfile
        basisAdmin
    */

    const keys = [

        "basisAdminProfile",

        "adminProfile",

        "basisAdmin"

    ];


    for (const key of keys) {

        const saved =
            localStorage.getItem(key);


        if (!saved) {

            continue;

        }


        try {

            const admin =
                JSON.parse(saved);


            if (
                admin &&
                typeof admin === "object"
            ) {

                return admin;

            }


        } catch (error) {

            console.error(
                "Unable to read admin profile:",
                error
            );

        }

    }


    return null;

}


/* =========================================================
   SAMPLE ACTIVITY DATA

   These are temporary.

   If the Admin profile already contains:

   activities
   attendance
   userActivities
   activityRecords

   those records will be used instead.
========================================================= */

const adminActivities = [

    {
        ay: "2026–2027",
        semester: "First Semester",
        title: "General Assembly & Orientation",
        date: "2026-08-15"
    },

    {
        ay: "2026–2027",
        semester: "First Semester",
        title: "Tree Planting Activity",
        date: "2026-09-10"
    },

    {
        ay: "2026–2027",
        semester: "First Semester",
        title: "Community Leadership Workshop",
        date: "2026-10-05"
    }

];


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderScorecardButtons();

    }
);


/* =========================================================
   RENDER SCORECARD LIST
   SAME LOGIC AS REPRESENTATIVE
========================================================= */

function renderScorecardButtons() {

    const listContainer =
        document.querySelector(
            ".scorecard-list"
        );


    if (!listContainer) {

        return;

    }


    /* CLEAR */

    listContainer.innerHTML = "";


    /* =====================================================
       CHECK ADMIN REGISTRATION
    ===================================================== */

    const currentAdmin =
        getRegisteredAdmin();


    /* =====================================================
       NOT REGISTERED
    ===================================================== */

    if (!currentAdmin) {

        showNoScorecardMessage();

        return;

    }


    /* =====================================================
       GET AY + SEMESTER
    ===================================================== */

    const academicYear =

        currentAdmin.academicYear ||

        currentAdmin.ay ||

        currentAdmin.schoolYear;


    const semester =

        currentAdmin.semester;


    /* =====================================================
       INCOMPLETE REGISTRATION
    ===================================================== */

    if (
        !academicYear ||
        !semester
    ) {

        showNoScorecardMessage();

        return;

    }


    /* =====================================================
       CREATE SCORECARD BUTTON
    ===================================================== */

    const button =
        document.createElement("button");


    button.type = "button";


    button.className =
        "scorecard-btn";


    button.textContent =
        `${academicYear} ${String(
            semester
        ).toUpperCase()} SCORECARD`;


    button.addEventListener(

        "click",

        function () {

            openScorecardDetail(
                academicYear,
                semester
            );

        }

    );


    listContainer.appendChild(
        button
    );


    updateScorecardScroll();

}


/* =========================================================
   NO SCORECARD MESSAGE
========================================================= */

function showNoScorecardMessage() {

    const listContainer =
        document.querySelector(
            ".scorecard-list"
        );


    if (!listContainer) {

        return;

    }


    listContainer.innerHTML = `

        <div class="no-scorecard-message">

            <i class="fa-solid fa-file-circle-xmark"></i>

            <h3>
                No available scorecards yet.
            </h3>

            <p>
                Please complete your Profile first.
            </p>

        </div>

    `;


    updateScorecardScroll();

}


/* =========================================================
   OPEN SCORECARD DETAIL
   SAME LOGIC AS REPRESENTATIVE
========================================================= */

function openScorecardDetail(
    academicYear,
    semester
) {


    /* =====================================================
       CHECK ADMIN AGAIN
    ===================================================== */

    const currentAdmin =
        getRegisteredAdmin();


    if (!currentAdmin) {

        return;

    }


    /* =====================================================
       LOAD ADMIN PROFILE
    ===================================================== */

    loadAdminInfo(
        currentAdmin
    );


    /* =====================================================
       UPDATE AY
    ===================================================== */

    const ayTitle =
        document.getElementById(
            "scorecardAYTitle"
        );


    if (ayTitle) {

        ayTitle.textContent =
            `AY: ${academicYear}`;

    }


    /* =====================================================
       UPDATE SEMESTER
    ===================================================== */

    const semTitle =
        document.getElementById(
            "scorecardSemTitle"
        );


    if (semTitle) {

        semTitle.textContent =
            String(
                semester
            ).toUpperCase();

    }


    /* =====================================================
       GET ADMIN ACTIVITIES
    ===================================================== */

    let activities = [];


    if (
        Array.isArray(
            currentAdmin.activities
        )
    ) {

        activities =
            currentAdmin.activities;

    }

    else if (
        Array.isArray(
            currentAdmin.attendance
        )
    ) {

        activities =
            currentAdmin.attendance;

    }

    else if (
        Array.isArray(
            currentAdmin.userActivities
        )
    ) {

        activities =
            currentAdmin.userActivities;

    }

    else if (
        Array.isArray(
            currentAdmin.activityRecords
        )
    ) {

        activities =
            currentAdmin.activityRecords;

    }

    else {

        activities =
            adminActivities;

    }


    /* =====================================================
       FILTER BY AY + SEMESTER
    ===================================================== */

    const attendedActivities =
        activities.filter(

            function (activity) {

                const activityAY =
                    activity.ay ||
                    activity.academicYear;


                const activitySemester =
                    activity.semester;


                return (

                    activityAY ===
                        academicYear &&

                    activitySemester ===
                        semester

                );

            }

        );


    /* =====================================================
       POPULATE ACTIVITY ROWS
    ===================================================== */

    populateActivityRows(
        attendedActivities
    );


    /* =====================================================
       SHOW DETAIL VIEW
    ===================================================== */

    showSubView(
        "view-scorecard-detail"
    );

}


/* =========================================================
   LOAD ADMIN INFORMATION
========================================================= */

function loadAdminInfo(
    user
) {

    const fields = {

        "info-name":

            user.name ||

            user.fullName ||

            buildAdminName(user),


        "info-sex":

            user.sex,


        "info-birthday":

            user.birthday,


        "info-religion":

            user.religion,


        "info-email":

            user.email,


        "info-contact":

            user.contact ||

            user.contactNo ||

            user.contactNumber,


        "info-municipality":

            user.municipality,


        "info-barangay":

            user.barangay ||

            user.assignedBarangay,


        "info-father":

            user.fatherName,


        "info-father-contact":

            user.fatherContact,


        "info-mother":

            user.motherName,


        "info-mother-contact":

            user.motherContact,


        "info-siblings":

            user.siblings,


        "info-school":

            user.school,


        "info-program":

            user.program,


        "info-year":

            user.yearLevel ||

            user.year,


        "info-control":

            user.controlNo ||

            user.controlNumber ||

            user.control_number ||

            "CONTROL NO. PENDING"

    };


    Object.entries(fields).forEach(

        function ([id, value]) {

            const element =
                document.getElementById(id);


            if (!element) {

                return;

            }


            element.textContent =
                value || "";

        }

    );

}


/* =========================================================
   BUILD ADMIN NAME
========================================================= */

function buildAdminName(
    user
) {

    return [

        user.givenName,

        user.firstName,

        user.middleName,

        user.surname,

        user.lastName

    ]

    .filter(Boolean)

    .join(" ");

}


/* =========================================================
   POPULATE ACTIVITY ROWS
========================================================= */

function populateActivityRows(
    activities
) {

    const container =
        document.getElementById(
            "activityRows"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    /* =====================================================
       NO ACTIVITY
    ===================================================== */

    if (
        !activities ||
        activities.length === 0
    ) {

        container.innerHTML = `

            <div
                class="representative-empty-activity"
            >

                No attendance/activity records yet.

            </div>

        `;

        return;

    }


    /* =====================================================
       CREATE ROWS
    ===================================================== */

    activities.forEach(

        function (activity) {

            const row =
                document.createElement("div");


            row.className =
                "activity-form-row";


            row.innerHTML = `

                <div class="field-group title-field">

                    <label>
                        Activity Title:
                    </label>

                    <input
                        type="text"
                        readonly
                        value="${escapeAttribute(
                            activity.title ||
                            activity.name ||
                            ""
                        )}"
                    >

                </div>


                <div class="field-group date-field">

                    <label>
                        Date:
                    </label>

                    <input
                        type="text"
                        readonly
                        value="${escapeAttribute(
                            activity.date ||
                            activity.attendanceDate ||
                            ""
                        )}"
                    >

                </div>

            `;


            container.appendChild(row);

        }

    );

}


/* =========================================================
   SHOW SUB VIEW
   SAME LOGIC AS REPRESENTATIVE
========================================================= */

function showSubView(
    viewId
) {

    const views =
        document.querySelectorAll(
            ".page-view"
        );


    views.forEach(

        function (view) {

            view.classList.remove(
                "active"
            );

        }

    );


    const target =
        document.getElementById(
            viewId
        );


    if (!target) {

        return;

    }


    target.classList.add(
        "active"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   UPDATE SCORECARD SCROLL
========================================================= */

function updateScorecardScroll() {

    const scorecardList =
        document.querySelector(
            ".scorecard-list"
        );


    if (!scorecardList) {

        return;

    }


    const scorecards =
        scorecardList.querySelectorAll(
            ".scorecard-btn"
        );


    if (scorecards.length > 0) {

        scorecardList.classList.add(
            "has-scroll"
        );

    }

    else {

        scorecardList.classList.remove(
            "has-scroll"
        );

    }

}


/* =========================================================
   REFRESH WHEN PAGE SHOWS
========================================================= */

window.addEventListener(

    "pageshow",

    function () {

        renderScorecardButtons();

    }

);


/* =========================================================
   REFRESH WHEN ADMIN PROFILE CHANGES
========================================================= */

window.addEventListener(

    "storage",

    function (event) {

        if (

            event.key ===
                "basisAdminProfile" ||

            event.key ===
                "adminProfile" ||

            event.key ===
                "basisAdmin"

        ) {

            renderScorecardButtons();

        }

    }

);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

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
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHtml(value);

}