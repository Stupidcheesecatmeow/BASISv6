/* =========================================================

   BASIS - ADMIN MORE MODULE

   ADMIN FEATURES:

   - FAQ

   - TERMS

   - REPORT GENERATOR

   - FEEDBACK / CONCERN INBOX

========================================================= */

 

document.addEventListener("DOMContentLoaded", function () {

 

    /* =====================================================

       ELEMENTS

    ====================================================== */

 

    const moreMenuView =

        document.getElementById("moreMenuView");

 

    const moreViews =

        document.querySelectorAll(".more-detail-view");

 

    const menuButtons =

        document.querySelectorAll("[data-open-view]");

 

    const closeButtons =

        document.querySelectorAll("[data-close-view]");

 

    const reportResults =

        document.getElementById("reportResults");

 

    const reportCount =

        document.getElementById("reportResultCount");

 

    const feedbackInboxList =

        document.getElementById("feedbackInboxList");

 

    const feedbackInboxSearch =

        document.getElementById("feedbackInboxSearch");

 

    const feedbackInboxFilter =

        document.getElementById("feedbackInboxFilter");

 

 

    /* =====================================================

       SHOW VIEW

    ====================================================== */

 

    function showView(viewId) {

 

        if (moreMenuView) {

            moreMenuView.style.display = "none";

        }

 

        moreViews.forEach(function (view) {

            view.style.display = "none";

        });

 

        const target =

            document.getElementById(viewId);

 

        if (!target) {

            return;

        }

 

        target.style.display = "block";

 

        if (viewId === "reportView") {

            loadReportFilters();

            renderReportEmpty();

        }

 

        if (viewId === "feedbackInboxView") {

            renderFeedbackInbox();

        }

 

    }

 

 

    /* =====================================================

       SHOW MORE MENU

    ====================================================== */

 

    function showMoreMenu() {

 

        if (moreMenuView) {

            moreMenuView.style.display = "block";

        }

 

        moreViews.forEach(function (view) {

            view.style.display = "none";

        });

 

    }

 

 

    /* =====================================================

       MENU BUTTONS

    ====================================================== */

 

    menuButtons.forEach(function (button) {

 

        button.addEventListener("click", function () {

 

            const viewId =

                button.getAttribute("data-open-view");

 

            showView(viewId);

 

        });

 

    });

 

 

    /* =====================================================

       CLOSE BUTTONS

    ====================================================== */

 

    closeButtons.forEach(function (button) {

 

        button.addEventListener("click", function () {

 

            showMoreMenu();

 

        });

 

    });

 

 

    /* =====================================================

       SAFE JSON

    ====================================================== */

 

    function readJSON(key, fallback) {

 

        try {

 

            const value =

                localStorage.getItem(key);

 

            if (!value) {

                return fallback;

            }

 

            const parsed =

                JSON.parse(value);

 

            return parsed;

 

        } catch (error) {

 

            console.error(

                "Unable to read localStorage:",

                key,

                error

            );

 

            return fallback;

        }

 

    }

 

 

    function asArray(value) {

 

        if (Array.isArray(value)) {

            return value;

        }

 

        if (

            value &&

            typeof value === "object"

        ) {

 

            if (Array.isArray(value.records)) {

                return value.records;

            }

 

            if (Array.isArray(value.data)) {

                return value.data;

            }

 

            if (Array.isArray(value.items)) {

                return value.items;

            }

 

        }

 

        return [];

 

    }

 

 

    function normalize(value) {

 

        return String(

            value ?? ""

        )

        .trim()

        .toLowerCase();

 

    }

 

 

    function escapeHTML(value) {

 

        return String(

            value ?? ""

        )

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

 

    }

 

 

    /* =====================================================

       ACTIVITY DATA

    ====================================================== */

 

    function getActivities() {

 

        const raw =

            readJSON("activities", []);

 

        return asArray(raw);

 

    }

 

 

    function getActivityId(activity, index) {

 

        return (

            activity.id ??

            activity.activityId ??

            activity.activity_id ??

            `ACT-${index + 1}`

        );

 

    }

 

 

    function getActivityTitle(activity) {

 

        return (

            activity.title ||

            activity.activityTitle ||

            activity.name ||

            "ACTIVITY"

        );

 

    }

 

 

    function getActivitySemester(activity) {

 

        return (

            activity.semester ||

            activity.sem ||

            activity.term ||

            "FIRST SEMESTER"

        );

 

    }

 

 

    function getActivityAcademicYear(activity) {

 

        return (

            activity.academicYear ||

            activity.academic_year ||

            activity.ay ||

            activity.schoolYear ||

            activity.school_year ||

            "2026–2027"

        );

 

    }

 

 

    function getActivityDate(activity) {

 

        return (

            activity.date ||

            activity.activityDate ||

            activity.startDate ||

            ""

        );

 

    }

 

 

    /* =====================================================

       ATTENDANCE / PARTICIPATION DATA

    ====================================================== */

 

    function getGlobalParticipationRecords() {

 

        const keys = [

 

            "attendanceRecords",

            "attendance",

            "activityAttendance",

            "activityParticipants",

            "participants",

            "verifiedAttendance",

            "verifiedActivities",

            "submissionRecords"

 

        ];

 

        const records = [];

 

        keys.forEach(function (key) {

 

            const raw =

                readJSON(key, []);

 

            asArray(raw).forEach(function (record) {

 

                if (

                    record &&

                    typeof record === "object"

                ) {

 

                    records.push({

                        ...record,

                        __sourceKey: key

                    });

 

                }

 

            });

 

        });

 

        return records;

 

    }

 

 

    function getNestedParticipationRecords(activity) {

 

        const keys = [

 

            "participants",

            "attendance",

            "attendanceRecords",

            "records",

            "attendees",

            "participantRecords"

 

        ];

 

        const records = [];

 

        keys.forEach(function (key) {

 

            if (

                Array.isArray(

                    activity[key]

                )

            ) {

 

                activity[key].forEach(

                    function (record) {

 

                        if (

                            record &&

                            typeof record === "object"

                        ) {

 

                            records.push({

                                ...record,

                                __nestedActivity: activity

                            });

 

                        }

 

                    }

                );

 

            }

 

        });

 

        return records;

 

    }

 

 

    function getRecordActivityId(record) {

 

        return (

            record.activityId ??

            record.activity_id ??

            record.activityID ??

            record.activity?.id ??

            record.activity?.activityId ??

            ""

        );

 

    }

 

 

    function getRecordActivityTitle(record) {

 

        return (

            record.activityTitle ||

            record.activityName ||

            record.activity_name ||

            record.activity?.title ||

            record.activity?.name ||

            record.title ||

            record.name ||

            ""

        );

 

    }

 

 

    function recordBelongsToActivity(

        record,

        activity

    ) {

 

        const recordId =

            normalize(

                getRecordActivityId(record)

            );

 

        const activityId =

            normalize(

                getActivityId(activity, 0)

            );

 

        if (

            recordId &&

            activityId &&

            recordId === activityId

        ) {

 

            return true;

 

        }

 

        const recordTitle =

            normalize(

                getRecordActivityTitle(record)

            );

 

        const activityTitle =

            normalize(

                getActivityTitle(activity)

            );

 

        if (

            recordTitle &&

            activityTitle &&

            recordTitle === activityTitle

        ) {

 

            return true;

 

        }

 

        if (

            record.__nestedActivity === activity

        ) {

 

            return true;

 

        }

 

        return false;

 

    }

 

 

    function buildReportRecords() {

 

        const activities =

            getActivities();

 

        const globalRecords =

            getGlobalParticipationRecords();

 

        const result = [];

 

        activities.forEach(function (

            activity,

            activityIndex

        ) {

 

            const nested =

                getNestedParticipationRecords(

                    activity

                );

 

            const matchedGlobal =

                globalRecords.filter(

                    function (record) {

 

                        return recordBelongsToActivity(

                            record,

                            activity

                        );

 

                    }

                );

 

            const participants = [

                ...nested,

                ...matchedGlobal

            ];

 

            /*

                Remove exact duplicates when the same

                record exists both inside an activity

                and in a global attendance collection.

            */

            const unique = [];

            const seen = new Set();

 

            participants.forEach(

                function (record, index) {

 

                    const signature =

                        JSON.stringify({

 

                            id:

                                record.id ??

                                record.attendanceId ??

                                record.controlNumber ??

                                "",

 

                            name:

                                record.fullname ??

                                record.fullName ??

                                record.name ??

                                record.participantName ??

                                "",

 

                            activity:

                                getRecordActivityTitle(

                                    record

                                ),

 

                            date:

                                record.date ??

                                record.attendanceDate ??

                                ""

 

                        });

 

                    if (!seen.has(signature)) {

 

                        seen.add(signature);

 

                        unique.push({

                            ...record,

                            __activity:

                                activity,

                            __activityIndex:

                                activityIndex,

                            __participantIndex:

                                index

                        });

 

                    }

 

                }

            );

 

            /*

                If an activity itself represents one

                participant record, allow it to appear.

            */

            if (

                unique.length === 0 &&

                (

                    activity.fullname ||

                    activity.fullName ||

                    activity.participantName ||

                    activity.participant

                )

            ) {

 

                unique.push({

                    ...activity,

                    __activity: activity,

                    __activityIndex: activityIndex,

                    __participantIndex: 0

                });

 

            }

 

            unique.forEach(function (

                record,

                participantIndex

            ) {

 

                result.push(

                    normalizeReportRecord(

                        record,

                        activity,

                        activityIndex,

                        participantIndex

                    )

                );

 

            });

 

        });

 

        return result;

 

    }

 

 

    /* =====================================================

       NORMALIZE REPORT RECORD

    ====================================================== */

 

    function normalizeReportRecord(

        record,

        activity,

        activityIndex,

        participantIndex

    ) {

 

        const participantName =

            record.fullname ||

            record.fullName ||

            record.name ||

            record.participantName ||

            record.participant ||

            record.scholarName ||

            "UNKNOWN PARTICIPANT";

 

        const barangay =

            record.barangay ||

            record.barangayName ||

            record.brgy ||

            activity.barangay ||

            "—";

 

        const cluster =

            record.cluster ||

            record.clusterName ||

            activity.cluster ||

            "—";

 

        const activityTitle =

            getActivityTitle(activity);

 

        const existingControl =

            record.controlNumber ||

            record.control_number ||

            record.controlNo ||

            record.control_no ||

            record.referenceNumber ||

            record.referenceNo;

 

        const activityKey =

            getActivityId(

                activity,

                activityIndex

            );

 

        const controlNumber =

            existingControl ||

            generateControlNumber(

                activity,

                activityKey,

                participantName,

                participantIndex

            );

 

        return {

 

            controlNumber:

                controlNumber,

 

            name:

                participantName,

 

            barangay:

                barangay,

 

            cluster:

                cluster,

 

            activity:

                activityTitle,

 

            activityId:

                activityKey,

 

            semester:

                getActivitySemester(activity),

 

            academicYear:

                getActivityAcademicYear(activity),

 

            date:

                getActivityDate(activity)

 

        };

 

    }

 

 

    /* =====================================================

       GENERATED CONTROL NUMBER

    ====================================================== */

 

    function generateControlNumber(

        activity,

        activityKey,

        participantName,

        participantIndex

    ) {

 

        const date =

            getActivityDate(activity);

 

        let year =

            String(

                getActivityAcademicYear(activity)

            )

            .replace(/\D/g, "")

            .slice(0, 4);

 

        if (!year) {

            year = "2026";

        }

 

        const activityPart =

            String(activityKey)

                .replace(/[^a-zA-Z0-9]/g, "")

                .slice(-6)

                .toUpperCase();

 

        const sequence =

            String(

                participantIndex + 1

            ).padStart(4, "0");

 

        const namePart =

            normalize(participantName)

                .replace(/[^a-z0-9]/g, "")

                .slice(0, 3)

                .toUpperCase();

 

        return (

            `BASIS-${year}-` +

            `${activityPart || "ACT"}-` +

            `${namePart || "USR"}-` +

            sequence

        );

 

    }

 

 

    /* =====================================================

       REPORT FILTERS

    ====================================================== */

 

    function loadReportFilters() {

 

        const activities =

            getActivities();

 

        const activityList =

            document.getElementById(

                "activityCheckboxList"

            );

 

        const academicList =

            document.getElementById(

                "academicYearCheckboxList"

            );

 

        if (!activityList || !academicList) {

            return;

        }

 

        activityList.innerHTML = "";

 

        if (activities.length === 0) {

 

            activityList.innerHTML = `

                <div class="checkbox-empty">

                    No activities available.

                </div>

            `;

 

        } else {

 

            activities.forEach(

                function (

                    activity,

                    index

                ) {

 

                    const id =

                        `activityCheck-${index}`;

 

                    const label =

                        document.createElement(

                            "label"

                        );

 

                    label.className =

                        "report-checkbox";

 

                    label.innerHTML = `

 

                        <input

                            type="checkbox"

                            class="activity-check"

                            id="${escapeHTML(id)}"

                            value="${escapeHTML(

                                String(

                                    getActivityId(

                                        activity,

                                        index

                                    )

                                )

                            )}"

                        >

 

                        <span>

                            ${escapeHTML(

                                getActivityTitle(

                                    activity

                                )

                            )}

                        </span>

 

                    `;

 

                    activityList.appendChild(

                        label

                    );

 

                }

            );

 

        }

 

 

        /*

            Academic years are generated from

            the available activity data.

        */

        const years = [];

 

        activities.forEach(

            function (activity) {

 

                const year =

                    getActivityAcademicYear(

                        activity

                    );

 

                if (

                    year &&

                    !years.includes(

                        String(year)

                    )

                ) {

 

                    years.push(

                        String(year)

                    );

 

                }

 

            }

        );

 

        years.sort();

 

        academicList.innerHTML = "";

 

        if (years.length === 0) {

 

            academicList.innerHTML = `

                <div class="checkbox-empty">

                    No academic years available.

                </div>

            `;

 

        } else {

 

            years.forEach(

                function (year) {

 

                    const label =

                        document.createElement(

                            "label"

                        );

 

                    label.className =

                        "report-checkbox";

 

                    label.innerHTML = `

 

                        <input

                            type="checkbox"

                            class="academic-year-check"

                            value="${escapeHTML(year)}"

                        >

 

                        <span>

                            ${escapeHTML(year)}

                        </span>

 

                    `;

 

                    academicList.appendChild(

                        label

                    );

 

                }

            );

 

        }

 

        bindReportCheckboxes();

 

    }

 

 

    function bindReportCheckboxes() {

 

        const selectAllActivities =

            document.getElementById(

                "selectAllActivities"

            );

 

        const selectAllSemesters =

            document.getElementById(

                "selectAllSemesters"

            );

 

        const selectAllAcademicYears =

            document.getElementById(

                "selectAllAcademicYears"

            );

 

 

        setupSelectAll(

            selectAllActivities,

            ".activity-check"

        );

 

        setupSelectAll(

            selectAllSemesters,

            ".semester-check"

        );

 

        setupSelectAll(

            selectAllAcademicYears,

            ".academic-year-check"

        );

 

    }

 

 

    function setupSelectAll(

        selectAll,

        selector

    ) {

 

        if (!selectAll) {

            return;

        }

 

        /*

            Clone to prevent duplicate listeners

            when report filters are refreshed.

        */

        const fresh =

            selectAll.cloneNode(true);

 

        selectAll.parentNode.replaceChild(

            fresh,

            selectAll

        );

 

        fresh.addEventListener(

            "change",

            function () {

 

                document

                    .querySelectorAll(selector)

                    .forEach(

                        function (checkbox) {

 

                            checkbox.checked =

                                fresh.checked;

 

                        }

                    );

 

            }

        );

 

    }

 

 

    /* =====================================================

       GET SELECTED FILTERS

    ====================================================== */

 

    function getSelectedFilters() {

 

        return {

 

            activityIds:

                Array.from(

                    document.querySelectorAll(

                        ".activity-check:checked"

                    )

                )

                .map(

                    checkbox =>

                        checkbox.value

                ),

 

            semesters:

                Array.from(

                    document.querySelectorAll(

                        ".semester-check:checked"

                    )

                )

                .map(

                    checkbox =>

                        checkbox.value

                ),

 

            academicYears:

                Array.from(

                    document.querySelectorAll(

                        ".academic-year-check:checked"

                    )

                )

                .map(

                    checkbox =>

                        checkbox.value

                )

 

        };

 

    }

 

 

    /* =====================================================

       FILTER REPORT

    ====================================================== */

 

    function getFilteredReportRecords() {

 

        const records =

            buildReportRecords();

 

        const filters =

            getSelectedFilters();

 

        return records.filter(

            function (record) {

 

                const activityMatches =

                    filters.activityIds.length === 0 ||

                    filters.activityIds.includes(

                        String(record.activityId)

                    );

 

                const semesterMatches =

                    filters.semesters.length === 0 ||

                    filters.semesters.some(

                        function (semester) {

 

                            return normalize(

                                record.semester

                            ) === normalize(

                                semester

                            );

 

                        }

                    );

 

                const academicMatches =

                    filters.academicYears.length === 0 ||

                    filters.academicYears.includes(

                        String(record.academicYear)

                    );

 

                return (

                    activityMatches &&

                    semesterMatches &&

                    academicMatches

                );

 

            }

        );

 

    }

 

 

    /* =====================================================

       GENERATE REPORT

    ====================================================== */

 

    function generateReport() {

 

        const records =

            getFilteredReportRecords();

 

        renderReportRecords(

            records

        );

 

    }

 

 

    function renderReportEmpty() {

 

        if (!reportResults) {

            return;

        }

 

        reportResults.innerHTML = `

 

            <div class="report-empty-state">

 

                <i class="fa-solid fa-file-circle-check"></i>

 

                <h3>No report generated yet.</h3>

 

                <p>

                    Select your filters and click GENERATE.

                </p>

 

            </div>

 

        `;

 

        if (reportCount) {

            reportCount.textContent =

                "0 records";

        }

 

    }

 

 

    /* =====================================================

       RENDER REPORT GROUPED BY ACTIVITY

    ====================================================== */

 

    function renderReportRecords(

        records

    ) {

 

        if (!reportResults) {

            return;

        }

 

        if (!records.length) {

 

            reportResults.innerHTML = `

 

                <div class="report-empty-state">

 

                    <i class="fa-solid fa-folder-open"></i>

 

                    <h3>No matching records found.</h3>

 

                    <p>

                        Try another activity, semester,

                        or academic year selection.

                    </p>

 

                </div>

 

            `;

 

            if (reportCount) {

                reportCount.textContent =

                    "0 records";

            }

 

            return;

 

        }

 

 

        const groups = new Map();

 

        records.forEach(

            function (record) {

 

                const key =

                    record.activityId ||

                    record.activity;

 

                if (!groups.has(key)) {

                    groups.set(

                        key,

                        []

                    );

                }

 

                groups.get(key).push(

                    record

                );

 

            }

        );

 

 

        let html = "";

 

        groups.forEach(

            function (

                groupRecords,

                groupKey

            ) {

 

                const first =

                    groupRecords[0];

 

                html += `

 

                    <section

                        class="report-group"

                        data-activity="${escapeHTML(

                            String(groupKey)

                        )}"

                    >

 

                        <div class="report-group-title">

 

                            <h4>

                                ${escapeHTML(

                                    first.activity

                                )}

                            </h4>

 

                            <span>

                                ${groupRecords.length}

                                PARTICIPANT${

                                    groupRecords.length === 1

                                        ? ""

                                        : "S"

                                }

                            </span>

 

                        </div>

 

 

                        <div class="report-table-wrap">

 

                            <table class="report-table">

 

                                <thead>

 

                                    <tr>

                                        <th>CONTROL NUMBER</th>

                                        <th>NAME</th>

                                        <th>BARANGAY</th>

                                        <th>CLUSTER</th>

                                        <th>ACTIVITY</th>

                                    </tr>

 

                                </thead>

 

                                <tbody>

 

                `;

 

 

                groupRecords.forEach(

                    function (record) {

 

                        html += `

 

                            <tr>

 

                                <td class="control-cell">

                                    ${escapeHTML(

                                        record.controlNumber

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.name

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.barangay

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.cluster

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.activity

                                    )}

                                </td>

 

                            </tr>

 

                        `;

 

                    }

                );

 

 

                html += `

 

                                </tbody>

 

                            </table>

 

                        </div>

 

                    </section>

 

                `;

 

            }

        );

 

 

        reportResults.innerHTML =

            html;

 

        if (reportCount) {

 

            reportCount.textContent =

                `${records.length} record${

                    records.length === 1

                        ? ""

                        : "s"

                }`;

 

        }

 

    }

 

 

    /* =====================================================

       CLEAR REPORT

    ====================================================== */

 

    function clearReport() {

 

        document

            .querySelectorAll(

                ".activity-check, " +

                ".semester-check, " +

                ".academic-year-check"

            )

            .forEach(

                function (checkbox) {

 

                    checkbox.checked = false;

 

                }

            );

 

        [

            "selectAllActivities",

            "selectAllSemesters",

            "selectAllAcademicYears"

        ]

        .forEach(

            function (id) {

 

                const checkbox =

                    document.getElementById(id);

 

                if (checkbox) {

                    checkbox.checked = false;

                }

 

            }

        );

 

        renderReportEmpty();

 

    }

 

 

    /* =====================================================

       EXPORT EXCEL

       Uses a browser-generated .xls file, so no external

       library is required.

    ====================================================== */

 

    function exportExcel() {

 

        const records =

            getFilteredReportRecords();

 

        if (!records.length) {

 

            alert(

                "Please generate a report with at least one record first."

            );

 

            return;

 

        }

 

        const groups = new Map();

 

        records.forEach(

            function (record) {

 

                const key =

                    record.activityId ||

                    record.activity;

 

                if (!groups.has(key)) {

                    groups.set(

                        key,

                        []

                    );

                }

 

                groups.get(key).push(

                    record

                );

 

            }

        );

 

 

        let tableHTML = `

 

            <table border="1">

 

                <tr>

                    <th>CONTROL NUMBER</th>

                    <th>NAME</th>

                    <th>BARANGAY</th>

                    <th>CLUSTER</th>

                    <th>ACTIVITY</th>

                </tr>

 

        `;

 

 

        groups.forEach(

            function (groupRecords) {

 

                const activityName =

                    groupRecords[0].activity;

 

                tableHTML += `

 

                    <tr>

                        <th colspan="5">

                            ${escapeHTML(

                                activityName

                            )}

                        </th>

                    </tr>

 

                `;

 

 

                groupRecords.forEach(

                    function (record) {

 

                        tableHTML += `

 

                            <tr>

 

                                <td>

                                    ${escapeHTML(

                                        record.controlNumber

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.name

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.barangay

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.cluster

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.activity

                                    )}

                                </td>

 

                            </tr>

 

                        `;

 

                    }

                );

 

            }

        );

 

 

        tableHTML += "</table>";

 

 

        const html =

            `<!DOCTYPE html>

             <html>

             <head>

                 <meta charset="UTF-8">

                 <title>BASIS Activity Report</title>

             </head>

             <body>

                 ${tableHTML}

             </body>

             </html>`;

 

 

        const blob =

            new Blob(

                [html],

                {

                    type:

                        "application/vnd.ms-excel"

                }

            );

 

 

        const url =

            URL.createObjectURL(blob);

 

        const link =

            document.createElement("a");

 

        link.href = url;

 

        link.download =

            `BASIS-Activity-Report-${getFileDate()}.xls`;

 

        document.body.appendChild(link);

 

        link.click();

 

        link.remove();

 

        URL.revokeObjectURL(url);

 

    }

 

 

    /* =====================================================

       EXPORT PDF

       Opens a clean print page and lets the browser save

       the generated report as PDF.

    ====================================================== */

 

    function exportPDF() {

 

        const records =

            getFilteredReportRecords();

 

        if (!records.length) {

 

            alert(

                "Please generate a report with at least one record first."

            );

 

            return;

 

        }

 

 

        const reportHTML =

            buildPrintableReport(

                records

            );

 

 

        const printWindow =

            window.open(

                "",

                "_blank",

                "width=1100,height=800"

            );

 

 

        if (!printWindow) {

 

            alert(

                "Please allow pop-ups for BASIS to export the PDF."

            );

 

            return;

 

        }

 

 

        printWindow.document.open();

 

        printWindow.document.write(

            reportHTML

        );

 

        printWindow.document.close();

 

        printWindow.focus();

 

        setTimeout(

            function () {

 

                printWindow.print();

 

            },

            350

        );

 

    }

 

 

    function buildPrintableReport(

        records

    ) {

 

        const groups = new Map();

 

        records.forEach(

            function (record) {

 

                const key =

                    record.activityId ||

                    record.activity;

 

                if (!groups.has(key)) {

                    groups.set(

                        key,

                        []

                    );

                }

 

                groups.get(key).push(

                    record

                );

 

            }

        );

 

 

        let groupsHTML = "";

 

        groups.forEach(

            function (groupRecords) {

 

                groupsHTML += `

 

                    <h2>

                        ${escapeHTML(

                            groupRecords[0].activity

                        )}

                    </h2>

 

                    <table>

 

                        <thead>

 

                            <tr>

                                <th>CONTROL NUMBER</th>

                                <th>NAME</th>

                                <th>BARANGAY</th>

                                <th>CLUSTER</th>

                                <th>ACTIVITY</th>

                            </tr>

 

                        </thead>

 

                        <tbody>

 

                `;

 

 

                groupRecords.forEach(

                    function (record) {

 

                        groupsHTML += `

 

                            <tr>

 

                                <td>

                                    ${escapeHTML(

                                        record.controlNumber

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.name

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.barangay

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.cluster

                                    )}

                                </td>

 

                                <td>

                                    ${escapeHTML(

                                        record.activity

                                    )}

                                </td>

 

                            </tr>

 

                        `;

 

                    }

                );

 

 

                groupsHTML += `

 

                        </tbody>

 

                    </table>

 

                `;

 

            }

        );

 

 

        return `

 

            <!DOCTYPE html>

 

            <html>

 

            <head>

 

                <meta charset="UTF-8">

 

                <title>BASIS Activity Report</title>

 

                <style>

 

                    * {

                        box-sizing: border-box;

                    }

 

                    body {

                        margin: 0;

                        padding: 28px;

                        color: #42523f;

                        font-family: Arial, sans-serif;

                    }

 

                    h1 {

                        margin: 0 0 5px;

                        font-size: 24px;

                    }

 

                    .subtitle {

                        margin-bottom: 22px;

                        color: #768a75;

                        font-size: 12px;

                    }

 

                    h2 {

                        margin: 22px 0 7px;

                        padding: 8px 10px;

                        background: #768a75;

                        color: #ffffff;

                        font-size: 14px;

                        page-break-after: avoid;

                    }

 

                    table {

                        width: 100%;

                        border-collapse: collapse;

                        margin-bottom: 15px;

                        font-size: 9px;

                    }

 

                    th {

                        background: #eef2ec;

                        font-weight: bold;

                    }

 

                    th,

                    td {

                        border: 1px solid #a3b2a0;

                        padding: 7px;

                        text-align: left;

                    }

 

                    tr {

                        page-break-inside: avoid;

                    }

 

                    @media print {

 

                        @page {

                            size: landscape;

                            margin: 12mm;

                        }

 

                    }

 

                </style>

 

            </head>

 

            <body>

 

                <h1>BASIS ACTIVITY PARTICIPATION REPORT</h1>

 

                <div class="subtitle">

                    Generated on ${escapeHTML(

                        new Date().toLocaleString(

                            "en-PH"

                        )

                    )}

                </div>

 

                ${groupsHTML}

 

            </body>

 

            </html>

 

        `;

 

    }

 

 

    function getFileDate() {

 

        const now =

            new Date();

 

        const year =

            now.getFullYear();

 

        const month =

            String(

                now.getMonth() + 1

            ).padStart(2, "0");

 

        const day =

            String(

                now.getDate()

            ).padStart(2, "0");

 

        return (

            `${year}-${month}-${day}`

        );

 

    }

 

 

    /* =====================================================

       FEEDBACK INBOX

    ====================================================== */

 

    function getFeedbackInboxRecords() {

 

        const sources = [

 

            {

                key:

                    "basisFeedbackHistory",

 

                source:

                    "ISKOLAR"

            },

 

            {

                key:

                    "feedbackHistory",

 

                source:

                    "ISKOLAR"

            },

 

            {

                key:

                    "basisRepresentativeFeedbackHistory",

 

                source:

                    "REPRESENTATIVE"

            },

 

            {

                key:

                    "representativeFeedbackHistory",

 

                source:

                    "REPRESENTATIVE"

            },

 

            {

                key:

                    "basisRepresentativeFeedback",

 

                source:

                    "REPRESENTATIVE"

            }

 

        ];

 

        const allRecords = [];

 

        sources.forEach(

            function (source) {

 

                const records =

                    asArray(

                        readJSON(

                            source.key,

                            []

                        )

                    );

 

                records.forEach(

                    function (record) {

 

                        if (

                            !record ||

                            typeof record !== "object"

                        ) {

                            return;

                        }

 

                        allRecords.push({

 

                            ...record,

 

                            __source:

                                record.source ||

                                record.senderRole ||

                                record.role ||

                                source.source,

 

                            __sourceKey:

                                source.key

 

                        });

 

                    }

                );

 

            }

        );

 

 

        /*

            Remove duplicates across aliases.

        */

        const unique = [];

        const seen = new Set();

 

        allRecords.forEach(

            function (record) {

 

                const signature =

                    JSON.stringify({

 

                        id:

                            record.id ||

                            record.timestamp ||

                            "",

 

                        title:

                            record.title ||

                            record.messageTitle ||

                            "",

 

                        message:

                            record.message ||

                            record.body ||

                            record.description ||

                            "",

 

                        name:

                            record.name ||

                            record.fullname ||

                            record.fullName ||

                            ""

 

                    });

 

                if (!seen.has(signature)) {

 

                    seen.add(signature);

 

                    unique.push(record);

 

                }

 

            }

        );

 

 

        unique.sort(

            function (a, b) {

 

                return (

                    Number(

                        b.timestamp ||

                        b.id ||

                        0

                    ) -

                    Number(

                        a.timestamp ||

                        a.id ||

                        0

                    )

                );

 

            }

        );

 

 

        return unique;

 

    }

 

 

    function getFeedbackSource(

        record

    ) {

 

        const source =

            normalize(

                record.__source

            );

 

        if (

            source.includes(

                "representative"

            )

        ) {

 

            return "REPRESENTATIVE";

 

        }

 

        if (

            source.includes(

                "scholar"

            ) ||

            source.includes(

                "iskolar"

            )

        ) {

 

            return "ISKOLAR";

 

        }

 

        if (

            record.__sourceKey &&

            record.__sourceKey

                .toLowerCase()

                .includes(

                    "representative"

                )

        ) {

 

            return "REPRESENTATIVE";

 

        }

 

        return "ISKOLAR";

 

    }

 

 

    function getFeedbackName(record) {

 

        return (

            record.name ||

            record.fullname ||

            record.fullName ||

            record.senderName ||

            record.userName ||

            "UNKNOWN USER"

        );

 

    }

 

 

    function getFeedbackTitle(record) {

 

        return (

            record.title ||

            record.messageTitle ||

            "FEEDBACK / CONCERN"

        );

 

    }

 

 

    function getFeedbackMessage(record) {

 

        return (

            record.message ||

            record.body ||

            record.description ||

            record.content ||

            "No message available."

        );

 

    }

 

 

    function getFeedbackDate(record) {

 

        if (record.date) {

            return String(

                record.date

            );

        }

 

        if (record.createdAt) {

            return String(

                record.createdAt

            );

        }

 

        if (record.timestamp) {

 

            const date =

                new Date(

                    Number(

                        record.timestamp

                    )

                );

 

            if (

                !Number.isNaN(

                    date.getTime()

                )

            ) {

 

                return date.toLocaleDateString(

                    "en-PH"

                );

 

            }

 

        }

 

        return "—";

 

    }

 

 

    function renderFeedbackInbox(

        searchTerm = "",

        filterType = "All"

    ) {

 

        if (!feedbackInboxList) {

            return;

        }

 

        const records =

            getFeedbackInboxRecords();

 

        const search =

            normalize(

                searchTerm

            );

 

 

        const filtered =

            records.filter(

                function (record) {

 

                    const source =

                        getFeedbackSource(

                            record

                        );

 

                    const type =

                        record.type ||

                        record.messageType ||

                        "Feedback";

 

                    const matchesSearch =

                        !search ||

                        normalize(

                            getFeedbackTitle(

                                record

                            )

                        ).includes(search) ||

                        normalize(

                            getFeedbackMessage(

                                record

                            )

                        ).includes(search) ||

                        normalize(

                            getFeedbackName(

                                record

                            )

                        ).includes(search) ||

                        normalize(

                            source

                        ).includes(search);

 

                    const matchesType =

                        filterType === "All" ||

                        normalize(type) ===

                            normalize(filterType);

 

                    return (

                        matchesSearch &&

                        matchesType

                    );

 

                }

            );

 

 

        if (!filtered.length) {

 

            feedbackInboxList.innerHTML = `

 

                <div class="feedback-history-empty feedback-inbox-empty">

 

                    <i class="fa-solid fa-inbox"></i>

 

                    <h3>

                        ${

                            records.length === 0

                                ? "No feedback or concerns received yet."

                                : "No matching records found."

                        }

                    </h3>

 

                    <p>

                        ${

                            records.length === 0

                                ? "Messages from Iskolars and Representatives will appear here."

                                : "Try another search or filter."

                        }

                    </p>

 

                </div>

 

            `;

 

            return;

 

        }

 

 

        feedbackInboxList.innerHTML =

            filtered.map(

                function (record) {

 

                    const type =

                        record.type ||

                        record.messageType ||

                        "Feedback";

 

                    return `

 

                        <div

                            class="feedback-inbox-item"

                            data-record-id="${escapeHTML(

                                String(

                                    record.id ||

                                    record.timestamp ||

                                    ""

                                )

                            )}"

                        >

 

                            <div class="feedback-inbox-info">

 

                                <h4>

                                    ${escapeHTML(

                                        getFeedbackTitle(

                                            record

                                        )

                                    )}

                                </h4>

 

                                <p>

                                    ${escapeHTML(

                                        getFeedbackName(

                                            record

                                        )

                                    )}

                                </p>

 

                                <span>

                                    ${escapeHTML(

                                        getFeedbackDate(

                                            record

                                        )

                                    )}

                                </span>

 

                            </div>

 

                            <div class="feedback-inbox-badges">

 

                                <div class="feedback-inbox-type">

                                    ${escapeHTML(

                                        String(

                                            type

                                        ).toUpperCase()

                                    )}

                                </div>

 

                                <div class="feedback-inbox-source">

                                    ${escapeHTML(

                                        getFeedbackSource(

                                            record

                                        )

                                    )}

                                </div>

 

                            </div>

 

                        </div>

 

                    `;

 

                }

            )

            .join("");

 

 

        feedbackInboxList

            .querySelectorAll(

                ".feedback-inbox-item"

            )

            .forEach(

                function (item) {

 

                    item.addEventListener(

                        "click",

                        function () {

 

                            const id =

                                item.dataset.recordId;

 

                            const record =

                                filtered.find(

                                    function (

                                        entry

                                    ) {

 

                                        return String(

                                            entry.id ||

                                            entry.timestamp ||

                                            ""

                                        ) === id;

 

                                    }

                                );

 

                            if (record) {

                                showFeedbackRecord(

                                    record

                                );

                            }

 

                        }

                    );

 

                }

            );

 

    }

 

 

    function showFeedbackRecord(

        record

    ) {

 

        const existing =

            document.getElementById(

                "adminFeedbackModal"

            );

 

        if (existing) {

            existing.remove();

        }

 

 

        const type =

            record.type ||

            record.messageType ||

            "Feedback";

 

        const modal =

            document.createElement(

                "div"

            );

 

        modal.id =

            "adminFeedbackModal";

 

        modal.className =

            "feedback-inbox-modal";

 

 

        modal.innerHTML = `

 

            <div class="feedback-inbox-modal-card">

 

                <button

                    type="button"

                    class="feedback-inbox-modal-close"

                >

                    ×

                </button>

 

                <h2>

                    ${escapeHTML(

                        getFeedbackTitle(

                            record

                        )

                    )}

                </h2>

 

                <div class="feedback-modal-meta">

 

                    <strong>TYPE:</strong>

                    ${escapeHTML(

                        String(type).toUpperCase()

                    )}

 

                    &nbsp;&nbsp;&nbsp;

 

                    <strong>FROM:</strong>

                    ${escapeHTML(

                        getFeedbackSource(

                            record

                        )

                    )}

 

                    &nbsp;&nbsp;&nbsp;

 

                    <strong>DATE:</strong>

                    ${escapeHTML(

                        getFeedbackDate(

                            record

                        )

                    )}

 

                </div>

 

                <div class="feedback-modal-account">

 

                    <p>

                        <strong>NAME:</strong>

                        ${escapeHTML(

                            getFeedbackName(

                                record

                            )

                        )}

                    </p>

 

                    <p>

                        <strong>EMAIL:</strong>

                        ${escapeHTML(

                            record.email ||

                            record.emailAddress ||

                            "Not available"

                        )}

                    </p>

 

                    <p>

                        <strong>CONTACT NO.:</strong>

                        ${escapeHTML(

                            record.contact ||

                            record.contactNo ||

                            record.phone ||

                            "Not available"

                        )}

                    </p>

 

                    <p>

                        <strong>MUNICIPALITY:</strong>

                        ${escapeHTML(

                            record.municipality ||

                            record.city ||

                            "Not available"

                        )}

                    </p>

 

                    <p>

                        <strong>BARANGAY:</strong>

                        ${escapeHTML(

                            record.barangay ||

                            "Not available"

                        )}

                    </p>

 

                </div>

 

                <div class="feedback-modal-message">

 

                    <strong>MESSAGE</strong>

 

                    <p>

                        ${escapeHTML(

                            getFeedbackMessage(

                                record

                            )

                        )}

                    </p>

 

                </div>

 

            </div>

 

        `;

 

 

        document.body.appendChild(

            modal

        );

 

 

        modal.querySelector(

            ".feedback-inbox-modal-close"

        ).addEventListener(

            "click",

            function () {

 

                modal.remove();

 

            }

        );

 

 

        modal.addEventListener(

            "click",

            function (event) {

 

                if (

                    event.target === modal

                ) {

 

                    modal.remove();

 

                }

 

            }

        );

 

    }

 

 

    /* =====================================================

       FEEDBACK SEARCH

    ====================================================== */

 

    if (feedbackInboxSearch) {

 

        feedbackInboxSearch.addEventListener(

            "input",

            function () {

 

                const filter =

                    feedbackInboxFilter?.dataset.filter ||

                    "All";

 

                renderFeedbackInbox(

                    feedbackInboxSearch.value,

                    filter

                );

 

            }

        );

 

    }

 

 

    /* =====================================================

       FEEDBACK FILTER

    ====================================================== */

 

    if (feedbackInboxFilter) {

 

        feedbackInboxFilter.addEventListener(

            "click",

            function () {

 

                const current =

                    feedbackInboxFilter.dataset.filter ||

                    "All";

 

                let next;

 

                if (current === "All") {

                    next = "Feedback";

                }

                else if (current === "Feedback") {

                    next = "Concern";

                }

                else {

                    next = "All";

                }

 

                feedbackInboxFilter.dataset.filter =

                    next;

 

                feedbackInboxFilter.textContent =

                    next === "All"

                        ? "FILTER"

                        : next.toUpperCase();

 

                renderFeedbackInbox(

                    feedbackInboxSearch

                        ? feedbackInboxSearch.value

                        : "",

                    next

                );

 

            }

        );

 

    }

 

 

    /* =====================================================

       REPORT BUTTONS

    ====================================================== */

 

    const generateReportBtn =

        document.getElementById(

            "generateReportBtn"

        );

 

    const exportExcelBtn =

        document.getElementById(

            "exportExcelBtn"

        );

 

    const exportPdfBtn =

        document.getElementById(

            "exportPdfBtn"

        );

 

    const clearReportBtn =

        document.getElementById(

            "clearReportBtn"

        );

 

 

    if (generateReportBtn) {

 

        generateReportBtn.addEventListener(

            "click",

            generateReport

        );

 

    }

 

    if (exportExcelBtn) {

 

        exportExcelBtn.addEventListener(

            "click",

            exportExcel

        );

 

    }

 

    if (exportPdfBtn) {

 

        exportPdfBtn.addEventListener(

            "click",

            exportPDF

        );

 

    }

 

    if (clearReportBtn) {

 

        clearReportBtn.addEventListener(

            "click",

            clearReport

        );

 

    }

 

 

    /* =====================================================

       REFRESH WHEN STORAGE CHANGES

    ====================================================== */

 

    window.addEventListener(

        "storage",

        function (event) {

 

            const relevantKeys = [

 

                "activities",

 

                "attendanceRecords",

                "attendance",

                "activityAttendance",

                "activityParticipants",

                "participants",

                "verifiedAttendance",

                "verifiedActivities",

                "submissionRecords",

 

                "basisFeedbackHistory",

                "feedbackHistory",

                "basisRepresentativeFeedbackHistory",

                "representativeFeedbackHistory",

                "basisRepresentativeFeedback"

 

            ];

 

            if (

                relevantKeys.includes(

                    event.key

                )

            ) {

 

                if (

                    document.getElementById(

                        "reportView"

                    )?.style.display ===

                    "block"

                ) {

 

                    loadReportFilters();

 

                }

 

                if (

                    document.getElementById(

                        "feedbackInboxView"

                    )?.style.display ===

                    "block"

                ) {

 

                    renderFeedbackInbox(

                        feedbackInboxSearch

                            ? feedbackInboxSearch.value

                            : "",

                        feedbackInboxFilter?.dataset.filter ||

                            "All"

                    );

 

                }

 

            }

 

        }

    );

 

 

    /* =====================================================

       INITIAL STATE

    ====================================================== */

 

    showMoreMenu();

 

});