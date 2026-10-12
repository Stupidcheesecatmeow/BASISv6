/* =========================================================
   BASIS REPRESENTATIVE HISTORY
   SAME LOGIC AS SCHOLAR HISTORY

   Representative History is NOT filtered by barangay.

   Data sources:
   - basisRepresentativeHistory
   - representativeHistory
   - basisAdminHistory
   ========================================================= */


/* =========================================================
   GET HISTORY DATA
   ========================================================= */

function getRepHistoryData() {

    const keys = [

        "basisRepresentativeHistory",

        "representativeHistory",

        "basisAdminHistory"

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
        getRepHistoryData();


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

function showRepHistoryView(viewId) {

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

        <div class="representative-history-empty">

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
            "repAnnouncementHistoryList"
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
            "repActivityHistoryList"
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
            "repNotificationHistoryList"
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

        "repAnnouncementDetailTitle",

        item.title ||
        "ANNOUNCEMENT TITLE"

    );


    setText(

        "repAnnouncementDetailDate",

        formatDate(
            item.date ||
            item.createdAt
        )

    );


    setText(

        "repAnnouncementDetailDescription",

        item.description ||

        item.body ||

        item.content ||

        "No announcement description available."

    );


    const image =
        document.getElementById(
            "repAnnouncementDetailImage"
        );


    if (image) {

        image.src =

            item.image ||

            item.imageUrl ||

            "../images/image-icon.png";

    }


    showRepHistoryView(
        "view-history-rep-announcement-detail"
    );

}


/* =========================================================
   ACTIVITY DETAIL
   ========================================================= */

function openActivityDetail(
    item
) {

    setText(

        "repActivityDetailTitle",

        item.title ||

        item.name ||

        "ACTIVITY TITLE"

    );


    setText(

        "repActivityDetailDate",

        formatDate(
            item.date ||
            item.activityDate
        )

    );


    setText(

        "repActivityDetailDescription",

        item.description ||

        item.body ||

        item.content ||

        "No activity description available."

    );


    setText(

        "repActivityDetailSemester",

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

        "repActivityName",

        item.title ||

        item.name ||

        "ACTIVITY TITLE"

    );


    setText(

        "repActivityType",

        item.type ||

        "—"

    );


    setText(

        "repActivityDate",

        formatDate(
            item.date ||
            item.activityDate
        )

    );


    setText(

        "repActivityTime",

        item.time ||

        "—"

    );


    setText(

        "repActivityVenue",

        item.venue ||

        "—"

    );


    setText(

        "repActivityAddress",

        item.venueAddress ||

        item.address ||

        "—"

    );


    setText(

        "repActivityNamePerson",

        item.name ||

        item.participant ||

        "—"

    );


    setText(

        "repActivityMunicipality",

        item.municipality ||

        "BAGAC"

    );


    setText(

        "repActivityBarangay",

        item.barangay ||

        "—"

    );


    showRepHistoryView(
        "view-history-rep-activity-detail"
    );

}


/* =========================================================
   NOTIFICATION DETAIL
   ========================================================= */

function openNotificationDetail(
    item
) {

    setText(

        "repNotificationDetailTitle",

        item.title ||

        "NOTIFICATION TITLE"

    );


    setText(

        "repNotificationDetailDate",

        formatDate(
            item.date ||
            item.createdAt
        )

    );


    setText(

        "repNotificationDetailBody",

        item.body ||

        item.description ||

        item.content ||

        "No notification details available."

    );


    showRepHistoryView(
        "view-history-rep-notification-detail"
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
   RENDER REPRESENTATIVE HISTORY
   SAME LOGIC AS SCHOLAR
   ========================================================= */

function renderRepresentativeHistory() {

    const data =
        normalizeHistoryData();


    /*
       IMPORTANT:

       NO BARANGAY FILTER HERE.

       Representative sees the same history
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

        renderRepresentativeHistory();


        setupSearch(

            "repAnnouncementSearch",

            "repAnnouncementHistoryList"

        );


        setupSearch(

            "repActivitySearch",

            "repActivityHistoryList"

        );


        setupSearch(

            "repNotificationSearch",

            "repNotificationHistoryList"

        );

    }

);


/* =========================================================
   PAGE SHOW
   ========================================================= */

window.addEventListener(

    "pageshow",

    function () {

        renderRepresentativeHistory();

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
                "basisRepresentativeHistory" ||

            event.key ===
                "representativeHistory" ||

            event.key ===
                "basisAdminHistory"

        ) {

            renderRepresentativeHistory();

        }

    }

);