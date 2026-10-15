let currentScorecardData = null;
let allScorecardActivities = [];
let selectedScorecardPeriod = null;

document.addEventListener("DOMContentLoaded", renderScorecardButtons);
window.addEventListener("pageshow", renderScorecardButtons);
window.addEventListener("focus", renderScorecardButtons);
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) renderScorecardButtons();
});

async function renderScorecardButtons() {
    const listContainer = document.getElementById("scorecardYears");
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="no-scorecard-message"><h3>Loading scorecards…</h3><p>Please wait while your records are loaded.</p></div>';

    try {
        const response = await fetch("../admin/api/account_api.php?action=scorecard", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load your scorecard.");
        }

        currentScorecardData = data;
        const profile = data.profile || {};
        loadProfileInfo(profile);

        const ownActivities = Array.isArray(data.activities) ? data.activities : [];
        const activityResponse = await fetch("../admin/api/account_api.php?action=activities", {
            credentials: "same-origin",
            cache: "no-store"
        });
        const activityData = await activityResponse.json();
        if (!activityResponse.ok || !activityData.success) {
            throw new Error(activityData.message || "Could not load academic periods.");
        }

        allScorecardActivities = Array.isArray(activityData.activities) ? activityData.activities : [];
        currentScorecardData.activities = ownActivities.filter(isAttendedRecord);

        const periods = new Map();
        allScorecardActivities.forEach(activity => {
            const academicYear = getActivityAcademicYear(activity);
            const semester = getActivitySemester(activity);
            if (!academicYear || !isRecognizedSemester(semester)) return;

            const key = `${normalizeAcademicYear(academicYear)}|${normalizeSemester(semester)}`;
            if (!periods.has(key)) {
                periods.set(key, { academicYear, semester });
            }
        });

        listContainer.replaceChildren();
        const sortedPeriods = [...periods.values()].sort((a, b) => {
            const yearCompare = normalizeAcademicYear(b.academicYear).localeCompare(normalizeAcademicYear(a.academicYear));
            if (yearCompare !== 0) return yearCompare;
            return normalizeSemester(a.semester) === normalizeSemester(b.semester)
                ? 0
                : normalizeSemester(a.semester) === "first semester" ? -1 : 1;
        });

        if (!sortedPeriods.length) {
            showNoScorecardMessage("No academic-year and semester scorecards are available yet.");
            return;
        }

        const yearGroups = new Map();
        sortedPeriods.forEach(period => {
            const year = String(period.academicYear).replace(/-/g, "–");
            if (!yearGroups.has(year)) yearGroups.set(year, []);
            yearGroups.get(year).push(period);
        });

        yearGroups.forEach((yearPeriods, academicYear) => {
            const yearContainer = document.createElement("div");
            yearContainer.className = "scorecard-year-container";
            yearContainer.innerHTML = `
                <div class="scorecard-year-header">
                    <div>
                        <span class="scorecard-year-label">Academic Year</span>
                        <div class="scorecard-year-value">${scorecardEscape(academicYear)}</div>
                    </div>
                    <span class="scorecard-year-count">${yearPeriods.length} Semester${yearPeriods.length === 1 ? "" : "s"}</span>
                </div>
                <div class="scorecard-semester-list"></div>`;

            const semesterList = yearContainer.querySelector(".scorecard-semester-list");
            yearPeriods.forEach(period => {
                const periodYear = String(period.academicYear).replace(/-/g, "–");
                const periodSemester = normalizeSemester(period.semester);
                const attendanceCount = currentScorecardData.activities.filter(activity =>
                    normalizeAcademicYear(getActivityAcademicYear(activity) || periodYear) === normalizeAcademicYear(period.academicYear) &&
                    normalizeSemester(getActivitySemester(activity) || period.semester) === periodSemester
                ).length;

                const button = document.createElement("button");
                button.type = "button";
                button.className = "scorecard-semester-item";
                button.innerHTML = `
                    <span class="scorecard-semester-name">${scorecardEscape(periodSemester.toUpperCase())} SCORECARD</span>
                    <span class="scorecard-semester-meta">${scorecardEscape(periodYear)} • ${attendanceCount} attended activit${attendanceCount === 1 ? "y" : "ies"}</span>`;
                button.addEventListener("click", () => openScorecardDetail(period.academicYear, period.semester));
                semesterList.appendChild(button);
            });
            listContainer.appendChild(yearContainer);
        });

        updateScorecardScroll();

    } catch (error) {
        console.error("Unable to load scholar scorecards:", error);
        listContainer.innerHTML = `<div class="no-scorecard-message"><i class="fa-solid fa-circle-exclamation"></i><h3>Scorecard could not be loaded.</h3><p>${scorecardEscape(error.message)}</p></div>`;
    }
}

function showNoScorecardMessage(message) {
    const listContainer = document.getElementById("scorecardYears");
    if (!listContainer) return;
    listContainer.innerHTML = `
        <div class="no-scorecard-message">
            <i class="fa-solid fa-file-circle-xmark"></i>
            <h3>No available scorecards yet.</h3>
            <p>${scorecardEscape(message || "Your scorecards will appear when academic periods are available.")}</p>
        </div>`;
    listContainer.classList.remove("has-scroll");
}

function getActivityAcademicYear(activity) {
    return String(activity?.academicYear || activity?.academic_year || activity?.schoolYear || activity?.school_year || "").trim();
}

function getActivitySemester(activity) {
    return String(activity?.semester || activity?.sem || activity?.term || "").trim();
}

function normalizeAcademicYear(value) {
    return String(value || "").trim().replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "").toLowerCase();
}

function normalizeSemester(value) {
    const semester = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (["1st semester", "first semester", "1st sem", "first sem", "semester 1", "sem 1", "1"].includes(semester)) return "first semester";
    if (["2nd semester", "second semester", "2nd sem", "second sem", "semester 2", "sem 2", "2"].includes(semester)) return "second semester";
    return semester;
}

function isRecognizedSemester(value) {
    return ["first semester", "second semester"].includes(normalizeSemester(value));
}

function semesterLabel(value) {
    const normalized = normalizeSemester(value);
    if (normalized === "first semester") return "FIRST SEMESTER";
    if (normalized === "second semester") return "SECOND SEMESTER";
    return String(value || "").toUpperCase();
}

function getCurrentAcademicYear() {
    const year = new Date().getFullYear();
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
    const resolvedSemester = isRecognizedSemester(semesterValue)
        ? semesterValue
        : isRecognizedSemester(yearValue)
            ? yearValue
            : "";

    return { academicYear: resolvedYear, semester: resolvedSemester };
}

function isAttendedRecord(activity) {
    if (!activity || typeof activity !== "object") return false;
    const statusValue = activity.attendanceStatus ?? activity.attendance_status ?? activity.attendance_status_name ??
        activity.attendanceStatusName ?? activity.status ?? activity.attendance;
    // The scorecard API is scoped to this scholar's attended activities. If it includes
    // a status field, enforce PRESENT/ATTENDED; if it omits one, trust that API scope.
    if (statusValue === undefined || statusValue === null || String(statusValue).trim() === "") return true;
    const status = String(statusValue).trim().toLowerCase();
    return ["present", "attended"].includes(status);
}

function openScorecardDetail(academicYear, semester) {
    if (!currentScorecardData) return;
    selectedScorecardPeriod = { academicYear, semester };
    loadProfileInfo(currentScorecardData.profile || {});

    const headerPeriod = getScorecardHeaderPeriod(academicYear, semester);
    const ayTitle = document.getElementById("scorecardAYTitle");
    const semTitle = document.getElementById("scorecardSemTitle");
    if (ayTitle) ayTitle.textContent = `AY: ${String(headerPeriod.academicYear).replace(/-/g, "–")}`;
    if (semTitle) semTitle.textContent = semesterLabel(headerPeriod.semester);

    const rows = (currentScorecardData.activities || []).filter(activity =>
        normalizeAcademicYear(getActivityAcademicYear(activity) || academicYear) === normalizeAcademicYear(academicYear) &&
        normalizeSemester(getActivitySemester(activity) || semester) === normalizeSemester(semester) &&
        isAttendedRecord(activity)
    );
    populateActivityRows(rows);
    showSubView("view-scorecard-detail");
}

function loadProfileInfo(user) {
    user = user || {};
    const father = user.father && typeof user.father === "object" ? user.father : {};
    const mother = user.mother && typeof user.mother === "object" ? user.mother : {};
    const family = user.familyInformation || user.family_information || user.family || {};
    const familyFather = family.father && typeof family.father === "object" ? family.father : father;
    const familyMother = family.mother && typeof family.mother === "object" ? family.mother : mother;
    const fullName = member => {
        if (!member || typeof member !== "object") return "";
        return [member.given, member.givenName, member.firstName, member.first_name, member.middle, member.middleName,
            member.middle_name, member.surname, member.lastName, member.last_name, member.suffix]
            .filter(Boolean).join(" ");
    };
    const first = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== "") ?? "—";
    const siblings = user.siblings ?? family.siblings ?? family.siblingsList ?? family.siblingList ?? "";
    const siblingName = item => {
        if (typeof item === "string" || typeof item === "number") return String(item).trim();
        if (!item || typeof item !== "object") return "";
        return String(item.name || item.fullName || item.full_name || fullName(item) || "").trim();
    };
    const siblingText = Array.isArray(siblings)
        ? siblings.map(siblingName).filter(Boolean).join(", ")
        : siblingName(siblings);

    const fields = {
        "info-name": first(user.name, user.fullName, user.full_name, [user.givenName || user.given, user.middleName || user.middle, user.surname || user.lastName, user.suffix].filter(Boolean).join(" ")),
        "info-sex": first(user.sex, user.gender),
        "info-birthday": first(user.birthday, user.birthdate, user.dateOfBirth, user.date_of_birth),
        "info-religion": first(user.religion),
        "info-email": first(user.email, user.emailAddress, user.email_address),
        "info-contact": first(user.contact, user.contactNo, user.contactNumber, user.phone, user.phoneNumber),
        "info-municipality": first(user.municipality),
        "info-barangay": first(user.barangay, user.assignedBarangay, user.assigned_barangay),
        "info-father": first(user.fatherName, user.father_name, fullName(familyFather), familyFather.name, familyFather.fullName),
        "info-father-contact": first(user.fatherContact, user.father_contact, user.fatherContactNo, familyFather.contact, familyFather.contactNo, familyFather.phone),
        "info-mother": first(user.motherName, user.mother_name, fullName(familyMother), familyMother.name, familyMother.fullName),
        "info-mother-contact": first(user.motherContact, user.mother_contact, user.motherContactNo, familyMother.contact, familyMother.contactNo, familyMother.phone),
        "info-siblings": siblingText || "No sibling information",
        "info-school": first(user.school, user.schoolName, user.school_name),
        "info-program": first(user.program, user.course, user.courseName, user.course_name),
        "info-year-level": first(user.yearLevel, user.year_level, user.year),
        "info-control-number": first(user.control_number, user.controlNumber, user.controlNo)
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value === "" ? "—" : String(value);
    });
}

function populateActivityRows(activities) {
    const container = document.getElementById("activityRows");
    if (!container) return;
    const rowTemplate = document.getElementById("activityRowTemplate")?.content?.firstElementChild;
    if (!rowTemplate) {
        console.error("Activity row template #activityRowTemplate was not found.");
        return;
    }
    container.replaceChildren();

    if (!Array.isArray(activities) || activities.length === 0) {
        const empty = document.createElement("div");
        empty.className = "representative-empty-activity";
        empty.textContent = "No attendance records for this academic period yet.";
        container.appendChild(empty);
        return;
    }

    activities.forEach(activity => {
        const row = rowTemplate.cloneNode(true);

        const title = activity.title || activity.name || activity.activityName || activity.activity_name || "Untitled Activity";
        const category = String(activity.category || activity.type || activity.activityCategory || activity.activity_category || "General").replace(/\s+Activity$/i, "");
        const date = activity.date || activity.attendanceDate || activity.attendance_date || activity.activityDate || activity.activity_date || "—";

        row.querySelector(".title-field input").value = String(title);
        row.querySelector(".category-field input").value = String(category);
        row.querySelector(".date-field input").value = String(date);
        container.appendChild(row);
    });
}

function updateScorecardScroll() {
    const list = document.getElementById("scorecardYears");
    if (!list) return;
    const count = list.querySelectorAll(".scorecard-semester-item").length;
    list.classList.toggle("has-scroll", count > 4);
}

function showSubView(viewId) {
    document.querySelectorAll(".page-view").forEach(view => view.classList.remove("active"));
    const target = document.getElementById(viewId);
    if (!target) return;
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function scorecardEscape(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
