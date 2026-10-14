const API_URL = "api/user_api.php";

let allUsers = [];
let selectedUser = null;
let selectedExcelFile = null;
let importedCredentials = [];

const $ = (id) => document.getElementById(id);
function formatSubmittedDateTime(value) {
    if (!value) return "—";
    const raw = String(value).trim();
    const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
        ? raw
        : `${raw.replace(" ", "T")}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila"
    }).format(date);
}

const BAGAC_BARANGAYS = [
    "Atilano Ricardo",
    "Bagumbayan",
    "Banawang",
    "Binuangan",
    "Binukawan",
    "Ibaba",
    "Ibis",
    "Pagasa",
    "Parang",
    "Paysawan",
    "Quinawan",
    "San Antonio",
    "Saysain",
    "Tabing-ilog"
];

document.addEventListener("DOMContentLoaded", () => {
    populateRepresentativeBarangays();
    bindEvents();
    loadUsers();
});

function bindEvents() {

    $("userSearch").addEventListener("input", renderUsers);

    $("filterBtn").addEventListener("click", () => {
        openModal("filterModal");
    });

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

    $("chooseFileBtn").addEventListener("click", () => {
        $("excelFile").click();
    });

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

        $("newSurname").value = "";

        $("newGivenName").value = "";

        $("newMiddleName").value = "";

        $("newEmail").value = "";

        $("newRole").value = "ISKOLAR";

        $("newStatus").value = "ACTIVE";

        updateRepresentativeBarangayField(
            "newRole",
            "newAssignedBarangayField",
            "newAssignedBarangay"
        );

        openModal("addUserModal");
    });

    $("role").addEventListener("change", () => {

        updateRepresentativeBarangayField(
            "role",
            "assignedBarangayField",
            "assignedBarangay"
        );

    });

    $("newRole").addEventListener("change", () => {

        updateRepresentativeBarangayField(
            "newRole",
            "newAssignedBarangayField",
            "newAssignedBarangay"
        );

    });

    $("createUserBtn").addEventListener(
        "click",
        createManualUser
    );

    $("closeDetailBtn").addEventListener(
        "click",
        showList
    );

    $("deleteUserBtn").addEventListener(
        "click",
        deleteSelectedUser
    );

    $("userForm").addEventListener(
        "submit",
        saveUser
    );

    $("showPasswordBtn").addEventListener("click", () => {

        const input = $("detailPassword");

        input.type =
            input.type === "password"
                ? "text"
                : "password";

        $("showPasswordBtn").textContent =
            input.type === "password"
                ? "SHOW"
                : "HIDE";
    });

    $("viewActivitiesBtn").addEventListener(
        "click",
        openActivities
    );

    $("closeActivitiesBtn").addEventListener(
        "click",
        showList
    );

    $("backToProfileBtn").addEventListener(
        "click",
        openSelectedProfile
    );

    $("copyCredentialBtn").addEventListener(
        "click",
        copyCredentials
    );

    $("closeCredentialBtn").addEventListener(
        "click",
        () => closeModal("credentialModal")
    );

    document.querySelectorAll("[data-close]").forEach(btn => {

        btn.addEventListener("click", () => {
            closeModal(btn.dataset.close);
        });

    });
}


/* ================= API ================= */

async function api(action, options = {}) {

    const response = await fetch(
        `${API_URL}?action=${encodeURIComponent(action)}`,
        {
            method: options.method || "GET",

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },

            body: options.body
                ? JSON.stringify(options.body)
                : undefined
        }
    );

    const data = await response.json().catch(() => ({
        success: false,
        message: "Invalid server response."
    }));

    if (!response.ok || data.success === false) {
        throw new Error(
            data.message || "Request failed."
        );
    }

    return data;
}


/* ================= LOAD USERS ================= */

async function loadUsers() {
    const tbody = $("usersTableBody");
    const emptyUsers = $("emptyUsers");

    if (tbody) {
        tbody.innerHTML = "";
    }

    if (emptyUsers) {
        emptyUsers.classList.add("hidden");
    }

    try {
        const data = await api("list");

        allUsers = Array.isArray(data.users)
            ? data.users
            : [];

        renderUsers();
    } catch (error) {
        console.error("Failed to load users:", error);
        toast(error.message || "Unable to load users.", true);

        if (emptyUsers) {
            emptyUsers.classList.remove("hidden");
        }
    }
}


/* ================= LIST ================= */

function renderUsers() {
    const query = $("userSearch")
        ? $("userSearch").value.trim().toLowerCase()
        : "";

    const role = $("filterRole")
        ? $("filterRole").value
        : "";

    const status = $("filterStatus")
        ? $("filterStatus").value
        : "";

    const filtered = allUsers.filter(user => {
        const searchable = [
            user.control_number,
            user.name,
            user.surname,
            user.given_name,
            user.middle_name,
            user.email,
            user.barangay,
            user.role,
            user.status
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return (
            searchable.includes(query) &&
            (!role || user.role === role) &&
            (!status || user.status === status)
        );
    });

    const tbody = $("usersTableBody");

    if (!tbody) return;

    tbody.innerHTML = "";

    filtered.forEach(user => {
        const tr = document.createElement("tr");


    const fullName = String(
        user.name || user.full_name || ""
    ).trim();

    let surname = String(user.surname || "").trim();
    let givenName = String(user.given_name || "").trim();
    let middleName = String(user.middle_name || "").trim();

    // Fallback para sa lumang records na name lang ang mayroon.
// Restore missing display fields from the existing full name.
if (fullName) {
    const normalizedFullName = fullName
        .replace(/\s+/g, " ")
        .trim();

    const normalizedSurname = surname
        .replace(/\s+/g, " ")
        .trim();

    if (
        normalizedSurname &&
        normalizedFullName.toLowerCase()
            .endsWith(normalizedSurname.toLowerCase())
    ) {
        const remaining = normalizedFullName
            .slice(
                0,
                normalizedFullName.length -
                    normalizedSurname.length
            )
            .trim()
            .replace(/[ ,]+$/, "");

        const parts = remaining
            .split(/\s+/)
            .filter(Boolean);

        if (!givenName && parts.length > 0) {
            givenName = parts[0];
        }

        if (!middleName && parts.length > 1) {
            const prefix = givenName.trim();

            middleName = remaining
                .toLowerCase()
                .startsWith(prefix.toLowerCase())
                ? remaining.slice(prefix.length).trim()
                : parts.slice(1).join(" ");
        }
    }

    // Fallback for records with no separated name fields.
    if (!surname && !givenName && !middleName) {
        const parts = normalizedFullName
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            givenName = parts[0];
        } else if (parts.length === 2) {
            givenName = parts[0];
            surname = parts[1];
        } else if (parts.length >= 3) {
            givenName = parts[0];
            surname = parts[parts.length - 1];
            middleName = parts.slice(1, -1).join(" ");
        }
    }
}

        const controlNumber = user.control_number || "—";
        const barangay = user.barangay || "—";
        const currentRole = user.role || "ISKOLAR";
        const currentStatus = user.status || "ACTIVE";

        const statusClass = currentStatus
            .toLowerCase()
            .replace(/\s+/g, "-");

        tr.innerHTML = `
            <td>
                <span class="control-number-badge">
                    ${escapeHtml(controlNumber)}
                </span>
            </td>

            <td>
                ${escapeHtml(surname || "—")}
            </td>

            <td>
                ${escapeHtml(givenName || "—")}
            </td>

            <td>
                ${escapeHtml(middleName || "—")}
            </td>

            <td>
                <div class="user-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(barangay)}</span>
                </div>
            </td>

            <td>
                <span class="role-badge ${escapeHtml(
                    currentRole.toLowerCase().replace(/\s+/g, "-")
                )}">
                    ${escapeHtml(currentRole)}
                </span>
            </td>

            <td>
                <span class="status-badge ${escapeHtml(statusClass)}">
                    <span class="status-dot"></span>
                    ${escapeHtml(currentStatus)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="manage-btn"
                    data-id="${escapeHtml(user.id)}"
                >
                    MANAGE
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".manage-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            openProfile(btn.dataset.id);
        });
    });

    const emptyUsers = $("emptyUsers");

    if (emptyUsers) {
        emptyUsers.classList.toggle(
            "hidden",
            filtered.length !== 0
        );
    }

    const userCount = $("userCount");

    if (userCount) {
        userCount.textContent =
            `${filtered.length} ${filtered.length === 1 ? "USER" : "USERS"}`;
    }
}


/* ================= PROFILE ================= */

async function openProfile(id) {

    try {

        const data = await api(
            "get",
            {
                method: "POST",

                body: {
                    id
                }
            }
        );

        selectedUser =
            data.user;

        fillProfile(
            selectedUser
        );

        $("userListView")
            .classList
            .add("hidden");

        $("activitiesView")
            .classList
            .add("hidden");

        $("userDetailView")
            .classList
            .remove("hidden");

    } catch (error) {

        toast(
            error.message,
            true
        );

    }
}


function openSelectedProfile() {

    if (!selectedUser) {
        return;
    }

    fillProfile(
        selectedUser
    );

    $("activitiesView")
        .classList
        .add("hidden");

    $("userDetailView")
        .classList
        .remove("hidden");

}



/* ================= PROFILE NAME FIX ================= */

function getProfileNameFields(user = {}) {
    let profile = {};

    // Support profile data returned in different formats.
    if (user.profile_json) {
        try {
            profile = typeof user.profile_json === "string"
                ? JSON.parse(user.profile_json)
                : user.profile_json;
        } catch (error) {
            console.warn("Could not parse profile_json:", error);
        }
    } else if (user.profile && typeof user.profile === "object") {
        profile = user.profile;
    }

    const firstValue = (...values) => {
        for (const value of values) {
            if (typeof value === "string" && value.trim() !== "") {
                return value.trim().replace(/\s+/g, " ");
            }
        }
        return "";
    };

    return {
        surname: firstValue(
            user.surname,
            user.last_name,
            user.lastName,
            profile.surname,
            profile.last_name,
            profile.lastName
        ),

        givenName: firstValue(
            user.given_name,
            user.givenName,
            user.first_name,
            user.firstName,
            profile.given_name,
            profile.givenName,
            profile.first_name,
            profile.firstName
        ),

        middleName: firstValue(
            user.middle_name,
            user.middleName,
            user.middle_name,
            profile.middle_name,
            profile.middleName
        ),

        suffix: firstValue(
            user.suffix,
            profile.suffix
        )
    };
}


/* ================= FORMAT USER NAME ================= */

function formatUserName(user) {
    const names = getProfileNameFields(user);

    if (
        names.surname ||
        names.givenName ||
        names.middleName
    ) {
        return [
            names.surname,
            names.givenName,
            names.middleName,
            names.suffix
        ].filter(Boolean).join(", ");
    }

    return String(
        user?.name ||
        user?.full_name ||
        ""
    ).trim();
}


/* ================= FILL ACCOUNT DETAILS ================= */

function fillProfile(user) {
    setUserAvatar("detailAvatar", user);
    setUserAvatar("activityAvatar", user);

    const names = getProfileNameFields(user);

    $("detailName").textContent =
        formatUserName(user) || "UNNAMED USER";

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

    $("assignedBarangay").value =
        user.assignedBarangay ||
        user.assigned_barangay ||
        "";

    updateRepresentativeBarangayField(
        "role",
        "assignedBarangayField",
        "assignedBarangay"
    );

    $("sex").value = user.sex || "";

    $("surname").value = names.surname;
    $("givenName").value = names.givenName;
    $("middleName").value = names.middleName;
    $("suffix").value = names.suffix;

    $("birthday").value =
        user.birthday || "";

    $("contactNo").value =
        user.contact_no ||
        user.contactNo ||
        user.contact ||
        "";

    $("religion").value =
        user.religion || "";

    $("municipality").value =
        user.municipality || "BAGAC";

    $("barangay").value =
        user.barangay || "";

    $("school").value =
        user.school || "";

    $("program").value =
        user.program || "";

    $("yearLevel").value =
        user.year_level ||
        user.yearLevel ||
        "";

    $("profileCompleted").value =
        Number(user.profile_completed) === 1
            ? "YES"
            : "NO";
}



function setUserAvatar(
    elementId,
    user
) {

    const container =
        $(elementId);

    if (!container) {
        return;
    }

    container.replaceChildren();

    const photo =
        String(
            user.profilePhoto || ""
        );


    if (
        photo.startsWith(
            "data:image/"
        )
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src = photo;

        image.alt =
            user.name ||
            "User profile";

        container.appendChild(
            image
        );

        return;
    }


    const avatar =
        document.createElement(
            "span"
        );

    const name =
        user.name ||
        "User";


    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    let initials = "U";


    if (parts.length >= 2) {

        initials =
            (
                parts[0][0] +
                parts[
                    parts.length - 1
                ][0]
            ).toUpperCase();

    } else if (
        parts.length === 1
    ) {

        initials =
            parts[0][0]
                .toUpperCase();

    }


    avatar.textContent =
        initials;


    container.appendChild(
        avatar
    );

}


/* ================= REPRESENTATIVE BARANGAY ================= */

function populateRepresentativeBarangays() {

    const selects = [
        $("assignedBarangay"),
        $("newAssignedBarangay")
    ];


    selects.forEach(select => {

        if (!select) {
            return;
        }


        select.innerHTML =
            `<option value="">
                SELECT BARANGAY
            </option>`;


        BAGAC_BARANGAYS.forEach(
            barangay => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    barangay;

                option.textContent =
                    barangay;

                select.appendChild(
                    option
                );

            }
        );

    });

}


function updateRepresentativeBarangayField(
    roleId,
    fieldId,
    selectId
) {

    const role =
        $(roleId);

    const field =
        $(fieldId);

    const select =
        $(selectId);


    if (
        !role ||
        !field ||
        !select
    ) {
        return;
    }


    const isRepresentative =
        role.value ===
        "REPRESENTATIVE";


    field.classList.toggle(
        "hidden",
        !isRepresentative
    );


    select.required =
        isRepresentative;


    if (!isRepresentative) {
        select.value = "";
    }

}


/* ================= SAVE USER ================= */

async function saveUser(event) {

    event.preventDefault();

    if (!selectedUser) {
        return;
    }


    try {

        await api(
            "update",
            {
                method: "POST",

                body: {

                    id: selectedUser.id,

                    role:
                        $("role").value,

                    status:
                        $("status").value,

                    assigned_barangay:
                        $("assignedBarangay").value

                }
            }
        );


        const data =
            await api(
                "get",
                {
                    method: "POST",

                    body: {
                        id:
                            selectedUser.id
                    }
                }
            );


        selectedUser =
            data.user;


        fillProfile(
            selectedUser
        );


        await loadUsers();


        toast(
            "User updated successfully."
        );


    } catch (error) {

        toast(
            error.message,
            true
        );

    }

}


/* ================= CREATE USER ================= */

async function createManualUser() {

    const surname =
        $("newSurname")
            .value
            .trim();


    const givenName =
        $("newGivenName")
            .value
            .trim();


    const middleName =
        $("newMiddleName")
            .value
            .trim();


    const email =
        $("newEmail")
            .value
            .trim();


    const role =
        $("newRole").value;


    const status =
        $("newStatus").value;


    const assignedBarangay =
        $("newAssignedBarangay").value;


    const name =
        [
            givenName,
            middleName,
            surname
        ]
            .filter(Boolean)
            .join(" ")
            .trim();


    if (!surname) {

        toast(
            "Please enter the user's surname.",
            true
        );

        return;
    }


    if (!givenName) {

        toast(
            "Please enter the user's given name.",
            true
        );

        return;
    }


    if (!email) {

        toast(
            "Please enter the user's email.",
            true
        );

        return;
    }


    if (
        role === "REPRESENTATIVE" &&
        !assignedBarangay
    ) {

        toast(
            "Please select a barangay for the representative.",
            true
        );

        return;
    }


    try {

        const data =
            await api(

                "create",

                {

                    method: "POST",

                    body: {

                        name,

                        surname,

                        given_name:
                            givenName,

                        middle_name:
                            middleName,

                        email,

                        role,

                        status,

                        assigned_barangay:
                            assignedBarangay

                    }

                }

            );


        closeModal(
            "addUserModal"
        );


        await loadUsers();


        if (data.user) {

            showCredentials(
                data.user
            );

        } else {

            toast(
                "User created successfully."
            );

        }


    } catch (error) {

        toast(
            error.message,
            true
        );

    }

}

/* ================= IMPORT EXCEL ================= */

async function importExcel() {
    if (!selectedExcelFile) {
        toast("Please select an Excel file first.", true);
        return;
    }

    if (typeof XLSX === "undefined") {
        toast(
            "Excel library could not load. Refresh the page and try again.",
            true
        );
        return;
    }

    $("importConfirmBtn").disabled = true;

    try {
        const buffer = await selectedExcelFile.arrayBuffer();

        const workbook = XLSX.read(buffer, {
            type: "array"
        });

        const sheetName = workbook.SheetNames[0];

        if (!sheetName || !workbook.Sheets[sheetName]) {
            throw new Error("No worksheet was found in the Excel file.");
        }

        const worksheet = workbook.Sheets[sheetName];

        // Basahin ang Excel rows at headers.
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false
        });

        if (!rawRows.length) {
            throw new Error("The selected Excel file is empty.");
        }

        // I-normalize ang headers para tanggap ang spaces,
        // underscores, hyphens, at iba't ibang capitalization.
        const normalizeHeader = (value) =>
            String(value ?? "")
                .replace(/^\uFEFF/, "")
                .trim()
                .toUpperCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+/g, " ");

        const normalizedRows = rawRows.map((row) => {
            const cells = {};

            Object.keys(row).forEach((key) => {
                cells[normalizeHeader(key)] =
                    String(row[key] ?? "").trim();
            });

            const surname =
                cells["SURNAME"] ||
                cells["LAST NAME"] ||
                cells["FAMILY NAME"] ||
                "";

            const givenName =
                cells["GIVEN NAME"] ||
                cells["GIVENNAME"] ||
                cells["FIRST NAME"] ||
                cells["FIRSTNAME"] ||
                "";

            const middleName =
                cells["MIDDLE NAME"] ||
                cells["MIDDLENAME"] ||
                cells["MIDDLE"] ||
                "";

            const email =
                cells["EMAIL"] ||
                cells["EMAIL ADDRESS"] ||
                cells["EMAILADDRESS"] ||
                "";

            return {
                surname: surname.replace(/\s+/g, " "),
                given_name: givenName.replace(/\s+/g, " "),
                middle_name: middleName.replace(/\s+/g, " "),
                email: email.trim()
            };
        }).filter((row) =>
            row.surname ||
            row.given_name ||
            row.middle_name ||
            row.email
        );

        if (!normalizedRows.length) {
            throw new Error(
                "No user records were found. Check your Excel headers and data."
            );
        }

        // Tanggapin ang multi-word names, gaya ng De Jesus
        // at Maria Christina. Hindi required ang middle name.
        const invalidRow = normalizedRows.findIndex((row) =>
            !row.surname ||
            !row.given_name ||
            !row.email
        );

        if (invalidRow !== -1) {
            throw new Error(
                `Excel row ${invalidRow + 2}: ` +
                "SURNAME, GIVEN NAME, and EMAIL are required. " +
                "MIDDLE NAME may be blank."
            );
        }

        // I-check ang email format.
        const invalidEmailRow = normalizedRows.findIndex((row) =>
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
        );

        if (invalidEmailRow !== -1) {
            throw new Error(
                `Excel row ${invalidEmailRow + 2}: ` +
                "Please check the email address."
            );
        }

        // Ipadala ang magkakahiwalay na name fields sa API.
        const data = await api("import", {
            method: "POST",
            body: {
                users: normalizedRows
            }
        });

        renderImportResult(data);
        await loadUsers();

    } catch (error) {
        console.error("Excel import failed:", error);

        toast(
            error.message || "Unable to import the Excel file.",
            true
        );

    } finally {
        $("importConfirmBtn").disabled = !selectedExcelFile;
    }
}


/* ================= IMPORT RESULT ================= */

function renderImportResult(data) {

    const result =
        $("importResult");


    importedCredentials =
        Array.isArray(
            data.credentials
        )
            ? data.credentials
            : [];


    result.classList.remove(
        "hidden"
    );


    result.innerHTML = `

        <strong>
            IMPORT COMPLETE
        </strong>

        <br>

        Imported:
        ${data.imported || 0}

        <br>

        Skipped:
        ${data.skipped || 0}

        <br>

        Imported accounts start with the ISKOLAR role.
        Change roles later in User Management.

        ${
            data.errors?.length
                ? `<br>Errors: ${data.errors.length}`
                : ""
        }

        ${
            importedCredentials.length
                ? `

                    <p>

                        <button
                            type="button"
                            id="downloadImportedCredentialsBtn"
                            class="action-btn"
                        >

                            DOWNLOAD GENERATED CREDENTIALS AS EXCEL

                        </button>

                    </p>


                    <details class="import-credentials">

                        <summary>
                            View generated credentials
                            (${importedCredentials.length})
                        </summary>


                        <div class="import-credentials-table-wrap">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Control number
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Role
                                        </th>

                                        <th>
                                            Temporary password
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    ${importedCredentials.map(
                                        user => `

                                            <tr>

                                                <td data-label="Control number">
                                                    ${escapeHtml(
                                                        user.control_number
                                                    )}
                                                </td>

                                                <td data-label="Name">
                                                    ${escapeHtml(
                                                        user.name
                                                    )}
                                                </td>

                                                <td data-label="Email">
                                                    ${escapeHtml(
                                                        user.email
                                                    )}
                                                </td>

                                                <td data-label="Role">
                                                    ISKOLAR
                                                </td>

                                                <td data-label="Temporary password">
                                                    ${escapeHtml(
                                                        user.password
                                                    )}
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>


                        <p>
                            Each user must change this temporary password after signing in.
                        </p>

                    </details>

                `
                : ""
        }

    `;

}


/* ================= DOWNLOAD CREDENTIALS ================= */

function downloadImportedCredentials() {

    if (
        !importedCredentials.length
    ) {

        toast(
            "There are no newly imported credentials to download.",
            true
        );

        return;
    }


    if (
        typeof XLSX ===
        "undefined"
    ) {

        toast(
            "Excel export could not load. Refresh the page and try again.",
            true
        );

        return;
    }


    const rows =
        importedCredentials.map(
            user => ({

                "CONTROL NUMBER":
                    user.control_number ||
                    "",

                "NAME":
                    user.name ||
                    "",

                "EMAIL":
                    user.email ||
                    "",

                "ROLE":
                    "ISKOLAR",

                "TEMPORARY PASSWORD":
                    user.password ||
                    "",

                "CHANGE PASSWORD ON FIRST LOGIN":
                    "YES"

            })
        );


    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );


    worksheet["!cols"] = [

        { wch: 19 },
        { wch: 23 },
        { wch: 27 },
        { wch: 15 },
        { wch: 20 },
        { wch: 28 }

    ];


    worksheet["!autofilter"] = {
        ref:
            `A1:F${rows.length + 1}`
    };


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Imported Users"
    );


    const stamp =
        new Date()
            .toISOString()
            .replace(
                /[-:]/g,
                ""
            )
            .replace(
                /\.\d{3}Z$/,
                "Z"
            );


    XLSX.writeFile(
        workbook,
        `BASIS_imported_credentials_${stamp}.xlsx`
    );

}


/* ================= CREDENTIALS ================= */

function showCredentials(user) {

    $("credentialControl")
        .textContent =
        user.control_number ||
        "—";


    $("credentialName")
        .textContent =
        user.name ||
        "—";


    $("credentialEmail")
        .textContent =
        user.email ||
        "—";


    $("credentialPassword")
        .textContent =
        user.initial_password ||
        "—";


    openModal(
        "credentialModal"
    );

}


async function copyCredentials() {

    const text = [

        `CONTROL NO.: ${
            $("credentialControl").textContent
        }`,

        `NAME: ${
            $("credentialName").textContent
        }`,

        `EMAIL: ${
            $("credentialEmail").textContent
        }`,

        `PASSWORD: ${
            $("credentialPassword").textContent
        }`

    ].join("\n");


    try {

        await navigator.clipboard
            .writeText(text);

        toast(
            "Credentials copied."
        );

    } catch {

        toast(
            "Unable to copy credentials.",
            true
        );

    }

}


/* ================= ACTIVITIES ================= */

async function openActivities() {

    if (!selectedUser) {
        return;
    }


    $("userDetailView")
        .classList
        .add("hidden");


    $("activitiesView")
        .classList
        .remove("hidden");


    $("activityUserName")
        .textContent =
        selectedUser.name ||
        "UNNAMED USER";


    $("activityUserLocation")
        .textContent =
        selectedUser.municipality ||
        "BAGAC";


    try {

        const data =
            await api(
                "activities",
                {
                    method: "POST",

                    body: {
                        id:
                            selectedUser.id
                    }
                }
            );


        const tbody =
            $("activitiesTableBody");


        tbody.innerHTML = "";


        const activities =
            data.activities ||
            [];


        $("emptyActivities")
            .classList
            .toggle(
                "hidden",
                activities.length !== 0
            );


        activities.forEach(
            item => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.className =
                    "activity-proof-row";


                tr.tabIndex = 0;


                tr.setAttribute(
                    "role",
                    "button"
                );


                tr.setAttribute(
                    "aria-label",
                    `View proofs for ${
                        item.activity_title ||
                        "activity"
                    }`
                );


                tr.innerHTML = `

                    <td>

                        ${escapeHtml(
                            item.activity_title ||
                            "—"
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            item.status ||
                            "Absent"
                        )}

                    </td>

                    <td>

                        ${escapeHtml(
                            formatSubmittedDateTime(item.submitted_at)
                        )}

                    </td>

                `;


                tr.addEventListener(
                    "click",
                    () =>
                        openActivityProofs(
                            item
                        )
                );


                tr.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                                "Enter" ||
                            event.key ===
                                " "
                        ) {

                            event.preventDefault();

                            openActivityProofs(
                                item
                            );

                        }

                    }
                );


                tbody.appendChild(
                    tr
                );

            }
        );


    } catch (error) {

        toast(
            error.message,
            true
        );

    }

}


/* ================= ACTIVITY PROOFS ================= */

async function openActivityProofs(
    activity
) {

    const list =
        $("activityProofList");


    $("activityProofTitle")
        .textContent =
        activity.activity_title ||
        "ACTIVITY PROOFS";


    $("activityProofSubtitle")
        .textContent =
        `${selectedUser?.name || "User"} · ${
            activity.status || "Absent"
        }`;


    list.replaceChildren(

        Object.assign(
            document.createElement("p"),
            {
                textContent:
                    "Loading uploads…"
            }
        )

    );


    openModal(
        "activityProofModal"
    );


    try {

        const data =
            await api(
                "activity-proofs",
                {
                    method: "POST",

                    body: {

                        id:
                            selectedUser.id,

                        activity_id:
                            activity.activity_id

                    }
                }
            );


        const uploads =
            data.uploads ||
            [];


        list.replaceChildren();


        if (!uploads.length) {

            const empty =
                document.createElement(
                    "p"
                );


            empty.className =
                "activity-proof-empty";


            empty.textContent =
                "No upload available.";


            list.appendChild(
                empty
            );


            return;
        }


        uploads.forEach(
            upload => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "activity-proof-card";


                const heading =
                    document.createElement(
                        "strong"
                    );


                heading.textContent =
                    upload.submission_type ===
                    "absence"

                        ? "ABSENCE PROOF · PDF"

                        : "ATTENDANCE PROOF · JPG";


                const detail =
                    document.createElement(
                        "span"
                    );


                detail.textContent =
                    `${upload.file_name || "Uploaded proof"} · ${
                        upload.status || "PENDING"
                    } · Submitted ${formatSubmittedDateTime(upload.submitted_at)}`;


                card.append(
                    heading,
                    detail
                );


                if (
                    upload.file_data
                ) {

                    if (
                        upload.submission_type ===
                        "attendance"
                    ) {

                        const image =
                            document.createElement(
                                "img"
                            );


                        image.src =
                            upload.file_data;


                        image.alt =
                            `Attendance proof from ${
                                selectedUser?.name ||
                                "user"
                            }`;


                        image.className =
                            "activity-proof-image";


                        card.appendChild(
                            image
                        );

                    } else {

                        const pdf =
                            document.createElement(
                                "iframe"
                            );


                        pdf.src =
                            upload.file_data;


                        pdf.title =
                            `Absence excuse letter from ${
                                selectedUser?.name ||
                                "user"
                            }`;


                        pdf.className =
                            "activity-proof-pdf";


                        card.appendChild(
                            pdf
                        );

                    }

                }


                list.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        list.replaceChildren();


        const message =
            document.createElement(
                "p"
            );


        message.className =
            "activity-proof-empty";


        message.textContent =
            error.message ||
            "Could not load uploaded proofs.";


        list.appendChild(
            message
        );

    }

}


/* ================= DELETE ================= */

async function deleteSelectedUser() {

    if (!selectedUser) {
        return;
    }


    const confirmed =
        confirm(
            `Delete ${
                selectedUser.name ||
                "this user"
            }?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            "delete",
            {
                method: "POST",

                body: {
                    id:
                        selectedUser.id
                }
            }
        );


        selectedUser =
            null;


        showList();


        await loadUsers();


        toast(
            "User deleted."
        );


    } catch (error) {

        toast(
            error.message,
            true
        );

    }

}


/* ================= VIEW / MODAL ================= */

function showList() {

    $("userDetailView")
        .classList
        .add("hidden");


    $("activitiesView")
        .classList
        .add("hidden");


    $("userListView")
        .classList
        .remove("hidden");

}


function openModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

}


function closeModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );

}


function resetImportModal() {

    selectedExcelFile =
        null;


    importedCredentials =
        [];


    $("excelFile").value =
        "";


    $("selectedFile")
        .textContent =
        "No file selected.";


    $("importConfirmBtn")
        .disabled =
        true;


    $("importResult")
        .classList
        .add("hidden");


    $("importResult")
        .textContent =
        "";

}


/* ================= TOAST ================= */

function toast(
    message,
    error = false
) {

    const element =
        $("toast");


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.background =
        error
            ? "#7b4545"
            : "#42523f";


    element.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            2800
        );

}

function formatUserName(user) {

    const surname =
        String(
            user?.surname || ""
        ).trim();


    const givenName =
        String(
            user?.given_name || ""
        ).trim();


    const middleName =
        String(
            user?.middle_name || ""
        ).trim();


    if (
        surname ||
        givenName ||
        middleName
    ) {

        return [

            surname,
            givenName,
            middleName

        ]
            .filter(Boolean)
            .join(", ");

    }


    return String(
        user?.name || ""
    ).trim();

}


/* ================= ESCAPE HTML ================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
