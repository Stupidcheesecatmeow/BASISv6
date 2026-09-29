/* =========================================================
   BASIS PROFILE JS
========================================================= */

const PROFILE_STORAGE_KEY = "basisScholarProfile";
const COR_STORAGE_KEY = "basisScholarCOR";


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


/*
   BASIS SCHOLAR CLUSTER

   Ang exact scholar cluster ay dapat manggaling
   sa admin/database.

   Hindi ginagamit dito ang public land-value
   cluster numbers dahil iba iyon sa BASIS
   scholar cluster assignment.
*/
const SCHOLAR_CLUSTER_MAP = {
    "Bagumbayan": "",
    "Banawang": "",
    "Binuangan": "",
    "Binukawan": "",
    "Ibaba": "",
    "Ibis": "",
    "Pag-asa": "",
    "Parang": "",
    "Paysawan": "",
    "Quinawan": "",
    "San Antonio": "",
    "Saysain": "",
    "Tabing-ilog": "",
    "Atilano Ricardo": ""
};


/* =========================================================
   DEFAULT PROFILE
========================================================= */

const DEFAULT_PROFILE = {
    registrationStatus: "approved",

    controlNumber: "",

    givenName: "JUAN",
    surname: "DELA CRUZ",
    middleName: "",
    suffix: "",

    sex: "",
    birthday: "",
    contact: "",
    email: "",
    religion: "",

    municipality: "BAGAC",
    barangay: "",
    cluster: "",

    school: "",
    program: "",
    yearLevel: "",

    studentStatus: "ACTIVE",

    profilePhoto: "",

    father: {
        given: "",
        surname: "",
        middle: "",
        suffix: "",
        contact: ""
    },

    mother: {
        given: "",
        surname: "",
        middle: "",
        suffix: "",
        contact: ""
    },

    siblings: []
};


/* =========================================================
   HELPERS
========================================================= */

function getProfile() {

    const saved =
        localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!saved) {
        return structuredClone(DEFAULT_PROFILE);
    }

    try {

        return {
            ...structuredClone(DEFAULT_PROFILE),
            ...JSON.parse(saved)
        };

    } catch (error) {

        return structuredClone(DEFAULT_PROFILE);
    }
}


function saveProfile(profile) {

    localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
    );
}


function getCorHistory() {

    const saved =
        localStorage.getItem(COR_STORAGE_KEY);

    if (!saved) {
        return [];
    }

    try {

        return JSON.parse(saved);

    } catch (error) {

        return [];
    }
}


function saveCorHistory(history) {

    localStorage.setItem(
        COR_STORAGE_KEY,
        JSON.stringify(history)
    );
}


function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   BARANGAY OPTIONS
========================================================= */

function populateBarangays(selected = "") {

    const barangay = $("barangay");

    if (!barangay) return;

    barangay.innerHTML =
        '<option value="">SELECT BARANGAY</option>';

    BAGAC_BARANGAYS.forEach(name => {

        const option =
            document.createElement("option");

        option.value = name;
        option.textContent = name;

        if (
            name.toLowerCase() ===
            selected.toLowerCase()
        ) {
            option.selected = true;
        }

        barangay.appendChild(option);
    });
}


/* =========================================================
   AUTOMATIC LOCATION
========================================================= */

function updateClusterFromBarangay() {

    const barangay =
        $("barangay").value;

    /* Municipality is always BAGAC */
    $("municipality").value = "BAGAC";

    if (!barangay) {

        $("cluster").value = "";

        return;
    }

    const assignedCluster =
        SCHOLAR_CLUSTER_MAP[barangay];

    /*
       If admin has assigned a cluster,
       show it.

       Otherwise:
       ASSIGNED BY ADMIN
    */
    $("cluster").value =
        assignedCluster ||
        "ASSIGNED BY ADMIN";
}


/* =========================================================
   CONTROL NUMBER
========================================================= */

function generateControlNumber() {

    const year = new Date().getFullYear();

    const random =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return `BASIS-${year}-${random}`;
}


function ensureControlNumber(profile) {

    if (
        profile.registrationStatus === "approved" &&
        !profile.controlNumber
    ) {
        profile.controlNumber =
            generateControlNumber();

        saveProfile(profile);
    }

    return profile.controlNumber || "";
}


/* =========================================================
   DISPLAY NAME / LOCATION / STATUS
========================================================= */

function updateProfileHeader(profile) {

    const fullName = [
        profile.givenName,
        profile.middleName,
        profile.surname,
        profile.suffix
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    $("displayFullName").textContent =
        fullName || "REGISTERED SCHOLAR";


    /* Control number appears only after approval */
    const controlNumber =
        $("displayControlNumber");

    if (
        profile.registrationStatus ===
        "approved"
    ) {

        const number =
            ensureControlNumber(profile);

        controlNumber.textContent =
            number
                ? `CONTROL NO: ${number}`
                : "";

        controlNumber.style.display =
            number
                ? "inline-flex"
                : "none";

    } else {

        controlNumber.textContent = "";
        controlNumber.style.display = "none";
    }


    const clusterText =
        profile.cluster ||
        "CLUSTER PENDING";

    const municipality =
        profile.municipality ||
        "BAGAC";

    $("displayLocation").textContent =
        `${municipality} – ${clusterText}`;


    const status =
        profile.registrationStatus === "approved"
            ? (
                profile.studentStatus ||
                "ACTIVE"
              ).toUpperCase()
            : "PENDING";

    $("statusTitle").textContent =
        status;

    $("statusTitle").classList.remove(
        "inactive",
        "pending"
    );

    if (status === "INACTIVE") {
        $("statusTitle")
            .classList.add("inactive");
    }

    if (status === "PENDING") {
        $("statusTitle")
            .classList.add("pending");
    }

    if ($("corAccountStatus")) {
        $("corAccountStatus").textContent =
            status;
    }
}

/* =========================================================
   ADMIN APPROVAL / REGISTRATION STATE
   Frontend demo only. Real admin approval should come
   from the PHP/database backend.
========================================================= */

function setRegistrationApproval(approved) {

    const profile =
        getProfile();

    profile.registrationStatus =
        approved
            ? "approved"
            : "pending";

    if (!approved) {
        profile.controlNumber = "";
        profile.studentStatus = "PENDING";
    } else {
        profile.studentStatus =
            profile.studentStatus === "PENDING"
                ? "ACTIVE"
                : (
                    profile.studentStatus ||
                    "ACTIVE"
                  );

        ensureControlNumber(profile);
    }

    saveProfile(profile);

    loadPersonalForm(profile);
}


/* =========================================================
   LOAD PERSONAL FORM
========================================================= */

function loadPersonalForm(profile) {

    $("givenName").value =
        profile.givenName || "";

    $("surname").value =
        profile.surname || "";

    $("middleName").value =
        profile.middleName || "";

    $("suffix").value =
        profile.suffix || "";


    $("sex").value =
        profile.sex || "";

    $("birthday").value =
        profile.birthday || "";

    $("contact").value =
        profile.contact || "";

    $("email").value =
        profile.email || "";

    $("religion").value =
        profile.religion || "";


    /* Municipality is automatic */

    $("municipality").value =
        "BAGAC";


    /* Barangay */

    populateBarangays(
        profile.barangay || ""
    );


    /* Cluster */

    $("cluster").value =

        profile.cluster ||

        SCHOLAR_CLUSTER_MAP[
            profile.barangay
        ] ||

        "ASSIGNED BY ADMIN";


    $("school").value =
        profile.school || "";

    $("program").value =
        profile.program || "";

    $("yearLevel").value =
        profile.yearLevel || "";


    /* Profile picture */

    if (profile.profilePhoto) {

        $("profilePhoto").src =
            profile.profilePhoto;
    }


    updateProfileHeader(profile);
}


/* =========================================================
   LOAD FAMILY FORM
========================================================= */

function loadFamilyForm(profile) {

    $("fatherGiven").value =
        profile.father?.given || "";

    $("fatherSurname").value =
        profile.father?.surname || "";

    $("fatherMiddle").value =
        profile.father?.middle || "";

    $("fatherSuffix").value =
        profile.father?.suffix || "";

    $("fatherContact").value =
        profile.father?.contact || "";


    $("motherGiven").value =
        profile.mother?.given || "";

    $("motherSurname").value =
        profile.mother?.surname || "";

    $("motherMiddle").value =
        profile.mother?.middle || "";

    $("motherSuffix").value =
        profile.mother?.suffix || "";

    $("motherContact").value =
        profile.mother?.contact || "";


    const container =
        $("siblingsContainer");


    container.innerHTML = "";


    const siblings =
        profile.siblings?.length
            ? profile.siblings
            : [{}];


    siblings.forEach(sibling => {

        addSiblingRow(sibling);

    });
}


/* =========================================================
   ADD SIBLING
========================================================= */

function addSiblingRow(data = {}) {

    const row =
        document.createElement("div");


    row.className =
        "sibling-grid-row";


    row.innerHTML = `

        <div class="form-group">

            <label>GIVEN NAME:</label>

            <input
                type="text"
                class="sibling-given"
                value="${escapeHtml(
                    data.given || ""
                )}"
            >

        </div>


        <div class="form-group">

            <label>SURNAME:</label>

            <input
                type="text"
                class="sibling-surname"
                value="${escapeHtml(
                    data.surname || ""
                )}"
            >

        </div>


        <div class="form-group">

            <label>MIDDLE NAME:</label>

            <input
                type="text"
                class="sibling-middle"
                value="${escapeHtml(
                    data.middle || ""
                )}"
            >

        </div>


        <div class="form-group col-suffix">

            <label>SUFFIX:</label>

            <input
                type="text"
                class="sibling-suffix"
                value="${escapeHtml(
                    data.suffix || ""
                )}"
            >

        </div>

    `;


    $("siblingsContainer")
        .appendChild(row);
}


function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   EDIT MODE
========================================================= */

let editMode = false;


function setEditMode(enabled) {

    editMode = enabled;


    const page =
        document.querySelector(
            ".profile-page-main"
        );


    if (page) {

        page.classList.toggle(
            "editing",
            enabled
        );
    }


    const editableInputs = [

        $("givenName"),
        $("surname"),
        $("middleName"),
        $("suffix"),
        $("birthday"),
        $("contact"),
        $("email"),
        $("religion"),
        $("school"),
        $("program")

    ];


    editableInputs.forEach(input => {

        if (!input) return;


        input.readOnly =
            !enabled;


        input.classList.toggle(
            "editable",
            enabled
        );

    });


    /*
       Select fields
    */

    $("sex").disabled =
        !enabled;


    $("barangay").disabled =
        !enabled;


    $("yearLevel").disabled =
        !enabled;


    /*
       Municipality is automatic.
    */

    $("municipality").disabled =
        true;


    /*
       Cluster is admin-controlled.
    */

    $("cluster").readOnly =
        true;


    /*
       Button text
    */

    $("editProfileBtn").textContent =

        enabled

            ? "CANCEL EDIT"

            : "EDIT PROFILE";
}


/* =========================================================
   COLLECT PERSONAL DATA
========================================================= */

function collectPersonalData() {

    const currentProfile =
        getProfile();


    return {

        givenName:
            $("givenName")
                .value
                .trim(),

        surname:
            $("surname")
                .value
                .trim(),

        middleName:
            $("middleName")
                .value
                .trim(),

        suffix:
            $("suffix")
                .value
                .trim(),


        sex:
            $("sex").value,

        birthday:
            $("birthday").value,

        contact:
            $("contact")
                .value
                .trim(),

        email:
            $("email")
                .value
                .trim(),

        religion:
            $("religion")
                .value
                .trim(),


        /*
           Municipality is always BAGAC.
        */

        municipality:
            "BAGAC",


        barangay:
            $("barangay").value,


        /*
           Cluster is NOT manually editable.

           Existing admin-assigned cluster is preserved.
        */

        cluster:

            currentProfile.cluster ||

            SCHOLAR_CLUSTER_MAP[
                $("barangay").value
            ] ||

            "",


        school:
            $("school")
                .value
                .trim(),

        program:
            $("program")
                .value
                .trim(),

        yearLevel:
            $("yearLevel").value
    };
}


/* =========================================================
   COLLECT FAMILY DATA
========================================================= */

function collectFamilyData() {

    const siblings = [];


    document
        .querySelectorAll(
            "#siblingsContainer .sibling-grid-row"
        )
        .forEach(row => {

            siblings.push({

                given:
                    row.querySelector(
                        ".sibling-given"
                    )?.value.trim() || "",

                surname:
                    row.querySelector(
                        ".sibling-surname"
                    )?.value.trim() || "",

                middle:
                    row.querySelector(
                        ".sibling-middle"
                    )?.value.trim() || "",

                suffix:
                    row.querySelector(
                        ".sibling-suffix"
                    )?.value.trim() || ""

            });

        });


    return {

        father: {

            given:
                $("fatherGiven")
                    .value
                    .trim(),

            surname:
                $("fatherSurname")
                    .value
                    .trim(),

            middle:
                $("fatherMiddle")
                    .value
                    .trim(),

            suffix:
                $("fatherSuffix")
                    .value
                    .trim(),

            contact:
                $("fatherContact")
                    .value
                    .trim()

        },


        mother: {

            given:
                $("motherGiven")
                    .value
                    .trim(),

            surname:
                $("motherSurname")
                    .value
                    .trim(),

            middle:
                $("motherMiddle")
                    .value
                    .trim(),

            suffix:
                $("motherSuffix")
                    .value
                    .trim(),

            contact:
                $("motherContact")
                    .value
                    .trim()

        },


        siblings

    };
}


/* =========================================================
   SAVE PROFILE
========================================================= */

function saveCurrentProfile() {

    const profile =
        getProfile();


    Object.assign(

        profile,

        collectPersonalData(),

        collectFamilyData()

    );


    saveProfile(profile);


    updateProfileHeader(
        profile
    );


    setEditMode(false);


    alert(
        "Profile saved successfully."
    );
}


/* =========================================================
   COR
========================================================= */

function updateCorFileName() {

    const file =
        $("corFile").files[0];


    $("corFileName").textContent =

        file

            ? file.name

            : "No file selected.";
}


function submitCOR() {

    const file =
        $("corFile").files[0];


    if (!file) {

        alert(
            "Please choose your COR first."
        );

        return;
    }


    const semester =
        $("corSemester").value;


    const history =
        getCorHistory();


    const existingIndex =
        history.findIndex(
            item =>

                item.academicYear ===
                    "2026–2027"

                &&

                item.semester ===
                    semester
        );


    const record = {

        academicYear:
            "2026–2027",

        semester:

            semester,

        fileName:
            file.name,

        submittedAt:
            new Date()
                .toLocaleString(),

        status:
            "PENDING VERIFICATION"

    };


    if (existingIndex >= 0) {

        history[existingIndex] =
            record;

    } else {

        history.push(record);

    }


    saveCorHistory(
        history
    );


    renderCorHistory();


    $("corVerificationStatus")
        .textContent =
        "PENDING VERIFICATION";


    $("corSummary")
        .textContent =
        `${semester} COR submitted. Waiting for admin verification.`;


    $("corFile").value = "";


    updateCorFileName();


    alert(
        "COR submitted. It is now waiting for admin verification."
    );
}


/* =========================================================
   COR HISTORY
========================================================= */

function renderCorHistory() {

    const history =
        getCorHistory();


    const container =
        $("corHistoryList");


    container.innerHTML = "";


    if (!history.length) {

        container.innerHTML = `

            <div class="cor-history-item">

                <div class="cor-history-main">

                    <strong>
                        No COR records yet.
                    </strong>

                    <span>
                        Submit your COR every semester.
                    </span>

                </div>

            </div>

        `;


        $("corVerificationStatus")
            .textContent =
            "NOT SUBMITTED";


        $("corSummary")
            .textContent =
            "No COR submitted yet.";


        return;
    }


    history
        .slice()
        .reverse()
        .forEach(item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "cor-history-item";


            row.innerHTML = `

                <div class="cor-history-main">

                    <strong>

                        ${escapeHtml(
                            item.academicYear
                        )}

                        —

                        ${escapeHtml(
                            item.semester
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            item.fileName
                        )}

                        •

                        ${escapeHtml(
                            item.submittedAt
                        )}

                    </span>

                </div>


                <span class="cor-status">

                    ${escapeHtml(
                        item.status
                    )}

                </span>

            `;


            container.appendChild(
                row
            );

        });


    const latest =
        history[
            history.length - 1
        ];


    $("corVerificationStatus")
        .textContent =
        latest.status;


    $("corSummary")
        .textContent =
        `${latest.semester} COR: ${latest.status}`;
}


/* =========================================================
   SUBVIEW
========================================================= */

function showSubView(viewId) {

    const personalView = document.getElementById("view-profile");
    const familyView = document.getElementById("view-profile-family");

    if (!personalView || !familyView) {
        console.error("Profile views are missing from profile.html.");
        return;
    }

    const target =
        viewId === "view-profile-family"
            ? familyView
            : viewId === "view-profile"
                ? personalView
                : null;

    if (!target) {
        console.error("Unknown profile view:", viewId);
        return;
    }

    /* Hide every profile view with !important so the site's
       global .page-view rules cannot leave the screen blank. */
    [personalView, familyView].forEach(view => {
        view.classList.remove("active");
        view.style.setProperty("display", "none", "important");
    });

    /* Show the requested view first. */
    target.classList.add("active");
    target.style.setProperty("display", "block", "important");

    if (viewId === "view-profile-family") {
        try {
            const profile = getProfile();
            loadFamilyForm(profile);
            renderCorHistory();
        } catch (error) {
            console.error("Family page loading error:", error);
        }

        const scrollArea =
            familyView.querySelector(".family-scroll-area");

        if (scrollArea) {
            requestAnimationFrame(() => {
                scrollArea.scrollTop = 0;
            });
        }
    }

    if (viewId === "view-profile") {
        try {
            loadPersonalForm(getProfile());
        } catch (error) {
            console.error("Personal page loading error:", error);
        }
    }
}

/* =========================================================
   PROFILE PHOTO
========================================================= */

function handleProfilePhoto() {

    const file =
        $("profilePhotoInput")
            .files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            $("profilePhoto").src =
                event.target.result;


            const profile =
                getProfile();


            profile.profilePhoto =
                event.target.result;


            saveProfile(
                profile
            );

        };


    reader.readAsDataURL(
        file
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    document.body.classList.add("profile-page-active");

    const profile = getProfile();

    loadPersonalForm(profile);
    loadFamilyForm(profile);
    renderCorHistory();

    function on(id, event, handler) {
        const element = $(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    on("editProfileBtn", "click", function() {
        if (editMode) {
            loadPersonalForm(getProfile());
            setEditMode(false);
        } else {
            setEditMode(true);
        }
    });

    on("barangay", "change", function() {
        updateClusterFromBarangay();
        $("municipality").value = "BAGAC";
    });

    on("addSiblingBtn", "click", function() {
        addSiblingRow();
    });

    on("saveProfileBtn", "click", saveCurrentProfile);
    on("corFile", "change", updateCorFileName);
    on("submitCorBtn", "click", submitCOR);
    on("profilePhotoInput", "change", handleProfilePhoto);

    setEditMode(false);
});

