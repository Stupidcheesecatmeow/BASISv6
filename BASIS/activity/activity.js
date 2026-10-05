/* =========================================================
   BASIS ACTIVITY JAVASCRIPT
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let activities = [];
let activityLoadErrorMessage = '';

let currentActivity = null;

let currentSubmissionType = "attendance";

function normalizeActivityRecord(record) {
    const item = record && typeof record === 'object' ? record : {};
    return {
        ...item,
        id: item.id ?? item.activity_id ?? item.activityId ?? '',
        name: item.name || item.title || item.activityTitle || item.activity_title || item.activityName || item.activity_name || '',
        type: item.type || item.activityType || item.activity_type || '',
        date: item.date || item.activityDate || item.activity_date || item.startDate || '',
        startTime: item.startTime || item.start_time || '',
        endTime: item.endTime || item.end_time || '',
        venue: item.venue || '',
        venueAddress: item.venueAddress || item.venue_address || item.address || '',
        generateQr: item.generateQr || item.generate_qr || item.qr_mode || '',
        deadlineDate: item.deadlineDate || item.deadline_date || '',
        deadlineTime: item.deadlineTime || item.deadline_time || '',
        academicYear: item.academicYear || item.academic_year || item.ay || item.schoolYear || '',
        semester: item.semester || item.sem || '',
        description: item.description || '',
        description_image: item.description_image || item.descriptionImage || ''
    };
}



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

async function loadActivities() {
    try {
        const response = await fetch('../admin/api/account_api.php?action=activities', {credentials:'same-origin'});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load activities.');
        activities = Array.isArray(data.activities) ? data.activities.map(normalizeActivityRecord) : [];
        activityLoadErrorMessage = '';
    } catch (error) {
        activities = [];
        activityLoadErrorMessage = error.message || 'Activities could not be loaded. Check your sign-in and refresh.';
        console.error('Unable to load activities:', error);
    }
    renderActivities(document.getElementById('activitySearch')?.value || '');
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
                        activity.name ||
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

                <h3>${escapeHTML(activityLoadErrorMessage ? 'Activities could not be loaded.' : 'No activities yet.')}</h3>

                <p>
                    ${escapeHTML(activityLoadErrorMessage || 'Please check back when a new activity is created.')}
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

async function openActivityDetail(activity) {
    const activityId = Number(activity?.id || activity?.activity_id || 0);
    if (!activityId) {
        showActivityLoadError('This activity is missing its system ID. Refresh the activity list and try again.');
        return;
    }

    try {
        const response = await fetch(`../admin/api/activity_api.php?action=get&id=${encodeURIComponent(activityId)}`, { credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !data.activity) throw new Error(data.message || 'Could not load this activity. Please refresh and try again.');
        activity = normalizeActivityRecord(data.activity);
        if (!String(activity.name).trim()) throw new Error('This activity record has no title. Please ask the admin to edit and save the activity again.');
    } catch (error) {
        showActivityLoadError(error.message || 'Could not load this activity. Please sign in again and retry.');
        return;
    }

    currentActivity = activity;

    const qrEnabled = ["qr", "both"].includes(String(activity.generateQr || activity.generate_qr || "").toLowerCase());
    const proofEnabled = ["proof", "both"].includes(String(activity.generateQr || activity.generate_qr || "").toLowerCase());
    const qrButton = document.getElementById("activityQrButton");
    const proofButton = document.getElementById("activityProofButton");
    if (qrButton) qrButton.hidden = !qrEnabled;
    if (proofButton) proofButton.hidden = !proofEnabled;


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

function showActivityLoadError(message) {
    const list = document.getElementById('activityList');
    if (!list) return;
    let status = document.getElementById('activityLoadError');
    if (!status) {
        status = document.createElement('p');
        status.id = 'activityLoadError';
        status.setAttribute('role', 'alert');
        status.style.cssText = 'margin:12px 0;padding:12px;border:1px solid #b33a3a;border-radius:8px;color:#8f1c13;background:#fff7f6';
        list.prepend(status);
    }
    status.textContent = message;
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
    const descriptionImage = document.getElementById('detailDescriptionImage');
    if (descriptionImage) {
        const image = activity.description_image || activity.descriptionImage || '';
        descriptionImage.hidden = !image;
        if (image) descriptionImage.src = image;
        else descriptionImage.removeAttribute('src');
    }


    setText(
        "detailDeadline",
        getActivityDeadline(activity)
    );

}



/* =========================================================
   POPULATE QR PAGE
========================================================= */

async function populateQRPage(
    activity
) {

    const qrImage = document.getElementById("activityQrImage");
    const downloadButton = document.getElementById("downloadActivityQrButton");
    if (downloadButton) downloadButton.disabled = true;
    if (qrImage) {
        qrImage.hidden = !["qr", "both"].includes(String(activity.generateQr || activity.generate_qr || "").toLowerCase());
        if (!qrImage.hidden) {
            try {
                const response = await fetch(`../admin/api/activity_qr.php?id=${encodeURIComponent(activity.id)}`, { credentials: "same-origin", cache: "no-store" });
                if (!response.ok) throw new Error("The QR code could not be loaded for this signed-in iskolar.");
                const blob = await response.blob();
                if (qrImage.dataset.qrObjectUrl) URL.revokeObjectURL(qrImage.dataset.qrObjectUrl);
                qrImage.dataset.qrObjectUrl = URL.createObjectURL(blob);
                qrImage.src = qrImage.dataset.qrObjectUrl;
                if (downloadButton) downloadButton.disabled = false;
            } catch (error) {
                qrImage.removeAttribute("src");
                console.error(error.message);
            }
        } else {
            qrImage.removeAttribute("src");
        }
    }

    try {
        const response = await fetch('../admin/api/account_api.php?action=profile', {credentials:'same-origin'});
        const data = await response.json();
        if (response.ok && data.success) {
            setText('qrParticipantName', data.profile.name || [data.profile.givenName, data.profile.middleName, data.profile.surname].filter(Boolean).join(' '));
            setText('qrParticipantBarangay', data.profile.barangay || '—');
        }
    } catch (error) {
        console.error('Unable to load participant QR details:', error);
    }

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

window.downloadActivityQr = async function () {
    const image = document.getElementById("activityQrImage");
    const objectUrl = image?.dataset.qrObjectUrl;
    if (!objectUrl || !currentActivity) return;
    const safeName = getActivityTitle(currentActivity).replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "activity";
    try {
        const svgResponse = await fetch(objectUrl);
        const svgBlob = await svgResponse.blob();
        if (!svgBlob.type.includes("svg")) throw new Error("The QR image is not available as SVG.");
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = svgUrl;
        link.download = `BASIS_${safeName}_attendance_QR.svg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
    } catch (error) {
        alert(error.message || "Could not download the QR as an SVG.");
    }
};



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
    const start = activity.startTime || activity.start_time || '';
    const end = activity.endTime || activity.end_time || '';
    return [start, end].filter(Boolean).join(' - ') || activity.time || activity.activityTime || '—';

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
    const date = activity.deadlineDate || activity.deadline_date || '';
    const time = activity.deadlineTime || activity.deadline_time || '';
    return [date, time].filter(Boolean).join(' ') || activity.deadline || '—';

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

    currentSubmissionType = type === 'absence' ? 'absence' : 'attendance';


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


    const input=document.getElementById('fileUploadInput');
    const hint=document.getElementById('proofFileTypeHint');
    if(input)input.accept=currentSubmissionType==='attendance'?'.jpg,.jpeg,image/jpeg':'.pdf,application/pdf';
    if(hint)hint.textContent=currentSubmissionType==='attendance'?'JPG only':'PDF only';
    const file=input?.files?.[0];
    if(file&&!isAllowedFile(file)){input.value='';const label=document.querySelector('#selectedFile span');if(label)label.textContent='No file selected';}

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
        async function () {

            const file =
                fileInput.files[0];


            if (!file) {

                setStatus(
                    `Please select a ${currentSubmissionType==='attendance'?'JPG photo':'PDF excuse letter'} first.`,
                    true
                );

                return;

            }


            if (!isAllowedFile(file)) {

                setStatus(
                    currentSubmissionType==='attendance' ? "Attendance proof must be a JPG photo." : "Absence proof must be a PDF letter.",
                    true
                );

                return;

            }


            const activityTitle =
                currentActivity
                    ? getActivityTitle(
                        currentActivity
                    )
                    : "Activity";


            const submissionType =
                currentSubmissionType
                    .toUpperCase();


            submitButton.disabled = true;
            submitButton.textContent = 'SUBMITTING...';
            try {
                const fileData = await new Promise((resolve,reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Unable to read file.'));
                    reader.readAsDataURL(file);
                });
                const response = await fetch('../admin/api/account_api.php?action=submit', {
                    method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({activity_id:currentActivity.id,submission_type:currentSubmissionType,file_name:file.name,file_data:fileData})
                });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Submission failed.');
                setStatus(`${submissionType} file submitted for "${activityTitle}" and is awaiting verification.`, false);
                submitButton.textContent = 'SUBMITTED';
            } catch (error) {
                setStatus(error.message, true);
                submitButton.disabled = false;
                submitButton.textContent = 'SUBMIT FILE';
            }


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
        selectedFile.innerHTML = '<i class="fa-solid fa-file"></i><span>No file selected</span>';
        return;
    }


    if (!isAllowedFile(file)) {

        selectedFile.innerHTML = `

            <i class="fa-solid fa-circle-xmark"></i>

            <span>
                Invalid file. ${currentSubmissionType==='attendance'?'JPG only.':'PDF only.'}
            </span>

        `;


        setStatus(
            currentSubmissionType==='attendance' ? "Attendance proof must be a JPG photo." : "Absence proof must be a PDF letter.",
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


    const allowedExtension = currentSubmissionType === 'attendance'
        ? (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))
        : fileName.endsWith('.pdf');
    const allowedMime = currentSubmissionType === 'attendance'
        ? file.type === 'image/jpeg'
        : file.type === 'application/pdf';


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
