/* =========================================================
   BASIS PROFILE JS
========================================================= */

const PROFILE_STORAGE_KEY = "basisScholarProfile";
const ACCOUNT_API = "../admin/api/account_api.php";


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

async function persistAccountProfile(profile) {
    const response = await fetch(`${ACCOUNT_API}?action=profile`, {method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile})});
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Unable to save profile.");
    window.dispatchEvent(new CustomEvent("basis-profile-updated", {detail: profile}));
}

async function loadAccountProfile() {
    const response = await fetch(`${ACCOUNT_API}?action=profile`, {credentials:"same-origin"});
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Unable to load profile.");
    return {...structuredClone(DEFAULT_PROFILE), ...data.profile};
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

    $("controlNumberField").value =
        profile.controlNumber || profile.control_number || "";

    $("religion").value =
        profile.religion || "";


    /* Municipality is automatic */

    $("municipality").value =
        "BAGAC";


    /* Barangay */

    populateBarangays(
        profile.barangay || ""
    );


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

async function saveCurrentProfile() {

    const profile =
        getProfile();


    Object.assign(

        profile,

        collectPersonalData(),

        collectFamilyData()

    );


    saveProfile(profile);
    try { await persistAccountProfile(profile); }
    catch (error) { alert(error.message); return; }


    updateProfileHeader(
        profile
    );


    setEditMode(false);


    alert(
        "Profile saved successfully."
    );
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
    target.style.setProperty("display", "flex", "important");

    if (viewId === "view-profile-family") {
        try {
            const profile = getProfile();
            loadFamilyForm(profile);
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

document.addEventListener("DOMContentLoaded", async function() {

    document.body.classList.add("profile-page-active");

    let profile = getProfile();
    try { profile = await loadAccountProfile(); saveProfile(profile); }
    catch (error) { console.error(error); }

    loadPersonalForm(profile);
    loadFamilyForm(profile);

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
        $("municipality").value = "BAGAC";
    });

    on("addSiblingBtn", "click", function() {
        addSiblingRow();
    });

    on("saveProfileBtn", "click", saveCurrentProfile);
    on("profilePhotoInput", "change", handleProfilePhoto);

    setEditMode(false);
});

