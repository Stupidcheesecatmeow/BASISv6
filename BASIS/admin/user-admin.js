const API_URL = "api/user_api.php";

let allUsers = [];
let selectedUser = null;
let selectedExcelFile = null;

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
        [user.municipality || "BAGAC", user.cluster ? `CLUSTER ${user.cluster}` : ""]
            .filter(Boolean)
            .join(" - ");

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

    $("cluster").value =
        user.cluster || "";

    $("school").value =
        user.school || "";

    $("program").value =
        user.program || "";

    $("yearLevel").value =
        user.year_level || "";

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
        status: $("status").value,
        sex: $("sex").value,

        given_name: $("givenName").value.trim(),
        surname: $("surname").value.trim(),
        middle_name: $("middleName").value.trim(),
        suffix: $("suffix").value.trim(),

        birthday: $("birthday").value,
        contact_no: $("contactNo").value.trim(),
        religion: $("religion").value.trim(),

        municipality: $("municipality").value.trim(),
        barangay: $("barangay").value,
        cluster: $("cluster").value.trim(),

        school: $("school").value.trim(),
        program: $("program").value.trim(),
        year_level: $("yearLevel").value
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

        if (data.credentials && data.credentials.length) {
            showCredentialsBatch(data.credentials);
        }

    } catch (error) {
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

    result.classList.remove("hidden");

    result.innerHTML = `
        <strong>IMPORT COMPLETE</strong><br>
        Imported: ${data.imported || 0}<br>
        Skipped: ${data.skipped || 0}
        ${data.errors?.length ? `<br>Errors: ${data.errors.length}` : ""}
    `;
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

function showCredentialsBatch(credentials) {

    const first = credentials[0];

    if (!first) return;

    showCredentials(first);

    if (credentials.length > 1) {
        toast(
            `${credentials.length} accounts created. The credential popup shows the first account.`
        );
    }
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
        [selectedUser.municipality || "BAGAC",
         selectedUser.cluster ? `CLUSTER ${selectedUser.cluster}` : ""]
            .filter(Boolean)
            .join(" - ");

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
