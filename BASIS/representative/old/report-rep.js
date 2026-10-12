document.addEventListener('DOMContentLoaded', () => {
    const activityList = document.getElementById('repReportActivityFilters');
    const semesterList = document.getElementById('repReportSemesterFilters');
    const yearList = document.getElementById('repReportYearFilters');
    const results = document.getElementById('repReportResults');
    const count = document.getElementById('repReportResultCount');
    if (!activityList || !semesterList || !yearList || !results || !count) return;

    const api = '../admin/api/activity_api.php';
    let activities = [];
    let generated = [];
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
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
        activities.forEach(activity => addCheckbox(activityList, String(activity.id), 'rep-report-activity', activity.name || activity.title || 'Activity'));
        if (!activities.length) setEmpty(activityList, 'No activities available.');

        const semesters = [...new Set(activities.map(activity => normalizeSemester(activity.semester)).filter(Boolean))];
        semesterList.replaceChildren();
        semesters.forEach(semester => addCheckbox(semesterList, semester, 'rep-report-semester', semester.toUpperCase()));
        if (!semesters.length) setEmpty(semesterList, 'No semesters available.');

        const years = [...new Set(activities.map(activity => String(activity.academicYear || activity.academic_year || '').trim()).filter(Boolean))];
        yearList.replaceChildren();
        years.forEach(year => addCheckbox(yearList, year, 'rep-report-year', year));
        if (!years.length) setEmpty(yearList, 'No academic years available.');
        syncSelectAll('repSelectAllActivities', '.rep-report-activity');
        syncSelectAll('repSelectAllSemesters', '.rep-report-semester');
        syncSelectAll('repSelectAllYears', '.rep-report-year');
    }

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

    document.getElementById('repGenerateReport')?.addEventListener('click', async () => {
        const activityIds = selected('.rep-report-activity');
        const semesters = selected('.rep-report-semester');
        const years = selected('.rep-report-year');
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
                return (data.participants || []).filter(person => person.time_in || /^attended$/i.test(person.submission || '')).map(person => ({
                    activityId: String(activity.id), activity: activity.name || activity.title || '',
                    controlNumber: person.control_number || '', name: person.name || '', barangay: person.barangay || '',
                    timeIn: person.time_in || '', timeOut: person.time_out || '', status: person.submission || 'Attended'
                }));
            }));
            generated = records.flat();
            renderReport();
        } catch (error) {
            results.textContent = error.message;
            count.textContent = '0 records';
        }
    });

    document.getElementById('repClearReport')?.addEventListener('click', () => {
        document.querySelectorAll('.rep-report-activity,.rep-report-year,.rep-report-semester').forEach(input => { input.checked = false; });
        ['repSelectAllActivities','repSelectAllSemesters','repSelectAllYears'].forEach(id => { const input = document.getElementById(id); if (input) { input.checked = false; input.indeterminate = false; } });
        generated = [];
        results.innerHTML = '<div class="report-empty-state"><i class="fa-solid fa-file-circle-check"></i><h3>No report generated yet.</h3><p>Select your filters and click GENERATE.</p></div>';
        count.textContent = '0 records';
    });

    document.getElementById('repExportReport')?.addEventListener('click', () => {
        if (!generated.length) { alert('Generate a report with at least one attendee first.'); return; }
        if (!window.XLSX) { alert('Excel export could not load. Refresh the page and try again.'); return; }
        const rows = generated.map(row => ({'ACTIVITY':row.activity,'CONTROL NO.':row.controlNumber,'NAME':row.name,'BARANGAY':row.barangay,'TIME IN':row.timeIn,'TIME OUT':row.timeOut,'STATUS':row.status}));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Activity Report');
        XLSX.writeFile(workbook, 'BASIS_Representative_Activity_Report.xlsx');
    });

    document.getElementById('repExportPdf')?.addEventListener('click', () => {
        if (!generated.length) { alert('Generate a report with at least one attendee first.'); return; }
        const rows = generated.map(row => `<tr>${[row.activity,row.controlNumber,row.name,row.barangay,row.timeIn,row.timeOut,row.status].map(value => `<td>${escape(value || '—')}</td>`).join('')}</tr>`).join('');
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) { alert('Please allow pop-ups for BASIS to export the PDF.'); return; }
        printWindow.document.open();
        printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>BASIS Representative Activity Report</title><style>body{font:12px Arial,sans-serif;color:#263326;padding:24px}h1{font-size:20px;color:#42523f}p{color:#586858}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #9eaa9c;padding:7px;text-align:left}th{background:#eef2ec;color:#42523f}tr{page-break-inside:avoid}@media print{body{padding:0}}</style></head><body><h1>BASIS ACTIVITY PARTICIPATION REPORT</h1><p>Generated ${new Date().toLocaleDateString()}</p><table><thead><tr><th>ACTIVITY</th><th>CONTROL NO.</th><th>NAME</th><th>BARANGAY</th><th>TIME IN</th><th>TIME OUT</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
        printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 350);
    });

    bindSelectAll('repSelectAllActivities', '.rep-report-activity');
    bindSelectAll('repSelectAllSemesters', '.rep-report-semester');
    bindSelectAll('repSelectAllYears', '.rep-report-year');
    request(`${api}?action=list`).then(data => {
        activities = data.activities || [];
        renderFilters();
    }).catch(error => {
        setEmpty(activityList, error.message);
        setEmpty(semesterList, 'Unable to load semesters.');
        setEmpty(yearList, 'Unable to load academic years.');
    });
});
