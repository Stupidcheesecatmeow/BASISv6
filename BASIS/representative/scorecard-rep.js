/* =========================================================
   BASIS - ADMIN SCORECARD
   COMPLETE WORKING VERSION
   ========================================================= */

let scorecardInitialPeriodOpened = false;


/* =========================================================
   GET REGISTERED ADMIN
   ========================================================= */

function getRegisteredRepresentative() {

    const currentUserId =
        sessionStorage.getItem("basisCurrentUserId");

    /* -----------------------------------------
       1. CURRENT USER PROFILE
       ----------------------------------------- */

    if (currentUserId) {

        const profileKey =
            `basisProfile_${currentUserId}`;

        const savedProfile =
            localStorage.getItem(profileKey);

        if (savedProfile) {

            try {

                const admin =
                    JSON.parse(savedProfile);

                if (
                    admin &&
                    typeof admin === "object"
                ) {
                    return admin;
                }

            } catch (error) {

                console.error(
                    "Unable to parse current representative profile:",
                    error
                );

            }
        }
    }


    /* -----------------------------------------
       2. FALLBACK PROFILE STORAGE
       ----------------------------------------- */

    const fallbackKeys = [
        "basisRepresentativeProfile",
        "representativeProfile",
        "basisRepresentative"
    ];

    for (const key of fallbackKeys) {

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
                `Unable to read representative profile from ${key}:`,
                error
            );

        }
    }


    /* -----------------------------------------
       3. SEARCH ALL BASIS PROFILE RECORDS
       ----------------------------------------- */

    for (
        let index = 0;
        index < localStorage.length;
        index++
    ) {

        const key =
            localStorage.key(index);

        if (
            !key ||
            !key.startsWith("basisProfile_")
        ) {
            continue;
        }

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
                `Unable to parse ${key}:`,
                error
            );

        }
    }


    return null;
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Remove old hard-coded activity placeholders from any cached HTML.
        const activityRows = document.getElementById("activityRows");
        if (activityRows) {
            activityRows.replaceChildren();
            activityRows.innerHTML =
                '<div class="representative-empty-activity">Choose a scorecard period to view attendance.</div>';
        }

        renderScorecardButtons();

    }
);


/* =========================================================
   RENDER SCORECARD LIST
   ========================================================= */

async function renderScorecardButtons() {

    const listContainer =
        document.getElementById("scorecardYears");

    if (!listContainer) return;

    listContainer.innerHTML =
        '<div class="scorecard-empty">Loading scorecards…</div>';

    let activities;
    let attendedActivities = [];

    try {

        const profileResponse = await fetch(
            "../admin/api/account_api.php?action=profile",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        const profileData = await profileResponse.json();

        if (!profileResponse.ok || !profileData.success) {
            throw new Error(
                profileData.message || "Unable to load profile."
            );
        }

        if (profileData.profile) {
            loadRepresentativeInfo(profileData.profile);
        } else {
            loadDefaultRepresentativeInfo();
        }

        const attendanceResponse = await fetch(
            "../admin/api/activity_api.php?action=my-attended-activities",
            { credentials: "same-origin", cache: "no-store" }
        );
        const attendanceData = await attendanceResponse.json();
        if (!attendanceResponse.ok || !attendanceData.success) {
            throw new Error(attendanceData.message || "Unable to load attendance records.");
        }
        attendedActivities = Array.isArray(attendanceData.activities)
            ? attendanceData.activities
            : [];

        const periodsResponse = await fetch(
            "../admin/api/account_api.php?action=activities",
            { credentials: "same-origin", cache: "no-store" }
        );
        const periodsData = await periodsResponse.json();
        if (!periodsResponse.ok || !periodsData.success) {
            throw new Error(periodsData.message || "Unable to load academic periods.");
        }
        activities = Array.isArray(periodsData.activities)
            ? periodsData.activities
            : [];

    } catch (error) {

        console.error(
            "Unable to load scorecard activities:",
            error
        );

        listContainer.innerHTML =
            '<div class="scorecard-empty">Unable to load activities. Please refresh the page.</div>';

        return;
    }

    const groups = new Map();

    activities.forEach(activity => {

        const academicYear = String(
            activity.academicYear ||
            activity.academic_year ||
            activity.schoolYear ||
            activity.school_year ||
            ""
        ).trim();

        const semesterRaw = String(
            activity.semester ||
            activity.sem ||
            activity.term ||
            ""
        ).trim();

        // Require an academic year and semester from a real activity.
        if (!academicYear || !semesterRaw) return;

        const semester =
            normalizeSemester(semesterRaw);

        if (
            ![
                "first semester",
                "second semester"
            ].includes(semester)
        ) {
            return;
        }

        const yearKey =
            normalizeAcademicYear(academicYear);

        const key =
            `${yearKey}::${semester}`;

        if (!groups.has(key)) {

            groups.set(key, {
                academicYear: academicYear.replace(/-/g, "–"),
                semester,
                activities: []
            });

        }

        groups.get(key).activities.push(activity);

    });

    listContainer.innerHTML = "";

    if (groups.size === 0) {

        listContainer.innerHTML = `
            <div class="scorecard-empty">
                <i class="fa-solid fa-address-card"></i>
                <h3>No scorecards yet.</h3>
                <p>Create an activity and assign its academic year and semester. The matching scorecard will appear here automatically.</p>
            </div>`;

        updateScorecardScroll();
        return;
    }

    const orderedGroups =
        [...groups.values()].sort((a, b) => {

            const yearCompare =
                b.academicYear.localeCompare(a.academicYear);

            if (yearCompare) return yearCompare;

            return a.semester === b.semester
                ? 0
                : a.semester === "first semester"
                    ? -1
                    : 1;

        });

    const years = new Map();

    orderedGroups.forEach(group => {

        if (!years.has(group.academicYear)) {
            years.set(group.academicYear, []);
        }

        years.get(group.academicYear).push(group);

    });

    years.forEach((semesterGroups, academicYear) => {

        const yearContainer =
            document.createElement("div");

        yearContainer.className =
            "scorecard-year-container";

        yearContainer.innerHTML = `
            <div class="scorecard-year-header">
                <div>
                    <span class="scorecard-year-label">Academic Year</span>
                    <div class="scorecard-year-value">${escapeHtml(academicYear)}</div>
                </div>
                <span class="scorecard-year-count">${semesterGroups.length} Semester${semesterGroups.length === 1 ? "" : "s"}</span>
            </div>
            <div class="scorecard-semester-list"></div>`;

        const semesterList =
            yearContainer.querySelector(".scorecard-semester-list");

        semesterGroups.forEach(group => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "scorecard-semester-item";

            const label =
                group.semester.toUpperCase();

            const attendedCount = attendedActivities.filter(activity => {
                const activityAY = activity.academicYear || activity.academic_year || activity.schoolYear || activity.school_year || "";
                const activitySemester = activity.semester || activity.sem || activity.term || "";
                return normalizeAcademicYear(activityAY) === normalizeAcademicYear(academicYear) &&
                    normalizeSemester(activitySemester) === normalizeSemester(group.semester);
            }).length;

            button.innerHTML = `
                <span class="scorecard-semester-name">${escapeHtml(label)} SCORECARD</span>
                <span class="scorecard-semester-meta">${escapeHtml(academicYear)} • ${attendedCount} attended activit${attendedCount === 1 ? "y" : "ies"}</span>
                <span class="scorecard-arrow"><i class="fa-solid fa-chevron-right"></i></span>`;

            button.addEventListener("click", () => {
                openScorecardDetail(
                    academicYear,
                    group.semester
                );
            });

            semesterList.appendChild(button);

        });

        listContainer.appendChild(yearContainer);

    });

    updateScorecardScroll();

    if (!scorecardInitialPeriodOpened) {
        const latestAttended = attendedActivities.find(activity => {
            const year = activity.academicYear || activity.academic_year || activity.schoolYear || activity.school_year || "";
            const term = activity.semester || activity.sem || activity.term || "";
            return year && term;
        });

        if (latestAttended) {
            const year = latestAttended.academicYear || latestAttended.academic_year || latestAttended.schoolYear || latestAttended.school_year;
            const term = latestAttended.semester || latestAttended.sem || latestAttended.term;
            const period = orderedGroups.find(group =>
                normalizeAcademicYear(group.academicYear) === normalizeAcademicYear(year) &&
                normalizeSemester(group.semester) === normalizeSemester(term)
            );

            scorecardInitialPeriodOpened = true;
            openScorecardDetail(
                period ? period.academicYear : year,
                period ? period.semester : term
            );
        }
    }

}


function getCurrentAcademicYear() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    return `${year}–${year + 1}`;

}

function getScorecardHeaderPeriod(academicYear, semester) {
    const yearPattern = /^\s*\d{4}\s*[-–—]\s*\d{4}\s*$/;
    const yearValue = String(academicYear || "").trim();
    const semesterValue = String(semester || "").trim();
    const resolvedYear = yearPattern.test(yearValue)
        ? yearValue
        : yearPattern.test(semesterValue)
            ? semesterValue
            : getCurrentAcademicYear();
    const resolvedSemester = ["first semester", "second semester"].includes(normalizeSemester(semesterValue))
        ? semesterValue
        : ["first semester", "second semester"].includes(normalizeSemester(yearValue))
            ? yearValue
            : "";

    return { academicYear: resolvedYear, semester: resolvedSemester };
}


/* =========================================================
   GET ADMIN COR HISTORY
   ========================================================= */

function getAdminCorHistory() {

    const saved =
        localStorage.getItem("basisAdminCOR");

    if (!saved) {
        return [];
    }

    try {

        const history =
            JSON.parse(saved);

        return Array.isArray(history)
            ? history
            : [];

    } catch (error) {

        console.error(
            "Unable to read admin COR history:",
            error
        );

        return [];
    }

}


/* =========================================================
   OPEN SCORECARD DETAIL
   ========================================================= */

async function getScorecardProfile() {

    // Prefer the latest server profile so nested family details are not stale.
    try {

        const response = await fetch(
            "../admin/api/account_api.php?action=profile",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (
            response.ok &&
            data.success &&
            data.profile
        ) {

            const profile = data.profile;

            if (profile.id) {

                sessionStorage.setItem(
                    "basisCurrentUserId",
                    String(profile.id)
                );

                localStorage.setItem(
                    `basisProfile_${profile.id}`,
                    JSON.stringify(profile)
                );

            }

            return profile;
        }

    } catch (error) {

        console.warn(
            "Could not refresh profile from server; using saved profile.",
            error
        );

    }

    return getRegisteredRepresentative();
}


async function openScorecardDetail(
    academicYear,
    semester
) {

    const headerPeriod =
        getScorecardHeaderPeriod(academicYear, semester);

    const ayTitle =
        document.getElementById("scorecardAYTitle");

    if (ayTitle) {
        ayTitle.textContent = `AY: ${headerPeriod.academicYear}`;
    }

    const semTitle =
        document.getElementById("scorecardSemTitle");

    if (semTitle) {
        semTitle.textContent =
            headerPeriod.semester.toUpperCase() || "SEMESTER";
    }

    const currentRepresentative =
        await getScorecardProfile();

    if (currentRepresentative) {
        loadRepresentativeInfo(currentRepresentative);
    } else {
        loadDefaultRepresentativeInfo();
    }

    const container =
        document.getElementById("activityRows");

    if (container) {
        container.innerHTML =
            '<div class="representative-empty-activity">Loading activities…</div>';
    }

    try {

        const response = await fetch(
            "../admin/api/activity_api.php?action=my-attended-activities",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load activities."
            );
        }

        const activities =
            (Array.isArray(data.activities) ? data.activities : [])
            .filter(activity => {

                const activityAY =
                    activity.academicYear ||
                    activity.academic_year ||
                    activity.schoolYear ||
                    activity.school_year ||
                    "";

                const activitySemester =
                    activity.semester ||
                    activity.sem ||
                    activity.term ||
                    "";

                return (
                    normalizeAcademicYear(activityAY) ===
                    normalizeAcademicYear(academicYear)
                ) && (
                    normalizeSemester(activitySemester) ===
                    normalizeSemester(semester)
                );

            });

        populateActivityRows(activities);

    } catch (error) {

        console.error(
            "Unable to load selected scorecard activities:",
            error
        );

        if (container) {

            container.innerHTML =
                '<div class="representative-empty-activity">Could not load activity records. Please go back and try again.</div>';

        }

    }

    showSubView("view-scorecard-detail");

}


function getStoredActivities() {

    const possibleKeys = [
        "basisActivities",
        "activities",
        "activityRecords",
        "basisActivityRecords",
        "adminActivities"
    ];

    for (const key of possibleKeys) {

        const saved =
            localStorage.getItem(key);

        if (!saved) {
            continue;
        }

        try {

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }

        } catch (error) {

            console.warn(
                `Unable to read ${key}:`,
                error
            );

        }

    }

    return [];

}


/* =========================================================
   DEFAULT ACTIVITIES
   ========================================================= */

function getDefaultActivities() {

    // No sample activities. Show only activities saved in the database.
    return [];

}


/* =========================================================
   LOAD ADMIN INFO
   ========================================================= */

function loadDefaultRepresentativeInfo() {
    const ids = [
        "info-name", "info-sex", "info-birthday", "info-religion",
        "info-email", "info-contact", "info-municipality", "info-barangay",
        "info-father", "info-father-contact", "info-mother",
        "info-mother-contact", "info-siblings", "info-school",
        "info-program", "info-year", "info-control"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "—";
    });
}

function loadRepresentativeInfo(user) {

    if (
        !user ||
        typeof user !== "object"
    ) {

        loadDefaultRepresentativeInfo();
        return;

    }


    /* =====================================================
       PERSONAL INFORMATION
    ===================================================== */

    const fullName =
        user.name ||
        user.fullName ||
        user.full_name ||
        buildRepresentativeName(user) ||
        "—";


    /* =====================================================
       FAMILY INFORMATION
    ===================================================== */

    const family =
        user.familyInformation ||
        user.family_information ||
        user.family ||
        user;

    const father =
        family.father && typeof family.father === "object"
            ? family.father
            : (
                user.father && typeof user.father === "object"
                    ? user.father
                    : {}
            );

    const mother =
        family.mother && typeof family.mother === "object"
            ? family.mother
            : (
                user.mother && typeof user.mother === "object"
                    ? user.mother
                    : {}
            );

    const buildFamilyMemberName = member => {

        if (!member || typeof member !== "object") {
            return "";
        }

        return getFirstValue(
            member.fullName,
            member.full_name,
            member.name,
            [
                member.given,
                member.givenName,
                member.firstName,
                member.first_name,
                member.middle,
                member.middleName,
                member.middle_name,
                member.surname,
                member.lastName,
                member.last_name,
                member.suffix
            ]
                .filter(value =>
                    value != null &&
                    String(value).trim() !== ""
                )
                .join(" ")
        );

    };

    const fatherName =
        getFirstValue(
            user.fatherName,
            user.father_name,
            user.fathersName,
            user.fatherFullName,
            user.parentFather,
            buildFamilyMemberName(father)
        );

    const fatherContact =
        getFirstValue(
            user.fatherContact,
            user.father_contact,
            user.fatherContactNo,
            user.father_contact_no,
            user.fatherPhone,
            user.fatherPhoneNumber,
            father.contact,
            father.contactNo,
            father.contactNumber,
            father.phone
        );

    const motherName =
        getFirstValue(
            user.motherName,
            user.mother_name,
            user.mothersName,
            user.motherFullName,
            user.parentMother,
            buildFamilyMemberName(mother)
        );

    const motherContact =
        getFirstValue(
            user.motherContact,
            user.mother_contact,
            user.motherContactNo,
            user.mother_contact_no,
            user.motherPhone,
            user.motherPhoneNumber,
            mother.contact,
            mother.contactNo,
            mother.contactNumber,
            mother.phone
        );

const siblings = formatSiblings(
    family.siblings || family.siblingsList || family.siblingList ||
    user.siblings || user.sibling || user.siblingsList || user.siblingList
);

    /* =====================================================
       ALL SCORECARD INFORMATION
    ===================================================== */

    const fields = {

        /* PERSONAL */

        "info-name":
            fullName,

        "info-sex":
            getFirstValue(
                user.sex,
                user.gender
            ),

        "info-birthday":
            getFirstValue(
                user.birthday,
                user.birthdate,
                user.dateOfBirth,
                user.date_of_birth
            ),

        "info-religion":
            user.religion,

        "info-email":
            getFirstValue(
                user.email,
                user.emailAddress,
                user.email_address
            ),

        "info-contact":
            getFirstValue(
                user.contact,
                user.contactNo,
                user.contactNumber,
                user.phone,
                user.phoneNumber
            ),

        "info-municipality":
            user.municipality,

        "info-barangay":
            getFirstValue(
                user.barangay,
                user.assignedBarangay,
                user.assigned_barangay
            ),


        /* FAMILY */

        "info-father":
            fatherName,

        "info-father-contact":
            fatherContact,

        "info-mother":
            motherName,

        "info-mother-contact":
            motherContact,

        "info-siblings":
            siblings,


        /* ACADEMIC */

        "info-school":
            getFirstValue(
                user.school,
                user.schoolName,
                user.school_name
            ),

        "info-program":
            getFirstValue(
                user.program,
                user.course,
                user.courseName,
                user.course_name
            ),

        "info-year":
            getFirstValue(
                user.yearLevel,
                user.year,
                user.year_level,
                user.yearLevelName
            ),

        "info-control":
            getFirstValue(
                user.controlNo,
                user.controlNumber,
                user.control_number
            ) || "CONTROL NO. PENDING"

    };


    /* =====================================================
       DISPLAY DATA
    ===================================================== */

    Object.entries(fields).forEach(
        function ([id, value]) {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            element.textContent =
                formatDisplayValue(value);

        }
    );

}


/* =========================================================
   GET FIRST AVAILABLE VALUE
   ========================================================= */

function getFirstValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return "—";

}


/* =========================================================
   FORMAT DISPLAY VALUE
   Prevents [object Object]
   ========================================================= */

function formatDisplayValue(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return "—";

    }


    /* ARRAY */

    if (Array.isArray(value)) {

        return formatSiblings(value);

    }


    /* OBJECT */

    if (typeof value === "object") {

        const objectName =
            value.name ||
            value.fullName ||
            value.full_name ||
            value.surname ||
            value.givenName ||
            value.firstName;

        if (objectName) {

            return String(objectName);

        }

        const values =
            Object.values(value).filter(
                item =>
                    item !== undefined &&
                    item !== null &&
                    String(item).trim() !== ""
            );

        if (values.length > 0) {

            return values
                .map(item =>
                    typeof item === "object"
                        ? JSON.stringify(item)
                        : String(item)
                )
                .join(", ");

        }

        return "—";

    }


    return String(value);

}


/* =========================================================
   FORMAT SIBLINGS
   ========================================================= */

function formatSiblings(siblings) {

    if (
        siblings === undefined ||
        siblings === null ||
        siblings === ""
    ) {

        return "—";

    }


    /* STRING */

    if (typeof siblings === "string") {

        return siblings.trim() || "—";

    }


    /* ARRAY */

    if (Array.isArray(siblings)) {

        if (siblings.length === 0) {

            return "—";

        }

        return siblings
            .map(function (sibling) {

                if (
                    sibling &&
                    typeof sibling === "object"
                ) {

                    return (
                        sibling.name ||
                        sibling.fullName ||
                        sibling.full_name ||
                        [
                            sibling.given,
                            sibling.givenName,
                            sibling.firstName,
                            sibling.first_name,
                            sibling.middle,
                            sibling.middleName,
                            sibling.middle_name,
                            sibling.surname,
                            sibling.lastName,
                            sibling.last_name,
                            sibling.suffix
                        ]
                            .filter(Boolean)
                            .join(" ") ||
                        sibling.relationship ||
                        JSON.stringify(sibling)
                    );

                }

                return String(sibling);

            })
            .filter(
                value =>
                    value &&
                    String(value).trim() !== ""
            )
            .join(", ");

    }


    /* SINGLE OBJECT */

    if (typeof siblings === "object") {

        return (
            siblings.name ||
            siblings.fullName ||
            siblings.full_name ||
            [
                siblings.given,
                siblings.givenName,
                siblings.firstName,
                siblings.middle,
                siblings.middleName,
                siblings.surname,
                siblings.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
            (
                siblings.count
                    ? String(siblings.count)
                    : JSON.stringify(siblings)
            )
        );

    }


    return String(siblings);

}


/* =========================================================
   BUILD ADMIN NAME
   ========================================================= */

function buildRepresentativeName(user) {

    const parts = [

        user.surname,
        user.lastName,
        user.last_name,
        user.givenName,
        user.firstName,
        user.first_name,
        user.middleName,
        user.middle_name,
        user.suffix

    ];


    return parts
        .filter(function (value) {

            return (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            );

        })
        .join(" ");

}


/* =========================================================
   POPULATE ACTIVITY ROWS
   ========================================================= */

function populateActivityRows(activities) {

    const container =
        document.getElementById("activityRows");


    if (!container) {

        console.error(
            "Activity container #activityRows was not found."
        );

        return;
    }


    const rowTemplate = document.getElementById("activityRowTemplate")
        ?.content?.firstElementChild;
    if (!rowTemplate) {
        console.error("Activity row template #activityRowTemplate was not found.");
        return;
    }

    /* CLEAR EXISTING HTML */

    container.replaceChildren();


    /* SAFETY FALLBACK */

    if (
        !Array.isArray(activities) ||
        activities.length === 0
    ) {

        container.innerHTML = `
            <div class="representative-empty-activity">
                No attendance/activity records yet.
            </div>
        `;

        return;
    }


    /* CREATE ROWS */

    activities.forEach(function (activity) {

        if (
            !activity ||
            typeof activity !== "object"
        ) {
            return;
        }


        const row = rowTemplate.cloneNode(true);


        /* TITLE */

        const title =
            activity.title ||
            activity.name ||
            activity.activityName ||
            activity.activity_name ||
            "Untitled Activity";


        /* CATEGORY */

        const category =
            activity.category ||
            activity.type ||
            activity.activityCategory ||
            "General";


        /* DATE */

        const date =
            activity.date ||
            activity.activityDate ||
            activity.attendanceDate ||
            activity.attendance_date ||
            "—";


        row.querySelector(".title-field input").value = String(title);
        row.querySelector(".category-field input").value = String(category);
        row.querySelector(".date-field input").value = String(date);


        container.appendChild(row);

    });

}


/* =========================================================
   SHOW SUB VIEW
   ========================================================= */

function showSubView(viewId) {

    const views =
        document.querySelectorAll(".page-view");


    views.forEach(function (view) {

        view.classList.remove("active");

    });


    const target =
        document.getElementById(viewId);


    if (!target) {

        console.error(
            `Scorecard view "${viewId}" was not found.`
        );

        return;
    }


    target.classList.add("active");


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
        document.getElementById("scorecardYears");


    if (!scorecardList) {
        return;
    }


    const scorecards =
        scorecardList.querySelectorAll(
            ".scorecard-semester-item"
        );


    if (scorecards.length > 0) {

        scorecardList.classList.add("has-scroll");

    } else {

        scorecardList.classList.remove("has-scroll");

    }

}


/* =========================================================
   NORMALIZE ACADEMIC YEAR
   ========================================================= */

function normalizeAcademicYear(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .trim()
        .replace(/-/g, "–")
        .replace(/\s+/g, "")
        .toLowerCase();

}


/* =========================================================
   NORMALIZE SEMESTER
   ========================================================= */

function normalizeSemester(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    const semester =
        String(value)
            .trim()
            .toLowerCase();


    /* FIRST SEMESTER */

    if (
        semester === "1st semester" ||
        semester === "first semester" ||
        semester === "1st sem" ||
        semester === "first sem" ||
        semester === "semester 1" ||
        semester === "sem 1" ||
        semester === "1"
    ) {

        return "first semester";

    }


    /* SECOND SEMESTER */

    if (
        semester === "2nd semester" ||
        semester === "second semester" ||
        semester === "2nd sem" ||
        semester === "second sem" ||
        semester === "semester 2" ||
        semester === "sem 2" ||
        semester === "2"
    ) {

        return "second semester";

    }


    return semester;

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

window.addEventListener("focus", renderScorecardButtons);
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) renderScorecardButtons();
});


/* =========================================================
   REFRESH WHEN STORAGE CHANGES
   ========================================================= */

window.addEventListener(
    "storage",
    function (event) {

        const refreshKeys = [

            "basisRepresentativeProfile",
            "representativeProfile",
            "basisRepresentative",
            "basisRepresentativeCOR",
            "basisActivities",
            "activities",
            "activityRecords",
            "basisActivityRecords",
            "adminActivities"

        ];


        if (
            refreshKeys.includes(event.key)
        ) {

            renderScorecardButtons();

        }


        const currentId =
            sessionStorage.getItem(
                "basisCurrentUserId"
            );


        if (
            currentId &&
            event.key === `basisProfile_${currentId}`
        ) {

            renderScorecardButtons();

        }

    }
);


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(value) {

    return escapeHtml(value);

}


/* =========================================================
   DEBUG
   ========================================================= */

function debugScorecard() {

    const currentUserId =
        sessionStorage.getItem(
            "basisCurrentUserId"
        );


    const currentRepresentative =
        getRegisteredRepresentative();


    console.log(
        "======================================"
    );

    console.log(
        "BASIS REPRESENTATIVE SCORECARD DEBUG"
    );

    console.log(
        "======================================"
    );


    console.log(
        "Current User ID:",
        currentUserId
    );


    console.log(
        "Registered Representative:",
        currentAdmin
    );


    console.log(
        "Stored Activities:",
        getStoredActivities()
    );


    console.log(
        "COR History:",
        getAdminCorHistory()
    );


    console.log(
        "======================================"
    );

}


/* =========================================================
   END
   ========================================================= */
