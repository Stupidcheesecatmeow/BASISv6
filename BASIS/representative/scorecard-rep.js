/* =========================================================
   REPRESENTATIVE SCORECARD
   SAME LOGIC AS ISKOLAR SCORECARD
   ========================================================= */


/* =========================================================
   GET REGISTERED REPRESENTATIVE
   ========================================================= */

function getRegisteredRepresentative() {

    /*
        Representative profile/registration
        should be saved in localStorage.

        Supported keys:

        basisRepresentativeProfile
        representativeProfile
        basisRepresentative
    */


    const currentId = localStorage.getItem("basisCurrentUserId");
    const keys = currentId ? [`basisProfile_${currentId}`] : [];


    for (const key of keys) {

        const saved =
            localStorage.getItem(key);


        if (!saved) {

            continue;

        }


        try {

            const representative =
                JSON.parse(saved);


            if (
                representative &&
                typeof representative === "object"
            ) {

                return representative;

            }


        } catch (error) {

            console.error(
                "Unable to read representative profile:",
                error
            );

        }

    }


    return null;

}


/* =========================================================
   SAMPLE ACTIVITY DATA
   =========================================================

   These are temporary.

   If the Representative profile already contains:

   activities
   attendance
   userActivities
   activityRecords

   those records will be used instead.
   ========================================================= */

const representativeActivities = [

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
   SAME LOGIC AS ISKOLAR
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
       CHECK REPRESENTATIVE REGISTRATION
       ===================================================== */

    const currentRepresentative =
        getRegisteredRepresentative();



    /* =====================================================
       NOT REGISTERED
       ===================================================== */

    if (!currentRepresentative) {

        showNoScorecardMessage();

        return;

    }



    /* =====================================================
       GET AY + SEMESTER
       ===================================================== */

    const academicYear =

        currentRepresentative.academicYear ||

        currentRepresentative.ay ||

        currentRepresentative.schoolYear;



    const semester =

        currentRepresentative.semester;



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
   SAME LOGIC AS ISKOLAR
   ========================================================= */

function openScorecardDetail(
    academicYear,
    semester
) {


    /* =====================================================
       CHECK REPRESENTATIVE AGAIN
       ===================================================== */

    const currentRepresentative =
        getRegisteredRepresentative();


    if (!currentRepresentative) {

        return;

    }



    /* =====================================================
       LOAD REPRESENTATIVE PROFILE
       ===================================================== */

    loadRepresentativeInfo(
        currentRepresentative
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
       GET REPRESENTATIVE ACTIVITIES
       ===================================================== */

    let activities = [];


    if (
        Array.isArray(
            currentRepresentative.activities
        )
    ) {

        activities =
            currentRepresentative.activities;

    }

    else if (
        Array.isArray(
            currentRepresentative.attendance
        )
    ) {

        activities =
            currentRepresentative.attendance;

    }

    else if (
        Array.isArray(
            currentRepresentative.userActivities
        )
    ) {

        activities =
            currentRepresentative.userActivities;

    }

    else if (
        Array.isArray(
            currentRepresentative.activityRecords
        )
    ) {

        activities =
            currentRepresentative.activityRecords;

    }

    else {

        activities =
            representativeActivities;

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
   LOAD REPRESENTATIVE INFORMATION
   ========================================================= */

function loadRepresentativeInfo(
    user
) {


    const fields = {


        "info-name":

            user.name ||

            user.fullName ||

            buildRepresentativeName(user),


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
   BUILD REPRESENTATIVE NAME
   ========================================================= */

function buildRepresentativeName(
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
   SAME LOGIC AS ISKOLAR
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
   REFRESH WHEN REPRESENTATIVE PROFILE CHANGES
   ========================================================= */

window.addEventListener(

    "storage",

    function (event) {


        if (

            event.key === `basisProfile_${localStorage.getItem("basisCurrentUserId")}`

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
