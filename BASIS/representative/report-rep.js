// The representative report uses the same live activity API as the admin report.
window.BASISRepApiReport = true;

document.addEventListener('DOMContentLoaded', () => {
    const activityList = document.getElementById('activityCheckboxList');
    const semesterList = document.getElementById('semesterCheckboxList');
    const yearList = document.getElementById('academicYearCheckboxList');
    const results = document.getElementById('reportResults');
    const count = document.getElementById('reportResultCount');
    if (!activityList || !semesterList || !yearList || !results || !count) return;

    const api = '../admin/api/activity_api.php';
    let activities = [];
    let generated = [];
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const formatParticipantName = person => {
        const surname = String(person.surname || '').trim();
        const givenName = String(person.given_name || '').trim();
        const middleName = String(person.middle_name || '').trim();
        const suffix = String(person.suffix || '').trim();
        if (!surname && !givenName && !middleName) return person.name || '';
        const firstAndMiddle = [givenName, middleName, suffix].filter(Boolean).join(' ');
        return surname ? `${surname}${firstAndMiddle ? `, ${firstAndMiddle}` : ''}` : firstAndMiddle;
    };
    const normalizeSemester = value => {
        const text = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (/^(1st|first)\s+semester$/.test(text)) return '1st Semester';
        if (/^(2nd|second)\s+semester$/.test(text)) return '2nd Semester';
        return String(value || '').trim();
    };
    const selected = selector => [...document.querySelectorAll(selector + ':checked')].map(input => input.value);
    const setEmpty = (element, message) => {
        const empty = document.createElement('div');
        empty.className = 'checkbox-empty';
        empty.textContent = message;
        element.replaceChildren(empty);
    };
    const addCheckbox = (container, value, className, labelText = value) => {
        const label = document.createElement('label');
        label.className = 'report-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox'; input.value = value; input.className = className;
        const text = document.createElement('span'); text.textContent = labelText;
        label.append(input, text); container.appendChild(label);
    };
    const request = async url => {
        const response = await fetch(url, {credentials:'same-origin',cache:'no-store'});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not load report data.');
        return data;
    };

    function syncSelectAll(allId, itemSelector) {
        const all = document.getElementById(allId);
        const items = [...document.querySelectorAll(itemSelector)];
        if (!all) return;
        all.checked = items.length > 0 && items.every(input => input.checked);
        all.indeterminate = items.some(input => input.checked) && !all.checked;
    }

    function bindSelectAll(allId, itemSelector) {
        document.getElementById(allId)?.addEventListener('change', event => {
            document.querySelectorAll(itemSelector).forEach(input => { input.checked = event.target.checked; });
        });
        document.addEventListener('change', event => {
            if (event.target.matches(itemSelector)) syncSelectAll(allId, itemSelector);
        });
    }

    function renderFilters() {
        activityList.replaceChildren();
        activities.forEach(activity => addCheckbox(activityList, String(activity.id), 'activity-check', activity.name || activity.title || 'Activity'));
        if (!activities.length) setEmpty(activityList, 'No activities available.');

        const semesters = [...new Set(activities.map(activity => normalizeSemester(activity.semester)).filter(Boolean))];
        semesterList.replaceChildren();
        semesters.forEach(semester => addCheckbox(semesterList, semester, 'semester-check', semester.toUpperCase()));
        if (!semesters.length) setEmpty(semesterList, 'No semesters available.');

        const years = [...new Set(activities.map(activity => String(activity.academicYear || activity.academic_year || '').trim()).filter(Boolean))];
        yearList.replaceChildren();
        years.forEach(year => addCheckbox(yearList, year, 'academic-year-check', year));
        if (!years.length) setEmpty(yearList, 'No academic years available.');
        syncSelectAll('selectAllActivities', '.activity-check');
        syncSelectAll('selectAllSemesters', '.semester-check');
        syncSelectAll('selectAllAcademicYears', '.academic-year-check');
    }

    // more-rep.js refreshes report filters whenever the report view is opened.
    // Keep that hook available while caching the loaded activities between opens.
    window.loadRepApiReportFilters = async function () {
        try {
            const data = await request(`${api}?action=list`);
            activities = data.activities || [];
            renderFilters();
        } catch (error) {
            setEmpty(activityList, error.message);
            setEmpty(semesterList, 'Unable to load semesters.');
            setEmpty(yearList, 'Unable to load academic years.');
        }
    };

    function renderReport() {
        results.replaceChildren();
        if (!generated.length) {
            results.innerHTML = '<div class="report-empty-state"><i class="fa-solid fa-folder-open"></i><h3>No matching records found.</h3><p>Try another activity, semester, or academic year selection.</p></div>';
            count.textContent = '0 records';
            return;
        }
        const groups = new Map();
        generated.forEach(row => {
            if (!groups.has(row.activityId)) groups.set(row.activityId, []);
            groups.get(row.activityId).push(row);
        });
        groups.forEach((rows, activityId) => {
            const activity = activities.find(item => String(item.id) === String(activityId));
            const group = document.createElement('section'); group.className = 'report-group';
            const title = document.createElement('div'); title.className = 'report-group-title';
            const heading = document.createElement('h4'); heading.textContent = activity?.name || rows[0].activity;
            const total = document.createElement('span'); total.textContent = `${rows.length} ATTENDEE${rows.length === 1 ? '' : 'S'}`;
            title.append(heading, total); group.appendChild(title);
            const wrap = document.createElement('div'); wrap.className = 'report-table-wrap';
            const table = document.createElement('table'); table.className = 'report-table';
            table.innerHTML = '<thead><tr><th>CONTROL NO.</th><th>NAME</th><th>BARANGAY</th><th>TIME IN</th><th>TIME OUT</th><th>STATUS</th></tr></thead>';
            const body = document.createElement('tbody');
            rows.forEach(row => {
                const tr = document.createElement('tr');
                [row.controlNumber || '—', row.name || '—', row.barangay || '—', row.timeIn || '—', row.timeOut || '—', row.status || '—'].forEach((value, index) => {
                    const td = document.createElement('td'); td.textContent = value;
                    if (index === 0) td.className = 'control-cell';
                    tr.appendChild(td);
                });
                body.appendChild(tr);
            });
            table.appendChild(body); wrap.appendChild(table); group.appendChild(wrap); results.appendChild(group);
        });
        count.textContent = `${generated.length} record${generated.length === 1 ? '' : 's'}`;
    }

    document.getElementById('generateReportBtn')?.addEventListener('click', async () => {
        const activityIds = selected('.activity-check');
        const semesters = selected('.semester-check');
        const years = selected('.academic-year-check');
        const matching = activities.filter(activity =>
            (!activityIds.length || activityIds.includes(String(activity.id))) &&
            (!semesters.length || semesters.includes(normalizeSemester(activity.semester))) &&
            (!years.length || years.includes(String(activity.academicYear || activity.academic_year || '').trim()))
        );
        results.innerHTML = '<div class="report-empty-state"><h3>Loading attendance…</h3></div>';
        count.textContent = 'Loading…';
        generated = [];
        try {
            const records = await Promise.all(matching.map(async activity => {
                const data = await request(`${api}?action=participants&activity_id=${encodeURIComponent(activity.id)}`);
                return (data.participants || []).filter(person => /^(attended|excused|absent)$/i.test(String(person.submission || '').trim())).map(person => ({
                    activityId: String(activity.id), activity: activity.name || activity.title || '',
                    controlNumber: person.control_number || '', name: formatParticipantName(person), surname: person.surname || '', barangay: person.barangay || '',
                    timeIn: person.time_in || '', timeOut: person.time_out || '', status: person.submission || ''
                })).sort((a, b) =>
                    a.barangay.localeCompare(b.barangay, undefined, { sensitivity: 'base' }) ||
                    a.surname.localeCompare(b.surname, undefined, { sensitivity: 'base' }) ||
                    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                );
            }));
            generated = records.flat();
            renderReport();
        } catch (error) {
            results.textContent = error.message;
            count.textContent = '0 records';
        }
    });

    document.getElementById('clearReportBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.activity-check,.academic-year-check,.semester-check').forEach(input => { input.checked = false; });
        ['selectAllActivities','selectAllSemesters','selectAllAcademicYears'].forEach(id => { const input = document.getElementById(id); if (input) { input.checked = false; input.indeterminate = false; } });
        generated = [];
        results.innerHTML = '<div class="report-empty-state"><i class="fa-solid fa-file-circle-check"></i><h3>No report generated yet.</h3><p>Select your filters and click GENERATE.</p></div>';
        count.textContent = '0 records';
    });

    document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
        if (!generated.length) { alert('Generate a report with at least one attendee first.'); return; }
        if (!window.XLSX) { alert('Excel export could not load. Refresh the page and try again.'); return; }
        const rows = generated.map(row => ({'ACTIVITY':row.activity,'CONTROL NO.':row.controlNumber,'NAME':row.name,'BARANGAY':row.barangay,'TIME IN':row.timeIn,'TIME OUT':row.timeOut,'STATUS':row.status}));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Activity Report');
        XLSX.writeFile(workbook, 'BASIS_Representative_Activity_Report.xlsx');
    });

    document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
        if (!generated.length) { alert('Generate a report with at least one attendee first.'); return; }
        const activityGroups = new Map();
        generated.forEach(row => {
            if (!activityGroups.has(row.activityId)) activityGroups.set(row.activityId, {name:row.activity, rows:[]});
            activityGroups.get(row.activityId).rows.push(row);
        });
        const activitySections = [...activityGroups.values()].map(group => {
            const rows = group.rows.map(row => {
                const statusClass = ({Attended:'attended',Absent:'absent',Excused:'excused'})[row.status] || 'other';
                const cells = [row.controlNumber,row.name,row.barangay,row.timeIn,row.timeOut];
                return `<tr>${cells.map(value => `<td>${escape(value || '—')}</td>`).join('')}<td><span class="status status-${statusClass}">${escape(row.status || '—')}</span></td></tr>`;
            }).join('');
            return `<section class="activity-section"><div class="activity-heading"><h2>${escape(group.name || 'Activity')}</h2><span>${group.rows.length} ATTENDEE${group.rows.length === 1 ? '' : 'S'}</span></div><div class="table-wrap"><table><thead><tr><th>CONTROL NO.</th><th>NAME</th><th>BARANGAY</th><th>TIME IN</th><th>TIME OUT</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
        }).join('');
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) { alert('Please allow pop-ups for BASIS to export the PDF.'); return; }
        printWindow.document.open();
        const reportDate = new Date().toLocaleDateString();
        const activityCount = new Set(generated.map(row => row.activityId)).size;
        printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>BASIS Representative Activity Report</title><style>
            *{box-sizing:border-box}body{margin:0;padding:34px;background:#f3f6f2;color:#263629;font:13px Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:1200px;margin:0 auto;background:#fff;border:1px solid #dce5da;border-radius:18px;overflow:hidden}.topbar{height:9px;background:#405a43}.content{padding:30px 34px 26px}.brand{color:#678067;font-size:10px;font-weight:800;letter-spacing:2px}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:8px}.heading h1{margin:0;color:#304832;font-size:24px;line-height:1.25}.heading p{margin:7px 0 0;color:#738173;font-size:12px}.report-chip{padding:8px 12px;border:1px solid #dce7d9;border-radius:9px;background:#eff4ed;color:#405a43;font-size:10px;font-weight:800;white-space:nowrap}.summary{display:flex;gap:10px;margin:22px 0 18px}.summary-card{min-width:150px;padding:11px 14px;border:1px solid #e1e9df;border-radius:10px;background:#f8faf7}.summary-card span{display:block;color:#788577;font-size:9px;font-weight:700;letter-spacing:.7px}.summary-card strong{display:block;margin-top:5px;color:#304832;font-size:16px}.activity-section{margin:0 0 16px;overflow:hidden;border:1px solid #dce5da;border-radius:12px;page-break-inside:avoid}.activity-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;background:#f1f5ef;border-bottom:1px solid #dce5da}.activity-heading h2{margin:0;color:#304832;font-size:14px}.activity-heading span{padding:5px 9px;border-radius:999px;background:#e3eddf;color:#405a43;font-size:9px;font-weight:800;white-space:nowrap}.table-wrap{overflow:hidden}table{width:100%;border-collapse:collapse}thead{display:table-header-group}th{padding:11px;background:#405a43;color:#fff;text-align:left;font-size:9px;letter-spacing:.45px}td{padding:10px 11px;border-top:1px solid #e8eee6;color:#354236;text-align:left;font-size:10px;line-height:1.4}tbody tr:nth-child(even){background:#f7f9f6}tr{page-break-inside:avoid}.status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:800}.status-attended{background:#e6f3e8;color:#28633a}.status-absent{background:#fbe9e8;color:#a33b35}.status-excused{background:#e8f0fb;color:#315f91}.status-other{background:#eef1ed;color:#596557}.footer{margin-top:17px;padding-top:12px;border-top:1px solid #e8eee6;color:#879184;font-size:9px;display:flex;justify-content:space-between;gap:12px}.footer strong{color:#536853}
            @page{size:landscape;margin:12mm}@media print{body{padding:0;background:#fff}.page{max-width:none;border:0;border-radius:0}.content{padding:0}.topbar{height:7px}th,td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        </style></head><body><main class="page"><div class="topbar"></div><div class="content"><div class="brand">BASIS · BAGAC ATTENDANCE AND SCHOLAR INFORMATION SYSTEM</div><div class="heading"><div><h1>Activity Participation Report</h1><p>Activity attendance and participation summary</p></div><span class="report-chip">REPRESENTATIVE REPORT</span></div><div class="summary"><div class="summary-card"><span>ATTENDEE RECORDS</span><strong>${generated.length}</strong></div><div class="summary-card"><span>ACTIVITIES</span><strong>${activityCount}</strong></div><div class="summary-card"><span>GENERATED</span><strong>${escape(reportDate)}</strong></div></div>${activitySections}<div class="footer"><span>Generated from BASIS attendance records</span><strong>REPRESENTATIVE</strong></div></div></main></body></html>`);
        printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 350);
    });

    bindSelectAll('selectAllActivities', '.activity-check');
    bindSelectAll('selectAllSemesters', '.semester-check');
    bindSelectAll('selectAllAcademicYears', '.academic-year-check');
    window.loadRepApiReportFilters();
});
