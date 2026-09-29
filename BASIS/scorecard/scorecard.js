function getRegisteredScholar() {

    /*
        The registration/profile page should save
        the scholar information in localStorage.

        Expected key:

        registeredScholar

        Example:

        localStorage.setItem(
            "registeredScholar",
            JSON.stringify(registrationData)
        );
    */

    const savedRegistration =
        localStorage.getItem("registeredScholar");


    // No registration found
    if (!savedRegistration) {

        return null;

    }


    try {

        const registration =
            JSON.parse(savedRegistration);

        return registration;

    } catch (error) {

        console.error(
            "Unable to read registration data:",
            error
        );

        return null;

    }

}



/* =========================================================
   SAMPLE ACTIVITY DATA
   =========================================================

   TEMPORARY ONLY.

   Later, replace this with your actual
   activity/attendance data from your database.

========================================================= */

const userActivities = [

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
   ========================================================= */

function renderScorecardButtons() {

    const listContainer =
        document.querySelector(".scorecard-list");


    if (!listContainer) {

        return;

    }


    // Clear existing content
    listContainer.innerHTML = "";



    /* ================================================
       CHECK REGISTRATION
    ================================================= */

    const currentUser =
        getRegisteredScholar();



    /* ================================================
       NOT REGISTERED
    ================================================= */

    if (!currentUser) {

        showNoScorecardMessage();

        return;

    }



    /* ================================================
       GET REGISTRATION AY + SEMESTER
    ================================================= */

    const academicYear =
        currentUser.academicYear ||
        currentUser.ay ||
        currentUser.schoolYear;


    const semester =
        currentUser.semester;



    /* ================================================
       INCOMPLETE REGISTRATION
    ================================================= */

    if (!academicYear || !semester) {

        showNoScorecardMessage();

        return;

    }



    /* ================================================
       CREATE SCORECARD BUTTON
    ================================================= */

    const button =
        document.createElement("button");


    button.type = "button";

    button.className = "scorecard-btn";


    button.textContent =
        `${academicYear} ${semester.toUpperCase()} SCORECARD`;


    button.addEventListener(
        "click",
        function () {

            openScorecardDetail(
                academicYear,
                semester
            );

        }
    );


    listContainer.appendChild(button);

}



/* =========================================================
   NO SCORECARD MESSAGE
   ========================================================= */

function showNoScorecardMessage() {

    const listContainer =
        document.querySelector(".scorecard-list");


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

}



/* =========================================================
   OPEN SCORECARD DETAIL
   ========================================================= */

function openScorecardDetail(
    academicYear,
    semester
) {

    /*
        Check again if user is registered.

        This prevents someone from manually
        opening the detail page without registration.
    */

    const currentUser =
        getRegisteredScholar();


    if (!currentUser) {

        return;

    }



    /* ================================================
       LOAD PROFILE INFORMATION
    ================================================= */

    loadProfileInfo(currentUser);



    /* ================================================
       UPDATE SCORECARD HEADER
    ================================================= */

    const ayTitle =
        document.getElementById(
            "scorecardAYTitle"
        );


    const semTitle =
        document.getElementById(
            "scorecardSemTitle"
        );


    if (ayTitle) {

        ayTitle.textContent =
            `AY: ${academicYear}`;

    }


    if (semTitle) {

        semTitle.textContent =
            semester.toUpperCase();

    }



    /* ================================================
       GET ATTENDED ACTIVITIES
    ================================================= */

    const attendedActivities =
        userActivities.filter(
            function (activity) {

                return (
                    activity.ay === academicYear &&
                    activity.semester === semester
                );

            }
        );



    /* ================================================
       POPULATE ACTIVITY ROWS
    ================================================= */

    populateActivityRows(
        attendedActivities
    );



    /* ================================================
       SHOW DETAIL VIEW
    ================================================= */

    showSubView(
        "view-scorecard-detail"
    );

}



/* =========================================================
   LOAD PROFILE INFORMATION
   ========================================================= */

function loadProfileInfo(user) {

    const fields = {

        "info-name":
            user.name,

        "info-sex":
            user.sex,

        "info-birthday":
            user.birthday,

        "info-religion":
            user.religion,

        "info-email":
            user.email,

        "info-contact":
            user.contact,

        "info-municipality":
            user.municipality,

        "info-barangay":
            user.barangay,

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
            user.program

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
   POPULATE ACTIVITY ROWS
   ========================================================= */

function populateActivityRows(
    activities
) {

    const rows =
        document.querySelectorAll(
            ".activity-form-row"
        );


    rows.forEach(
        function (row, index) {

            const titleInput =
                row.querySelector(
                    ".title-field input"
                );


            const dateInput =
                row.querySelector(
                    ".date-field input"
                );


            if (!titleInput || !dateInput) {

                return;

            }



            /* ============================================
               ACTIVITY EXISTS
            ============================================ */

            if (activities[index]) {

                titleInput.value =
                    activities[index].title || "";

                dateInput.value =
                    activities[index].date || "";

            }


            /* ============================================
               NO ACTIVITY
            ============================================ */

            else {

                titleInput.value = "";

                dateInput.value = "";

            }

        }
    );

}



/* =========================================================
   SHOW SUB VIEW
   ========================================================= */

function showSubView(viewId) {

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
        document.getElementById(viewId);


    if (!target) {

        return;

    }


    target.classList.add(
        "active"
    );



    /* ================================================
       SCROLL TO TOP
    ================================================= */

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}

window.addEventListener(
    "pageshow",
    function () {

        renderScorecardButtons();

    }
);

const scorecardList = document.querySelector(".scorecard-list");

if (scorecardList) {
    const scorecards = scorecardList.querySelectorAll(".scorecard-btn");

    if (scorecards.length > 0) {
        scorecardList.classList.add("has-scroll");
    } else {
        scorecardList.classList.remove("has-scroll");
    }
}