/* =========================================================
   BASIS ADMIN HISTORY
   SAME LOGIC AS SCHOLAR HISTORY

   Admin History is NOT filtered by barangay.

   Data sources:
   - basisAdminHistory
   - adminHistory
   - basisRepresentativeHistory
========================================================= */


/* =========================================================
   GET HISTORY DATA
========================================================= */

function getAdminHistoryData() {

    const keys = [

        "basisAdminHistory",

        "adminHistory",

        "basisRepresentativeHistory"

    ];


    for (const key of keys) {

        const saved =
            localStorage.getItem(key);


        if (!saved) {

            continue;

        }


        try {

            const data =
                JSON.parse(saved);


            if (Array.isArray(data)) {

                return data;

            }


            if (
                data &&
                typeof data === "object"
            ) {

                return data;

            }


        } catch (error) {

            console.error(
                "Unable to read history:",
                error
            );

        }

    }


    return [];

}


/* =========================================================
   NORMALIZE HISTORY DATA
========================================================= */

function normalizeHistoryData() {

    const raw =
        getAdminHistoryData();


    /* -----------------------------------------
       IF DATA IS AN ARRAY
    ----------------------------------------- */

    if (Array.isArray(raw)) {

        return {

            announcements:
                raw.filter(
                    item =>
                        item.type === "announcement"
                ),

            activities:
                raw.filter(
                    item =>
                        item.type === "activity"
                ),

            notifications:
                raw.filter(
                    item =>
                        item.type === "notification"
                )

        };

    }


    /* -----------------------------------------
       IF DATA IS AN OBJECT
    ----------------------------------------- */

    return {

        announcements:

            Array.isArray(
                raw.announcements
            )

                ? raw.announcements

                : [],


        activities:

            Array.isArray(
                raw.activities
            )

                ? raw.activities

                : [],


        notifications:

            Array.isArray(
                raw.notifications
            )

                ? raw.notifications

                : []

    };

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {

        return "xx/xx/xxxx";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   SHOW HISTORY VIEW
========================================================= */

function showAdminHistoryView(viewId) {

    document
        .querySelectorAll(".page-view")
        .forEach(
            function (view) {

                view.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.getElementById(
            viewId
        );


    if (!target) {

        return;

    }


    target.classList.add(
        "active"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   EMPTY HISTORY
========================================================= */

function renderEmptyHistory(
    container,
    title,
    description
) {

    container.innerHTML = `

        <div class="admin-history-empty">

            <i class="fa-solid fa-clock-rotate-left"></i>

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(description)}
            </p>

        </div>

    `;

}


/* =========================================================
   ANNOUNCEMENT HISTORY
========================================================= */

function renderAnnouncementHistory(
    items
) {

    const container =
        document.getElementById(
            "adminAnnouncementHistoryList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (!items.length) {

        renderEmptyHistory(

            container,

            "No announcement history yet.",

            "History will appear here when there is data."

        );

        return;

    }


    items.forEach(

        function (item) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-item-row";


            row.innerHTML = `

                <h4>
                    ${escapeHtml(
                        item.title ||
                        "ANNOUNCEMENT"
                    )}
                </h4>


                <div class="history-item-meta">

                    <span>
                        ${escapeHtml(
                            formatDate(
                                item.date ||
                                item.createdAt
                            )
                        )}
                    </span>

                </div>

            `;


            row.addEventListener(
                "click",
                function () {

                    openAnnouncementDetail(
                        item
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   ACTIVITY HISTORY
========================================================= */

function renderActivityHistory(
    items
) {

    const container =
        document.getElementById(
            "adminActivityHistoryList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (!items.length) {

        renderEmptyHistory(

            container,

            "No activity history yet.",

            "History will appear here when there is data."

        );

        return;

    }


    items.forEach(

        function (item) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-item-row";


            row.innerHTML = `

                <h4>
                    ${escapeHtml(
                        item.title ||
                        item.name ||
                        "ACTIVITY"
                    )}
                </h4>


                <div class="history-item-meta">

                    <span>
                        ${escapeHtml(
                            formatDate(
                                item.date ||
                                item.activityDate
                            )
                        )}
                    </span>


                    <span>
                        ${escapeHtml(
                            item.type ||
                            "ACTIVITY"
                        )}
                    </span>

                </div>

            `;


            row.addEventListener(
                "click",
                function () {

                    openActivityDetail(
                        item
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   NOTIFICATION HISTORY
========================================================= */

function renderNotificationHistory(
    items
) {

    const container =
        document.getElementById(
            "adminNotificationHistoryList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (!items.length) {

        renderEmptyHistory(

            container,

            "No notification history yet.",

            "History will appear here when there is data."

        );

        return;

    }


    items.forEach(

        function (item) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-item-row";


            row.innerHTML = `

                <h4>
                    ${escapeHtml(
                        item.title ||
                        "NOTIFICATION"
                    )}
                </h4>


                <div class="history-item-meta">

                    <span>
                        ${escapeHtml(
                            formatDate(
                                item.date ||
                                item.createdAt
                            )
                        )}
                    </span>

                </div>

            `;


            row.addEventListener(
                "click",
                function () {

                    openNotificationDetail(
                        item
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   ANNOUNCEMENT DETAIL
========================================================= */

function openAnnouncementDetail(
    item
) {

    setText(

        "adminAnnouncementDetailTitle",

        item.title ||
        "ANNOUNCEMENT TITLE"

    );


    setText(

        "adminAnnouncementDetailDate",

        formatDate(
            item.date ||
            item.createdAt
        )

    );


    setText(

        "adminAnnouncementDetailDescription",

        item.description ||

        item.body ||

        item.content ||

        "No announcement description available."

    );


    const image =
        document.getElementById(
            "adminAnnouncementDetailImage"
        );


    if (image) {

        image.src =

            item.image ||

            item.imageUrl ||

            "../images/image-icon.png";

    }


    showAdminHistoryView(
        "view-history-admin-announcement-detail"
    );

}


/* =========================================================
   ACTIVITY DETAIL
========================================================= */

function openActivityDetail(
    item
) {

    setText(

        "adminActivityDetailTitle",

        item.title ||

        item.name ||

        "ACTIVITY TITLE"

    );


    setText(

        "adminActivityDetailDate",

        formatDate(
            item.date ||
            item.activityDate
        )

    );


    setText(

        "adminActivityDetailDescription",

        item.description ||

        item.body ||

        item.content ||

        "No activity description available."

    );


    setText(

        "adminActivityDetailSemester",

        `${

            item.academicYear ||

            "2026 – 2027"

        } ${

            (

                item.semester ||

                "FIRST SEMESTER"

            ).toUpperCase()

        }`

    );


    setText(

        "adminActivityName",

        item.title ||

        item.name ||

        "ACTIVITY TITLE"

    );


    setText(

        "adminActivityType",

        item.type ||

        "—"

    );


    setText(

        "adminActivityDate",

        formatDate(
            item.date ||
            item.activityDate
        )

    );


    setText(

        "adminActivityTime",

        item.time ||

        "—"

    );


    setText(

        "adminActivityVenue",

        item.venue ||

        "—"

    );


    setText(

        "adminActivityAddress",

        item.venueAddress ||

        item.address ||

        "—"

    );


    setText(

        "adminActivityNamePerson",

        item.name ||

        item.participant ||

        "—"

    );


    setText(

        "adminActivityMunicipality",

        item.municipality ||

        "BAGAC"

    );


    setText(

        "adminActivityBarangay",

        item.barangay ||

        "—"

    );


    showAdminHistoryView(
        "view-history-admin-activity-detail"
    );

}


/* =========================================================
   NOTIFICATION DETAIL
========================================================= */

function openNotificationDetail(
    item
) {

    setText(

        "adminNotificationDetailTitle",

        item.title ||

        "NOTIFICATION TITLE"

    );


    setText(

        "adminNotificationDetailDate",

        formatDate(
            item.date ||
            item.createdAt
        )

    );


    setText(

        "adminNotificationDetailBody",

        item.body ||

        item.description ||

        item.content ||

        "No notification details available."

    );


    showAdminHistoryView(
        "view-history-admin-notification-detail"
    );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value || "—";

    }

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch(
    inputId,
    containerId
) {

    const input =
        document.getElementById(
            inputId
        );


    const container =
        document.getElementById(
            containerId
        );


    if (
        !input ||
        !container
    ) {

        return;

    }


    input.addEventListener(
        "input",
        function () {

            const query =
                input.value
                    .toLowerCase()
                    .trim();


            container
                .querySelectorAll(
                    ".history-item-row"
                )
                .forEach(

                    function (row) {

                        row.style.display =

                            row.textContent
                                .toLowerCase()
                                .includes(query)

                                ? ""

                                : "none";

                    }

                );

        }
    );

}


/* =========================================================
   RENDER ADMIN HISTORY
   SAME LOGIC AS SCHOLAR
========================================================= */

function renderAdminHistory() {

    const data =
        normalizeHistoryData();


    /*
       IMPORTANT:

       NO BARANGAY FILTER HERE.

       Admin sees the same history
       logic as the Scholar side.
    */


    renderAnnouncementHistory(

        data.announcements

    );


    renderActivityHistory(

        data.activities

    );


    renderNotificationHistory(

        data.notifications

    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

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


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    function () {

        renderAdminHistory();


        setupSearch(

            "adminAnnouncementSearch",

            "adminAnnouncementHistoryList"

        );


        setupSearch(

            "adminActivitySearch",

            "adminActivityHistoryList"

        );


        setupSearch(

            "adminNotificationSearch",

            "adminNotificationHistoryList"

        );

    }

);


/* =========================================================
   PAGE SHOW
========================================================= */

window.addEventListener(

    "pageshow",

    function () {

        renderAdminHistory();

    }

);


/* =========================================================
   STORAGE UPDATE
========================================================= */

window.addEventListener(

    "storage",

    function (event) {

        if (

            event.key ===
                "basisAdminHistory" ||

            event.key ===
                "adminHistory" ||

            event.key ===
                "basisRepresentativeHistory"

        ) {

            renderAdminHistory();

        }

    }

);