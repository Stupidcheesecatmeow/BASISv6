const PROFILE_STORAGE_KEY = `basisProfile_${sessionStorage.getItem("basisCurrentUserId") || "guest"}`;
const ROLE_STORAGE_KEY = "basisAssignedRole";

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
   SCHOOL, RELIGION AND PROGRAM OPTIONS
   Custom entries are retained locally for reuse. Profile
   values continue through the existing BASISAuth save flow.
========================================================= */

const PROFILE_OPTION_STORAGE = "basisProfileDropdownOptions";

const SCHOOL_OPTIONS = [
    "ACLC College",
    "Apcas Balanga",
    "Bataan Christian College Inc.",
    "Bataan Heroes College",
    "Bataan Maritime Institute",
    "Bataan Peninsula State University - Abucay Campus",
    "Bataan Peninsula State University - Bagac Campus",
    "Bataan Peninsula State University - Balanga Campus",
    "Bataan Peninsula State University - Dinalupihan Campus",
    "Bataan Peninsula State University - Main Campus",
    "Bataan Peninsula State University - Orani Campus",
    "Colegio de San Juan de Letran Bataan",
    "College of Subic Montessori - Bataan",
    "Eastwoods Professional College of Science & Technology",
    "Limay Polytechnic College",
    "Maritime Academy of Asia and the Pacific",
    "Microcity College Bataan",
    "Philippine Women's University (PWU) - Bataan",
    "Polytechnic University of the Philippines Bataan",
    "Tomas del Rosario College",
    "University of Nueva Caceres–Bataan"
];

const RELIGION_OPTIONS = [
    "Roman Catholic",
    "Iglesia ni Cristo",
    "Islam",
    "Born Again Christian",
    "Evangelical / Protestant Churches",
    "Aglipayan",
    "Adventist",
    "Jehovah's Witnesses",
    "Atheist"
];

const PROGRAM_OPTIONS = [
    "Bachelor of Science in Agriculture Major in Animal Science",
    "Bachelor of Science in Agriculture Major in Crop Science",
    "Bachelor of Science in Agricultural and Biosystem Engineering",
    "Bachelor of Technical-Vocational Teacher Education Major in Animal Production",
    "Bachelor of Technical-Vocational Teacher Education Major in Crops Production",
    "Bachelor of Science in Industrial Technology Major in Electrical Technology",
    "Bachelor of Science in Industrial Technology Major in Welding and Fabrication Technology",
    "Bachelor in Secondary Education Major in English",
    "Bachelor in Secondary Education Major in Filipino",
    "Bachelor in Secondary Education Major in Social Studies",
    "Bachelor in Public Administration",
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Business Administration Major in Human Resource Management",
    "Bachelor of Science in Business Administration Major in Marketing Management",
    "Bachelor of Science in Business Administration Major in Operations Management",
    "Bachelor of Science in Psychology",
    "Bachelor of Arts in Psychology",
    "Bachelor of Science in Human Services",
    "Bachelor of Early Childhood Education",
    "Bachelor of Elementary Education",
    "Bachelor in Secondary Education Major in Mathematics",
    "Bachelor in Secondary Education Major in General Science",
    "Bachelor of Science in Fisheries",
    "Bachelor of Technical Livelihood Education Major in Industrial Arts",
    "Bachelor of Physical Education",
    "Bachelor of Science in Exercise and Sports Science Major in Fitness and Sports Coaching",
    "Bachelor of Science in Exercise and Sports Science Major in Fitness and Sports Management",
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Civil Engineering Major in Construction Engineering & Management",
    "Bachelor of Science in Civil Engineering Major in Structural Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Mechanical Engineering",
    "Bachelor of Science in Industrial Engineering",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Tourism Management",
    "Bachelor of Science in Midwifery",
    "Bachelor of Science in Nursing",
    "Bachelor of Science in Public Health",
    "Bachelor of Arts in Communication Major in New Media",
    "Bachelor of Arts in Communication Major in Creative Performing Arts",
    "Bachelor of Science in Computer Science Major in Network and Data Communication",
    "Bachelor of Science in Computer Science Major in Software Development",
    "Bachelor of Science in Information Technology Major in Network and Web Application",
    "Bachelor of Science in Entertainment and Multimedia Computing Major in Game Development",
    "Bachelor of Science in Entertainment and Multimedia Computing Major in Digital Animation Technology",
    "Bachelor of Industrial Technology Major in Drafting Technology",
    "Bachelor of Industrial Technology Major in Automotive Technology",
    "Bachelor of Industrial Technology Major in Electronics Technology",
    "Bachelor of Industrial Technology Major in Electrical Technology",
    "Bachelor of Industrial Technology Major in Mechanical Technology",
    "Bachelor of Industrial Technology Major in Welding and Fabrication Technology",
    "Bachelor of Industrial Technology Major in Heating, Ventilation, and Air-conditioning Technology",
    "Bachelor of Industrial Technology Major in Food and Service Technology Technology",
    "Bachelor of Industrial Technology Major in Garments, Fashion, and Design Technology"
];

function readProfileOptionCatalog() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_OPTION_STORAGE) || "{}");
    } catch {
        return {};
    }
}

function saveProfileOptionCatalog(catalog) {
    localStorage.setItem(PROFILE_OPTION_STORAGE, JSON.stringify(catalog));
}

function populateProfileDropdown(inputId, options, selectedValue = "", type) {
    const input = $(inputId);
    const list = $(`${type}Options`);
    if (!input || !list) return;

    const catalog = readProfileOptionCatalog();
    const customOptions = Array.isArray(catalog[type]) ? catalog[type] : [];
    const allOptions = [...new Set([...options, ...customOptions])];
    list.replaceChildren();
    allOptions.forEach(label => {
        const option = document.createElement("option");
        option.value = label;
        list.appendChild(option);
    });
    if (type === "program") {
        const otherOption = document.createElement("option");
        otherOption.value = "Others";
        list.appendChild(otherOption);
    }
    input.value = selectedValue || "";
    input.placeholder = type === "school" ? "TYPE OR SELECT SCHOOL / CAMPUS" :
        type === "religion" ? "TYPE OR SELECT RELIGION" : "TYPE OR SELECT PROGRAM";

    input.oninput = () => {
        if (type === "program" && input.value.trim().toLowerCase() === "others") {
            input.value = "Bachelor of Science in ";
            input.setSelectionRange(input.value.length, input.value.length);
        }
    };
}

function getDropdownFieldValue(type) {
    const input = $({ school: "school", religion: "religion", program: "program" }[type]);
    if (!input) return "";
    let value = input.value.trim();
    if (type === "program" && value.toLowerCase() === "others") value = "Bachelor of Science in ";
    if (!value) return "";

    const catalog = readProfileOptionCatalog();
    catalog[type] = Array.isArray(catalog[type]) ? catalog[type] : [];
    const knownOptions = { school: SCHOOL_OPTIONS, religion: RELIGION_OPTIONS, program: PROGRAM_OPTIONS }[type];
    if (![...knownOptions, ...catalog[type]].some(item => item.toLowerCase() === value.toLowerCase())) {
        catalog[type].push(value);
        saveProfileOptionCatalog(catalog);
    }
    return value;
}

function setupProfileDropdowns(profile = getProfile()) {
    populateProfileDropdown("school", SCHOOL_OPTIONS, profile.school || "", "school");
    populateProfileDropdown("religion", RELIGION_OPTIONS, profile.religion || "", "religion");
    populateProfileDropdown("program", PROGRAM_OPTIONS, profile.program || "", "program");
}

/* =========================================================
   CLUSTER MAPPING

   I kept this structure so we can connect the actual
   barangay -> cluster mapping later without changing
   the rest of the profile logic.
========================================================= */

const BARANGAY_CLUSTERS = {
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
   ACADEMIC YEAR / SEMESTER

   These keys will later be used by the ADMIN USER
   MANAGEMENT page.

   Example later:
   localStorage.setItem("basisActiveAcademicYear", "2027 - 2028");
   localStorage.setItem("basisActiveSemester", "2ND SEMESTER");

   This profile page will automatically read those values.
========================================================= */

const ACADEMIC_YEAR_KEY = "basisActiveAcademicYear";
const SEMESTER_KEY = "basisActiveSemester";

const DEFAULT_ACADEMIC_YEAR = "2026 - 2027";
const DEFAULT_SEMESTER = "1ST SEMESTER";

function getAcademicPeriod() {

    return {

        academicYear:
            localStorage.getItem(
                ACADEMIC_YEAR_KEY
            ) ||
            DEFAULT_ACADEMIC_YEAR,

        semester:
            localStorage.getItem(
                SEMESTER_KEY
            ) ||
            DEFAULT_SEMESTER

    };

}

function renderAcademicPeriod() {

    const period =
        getAcademicPeriod();

    const academicYear =
        $("academicYearDisplay");

    const semester =
        $("semesterDisplay");

    if (academicYear) {

        academicYear.textContent =
            period.academicYear;

    }

    if (semester) {

        semester.textContent =
            period.semester;

    }

}

/* =========================================================
   DEFAULT PROFILE
========================================================= */

const DEFAULT_PROFILE = {

    registrationStatus: "approved",

    role: "REPRESENTATIVE",

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

    siblings: [],

    profileCompleted: false

};

/* =========================================================
   HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

}

/* =========================================================
   GET PROFILE
========================================================= */

function getProfile() {

    const saved =
        localStorage.getItem(
            PROFILE_STORAGE_KEY
        );

    if (!saved) {

        return structuredClone(
            DEFAULT_PROFILE
        );

    }

    try {

        return {

            ...structuredClone(
                DEFAULT_PROFILE
            ),

            ...JSON.parse(saved)

        };

    } catch (error) {

        console.error(
            "Unable to load profile:",
            error
        );

        return structuredClone(
            DEFAULT_PROFILE
        );

    }

}

/* =========================================================
   SAVE PROFILE
========================================================= */

function saveProfile(profile) {

    localStorage.setItem(

        PROFILE_STORAGE_KEY,

        JSON.stringify(profile)

    );

}

/* =========================================================
   DISPLAY HELPERS
========================================================= */

function displayValue(value) {

    const clean =
        String(value ?? "").trim();

    return clean || "—";

}

function formatDate(value) {

    if (!value) {

        return "—";

    }

    const date =
        new Date(
            `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }

    return date.toLocaleDateString(
        "en-PH",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")

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
   BARANGAY
========================================================= */

function populateBarangays(
    selected = ""
) {

    const barangay =
        $("barangay");

    if (!barangay) return;

    barangay.innerHTML =
        '<option value="">SELECT BARANGAY</option>';

    BAGAC_BARANGAYS.forEach(
        name => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = name;

            option.textContent =
                name;

            if (

                name.toLowerCase() ===

                String(selected)
                    .toLowerCase()

            ) {

                option.selected = true;

            }

            barangay.appendChild(
                option
            );

        }
    );

    updateCluster();

}

/* =========================================================
   CLUSTER
========================================================= */

function updateCluster() {

    const barangay =
        $("barangay")?.value || "";

    const profile =
        getProfile();

    const mappedCluster =
        BARANGAY_CLUSTERS[
            barangay
        ];

    if (mappedCluster) {

        profile.cluster =
            mappedCluster;

        saveProfile(profile);

    }

    const summaryCluster =
        $("summaryCluster");

    if (summaryCluster) {

        summaryCluster.textContent =
            displayValue(
                mappedCluster ||
                profile.cluster
            );

    }

}

/* =========================================================
   CONTROL NUMBER
========================================================= */

function generateControlNumber() {

    const year =
        new Date().getFullYear();

    const random =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return `BASIS-${year}-${random}`;

}

function ensureControlNumber(
    profile
) {

    if (

        profile.registrationStatus ===
        "approved" &&

        !profile.controlNumber

    ) {

        profile.controlNumber =
            generateControlNumber();

        saveProfile(profile);

    }

    return profile.controlNumber || "";

}

/* =========================================================
   ROLE
========================================================= */

function getAssignedRole(
    profile
) {

    const storedRole =
        localStorage.getItem(
            ROLE_STORAGE_KEY
        );

    const role =
        storedRole ||
        profile.role ||
        "REPRESENTATIVE";

    return String(role)

        .trim()

        .toUpperCase() ||

        "REPRESENTATIVE";

}

function setAssignedRole(
    role
) {

    const normalized =

        String(role || "")

            .trim()

            .toUpperCase();

    if (!normalized) return;

    localStorage.setItem(
        ROLE_STORAGE_KEY,
        normalized
    );

    const profile =
        getProfile();

    profile.role =
        normalized;

    saveProfile(profile);

    updateProfileHeader(
        profile
    );

}

/* =========================================================
   PROFILE HEADER
========================================================= */

function updateProfileHeader(
    profile
) {

    const assignedRole =
        getAssignedRole(
            profile
        );

    const roleLabel =
        $("displayRole");

    if (roleLabel) {

        roleLabel.textContent =
            assignedRole;

    }

    const fullName = [

        profile.givenName,

        profile.middleName,

        profile.surname,

        profile.suffix

    ]

        .filter(Boolean)

        .join(" ")

        .trim();

    if ($("displayFullName")) {

        $("displayFullName")
            .textContent =

            fullName ||
            "REGISTERED USER";

    }

    if ($("displayLocation")) {

        $("displayLocation")
            .textContent =

            profile.barangay

                ? `${profile.barangay}, ${profile.municipality || "BAGAC"}`

                : (
                    profile.municipality ||
                    "BAGAC"
                );

    }

    const controlNumber =
        $("displayControlNumber");

    if (controlNumber) {

        if (

            profile.registrationStatus ===
            "approved"

        ) {

            const number =
                ensureControlNumber(
                    profile
                );

            controlNumber.textContent =

                number

                    ? `CONTROL NO: ${number}`

                    : "";

            controlNumber.style.display =

                number

                    ? "inline-flex"

                    : "none";

        } else {

            controlNumber.textContent =
                "";

            controlNumber.style.display =
                "none";

        }

    }

    const status =

        profile.registrationStatus ===
        "approved"

            ? (
                profile.studentStatus ||
                "ACTIVE"
            ).toUpperCase()

            : "PENDING";

    if ($("statusTitle")) {

        $("statusTitle")
            .textContent =
            status;

        $("statusTitle")
            .classList.remove(
                "inactive",
                "pending"
            );

        if (
            status === "INACTIVE"
        ) {

            $("statusTitle")
                .classList.add(
                    "inactive"
                );

        }

        if (
            status === "PENDING"
        ) {

            $("statusTitle")
                .classList.add(
                    "pending"
                );

        }

    }

    if ($("headerWelcomeRole")) {

        $("headerWelcomeRole")
            .textContent =
            `MABUHAY, ${String(profile.givenName || profile.given_name || profile.name || "").trim().split(/\s+/)[0].toLocaleUpperCase()}!`;

    }

}

/* =========================================================
   REGISTRATION APPROVAL
========================================================= */

function setRegistrationApproval(
    approved
) {

    const profile =
        getProfile();

    profile.registrationStatus =

        approved
            ? "approved"
            : "pending";

    if (!approved) {

        profile.controlNumber =
            "";

        profile.studentStatus =
            "PENDING";

    } else {

        profile.studentStatus =

            profile.studentStatus ===
            "PENDING"

                ? "ACTIVE"

                : (
                    profile.studentStatus ||
                    "ACTIVE"
                );

        ensureControlNumber(
            profile
        );

    }

    saveProfile(profile);


// Sync the updated picture with the sidebar and topbar.
window.dispatchEvent(
    new Event("basis:profile-photo-updated")
);

    loadProfile(profile);

}

/* =========================================================
   LOAD PERSONAL FORM
========================================================= */

function loadPersonalForm(
    profile
) {

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

        profile.controlNumber ||
        profile.control_number ||
        "";

    setupProfileDropdowns(profile);

    $("municipality").value =
        "BAGAC";

    populateBarangays(
        profile.barangay || ""
    );

    // Dropdowns are populated by setupProfileDropdowns(profile).

    $("yearLevel").value =
        profile.yearLevel || "";

    if (profile.profilePhoto) {

        $("profilePhoto").src =
            profile.profilePhoto;

    } else {

        $("profilePhoto").src =
            "../images/profile_default.jpg";

    }

}

/* =========================================================
   LOAD FAMILY FORM
========================================================= */

function loadFamilyForm(
    profile
) {

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

    if (!container) return;

    container.innerHTML = "";

    const siblings =

        profile.siblings?.length

            ? profile.siblings

            : [{}];

    siblings.forEach(
        sibling => {

            addSiblingRow(
                sibling
            );

        }
    );

}

/* =========================================================
   ADD SIBLING
========================================================= */

function addSiblingRow(
    data = {}
) {

    const row =
        document.createElement(
            "div"
        );

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

        <div class="form-group">

            <label>SUFFIX:</label>

            <input
                type="text"
                class="sibling-suffix"
                value="${escapeHtml(
                    data.suffix || ""
                )}"
            >

        </div>

        <button
            type="button"
            class="remove-sibling-btn"
            title="Remove sibling"
        >
            <i class="fa-solid fa-trash"></i>
        </button>

    `;

    const removeButton =
        row.querySelector(
            ".remove-sibling-btn"
        );

    removeButton.addEventListener(
        "click",
        function() {

            row.remove();

            const remaining =
                document.querySelectorAll(
                    "#siblingsContainer .sibling-grid-row"
                );

            if (!remaining.length) {

                addSiblingRow();

            }

        }
    );

    $("siblingsContainer")
        .appendChild(row);

}

/* =========================================================
   COLLECT PERSONAL DATA
========================================================= */

function collectPersonalData() {

    const currentProfile =
        getProfile();

    const selectedBarangay =
        $("barangay").value;

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
            getDropdownFieldValue("religion"),

        municipality:
            "BAGAC",

        barangay:
            selectedBarangay,

        cluster:
            BARANGAY_CLUSTERS[
                selectedBarangay
            ] ||
            currentProfile.cluster ||
            "",

        school:
            getDropdownFieldValue("school"),

        program:
            getDropdownFieldValue("program"),

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

        .forEach(
            row => {

                siblings.push({

                    given:
                        row.querySelector(
                            ".sibling-given"
                        )?.value
                            .trim() || "",

                    surname:
                        row.querySelector(
                            ".sibling-surname"
                        )?.value
                            .trim() || "",

                    middle:
                        row.querySelector(
                            ".sibling-middle"
                        )?.value
                            .trim() || "",

                    suffix:
                        row.querySelector(
                            ".sibling-suffix"
                        )?.value
                            .trim() || ""

                });

            }
        );

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
   SUMMARY HELPERS
========================================================= */

function setSummary(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.textContent =
            displayValue(
                value
            );

    }

}

/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary(
    profile
) {

    /* PERSONAL */

    setSummary(
        "summarySurname",
        profile.surname
    );

    setSummary(
        "summaryGivenName",
        profile.givenName
    );

    setSummary(
        "summaryMiddleName",
        profile.middleName
    );

    setSummary(
        "summarySuffix",
        profile.suffix
    );

    setSummary(
        "summarySex",
        profile.sex
    );

    setSummary(
        "summaryBirthday",
        formatDate(
            profile.birthday
        )
    );

    setSummary(
        "summaryContact",
        profile.contact
    );

    setSummary(
        "summaryEmail",
        profile.email
    );

    setSummary(
        "summaryControlNumber",
        profile.controlNumber
    );

    setSummary(
        "summaryReligion",
        profile.religion
    );

    /* ADDRESS */

    setSummary(
        "summaryMunicipality",
        profile.municipality ||
        "BAGAC"
    );

    setSummary(
        "summaryBarangay",
        profile.barangay
    );

    setSummary(
        "summaryCluster",
        profile.cluster
    );

    /* ACADEMIC */

    setSummary(
        "summarySchool",
        profile.school
    );

    setSummary(
        "summaryProgram",
        profile.program
    );

    setSummary(
        "summaryYearLevel",
        profile.yearLevel
    );

    /* FATHER */

    setSummary(
        "summaryFatherGiven",
        profile.father?.given
    );

    setSummary(
        "summaryFatherSurname",
        profile.father?.surname
    );

    setSummary(
        "summaryFatherMiddle",
        profile.father?.middle
    );

    setSummary(
        "summaryFatherSuffix",
        profile.father?.suffix
    );

    setSummary(
        "summaryFatherContact",
        profile.father?.contact
    );

    /* MOTHER */

    setSummary(
        "summaryMotherGiven",
        profile.mother?.given
    );

    setSummary(
        "summaryMotherSurname",
        profile.mother?.surname
    );

    setSummary(
        "summaryMotherMiddle",
        profile.mother?.middle
    );

    setSummary(
        "summaryMotherSuffix",
        profile.mother?.suffix
    );

    setSummary(
        "summaryMotherContact",
        profile.mother?.contact
    );

    renderSiblingSummary(
        profile.siblings || []
    );

}

/* =========================================================
   SIBLING SUMMARY
========================================================= */

function renderSiblingSummary(
    siblings
) {

    const container =
        $("summarySiblings");

    if (!container) return;

    container.innerHTML = "";

    const validSiblings =
        siblings.filter(
            sibling =>
                sibling &&
                (
                    sibling.given ||
                    sibling.surname ||
                    sibling.middle ||
                    sibling.suffix
                )
        );

    if (!validSiblings.length) {

        container.innerHTML = `

            <div class="no-sibling">

                No sibling information added.

            </div>

        `;

        return;

    }

    validSiblings.forEach(
        sibling => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "sibling-summary-row";

            row.innerHTML = `

                <div class="summary-item">

                    <span>GIVEN NAME</span>

                    <strong>
                        ${escapeHtml(
                            displayValue(
                                sibling.given
                            )
                        )}
                    </strong>

                </div>

                <div class="summary-item">

                    <span>SURNAME</span>

                    <strong>
                        ${escapeHtml(
                            displayValue(
                                sibling.surname
                            )
                        )}
                    </strong>

                </div>

                <div class="summary-item">

                    <span>MIDDLE NAME</span>

                    <strong>
                        ${escapeHtml(
                            displayValue(
                                sibling.middle
                            )
                        )}
                    </strong>

                </div>

                <div class="summary-item">

                    <span>SUFFIX</span>

                    <strong>
                        ${escapeHtml(
                            displayValue(
                                sibling.suffix
                            )
                        )}
                    </strong>

                </div>

            `;

            container.appendChild(
                row
            );

        }
    );

}

/* =========================================================
   EDIT MODE
========================================================= */

let editMode = false;

function setEditMode(enabled) {

    const page = document.querySelector(".profile-page-main");
    const summaryView = $("profileSummaryView");
    const editView = $("profileEditView");
    const editButton = $("editProfileBtn");
    const summaryNote = $("summaryModeNote");

    if (!page || !summaryView || !editView) {
        console.error("Profile edit elements not found.");
        return;
    }

    editMode = Boolean(enabled);

    if (editMode) {

        const profile = getProfile();

        loadPersonalForm(profile);
        loadFamilyForm(profile);
        renderAcademicPeriod();

        page.classList.add("editing");

        summaryView.style.display = "none";
        editView.style.display = "block";

        if (summaryNote) {
            summaryNote.style.display = "none";
        }

        if (editButton) {
            editButton.textContent = "CANCEL EDIT";
        }

        console.log("Profile edit mode: ON");

    } else {

        const profile = getProfile();

        page.classList.remove("editing");

        summaryView.style.display = "block";
        editView.style.display = "none";

        renderSummary(profile);
        updateProfileHeader(profile);

        if (summaryNote) {
            summaryNote.style.display = "inline-flex";
        }

        if (editButton) {
            editButton.textContent = "EDIT PROFILE";
        }

        console.log("Profile edit mode: OFF");
    }
}

/* =========================================================
   LOAD COMPLETE PROFILE
========================================================= */

function loadProfile(
    profile
) {

    if (!profile) {

        profile =
            getProfile();

    }

    if (

        profile.registrationStatus ===
        "approved"

    ) {

        ensureControlNumber(
            profile
        );

    }

    loadPersonalForm(
        profile
    );

    loadFamilyForm(
        profile
    );

    updateProfileHeader(
        profile
    );

    renderSummary(
        profile
    );

    renderAcademicPeriod();

    if ($("profilePhoto")) {

        $("profilePhoto").src =

            profile.profilePhoto ||

            "../images/profile_default.jpg";

    }

    if (
        profile.profileCompleted
    ) {

        setEditMode(
            false
        );

    } else {

        setEditMode(
            true
        );

    }

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

    profile.profileCompleted =
        true;

    if (

        profile.registrationStatus ===
        "approved"

    ) {

        ensureControlNumber(
            profile
        );

    }

    saveProfile(
        profile
    );

    try {

        if (

            window.BASISAuth &&

            typeof window.BASISAuth
                .saveProfile ===
                "function"

        ) {

            await window.BASISAuth
                .saveProfile(

                    profile,

                    PROFILE_STORAGE_KEY

                );

        }

    } catch (error) {

        alert(
            error.message
        );

        return;

    }

    loadProfile(
        profile
    );

    setEditMode(
        false
    );

    alert(
        "Profile saved successfully."
    );

}

/* =========================================================
   PROFILE PHOTO
========================================================= */

function handleProfilePhoto() {

    const file =
        $("profilePhotoInput")
            ?.files?.[0];

    if (!file) return;

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select an image file."
        );

        return;

    }

    const reader =
        new FileReader();

    reader.onload =
        function(event) {

            const imageData =
                event.target.result;

            if ($("profilePhoto")) {

                $("profilePhoto")
                    .src =
                    imageData;

            }

            const profile =
                getProfile();

            profile.profilePhoto =
                imageData;

            saveProfile(
                profile
            );

            if (!editMode) {

                renderSummary(
                    profile
                );

            }

        };

    reader.readAsDataURL(
        file
    );

}

/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /* Hide header avatar on profile page */

        const headerAvatar =
            document.querySelector(
                ".profile-avatar-wrapper"
            );

        if (headerAvatar) {

            headerAvatar.style.setProperty(
                "display",
                "none",
                "important"
            );

        }

        /* Load profile */

        const profile =
            getProfile();

        loadProfile(
            profile
        );

        /* Helper */

        function on(
            id,
            event,
            handler
        ) {

            const element =
                $(id);

            if (element) {

                element.addEventListener(
                    event,
                    handler
                );

            }

        }

        /* =================================================
           EDIT PROFILE
        ================================================= */

        on(
            "editProfileBtn",
            "click",
            function() {

                if (editMode) {

                    const profile =
                        getProfile();

                    loadProfile(
                        profile
                    );

                    setEditMode(
                        false
                    );

                } else {

                    setEditMode(
                        true
                    );

                }

            }
        );

        /* =================================================
           CANCEL EDIT
        ================================================= */

        on(
            "cancelEditBtn",
            "click",
            function() {

                const profile =
                    getProfile();

                loadProfile(
                    profile
                );

                setEditMode(
                    false
                );

            }
        );

        /* =================================================
           BARANGAY
        ================================================= */

        on(
            "barangay",
            "change",
            function() {

                updateCluster();

            }
        );

        /* =================================================
           ADD SIBLING
        ================================================= */

        on(
            "addSiblingBtn",
            "click",
            function() {

                addSiblingRow();

            }
        );

        /* =================================================
           SAVE PROFILE
        ================================================= */

        on(
            "saveProfileBtn",
            "click",
            saveCurrentProfile
        );

        /* =================================================
           PROFILE PHOTO
        ================================================= */

        on(
            "profilePhotoInput",
            "change",
            handleProfilePhoto
        );

        /* =================================================
           ACADEMIC PERIOD
        ================================================= */

        renderAcademicPeriod();

    }
);

/* =========================================================
   BACKWARD COMPATIBILITY

   Old profile code may still call showSubView().
   We keep the function so it won't throw an error,
   but the actual profile is now ONE PAGE.
========================================================= */

function showSubView(
    viewId
) {

    if (
        viewId ===
        "view-profile-family"
    ) {

        setEditMode(
            true
        );

        setTimeout(
            function() {

                const familyCard =
                    document.querySelector(
                        ".family-edit-block"
                    );

                if (familyCard) {

                    familyCard.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            },
            50
        );

    } else {

        const scrollArea =
            document.querySelector(
                ".profile-scroll-area"
            );

        if (scrollArea) {

            scrollArea.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }

    }

}
