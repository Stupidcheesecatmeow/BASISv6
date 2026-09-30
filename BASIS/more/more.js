/* =========================================================
   BASIS - MORE MODULE
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


    const feedbackForm =
        document.getElementById("feedbackForm");


    const feedbackSearch =
        document.getElementById("feedbackHistorySearch");


    const feedbackHistoryList =
        document.getElementById("feedbackHistoryList");


    const filterButton =
        document.getElementById("feedbackHistoryFilter");


    /* =====================================================
       SHOW VIEW
    ====================================================== */

    function showView(viewId) {

        if (!moreMenuView) {
            return;
        }


        moreMenuView.style.display = "none";


        moreViews.forEach(function (view) {

            view.style.display = "none";

        });


        const target =
            document.getElementById(viewId);


        if (!target) {
            return;
        }


        target.style.display = "block";


        if (viewId === "feedbackView") {

            loadAccountInformation();

        }


        if (viewId === "feedbackHistoryView") {

            renderFeedbackHistory();

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
       GET CURRENT USER
    ====================================================== */

    function getCurrentUser() {

        let user = null;


        /*
         * Try common BASIS/localStorage names.
         */

        const possibleKeys = [

            "currentUser",
            "user",
            "profile",
            "userProfile",
            "scholarProfile",
            "account",
            "loggedInUser"

        ];


        for (const key of possibleKeys) {

            try {

                const stored =
                    localStorage.getItem(key);


                if (!stored) {
                    continue;
                }


                const parsed =
                    JSON.parse(stored);


                if (
                    parsed &&
                    typeof parsed === "object"
                ) {

                    user = parsed;

                    break;

                }

            } catch (error) {

                /*
                 * Ignore invalid JSON.
                 */

            }

        }


        /*
         * Optional global BASIS user object.
         */

        if (
            !user &&
            window.BASIS_USER &&
            typeof window.BASIS_USER === "object"
        ) {

            user = window.BASIS_USER;

        }


        return user || {};

    }


    /* =====================================================
       FIND USER VALUE
    ====================================================== */

    function getUserValue(user, keys) {

        for (const key of keys) {

            if (
                user[key] !== undefined &&
                user[key] !== null &&
                String(user[key]).trim() !== ""
            ) {

                return String(user[key]);

            }

        }


        return "Not available";

    }


    /* =====================================================
       LOAD ACCOUNT INFORMATION
    ====================================================== */

    function loadAccountInformation() {

        const user =
            getCurrentUser();


        const name =
            getUserValue(user, [

                "fullname",
                "fullName",
                "name",
                "scholar_name",
                "scholarName"

            ]);


        const email =
            getUserValue(user, [

                "email",
                "email_address",
                "emailAddress"

            ]);


        const contact =
            getUserValue(user, [

                "contact",
                "contact_no",
                "contactNo",
                "phone",
                "phone_number",
                "phoneNumber"

            ]);


        const municipality =
            getUserValue(user, [

                "municipality",
                "city"

            ]);


        const barangay =
            getUserValue(user, [

                "barangay"

            ]);


        setText(
            "feedbackName",
            name
        );


        setText(
            "feedbackEmail",
            email
        );


        setText(
            "feedbackContact",
            contact
        );


        setText(
            "feedbackMunicipality",
            municipality
        );


        setText(
            "feedbackBarangay",
            barangay
        );

    }


    /* =====================================================
       SAFE TEXT
    ====================================================== */

    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value || "Not available";

        }

    }


    /* =====================================================
       FEEDBACK STORAGE
    ====================================================== */

    function getFeedbackHistory() {

        try {

            const saved =
                localStorage.getItem(
                    "basisFeedbackHistory"
                );


            if (!saved) {
                return [];
            }


            const parsed =
                JSON.parse(saved);


            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            return [];

        }

    }


    /* =====================================================
       SAVE FEEDBACK HISTORY
    ====================================================== */

    function saveFeedbackHistory(records) {

        localStorage.setItem(
            "basisFeedbackHistory",
            JSON.stringify(records)
        );

    }


    /* =====================================================
       SUBMIT FEEDBACK
    ====================================================== */

    if (feedbackForm) {

        feedbackForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const user =
                    getCurrentUser();


                const name =
                    getUserValue(user, [
                        "fullname",
                        "fullName",
                        "name",
                        "scholar_name",
                        "scholarName"
                    ]);


                const email =
                    getUserValue(user, [
                        "email",
                        "email_address",
                        "emailAddress"
                    ]);


                const contact =
                    getUserValue(user, [
                        "contact",
                        "contact_no",
                        "contactNo",
                        "phone",
                        "phone_number",
                        "phoneNumber"
                    ]);


                const municipality =
                    getUserValue(user, [
                        "municipality",
                        "city"
                    ]);


                const barangay =
                    getUserValue(user, [
                        "barangay"
                    ]);


                const type =
                    document.getElementById(
                        "messageType"
                    ).value;


                const title =
                    document.getElementById(
                        "messageTitle"
                    ).value.trim();


                const message =
                    document.getElementById(
                        "messageBody"
                    ).value.trim();


                if (!title || !message) {

                    showFeedbackStatus(
                        "Please complete the message title and message."
                    );

                    return;

                }


                const records =
                    getFeedbackHistory();


                const newRecord = {

                    id:
                        Date.now(),

                    name:
                        name,

                    email:
                        email,

                    contact:
                        contact,

                    municipality:
                        municipality,

                    barangay:
                        barangay,

                    type:
                        type,

                    title:
                        title,

                    message:
                        message,

                    date:
                        new Date().toLocaleDateString(
                            "en-PH",
                            {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit"
                            }
                        ),

                    timestamp:
                        Date.now()

                };


                records.unshift(newRecord);


                saveFeedbackHistory(records);


                feedbackForm.reset();


                /*
                 * Reset dropdown to Feedback.
                 */

                document.getElementById(
                    "messageType"
                ).value = "Feedback";


                showFeedbackStatus(
                    "Your " +
                    type.toLowerCase() +
                    " has been submitted successfully."
                );


                /*
                 * Refresh history.
                 */

                renderFeedbackHistory();

            }
        );

    }


    /* =====================================================
       STATUS MESSAGE
    ====================================================== */

    function showFeedbackStatus(message) {

        const status =
            document.getElementById(
                "feedbackStatus"
            );


        if (!status) {
            return;
        }


        status.textContent =
            message;


        setTimeout(function () {

            status.textContent = "";

        }, 4000);

    }


    /* =====================================================
       RENDER HISTORY
    ====================================================== */

    function renderFeedbackHistory(
        searchTerm = "",
        filterType = "All"
    ) {

        if (!feedbackHistoryList) {
            return;
        }


        const records =
            getFeedbackHistory();


        let filtered =
            records.filter(function (record) {

                const search =
                    searchTerm
                        .toLowerCase()
                        .trim();


                const matchesSearch =
                    !search ||
                    String(record.title || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(record.message || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(record.type || "")
                        .toLowerCase()
                        .includes(search);


                const matchesType =
                    filterType === "All" ||
                    record.type === filterType;


                return (
                    matchesSearch &&
                    matchesType
                );

            });


        /*
         * EMPTY STATE
         */

        if (filtered.length === 0) {

            feedbackHistoryList.innerHTML = `

                <div class="feedback-history-empty">

                    <i class="fas fa-history"></i>

                    <h3>
                        ${
                            records.length === 0
                                ? "No feedback or concern history yet."
                                : "No matching records found."
                        }
                    </h3>

                    <p>
                        ${
                            records.length === 0
                                ? "Your submitted feedback and concerns will appear here."
                                : "Try another search or filter."
                        }
                    </p>

                </div>

            `;

            return;

        }


        /*
         * RECORDS
         */

        feedbackHistoryList.innerHTML =
            filtered.map(function (record) {

                return `

                    <div
                        class="feedback-history-item"
                        data-record-id="${record.id}"
                    >

                        <div
                            class="feedback-history-info"
                        >

                            <h4>
                                ${escapeHTML(
                                    record.title
                                )}
                            </h4>

                            <span>
                                ${escapeHTML(
                                    record.date
                                )}
                            </span>

                        </div>


                        <div
                            class="feedback-history-type"
                        >
                            ${escapeHTML(
                                record.type
                            )}
                        </div>

                    </div>

                `;

            }).join("");


        /*
         * Open record detail.
         */

        const items =
            feedbackHistoryList.querySelectorAll(
                ".feedback-history-item"
            );


        items.forEach(function (item) {

            item.addEventListener(
                "click",
                function () {

                    const id =
                        Number(
                            item.dataset.recordId
                        );


                    const record =
                        records.find(
                            function (entry) {
                                return (
                                    Number(entry.id) === id
                                );
                            }
                        );


                    if (record) {

                        showHistoryRecord(
                            record
                        );

                    }

                }
            );

        });

    }


    /* =====================================================
       HISTORY DETAIL
    ====================================================== */

    function showHistoryRecord(record) {

        const existing =
            document.getElementById(
                "feedbackHistoryModal"
            );


        if (existing) {
            existing.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "feedbackHistoryModal";


        modal.className =
            "feedback-history-modal";


        modal.innerHTML = `

            <div class="feedback-history-modal-card">

                <button
                    type="button"
                    class="feedback-history-modal-close"
                >
                    ×
                </button>


                <h2>
                    ${escapeHTML(record.title)}
                </h2>


                <div class="modal-meta">

                    <strong>TYPE:</strong>
                    ${escapeHTML(record.type)}

                    &nbsp;&nbsp;

                    <strong>DATE:</strong>
                    ${escapeHTML(record.date)}

                </div>


                <div class="modal-account">

                    <p>
                        <strong>NAME:</strong>
                        ${escapeHTML(record.name)}
                    </p>

                    <p>
                        <strong>EMAIL:</strong>
                        ${escapeHTML(record.email)}
                    </p>

                    <p>
                        <strong>CONTACT NO.:</strong>
                        ${escapeHTML(record.contact)}
                    </p>

                </div>


                <div class="modal-message">

                    <strong>MESSAGE</strong>

                    <p>
                        ${escapeHTML(record.message)}
                    </p>

                </div>

            </div>

        `;


        document.body.appendChild(modal);


        modal.querySelector(
            ".feedback-history-modal-close"
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
       SEARCH
    ====================================================== */

    if (feedbackSearch) {

        feedbackSearch.addEventListener(
            "input",
            function () {

                renderFeedbackHistory(
                    feedbackSearch.value
                );

            }
        );

    }


    /* =====================================================
       FILTER
    ====================================================== */

    if (filterButton) {

        filterButton.addEventListener(
            "click",
            function () {

                const current =
                    filterButton.dataset.filter ||
                    "All";


                let next;


                if (current === "All") {

                    next = "Feedback";

                } else if (current === "Feedback") {

                    next = "Concern";

                } else {

                    next = "All";

                }


                filterButton.dataset.filter =
                    next;


                /*
                 * Keep button text simple.
                 */

                filterButton.textContent =
                    next === "All"
                        ? "FILTER"
                        : next.toUpperCase();


                renderFeedbackHistory(
                    feedbackSearch
                        ? feedbackSearch.value
                        : "",
                    next
                );

            }
        );

    }


    /* =====================================================
       ESCAPE HTML
    ====================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       INITIAL STATE
    ====================================================== */

    showMoreMenu();

});
