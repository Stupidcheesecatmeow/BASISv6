let currentScorecardData = null;
let selectedScorecardPeriod = null;

document.addEventListener("DOMContentLoaded", renderScorecardButtons);

async function renderScorecardButtons() {
    const listContainer = document.querySelector(".scorecard-list");
    if (!listContainer) return;
    listContainer.innerHTML = '<div class="no-scorecard-message"><p>Loading your scorecard…</p></div>';
    try {
        const response = await fetch('../admin/api/account_api.php?action=scorecard', {credentials:'same-origin',cache:'no-store'});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not load your scorecard.');
        currentScorecardData = data;
        const profile = data.profile || {};
        const scorecardActivities = Array.isArray(data.activities) ? data.activities : [];
        const activityResponse = await fetch('../admin/api/account_api.php?action=activities', {credentials:'same-origin',cache:'no-store'});
        const activityData = await activityResponse.json();
        if (!activityResponse.ok || !activityData.success) throw new Error(activityData.message || 'Could not load attendance records.');
        const attendanceActivities = (activityData.activities || [])
            .filter(activity => ['PRESENT','ATTENDED'].includes(String(activity.attendance_status || activity.status || '').toUpperCase()) || String(activity.time_in || '').trim() !== '')
            .map(activity => ({...activity, title:activity.title || activity.name, academicYear:activity.academicYear || activity.academic_year, status:activity.attendance_status || activity.status || 'ATTENDED'}));
        const mergedActivities = new Map();
        [...scorecardActivities, ...attendanceActivities].forEach(activity => {
            const key = String(activity.id || activity.activity_id || `${activity.title || activity.name}|${activity.date || activity.attendance_date}`);
            mergedActivities.set(key, {...mergedActivities.get(key), ...activity});
        });
        const activities = [...mergedActivities.values()];
        currentScorecardData.activities = activities;
        const periods = new Map();
        activities.forEach(activity => {
            const ay = activity.academicYear || activity.academic_year || defaultAcademicYear();
            const semester = activity.semester || defaultSemester();
            const key = `${ay}|${semester}`;
            if (!periods.has(key)) periods.set(key, {academicYear:ay,semester});
        });
        if (!periods.size) periods.set(`${defaultAcademicYear()}|${defaultSemester()}`, {academicYear:defaultAcademicYear(),semester:defaultSemester()});
        listContainer.replaceChildren();
        [...periods.values()].forEach(period => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'scorecard-btn';
            button.textContent = `${period.academicYear} ${String(period.semester).toUpperCase()} SCORECARD`;
            button.addEventListener('click', () => openScorecardDetail(period.academicYear, period.semester));
            listContainer.appendChild(button);
        });
        loadProfileInfo(profile);
    } catch (error) {
        listContainer.innerHTML = `<div class="no-scorecard-message"><h3>Scorecard could not be loaded.</h3><p>${escapeScorecardText(error.message)}</p></div>`;
    }
}

function defaultAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function defaultSemester() {
    const month = new Date().getMonth();
    return month >= 7 || month === 0 ? '1st Semester' : '2nd Semester';
}

function normalizeScorecardSemester(value) {
    const normalized = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (/^(1st|first) semester$/.test(normalized)) return '1st semester';
    if (/^(2nd|second) semester$/.test(normalized)) return '2nd semester';
    return normalized;
}

function normalizeScorecardAcademicYear(value) {
    return String(value || '').trim().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, '');
}

function escapeScorecardText(value) {
    const el = document.createElement('span');
    el.textContent = String(value || '');
    return el.innerHTML;
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

function openScorecardDetail(academicYear, semester) {
    const data = currentScorecardData;
    if (!data) return;
    selectedScorecardPeriod = {academicYear,semester};
    loadProfileInfo(data.profile || {});
    const ayTitle=document.getElementById('scorecardAYTitle');
    const semTitle=document.getElementById('scorecardSemTitle');
    if(ayTitle)ayTitle.textContent=`AY: ${academicYear}`;
    if(semTitle)semTitle.textContent=String(semester).toUpperCase();
    const attended=(data.activities||[]).filter(activity =>
        normalizeScorecardAcademicYear(activity.academicYear||activity.academic_year||academicYear)===normalizeScorecardAcademicYear(academicYear) &&
        normalizeScorecardSemester(activity.semester||semester)===normalizeScorecardSemester(semester)
    );
    populateActivityRows(attended);
    showSubView('view-scorecard-detail');
}



/* =========================================================
   LOAD PROFILE INFORMATION
   ========================================================= */

function loadProfileInfo(user) {

    const father = user.father || {};
    const mother = user.mother || {};
    const fullName = person => [person.given, person.middle, person.surname, person.suffix].filter(Boolean).join(' ');
    const siblingNames = Array.isArray(user.siblings) ? user.siblings.map(fullName).filter(Boolean).join(', ') : String(user.siblings || '');

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
            fullName(father) || user.fatherName,

        "info-father-contact":
            father.contact || user.fatherContact,

        "info-mother":
            fullName(mother) || user.motherName,

        "info-mother-contact":
            mother.contact || user.motherContact,

        "info-siblings":
            siblingNames,

        "info-school":
            user.school,

        "info-program":
            user.program,

        "info-year-level":
            user.yearLevel || user.year_level,

        "info-year":
            user.yearLevel || user.year_level,

        "info-control-number":
            user.control_number,

        "info-control":
            user.control_number

    };



    Object.entries(fields).forEach(
        function ([id, value]) {

            const element =
                document.getElementById(id);


            if (!element) {

                return;

            }


            element.textContent = value || "—";

        }
    );

}



/* =========================================================
   POPULATE ACTIVITY ROWS
   ========================================================= */

function populateActivityRows(
    activities
) {
    const column=document.getElementById('activityRows')||document.querySelector('.activity-log-column');
    if(!column)return;
    column.querySelectorAll('.activity-form-row,.scorecard-no-activities').forEach(element=>element.remove());
    if(!activities.length){
        const empty=document.createElement('p');
        empty.className='scorecard-no-activities';
        empty.textContent='No attended activities for this semester yet.';
        column.appendChild(empty);
        return;
    }
    activities.forEach(activity=>{
        const row=document.createElement('div');row.className='activity-form-row';
        const titleGroup=document.createElement('div');titleGroup.className='field-group title-field';
        const titleLabel=document.createElement('label');titleLabel.textContent='Activity Title:';
        const title=document.createElement('input');title.type='text';title.readOnly=true;title.value=activity.title||activity.name||'';
        titleGroup.append(titleLabel,title);
        const dateGroup=document.createElement('div');dateGroup.className='field-group date-field';
        const dateLabel=document.createElement('label');dateLabel.textContent='Date:';
        const date=document.createElement('input');date.type='text';date.readOnly=true;date.value=activity.attendance_date||activity.date||'';
        dateGroup.append(dateLabel,date);row.append(titleGroup,dateGroup);column.appendChild(row);
    });
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
