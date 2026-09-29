/* =========================================================
   BASIS ACTIVITY JAVASCRIPT
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let activities = [];

let currentActivity = null;

let currentSubmissionType = "attendance";



/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadActivities();

        setupSearch();

        setupFileUpload();

    }
);



/* =========================================================
   LOAD ACTIVITIES
========================================================= */

function loadActivities() {

    /*
        Activities should be stored by the
        Create Activity page using:

        localStorage.setItem(
            "activities",
            JSON.stringify(activities)
        );
    */


    const savedActivities =
        localStorage.getItem("activities");


    /*
        No created activities yet.
    */

    if (!savedActivities) {

        activities = [];

        renderActivities();

        return;

    }


    try {

        const parsed =
            JSON.parse(savedActivities);


        /*
            Make sure the stored data
            is an array.
        */

        if (Array.isArray(parsed)) {

            activities = parsed;

        } else {

            activities = [];

        }

    } catch (error) {

        console.error(
            "Unable to load activities:",
            error
        );

        activities = [];

    }


    renderActivities();

}



/* =========================================================
   RENDER ACTIVITIES
========================================================= */

function renderActivities(
    searchTerm = ""
) {

    const activityList =
        document.getElementById(
            "activityList"
        );


    if (!activityList) {

        return;

    }


    activityList.innerHTML = "";



    /* ================================================
       SEARCH
    ================================================= */

    const search =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredActivities =
        activities.filter(
            function (activity) {

                if (!search) {

                    return true;

                }


                const title =
                    String(
                        activity.title ||
                        activity.activityTitle ||
                        ""
                    ).toLowerCase();


                const type =
                    String(
                        activity.type ||
                        activity.activityType ||
                        ""
                    ).toLowerCase();


                return (
                    title.includes(search) ||
                    type.includes(search)
                );

            }
        );



    /* ================================================
       NO ACTIVITIES
    ================================================= */

    if (filteredActivities.length === 0) {

        activityList.innerHTML = `

            <div class="no-activities-message">

                <i class="fa-solid fa-calendar-xmark"></i>

                <h3>
                    No activities yet.
                </h3>

                <p>
                    Please check back when a new activity is created.
                </p>

            </div>

        `;

        return;

    }



    /* ================================================
       CREATE ACTIVITY CARDS
    ================================================= */

    filteredActivities.forEach(
        function (activity) {

            const card =
                document.createElement("div");


            card.className =
                "activity-card-item";


            const title =
                getActivityTitle(activity);


            const date =
                getActivityDate(activity);


            card.innerHTML = `

                <div class="activity-card-info">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <span>
                        ${escapeHTML(date)}
                    </span>

                </div>


                <button
                    type="button"
                    class="open-activity-btn"
                >
                    OPEN
                </button>

            `;


            const openButton =
                card.querySelector(
                    ".open-activity-btn"
                );


            openButton.addEventListener(
                "click",
                function () {

                    openActivityDetail(activity);

                }
            );


            activityList.appendChild(card);

        }
    );

}



/* =========================================================
   GET ACTIVITY TITLE
========================================================= */

function getActivityTitle(activity) {

    return (
        activity.title ||
        activity.activityTitle ||
        activity.name ||
        "ACTIVITY TITLE"
    );

}



/* =========================================================
   GET ACTIVITY DATE
========================================================= */

function getActivityDate(activity) {

    return (
        activity.date ||
        activity.activityDate ||
        activity.startDate ||
        "XX/XX/XXXX"
    );

}



/* =========================================================
   OPEN ACTIVITY
========================================================= */

function openActivityDetail(activity) {

    currentActivity =
        activity;


    /*
        Populate every page using
        the selected activity.
    */

    populateActivityDetail(activity);

    populateQRPage(activity);

    populateSubmissionPage(activity);


    /*
        Open detail page.
    */

    showSubView(
        "view-activity-detail"
    );

}



/* =========================================================
   POPULATE ACTIVITY DETAIL
========================================================= */

function populateActivityDetail(
    activity
) {

    setText(
        "detailTitle",
        getActivityTitle(activity)
    );


    setText(
        "detailType",
        `TYPE OF ACTIVITY: ${getActivityType(activity)}`
    );


    setText(
        "detailSemester",
        formatSemester(activity)
    );


    setText(
        "detailDate",
        getActivityDate(activity)
    );


    setText(
        "detailTime",
        getActivityTime(activity)
    );


    setText(
        "detailVenue",
        getActivityVenue(activity)
    );


    setText(
        "detailVenueAddress",
        getActivityVenueAddress(activity)
    );


    setText(
        "detailMunicipality",
        getActivityMunicipality(activity)
    );


    setText(
        "detailBarangay",
        getActivityBarangay(activity)
    );


    setText(
        "detailDescription",
        getActivityDescription(activity)
    );


    setText(
        "detailDeadline",
        getActivityDeadline(activity)
    );

}



/* =========================================================
   POPULATE QR PAGE
========================================================= */

function populateQRPage(
    activity
) {

    setText(
        "qrSemester",
        formatSemester(activity)
    );


    setText(
        "qrTitle",
        getActivityTitle(activity)
    );


    setText(
        "qrType",
        getActivityType(activity)
    );


    setText(
        "qrDate",
        getActivityDate(activity)
    );


    setText(
        "qrTime",
        getActivityTime(activity)
    );


    setText(
        "qrVenue",
        getActivityVenue(activity)
    );


    setText(
        "qrVenueAddress",
        getActivityVenueAddress(activity)
    );


    setText(
        "qrMunicipality",
        getActivityMunicipality(activity)
    );


    setText(
        "qrBarangay",
        getActivityBarangay(activity)
    );


    setText(
        "qrDeadline",
        getActivityDeadline(activity)
    );

}



/* =========================================================
   POPULATE SUBMISSION PAGE
========================================================= */

function populateSubmissionPage(
    activity
) {

    setText(
        "submissionSemester",
        formatSemester(activity)
    );


    setText(
        "submissionDeadline",
        getActivityDeadline(activity)
    );


    setText(
        "submissionTime",
        getActivityTime(activity)
    );


    setText(
        "submissionTitle",
        getActivityTitle(activity)
    );


    setText(
        "submissionType",
        getActivityType(activity)
    );


    setText(
        "submissionDate",
        getActivityDate(activity)
    );


    setText(
        "submissionActivityTime",
        getActivityTime(activity)
    );


    setText(
        "submissionVenue",
        getActivityVenue(activity)
    );


    setText(
        "submissionVenueAddress",
        getActivityVenueAddress(activity)
    );


    setText(
        "submissionMunicipality",
        getActivityMunicipality(activity)
    );


    setText(
        "submissionBarangay",
        getActivityBarangay(activity)
    );

}



/* =========================================================
   ACTIVITY DATA HELPERS
========================================================= */

function getActivityType(activity) {

    return (
        activity.type ||
        activity.activityType ||
        "—"
    );

}


function getActivityTime(activity) {

    return (
        activity.time ||
        activity.activityTime ||
        "—"
    );

}


function getActivityVenue(activity) {

    return (
        activity.venue ||
        "—"
    );

}


function getActivityVenueAddress(activity) {

    return (
        activity.venueAddress ||
        activity.address ||
        "—"
    );

}


function getActivityMunicipality(activity) {

    return (
        activity.municipality ||
        "—"
    );

}


function getActivityBarangay(activity) {

    return (
        activity.barangay ||
        "—"
    );

}


function getActivityDescription(activity) {

    return (
        activity.description ||
        "No description available."
    );

}


function getActivityDeadline(activity) {

    return (
        activity.deadline ||
        "—"
    );

}



/* =========================================================
   SEMESTER FORMAT
========================================================= */

function formatSemester(activity) {

    const academicYear =
        activity.academicYear ||
        activity.ay ||
        activity.schoolYear ||
        "2026–2027";


    const semester =
        activity.semester ||
        activity.sem ||
        "First Semester";


    return (
        `${academicYear} ${semester}`
    ).toUpperCase();

}



/* =========================================================
   SHOW / HIDE VIEWS
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


    /*
        Always go back to the
        top of the page.
    */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "activitySearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            renderActivities(
                searchInput.value
            );

        }
    );

}



/* =========================================================
   FILTER BUTTON
========================================================= */

const filterButton =
    document.getElementById(
        "filterBtn"
    );


if (filterButton) {

    filterButton.addEventListener(
        "click",
        function () {

            /*
                Basic filter behavior for now.

                Later we can make this show
                filters for AY / semester /
                activity type.
            */

            if (activities.length === 0) {

                return;

            }


            activities.reverse();

            renderActivities(
                document.getElementById(
                    "activitySearch"
                )?.value || ""
            );

        }
    );

}



/* =========================================================
   SUBMISSION TAB
========================================================= */

function setSubmissionTab(
    type
) {

    currentSubmissionType =
        type;


    const attendanceTab =
        document.getElementById(
            "tabAttendance"
        );


    const absenceTab =
        document.getElementById(
            "tabAbsence"
        );


    if (!attendanceTab || !absenceTab) {

        return;

    }


    attendanceTab.classList.remove(
        "active"
    );


    absenceTab.classList.remove(
        "active"
    );


    if (type === "attendance") {

        attendanceTab.classList.add(
            "active"
        );

    } else {

        absenceTab.classList.add(
            "active"
        );

    }


    /*
        The uploaded file is still handled
        the same way. The selected tab tells
        the system whether the submission is
        attendance or absence.
    */

}



/* =========================================================
   FILE UPLOAD
========================================================= */

function setupFileUpload() {

    const dropArea =
        document.getElementById(
            "uploadDropArea"
        );


    const fileInput =
        document.getElementById(
            "fileUploadInput"
        );


    const selectedFile =
        document.getElementById(
            "selectedFile"
        );


    const submitButton =
        document.getElementById(
            "submitFileBtn"
        );


    const status =
        document.getElementById(
            "uploadStatus"
        );


    if (
        !dropArea ||
        !fileInput ||
        !selectedFile ||
        !submitButton
    ) {

        return;

    }



    /* ================================================
       CLICK UPLOAD AREA
    ================================================= */

    dropArea.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );



    /* ================================================
       FILE SELECT
    ================================================= */

    fileInput.addEventListener(
        "change",
        function () {

            handleSelectedFile(
                fileInput.files[0]
            );

        }
    );



    /* ================================================
       DRAG OVER
    ================================================= */

    dropArea.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            dropArea.classList.add(
                "drag-over"
            );

        }
    );



    /* ================================================
       DRAG LEAVE
    ================================================= */

    dropArea.addEventListener(
        "dragleave",
        function () {

            dropArea.classList.remove(
                "drag-over"
            );

        }
    );



    /* ================================================
       DROP
    ================================================= */

    dropArea.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();


            dropArea.classList.remove(
                "drag-over"
            );


            const file =
                event.dataTransfer.files[0];


            if (!file) {

                return;

            }


            /*
                Put dropped file into
                the file input.
            */

            const dataTransfer =
                new DataTransfer();


            dataTransfer.items.add(
                file
            );


            fileInput.files =
                dataTransfer.files;


            handleSelectedFile(
                file
            );

        }
    );



    /* ================================================
       SUBMIT
    ================================================= */

    submitButton.addEventListener(
        "click",
        function () {

            const file =
                fileInput.files[0];


            if (!file) {

                setStatus(
                    "Please select a PDF or PNG file first.",
                    true
                );

                return;

            }


            if (!isAllowedFile(file)) {

                setStatus(
                    "Only PDF and PNG files are allowed.",
                    true
                );

                return;

            }


            /*
                Front-end submission for now.

                Actual server/database upload
                can be connected later.
            */

            const activityTitle =
                currentActivity
                    ? getActivityTitle(
                        currentActivity
                    )
                    : "Activity";


            const submissionType =
                currentSubmissionType
                    .toUpperCase();


            setStatus(
                `${submissionType} file selected successfully for "${activityTitle}".`,
                false
            );


            submitButton.disabled = true;


            submitButton.textContent =
                "SUBMITTED";


        }
    );

}



/* =========================================================
   HANDLE FILE
========================================================= */

function handleSelectedFile(
    file
) {

    const selectedFile =
        document.getElementById(
            "selectedFile"
        );


    const status =
        document.getElementById(
            "uploadStatus"
        );


    if (!file) {

        return;

    }


    if (!isAllowedFile(file)) {

        selectedFile.innerHTML = `

            <i class="fa-solid fa-circle-xmark"></i>

            <span>
                Invalid file. PDF or PNG only.
            </span>

        `;


        setStatus(
            "Only PDF and PNG files are allowed.",
            true
        );


        return;

    }


    selectedFile.innerHTML = `

        <i class="fa-solid fa-file-circle-check"></i>

        <span title="${escapeHTML(file.name)}">
            ${escapeHTML(file.name)}
        </span>

    `;


    if (status) {

        status.textContent = "";

    }


    const submitButton =
        document.getElementById(
            "submitFileBtn"
        );


    if (submitButton) {

        submitButton.disabled = false;

        submitButton.textContent =
            "SUBMIT FILE";

    }

}



/* =========================================================
   FILE VALIDATION
========================================================= */

function isAllowedFile(
    file
) {

    const fileName =
        file.name.toLowerCase();


    const allowedExtension =
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".png");


    const allowedMime =
        file.type === "application/pdf" ||
        file.type === "image/png";


    return (
        allowedExtension &&
        (
            !file.type ||
            allowedMime
        )
    );

}



/* =========================================================
   STATUS
========================================================= */

function setStatus(
    message,
    isError
) {

    const status =
        document.getElementById(
            "uploadStatus"
        );


    if (!status) {

        return;

    }


    status.textContent =
        message;


    status.style.color =
        isError
            ? "#b33a3a"
            : "#42523f";

}



/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.textContent =
        value || "—";

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
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
   REFRESH WHEN RETURNING TO PAGE
========================================================= */

window.addEventListener(
    "pageshow",
    function () {

        loadActivities();

    }
);



/* =========================================================
   REFRESH WHEN ANOTHER TAB CHANGES ACTIVITIES
========================================================= */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key === "activities"
        ) {

            loadActivities();

        }

    }
);