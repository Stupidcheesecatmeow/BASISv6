const API_URL = "api/user_api.php";

let allUsers = [];
let selectedUser = null;
let selectedExcelFile = null;
let importedCredentials = [];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadUsers();
});

function bindEvents() {

    $("userSearch").addEventListener("input", renderUsers);

    $("filterBtn").addEventListener("click", () => openModal("filterModal"));
    $("applyFilterBtn").addEventListener("click", () => {
        renderUsers();
        closeModal("filterModal");
    });

    $("clearFilterBtn").addEventListener("click", () => {
        $("filterRole").value = "";
        $("filterStatus").value = "";
        renderUsers();
        closeModal("filterModal");
    });

    $("importExcelBtn").addEventListener("click", () => {
        resetImportModal();
        openModal("importModal");
    });

    $("chooseFileBtn").addEventListener("click", () => $("excelFile").click());

    $("excelFile").addEventListener("change", (e) => {
        selectedExcelFile = e.target.files[0] || null;

        $("selectedFile").textContent =
            selectedExcelFile
                ? selectedExcelFile.name
                : "No file selected.";

        $("importConfirmBtn").disabled = !selectedExcelFile;
    });

    $("importConfirmBtn").addEventListener("click", importExcel);
    $("importResult").addEventListener("click", event => {
        if (event.target.closest("#downloadImportedCredentialsBtn")) {
            downloadImportedCredentials();
        }
    });

    $("addUserBtn").addEventListener("click", () => {
        $("newName").value = "";
        $("newEmail").value = "";
        $("newRole").value = "ISKOLAR";
        $("newStatus").value = "ACTIVE";
        openModal("addUserModal");
    });

    $("createUserBtn").addEventListener("click", createManualUser);

    $("closeDetailBtn").addEventListener("click", showList);
    $("deleteUserBtn").addEventListener("click", deleteSelectedUser);

    $("userForm").addEventListener("submit", saveUser);

    $("showPasswordBtn").addEventListener("click", () => {
        const input = $("detailPassword");
        input.type = input.type === "password" ? "text" : "password";
        $("showPasswordBtn").textContent =
            input.type === "password" ? "SHOW" : "HIDE";
    });

    $("viewActivitiesBtn").addEventListener("click", openActivities);
    $("closeActivitiesBtn").addEventListener("click", showList);
    $("backToProfileBtn").addEventListener("click", openSelectedProfile);

    $("copyCredentialBtn").addEventListener("click", copyCredentials);
    $("closeCredentialBtn").addEventListener("click", () => closeModal("credentialModal"));

    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
}

/* ================= API ================= */

async function api(action, options = {}) {

    const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({
        success: false,
        message: "Invalid server response."
    }));

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

async function loadUsers() {
    try {
        const data = await api("list");
        allUsers = Array.isArray(data.users) ? data.users : [];
        renderUsers();
    } catch (error) {
        toast(error.message, true);
    }
}

/* ================= LIST ================= */

function renderUsers() {

    const query = $("userSearch").value.trim().toLowerCase();
    const role = $("filterRole").value;
    const status = $("filterStatus").value;

    const filtered = allUsers.filter(user => {

        const searchable = [
            user.control_number,
            user.name,
            user.email,
            user.barangay,
            user.role,
            user.status
        ].join(" ").toLowerCase();

        return (
            searchable.includes(query) &&
            (!role || user.role === role) &&
            (!status || user.status === status)
        );
    });

    const tbody = $("usersTableBody");
    tbody.innerHTML = "";

    filtered.forEach(user => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHtml(user.control_number || "—")}</td>
            <td>${escapeHtml(user.name || "—")}</td>
            <td>${escapeHtml(user.barangay || "—")}</td>
            <td>
                <span class="role-badge">
                    ${escapeHtml(user.role || "ISKOLAR")}
                </span>
            </td>
            <td>
                <span class="status-badge ${(user.status || "ACTIVE").toLowerCase()}">
                    ${escapeHtml(user.status || "ACTIVE")}
                </span>
            </td>
            <td>
                <button class="manage-btn" data-id="${user.id}">
                    UPDATE
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".manage-btn").forEach(btn => {
        btn.addEventListener("click", () => openProfile(btn.dataset.id));
    });

    $("emptyUsers").classList.toggle("hidden", filtered.length !== 0);
    $("userCount").textContent =
        `${filtered.length} ${filtered.length === 1 ? "USER" : "USERS"}`;
}

/* ================= PROFILE ================= */

async function openProfile(id) {

    try {
        const data = await api("get", {
            method: "POST",
            body: { id }
        });

        selectedUser = data.user;

        fillProfile(selectedUser);

        $("userListView").classList.add("hidden");
        $("activitiesView").classList.add("hidden");
        $("userDetailView").classList.remove("hidden");

    } catch (error) {
        toast(error.message, true);
    }
}

function openSelectedProfile() {
    if (selectedUser) {
        fillProfile(selectedUser);
        $("activitiesView").classList.add("hidden");
        $("userDetailView").classList.remove("hidden");
    }
}

function fillProfile(user) {

    $("detailName").textContent =
        user.name || "UNNAMED USER";

    $("detailLocation").textContent =
        user.municipality || "BAGAC";

    $("detailControlNo").textContent =
        user.control_number || "—";

    $("detailEmail").textContent =
        user.email || "—";

    $("detailPassword").value =
        user.initial_password || "";

    $("detailPassword").type = "password";
    $("showPasswordBtn").textContent = "SHOW";

    $("role").value = user.role || "ISKOLAR";
    $("status").value = user.status || "ACTIVE";
    $("sex").value = user.sex || "";

    $("givenName").value = user.given_name || "";
    $("surname").value = user.surname || "";
    $("middleName").value = user.middle_name || "";
    $("suffix").value = user.suffix || "";

    $("birthday").value = user.birthday || "";
    $("contactNo").value = user.contact_no || "";
    $("religion").value = user.religion || "";

    $("municipality").value =
        user.municipality || "BAGAC";

    $("barangay").value =
        user.barangay || "";

    $("school").value =
        user.school || "";

    $("program").value =
        user.program || "";

    const yearLevel = $("yearLevel");
    yearLevel.querySelectorAll("option[data-custom-year-level]").forEach(option => option.remove());
    const savedYearLevel = String(user.year_level || "").trim();
    const yearOption = Array.from(yearLevel.options).find(option =>
        option.value.toUpperCase() === savedYearLevel.toUpperCase()
    );
    if (savedYearLevel && yearOption) {
        yearLevel.value = yearOption.value;
    } else if (savedYearLevel) {
        const customOption = document.createElement("option");
        customOption.value = savedYearLevel;
        customOption.textContent = savedYearLevel;
        customOption.dataset.customYearLevel = "true";
        yearLevel.add(customOption);
        yearLevel.value = savedYearLevel;
    } else {
        yearLevel.value = "";
    }

    $("profileCompleted").value =
        Number(user.profile_completed) === 1
            ? "YES"
            : "NO";
}

/* ================= SAVE ================= */

async function saveUser(event) {

    event.preventDefault();

    if (!selectedUser) return;

    const body = {
        id: selectedUser.id,

        role: $("role").value,
        status: $("status").value
    };

    try {

        const data = await api("update", {
            method: "POST",
            body
        });

        selectedUser = data.user;

        fillProfile(selectedUser);

        await loadUsers();

        toast("User profile updated successfully.");

    } catch (error) {
        toast(error.message, true);
    }
}

/* ================= ADD ================= */

async function createManualUser() {

    const name = $("newName").value.trim();
    const email = $("newEmail").value.trim();
    const role = $("newRole").value;
    const status = $("newStatus").value;

    if (!name || !email) {
        toast("Name and email are required.", true);
        return;
    }

    try {

        const data = await api("create", {
            method: "POST",
            body: {
                name,
                email,
                role,
                status
            }
        });

        closeModal("addUserModal");

        await loadUsers();

        showCredentials(data.user);

    } catch (error) {
        toast(error.message, true);
    }
}

/* ================= EXCEL IMPORT ================= */

async function importExcel() {

    importedCredentials = [];

    if (!selectedExcelFile) {
        toast("Please select an Excel file.", true);
        return;
    }

    if (typeof XLSX === "undefined") {
        toast("Excel reader is not loaded. Check your internet connection.", true);
        return;
    }

    $("importConfirmBtn").disabled = true;
    $("importConfirmBtn").textContent = "IMPORTING...";

    try {

        const buffer = await selectedExcelFile.arrayBuffer();

        const workbook = XLSX.read(buffer, {
            type: "array"
        });

        const firstSheet =
            workbook.Sheets[workbook.SheetNames[0]];

        const rows =
            XLSX.utils.sheet_to_json(firstSheet, {
                defval: ""
            });

        if (!rows.length) {
            throw new Error("The Excel file has no data.");
        }

        const normalizedRows = rows.map(row => {

            const keys = Object.keys(row);

            const findKey = (wanted) =>
                keys.find(key =>
                    key.trim().toLowerCase() === wanted
                );

            const nameKey = findKey("name");
            const emailKey = findKey("email");

            return {
                name: nameKey ? String(row[nameKey]).trim() : "",
                email: emailKey ? String(row[emailKey]).trim() : ""
            };
        });

        const missing = normalizedRows.find(
            row => !row.name || !row.email
        );

        if (missing) {
            throw new Error(
                "Every row must contain both NAME and EMAIL."
            );
        }

        const data = await api("import", {
            method: "POST",
            body: {
                rows: normalizedRows
            }
        });

        renderImportResult(data);

        await loadUsers();

    } catch (error) {
        importedCredentials = [];
        $("importResult").classList.remove("hidden");
        $("importResult").textContent = error.message;
        toast(error.message, true);
    } finally {
        $("importConfirmBtn").disabled = false;
        $("importConfirmBtn").textContent = "IMPORT USERS";
    }
}

function renderImportResult(data) {

    const result = $("importResult");
    importedCredentials = Array.isArray(data.credentials) ? data.credentials : [];

    result.classList.remove("hidden");

    result.innerHTML = `
        <strong>IMPORT COMPLETE</strong><br>
        Imported: ${data.imported || 0}<br>
        Skipped: ${data.skipped || 0}
        <br>Imported accounts start with the ISKOLAR role. Change roles later in User Management.
        ${data.errors?.length ? `<br>Errors: ${data.errors.length}` : ""}
        ${importedCredentials.length ? `<p><button type="button" id="downloadImportedCredentialsBtn" class="action-btn">DOWNLOAD GENERATED CREDENTIALS AS EXCEL</button></p><details class="import-credentials"><summary>View generated credentials (${importedCredentials.length})</summary><div class="import-credentials-table-wrap"><table><thead><tr><th>Control number</th><th>Name</th><th>Email</th><th>Role</th><th>Temporary password</th></tr></thead><tbody>${importedCredentials.map(user => `<tr><td data-label="Control number">${escapeHtml(user.control_number)}</td><td data-label="Name">${escapeHtml(user.name)}</td><td data-label="Email">${escapeHtml(user.email)}</td><td data-label="Role">ISKOLAR</td><td data-label="Temporary password">${escapeHtml(user.password)}</td></tr>`).join("")}</tbody></table></div><p>Each user must change this temporary password after signing in.</p></details>` : ""}
    `;
}

function downloadImportedCredentials() {
    if (!importedCredentials.length) {
        toast("There are no newly imported credentials to download.", true);
        return;
    }
    if (typeof XLSX === "undefined") {
        toast("Excel export could not load. Refresh the page and try again.", true);
        return;
    }

    const rows = importedCredentials.map(user => ({
        "CONTROL NUMBER": user.control_number || "",
        "NAME": user.name || "",
        "EMAIL": user.email || "",
        "ROLE": "ISKOLAR",
        "TEMPORARY PASSWORD": user.password || "",
        "CHANGE PASSWORD ON FIRST LOGIN": "YES"
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
        {wch:19}, {wch:23}, {wch:27}, {wch:15}, {wch:20}, {wch:28}
    ];
    worksheet["!autofilter"] = {ref:`A1:F${rows.length + 1}`};
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Imported Users");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    XLSX.writeFile(workbook, `BASIS_imported_credentials_${stamp}.xlsx`);
}

/* ================= CREDENTIALS ================= */

function showCredentials(user) {

    $("credentialControl").textContent =
        user.control_number || "—";

    $("credentialName").textContent =
        user.name || "—";

    $("credentialEmail").textContent =
        user.email || "—";

    $("credentialPassword").textContent =
        user.initial_password || "—";

    openModal("credentialModal");
}

async function copyCredentials() {

    const text = [
        `CONTROL NO.: ${$("credentialControl").textContent}`,
        `NAME: ${$("credentialName").textContent}`,
        `EMAIL: ${$("credentialEmail").textContent}`,
        `PASSWORD: ${$("credentialPassword").textContent}`
    ].join("\n");

    try {
        await navigator.clipboard.writeText(text);
        toast("Credentials copied.");
    } catch {
        toast("Unable to copy credentials.", true);
    }
}

/* ================= ACTIVITIES ================= */

async function openActivities() {

    if (!selectedUser) return;

    $("userDetailView").classList.add("hidden");
    $("activitiesView").classList.remove("hidden");

    $("activityUserName").textContent =
        selectedUser.name || "UNNAMED USER";

    $("activityUserLocation").textContent =
        selectedUser.municipality || "BAGAC";

    try {

        const data = await api("activities", {
            method: "POST",
            body: { id: selectedUser.id }
        });

        const tbody = $("activitiesTableBody");
        tbody.innerHTML = "";

        const activities = data.activities || [];

        $("emptyActivities").classList.toggle(
            "hidden",
            activities.length !== 0
        );

        activities.forEach(item => {

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${escapeHtml(item.activity_title || "—")}</td>
                <td>${escapeHtml(item.time_in || "—")}</td>
                <td>${escapeHtml(item.time_out || "—")}</td>
                <td>${escapeHtml(item.submission || "—")}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        toast(error.message, true);
    }
}

/* ================= DELETE ================= */

async function deleteSelectedUser() {

    if (!selectedUser) return;

    const confirmed = confirm(
        `Delete ${selectedUser.name || "this user"}?`
    );

    if (!confirmed) return;

    try {

        await api("delete", {
            method: "POST",
            body: { id: selectedUser.id }
        });

        selectedUser = null;

        showList();
        await loadUsers();

        toast("User deleted.");

    } catch (error) {
        toast(error.message, true);
    }
}

/* ================= VIEW / MODAL ================= */

function showList() {
    $("userDetailView").classList.add("hidden");
    $("activitiesView").classList.add("hidden");
    $("userListView").classList.remove("hidden");
}

function openModal(id) {
    $(id).classList.remove("hidden");
}

function closeModal(id) {
    $(id).classList.add("hidden");
}

function resetImportModal() {
    selectedExcelFile = null;
    importedCredentials = [];
    $("excelFile").value = "";
    $("selectedFile").textContent = "No file selected.";
    $("importConfirmBtn").disabled = true;
    $("importResult").classList.add("hidden");
    $("importResult").textContent = "";
}

function toast(message, error = false) {

    const element = $("toast");

    element.textContent = message;
    element.style.background =
        error ? "#7b4545" : "#42523f";

    element.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer =
        setTimeout(() => {
            element.classList.remove("show");
        }, 2800);
}

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
