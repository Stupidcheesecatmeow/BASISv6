/* =========================================================
   BASIS ADMIN — HISTORY
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       API
    ===================================================== */

    const ACCOUNT_API =
        "api/account_api.php";

    const ACTIVITY_API =
        "api/activity_api.php";


    /* =====================================================
       DATA
    ===================================================== */

    let historyData = {

        announcements: [],

        activities: [],

        notifications: []

    };


    let loading = false;

    let lastSnapshot = "";


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    function escapeHtml(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    function firstValue(...values) {

        return values.find(value =>

            value !== undefined &&

            value !== null &&

            String(value).trim() !== ""

        ) ?? "";

    }


    function setText(id, value) {

        const element = $(id);

        if (!element) return;

        element.textContent =
            value || "—";

    }


    /* =====================================================
       DATE
    ===================================================== */

    function recordDate(item) {

        return firstValue(

            item?.published_at,

            item?.publishedAt,

            item?.created_at,

            item?.createdAt,

            item?.date,

            item?.activity_date,

            item?.activityDate,

            item?.timestamp

        );

    }


    function dateValue(item) {

        const raw =
            recordDate(item);

        if (!raw) return 0;


        let date =
            new Date(raw);


        if (!Number.isNaN(date.getTime())) {

            return date.getTime();

        }


        date =
            new Date(
                String(raw).slice(0, 10)
                + "T00:00:00"
            );


        return Number.isNaN(
            date.getTime()
        )
            ? 0
            : date.getTime();

    }


    function formatDate(value) {

        if (!value) return "—";


        const raw =
            String(value);


        const date =
            /^\d{4}-\d{2}-\d{2}$/.test(raw)

                ? new Date(
                    raw + "T00:00:00"
                )

                : new Date(raw);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return raw;

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


    function formatDateTime(value) {

        if (!value) return "—";


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return formatDate(value);

        }


        return date.toLocaleString(
            "en-US",
            {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function sortNewest(items) {

        return [...items].sort(

            (a, b) =>
                dateValue(b) -
                dateValue(a)

        );

    }


    function uniqueById(
        items,
        prefix
    ) {

        const seen =
            new Set();


        return items.filter(
            (item, index) => {

                const key =
                    firstValue(

                        item?.id,

                        item?.activity_id,

                        item?.announcement_id,

                        `${prefix}-${index}-${recordDate(item)}`

                    );


                if (
                    seen.has(
                        String(key)
                    )
                ) {

                    return false;

                }


                seen.add(
                    String(key)
                );


                return true;

            }
        );

    }


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function getJson(url) {

        const response =
            await fetch(
                url,
                {
                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json()
                .catch(() => ({
                    success: false,
                    message:
                        "Invalid server response."
                }));


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Unable to load history."
            );

        }


        return data;

    }


    /* =====================================================
       ANNOUNCEMENTS
    ===================================================== */

    async function fetchAnnouncements() {

        const data =
            await getJson(
                `${ACCOUNT_API}?action=announcements`
            );


        return Array.isArray(
            data.announcements
        )
            ? data.announcements
            : [];

    }


    /* =====================================================
       ACTIVITIES
    ===================================================== */

    async function fetchActivities() {

        const data =
            await getJson(
                `${ACTIVITY_API}?action=list`
            );


        return Array.isArray(
            data.activities
        )
            ? data.activities
            : [];

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    async function fetchNotifications() {

        const data =
            await getJson(
                `${ACCOUNT_API}?action=notifications`
            );


        return Array.isArray(
            data.notifications
        )
            ? data.notifications
            : [];

    }



    /* =====================================================
       ANNOUNCEMENT LIFETIME — 14 DAYS
       Home shows announcements for 14 calendar days.
       History shows them after the 14-day window expires.
    ===================================================== */

    const ANNOUNCEMENT_LIFETIME_DAYS = 14;

    function announcementPublishedDate(item) {
        // Start the 14-day Home/History window from publication, not the entered event date.
        const raw = firstValue(
            item?.published_at,
            item?.publishedAt,
            item?.created_at,
            item?.createdAt,
            item?.date,
            item?.announcement_date,
            item?.announcementDate
        );

        if (!raw) return null;

        const value = String(raw).trim();
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        const parsed = match
            ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
            : new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        // Compare calendar days consistently across date-only values and SQL timestamps.
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }

    function announcementExpirationDate(item) {
        const published = announcementPublishedDate(item);
        if (!published) return null;

        const expires = new Date(published.getTime());
        expires.setDate(expires.getDate() + ANNOUNCEMENT_LIFETIME_DAYS);
        return expires;
    }

    function isAnnouncementExpired(item, now = new Date()) {
        const published = announcementPublishedDate(item);
        const expires = announcementExpirationDate(item);

        return Boolean(published && expires && published <= now && expires <= now);
    }

    function isAnnouncementActive(item, now = new Date()) {
        const published = announcementPublishedDate(item);
        const expires = announcementExpirationDate(item);

        return Boolean(published && expires && published <= now && now < expires);
    }

    /* =====================================================
       HISTORY RULES
    ===================================================== */

    function activityPastDueDate(item) {
        return firstValue(
            item?.due_date,
            item?.dueDate,
            item?.deadline,
            item?.end_date,
            item?.endDate,
            item?.activity_date,
            item?.activityDate,
            item?.date
        );
    }

    function isPastDueActivity(item) {
        const deadlineDate = firstValue(item?.deadline_date, item?.deadlineDate, item?.due_date, item?.dueDate);
        const date = deadlineDate || firstValue(item?.activity_date, item?.activityDate, item?.date, item?.end_date, item?.endDate);
        if (!date) return false;

        const time = deadlineDate
            ? firstValue(item?.deadline_time, item?.deadlineTime, "23:59:59")
            : firstValue(item?.end_time, item?.endTime, "23:59:59");
        const due = new Date(`${String(date).trim().slice(0, 10)}T${time}`);
        return !Number.isNaN(due.getTime()) && due <= new Date();
    }

    function buildRelevantNotifications(announcements, rawNotifications) {
        return uniqueById(sortNewest(rawNotifications || []), "notification");
    }


    /* =====================================================
       LOAD DATA
    ===================================================== */

    async function loadHistoryData() {

        if (loading) return;


        loading = true;


        try {

            const [
                announcementsResult,
                activitiesResult,
                notificationsResult

            ] = await Promise.allSettled([

                fetchAnnouncements(),

                fetchActivities(),

                fetchNotifications()

            ]);


            const announcements =

                announcementsResult.status ===
                "fulfilled"

                    ? announcementsResult.value

                    : [];


            const activities =

                activitiesResult.status ===
                "fulfilled"

                    ? activitiesResult.value

                    : [];


            const notifications =

                notificationsResult.status ===
                "fulfilled"

                    ? notificationsResult.value

                    : [];


            historyData = {

                announcements:
                    uniqueById(
                        sortNewest(
                            announcements
                        ),
                        "announcement"
                    ),


                // Activity History only contains activities whose date/deadline has passed.
                activities:
                    uniqueById(
                        sortNewest(
                            activities.filter(isPastDueActivity)
                        ),
                        "activity"
                    ),

                // Notifications include new announcements and feedback/concern records.
                notifications:
                    buildRelevantNotifications(
                        announcements.filter(isAnnouncementActive),
                        notifications
                    )

            };


            renderAdminHistory();


            lastSnapshot =
                createSnapshot();


        }

        catch (error) {

            console.error(
                "History error:",
                error
            );

            showLoadError(
                error.message
            );

        }

        finally {

            loading = false;

        }

    }


    /* =====================================================
       SNAPSHOT
    ===================================================== */

    function createSnapshot() {

        return JSON.stringify({

            announcements:
                historyData.announcements
                    .map(item => [

                        item.id,

                        recordDate(item),

                        item.title,

                        item.attachment_data

                    ]),


            activities:
                historyData.activities
                    .map(item => [

                        item.id,

                        recordDate(item),

                        item.name,

                        item.description_image

                    ]),


            notifications:
                historyData.notifications
                    .map(item => [

                        item.id,

                        recordDate(item),

                        item.title,

                        item.message,

                        item.isRead

                    ])

        });

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showLoadError(message) {

        const ids = [

            "adminAnnouncementHistoryList",

            "adminActivityHistoryList",

            "adminNotificationHistoryList"

        ];


        ids.forEach(id => {

            const container =
                $(id);

            if (!container) return;


            container.innerHTML = `

                <div class="history-empty">

                    <div class="history-empty-icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>

                    <h3>
                        Unable to load records
                    </h3>

                    <p>
                        ${escapeHtml(
                            message ||
                            "Please refresh the page."
                        )}
                    </p>

                </div>

            `;

        });

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function hideAllViews() {

        document
            .querySelectorAll(
                ".page-view"
            )
            .forEach(view => {

                view.classList.remove(
                    "active"
                );

            });

    }


    function showAdminHistoryView(
        viewId
    ) {

        hideAllViews();


        const target =
            $(viewId);


        if (!target) {

            console.warn(
                "History view not found:",
                viewId
            );

            return;

        }


        target.classList.add(
            "active"
        );


        if (
            viewId ===
            "view-history-admin"
        ) {

            renderAdminHistory();

        }


        if (
            viewId ===
            "view-history-admin-announcements"
        ) {

            renderAnnouncementHistory();

        }


        if (
            viewId ===
            "view-history-admin-activities"
        ) {

            renderActivityHistory();

        }


        if (
            viewId ===
            "view-history-admin-notifications"
        ) {

            renderNotificationHistory();

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    window.showAdminHistoryView =
        showAdminHistoryView;


    window.showHistoryView =
        showAdminHistoryView;


    window.backToAdminHistory =
        () =>
            showAdminHistoryView(
                "view-history-admin"
            );


    /* =====================================================
       COUNTERS
    ===================================================== */

    function updateCounters() {

        const values = [

            [
                "historyAnnouncementCount",
                historyData.announcements.length
            ],

            [
                "historyActivityCount",
                historyData.activities.length
            ],

            [
                "historyNotificationCount",
                historyData.notifications.length
            ]

        ];


        values.forEach(
            ([id, value]) => {

                const element =
                    $(id);

                if (!element) return;

                element.textContent =
                    value;

            }
        );

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    function renderEmpty(
        container,
        title,
        message
    ) {

        container.innerHTML = `

            <div class="history-empty">

                <div class="history-empty-icon">

                    <i class="fa-solid fa-clock-rotate-left"></i>

                </div>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        `;

    }


    /* =====================================================
       ANNOUNCEMENT HELPERS
    ===================================================== */

    function announcementTitle(item) {

        return firstValue(

            item?.title,

            item?.name,

            "Untitled Announcement"

        );

    }


    function announcementBody(item) {

        return firstValue(

            item?.message,

            item?.description,

            item?.body,

            item?.content,

            "No announcement message available."

        );

    }


    function announcementImage(item) {

        return firstValue(

            item?.attachment_data,

            item?.attachmentData,

            item?.image,

            item?.imageUrl,

            item?.photo,

            item?.photoUrl

        );

    }


    function isImageSource(
        source,
        item
    ) {

        if (!source) return false;


        const attachmentName =
            firstValue(
                item?.attachment_name,
                item?.attachmentName
            );


        if (
            attachmentName &&
            /\.(jpg|jpeg|png|gif|webp)$/i
                .test(attachmentName)
        ) {

            return true;

        }


        return /^data:image\//i
            .test(String(source));

    }


    /* =====================================================
       ANNOUNCEMENT LIST
    ===================================================== */

    function renderAnnouncementHistory() {

        const container =
            $(
                "adminAnnouncementHistoryList"
            );


        if (!container) return;


        const items =
            sortNewest(historyData.announcements);


        if (!items.length) {

            renderEmpty(

                container,

                "No announcement history yet.",

                "Published announcements will appear here."

            );

            return;

        }


        container.innerHTML =
            items.map(
                (item, index) => {

                    return `

                        <button
                            class="history-record-row"
                            type="button"
                            data-index="${index}"
                        >

                            <div class="history-record-icon">

                                <i class="fa-solid fa-bullhorn"></i>

                            </div>


                            <div class="history-record-main">

                                <strong>
                                    ${escapeHtml(
                                        announcementTitle(item)
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        announcementBody(item)
                                    )}
                                </span>

                            </div>


                            <div class="history-record-date">

                                ${escapeHtml(
                                    formatDate(
                                        recordDate(item)
                                    )
                                )}

                            </div>


                            <div class="history-record-arrow">

                                <i class="fa-solid fa-chevron-right"></i>

                            </div>

                        </button>

                    `;

                }
            ).join("");


        container
            .querySelectorAll(
                ".history-record-row"
            )
            .forEach(row => {

                row.addEventListener(
                    "click",
                    () => {

                        openAnnouncementDetail(
                            Number(
                                row.dataset.index
                            )
                        );

                    }
                );

            });

    }


    /* =====================================================
       ANNOUNCEMENT DETAIL
    ===================================================== */

    function openAnnouncementDetail(
        index
    ) {

        const item =
            sortNewest(historyData.announcements)[index];


        if (!item) return;


        setText(

            "adminAnnouncementDetailDate",

            formatDateTime(
                recordDate(item)
            )

        );


        setText(

            "adminAnnouncementDetailTitle",

            announcementTitle(item)

        );


        setText(

            "adminAnnouncementDetailDescription",

            announcementBody(item)

        );


        const image =
            $(
                "adminAnnouncementDetailImage"
            );


        const placeholder =
            $(
                "adminAnnouncementDetailImagePlaceholder"
            );


        const source =
            announcementImage(item);


        if (
            image &&
            source &&
            isImageSource(
                source,
                item
            )
        ) {

            image.src =
                source;

            image.style.display =
                "block";


            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        }

        else {

            if (image) {

                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";

            }


            if (placeholder) {

                placeholder.style.display =
                    "flex";

            }

        }


        showAdminHistoryView(
            "view-history-admin-announcement-detail"
        );

    }


    window.openAnnouncementDetail =
        openAnnouncementDetail;


    /* =====================================================
       ACTIVITY HELPERS
    ===================================================== */

    function activityDate(item) {

        return firstValue(
            item?.due_date,
            item?.dueDate,
            item?.deadline,
            item?.end_date,
            item?.endDate,
            item?.activity_date,
            item?.activityDate,
            item?.date
        );

    }


    function activityTime(item) {

        const start =
            firstValue(

                item?.startTime,

                item?.start_time

            );


        const end =
            firstValue(

                item?.endTime,

                item?.end_time

            );


        if (
            start &&
            end
        ) {

            return `${start} - ${end}`;

        }


        return start ||
            end ||
            "—";

    }


    function activityImage(item) {

        return firstValue(

            item?.description_image,

            item?.descriptionImage,

            item?.image,

            item?.imageUrl,

            item?.photo,

            item?.photoUrl

        );

    }


    /* =====================================================
       ACTIVITY LIST
    ===================================================== */

    function renderActivityHistory() {

        const container =
            $(
                "adminActivityHistoryList"
            );


        if (!container) return;


        const items =
            sortNewest(
                historyData.activities
            );


        if (!items.length) {

            renderEmpty(

                container,

                "No activity history yet.",

                "Created activities will appear here."

            );

            return;

        }


        container.innerHTML =
            items.map(
                (item, index) => {

                    const name =
                        firstValue(

                            item?.name,

                            "Untitled Activity"

                        );


                    const type =
                        firstValue(

                            item?.type,

                            "Activity"

                        );


                    return `

                        <button
                            class="history-record-row"
                            type="button"
                            data-index="${index}"
                        >

                            <div class="history-record-icon">

                                <i class="fa-solid fa-calendar-check"></i>

                            </div>


                            <div class="history-record-main">

                                <strong>
                                    ${escapeHtml(name)}
                                </strong>

                                <span>
                                    ${escapeHtml(type)}
                                </span>

                            </div>


                            <div class="history-record-date">

                                ${escapeHtml(
                                    formatDate(
                                        activityDate(item)
                                    )
                                )}

                            </div>


                            <div class="history-record-arrow">

                                <i class="fa-solid fa-chevron-right"></i>

                            </div>

                        </button>

                    `;

                }
            ).join("");


        container
            .querySelectorAll(
                ".history-record-row"
            )
            .forEach(row => {

                row.addEventListener(
                    "click",
                    () => {

                        openActivityDetail(
                            Number(
                                row.dataset.index
                            )
                        );

                    }
                );

            });

    }


    /* =====================================================
       ACTIVITY DETAIL
    ===================================================== */

    function fillActivityDetail(
        item
    ) {

        setText(

            "adminActivityDetailDate",

            formatDate(
                activityDate(item)
            )

        );


        setText(

            "adminActivityDetailTitle",

            firstValue(
                item?.name,
                "Untitled Activity"
            )

        );


        setText(

            "adminActivityDetailDescription",

            firstValue(
                item?.description,
                "No activity description available."
            )

        );


        setText(

            "adminActivityName",

            firstValue(
                item?.name,
                "—"
            )

        );


        setText(

            "adminActivityType",

            firstValue(
                item?.type,
                "—"
            )

        );


        setText(

            "adminActivityDate",

            formatDate(
                activityDate(item)
            )

        );


        setText(

            "adminActivityTime",

            activityTime(item)

        );


        setText(

            "adminActivityVenue",

            firstValue(
                item?.venue,
                "—"
            )

        );


        setText(

            "adminActivityAddress",

            firstValue(
                item?.venueAddress,

                item?.venue_address,

                "—"
            )

        );


        setText(

            "adminActivityNamePerson",

            firstValue(

                item?.namePerson,

                item?.contactPerson,

                item?.facilitator,

                item?.organizer,

                "—"

            )

        );


        setText(

            "adminActivityMunicipality",

            firstValue(
                item?.municipality,
                "—"
            )

        );


        setText(

            "adminActivityBarangay",

            firstValue(
                item?.barangay,
                "—"
            )

        );


        /* IMAGE */

        const image =
            $(
                "adminActivityDetailImage"
            );


        const placeholder =
            $(
                "adminActivityDetailImagePlaceholder"
            );


        const source =
            activityImage(item);


        if (
            image &&
            source
        ) {

            image.src =
                source;

            image.style.display =
                "block";


            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        }

        else {

            if (image) {

                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";

            }


            if (placeholder) {

                placeholder.style.display =
                    "flex";

            }

        }

    }


    function openActivityDetail(
        index
    ) {

        const item =
            sortNewest(
                historyData.activities
            )[index];


        if (!item) return;


        sessionStorage.setItem("basisAdminSelectedActivityId", String(item.id));
        window.location.href = "activity_menu-admin.html";

    }


    window.openActivityDetail =
        openActivityDetail;


    /* =====================================================
       NOTIFICATION HELPERS
    ===================================================== */

    function notificationTitle(item) {

        return firstValue(

            item?.title,

            "Activity Notification"

        );

    }


    function notificationBody(item) {

        return firstValue(

            item?.message,

            item?.body,

            item?.description,

            item?.content,

            "No notification message available."

        );

    }


    function notificationType(item) {

        const type =
            String(
                item?.type || ""
            ).toLowerCase();


        if (
            type.includes("reject")
        ) {

            return "REJECTED";

        }


        if (
            type.includes("verif") ||
            type.includes("approved")
        ) {

            return "VERIFIED";

        }


        if (
            type.includes("new_activity")
        ) {

            return "NEW ACTIVITY";

        }

        if (type.includes("new_announcement")) return "NEW ANNOUNCEMENT";
        if (type.includes("new_feedback")) return "NEW FEEDBACK / CONCERN";
        if (type.includes("feedback_response")) return "FEEDBACK / CONCERN REPLY";


        return "ACTIVITY";

    }

    function renderNotificationPreview(item, prefix) {
        const type = String(item?.type || "").toLowerCase();
        const isActivity = type.includes("new_activity") || Number(item?.activityId) > 0;
        const isAnnouncement = type.includes("new_announcement") || Number(item?.announcementId) > 0;
        const image = $(`${prefix}Image`);
        const details = $(`${prefix}ActivityDetails`);
        if (!image || !details) return;
        const source = isActivity ? item?.activityImage : item?.announcementImage;
        const imageName = item?.announcementAttachmentName || "";
        const validImage = /^data:image\//i.test(String(source || "")) || (isAnnouncement && imageName && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageName));
        if ((isActivity || isAnnouncement) && validImage) {
            image.src = source;
            image.hidden = false;
            image.onerror = () => { image.hidden = true; image.removeAttribute("src"); };
        } else {
            image.hidden = true;
            image.removeAttribute("src");
            image.onerror = null;
        }
        const rows = isActivity ? [
            ["Activity", item?.activityName], ["Type", item?.activityType], ["Date", item?.activityDate],
            ["Time", [item?.activityStartTime, item?.activityEndTime].filter(Boolean).join(" – ")],
            ["Venue", item?.activityVenueAddress || item?.activityVenue], ["Academic year", item?.activityAcademicYear], ["Semester", item?.activitySemester]
        ] : isAnnouncement ? [["Announcement date", item?.announcementDate]] : [];
        const available = rows.filter(([, value]) => String(value || "").trim());
        details.innerHTML = available.map(([label, value]) => `<div class="notification-activity-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
        details.hidden = available.length === 0;
    }


    /* =====================================================
       NOTIFICATION LIST
    ===================================================== */

    function renderNotificationHistory() {

        const container =
            $(
                "adminNotificationHistoryList"
            );


        if (!container) return;


        const items =
            sortNewest(
                historyData.notifications
            );

        const markAllButton = $("adminMarkAllReadBtn");
        if (markAllButton) markAllButton.disabled = !historyData.notifications.some(item => !Number(item.isRead));


        if (!items.length) {

            renderEmpty(

                container,

                "No notification history yet.",

                "New announcements and feedback or concern updates will appear here."

            );

            return;

        }


        container.innerHTML =
            items.map(
                (item, index) => {

                    return `

                        <button
                            class="history-record-row${Number(item.isRead) ? "" : " is-unread"}"
                            type="button"
                            data-index="${index}"
                        >

                            ${Number(item.isRead) ? "" : '<span class="notification-unread-dot" aria-label="Unread notification"></span>'}

                            <div class="history-record-icon">

                                <i class="fa-regular fa-bell"></i>

                            </div>


                            <div class="history-record-main">

                                <strong>
                                    ${escapeHtml(
                                        notificationTitle(item)
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        notificationBody(item)
                                    )}
                                </span>

                            </div>


                            <div class="history-record-date">

                                ${escapeHtml(
                                    formatDate(
                                        recordDate(item)
                                    )
                                )}

                            </div>


                            <div class="history-record-arrow">

                                <i class="fa-solid fa-chevron-right"></i>

                            </div>

                        </button>

                    `;

                }
            ).join("");


        container
            .querySelectorAll(
                ".history-record-row"
            )
            .forEach(row => {

                row.addEventListener(
                    "click",
                    () => {

                        openNotificationDetail(
                            Number(
                                row.dataset.index
                            )
                        );

                    }
                );

            });

    }


    /* =====================================================
       NOTIFICATION DETAIL
    ===================================================== */

    async function openNotificationDetail(
        index
    ) {

        const item =
            sortNewest(
                historyData.notifications
            )[index];


        if (!item) return;

        markNotificationRead(item);

        let detailItem = item;
        try {
            const response = await fetch(`${ACCOUNT_API}?action=notification-detail&id=${encodeURIComponent(item.id)}`, { credentials: "same-origin", headers: { Accept: "application/json" } });
            const result = await response.json();
            if (response.ok && result.success && result.notification) detailItem = result.notification;
        } catch (error) { console.warn("Could not load notification preview:", error); }


        setText(

            "adminNotificationDetailDate",

            formatDateTime(
                recordDate(detailItem)
            )

        );


        setText(

            "adminNotificationDetailTitle",

            detailItem.announcementTitle || detailItem.activityName || notificationTitle(detailItem)

        );


        setText(

            "adminNotificationDetailBody",

            firstValue(detailItem.announcementMessage, detailItem.activityDescription, notificationBody(detailItem))

        );


        setText(

            "adminNotificationDetailType",

            notificationType(detailItem)

        );

        renderNotificationPreview(detailItem, "adminNotificationDetail");


        showAdminHistoryView(
            "view-history-admin-notification-detail"
        );

    }


    window.openNotificationDetail =
        openNotificationDetail;

    async function markNotificationRead(item) {
        if (!item?.id || Number(item.isRead)) return;
        try {
            const response = await fetch(`${ACCOUNT_API}?action=notifications`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ id: Number(item.id) })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Could not update notification status.");
            item.isRead = 1;
            renderNotificationHistory();
            document.dispatchEvent(new CustomEvent("basis-notifications-updated"));
        } catch (error) {
            console.warn("Could not mark notification as read:", error);
        }
    }

    async function markAllNotificationsRead() {
        const button = $("adminMarkAllReadBtn");
        if (!historyData.notifications.some(item => !Number(item.isRead))) return;
        if (button) button.disabled = true;
        try {
            const response = await fetch(`${ACCOUNT_API}?action=notifications`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({}) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Could not mark notifications as read.");
            historyData.notifications.forEach(item => { item.isRead = 1; });
            renderNotificationHistory();
            document.dispatchEvent(new CustomEvent("basis-notifications-updated"));
        } catch (error) {
            if (button) button.disabled = false;
            alert(error.message || "Could not mark notifications as read.");
        }
    }


    /* =====================================================
       RENDER MAIN
    ===================================================== */

    function renderAdminHistory() {

        updateCounters();

        renderAnnouncementHistory();

        renderActivityHistory();

        renderNotificationHistory();

    }


    window.renderAdminHistory =
        renderAdminHistory;


    window.renderAnnouncementHistory =
        renderAnnouncementHistory;


    window.renderActivityHistory =
        renderActivityHistory;


    window.renderNotificationHistory =
        renderNotificationHistory;


    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch(
        inputId,
        listId,
        getItems,
        type
    ) {

        const input =
            $(inputId);


        if (!input) return;


        input.addEventListener(
            "input",
            () => {

                const query =
                    input.value
                        .trim()
                        .toLowerCase();


                const items =
                    sortNewest(
                        getItems()
                    );


                if (!query) {

                    if (
                        type ===
                        "announcement"
                    ) {

                        renderAnnouncementHistory();

                    }

                    else if (
                        type ===
                        "activity"
                    ) {

                        renderActivityHistory();

                    }

                    else {

                        renderNotificationHistory();

                    }

                    return;

                }


                const filtered =
                    items.filter(
                        item =>
                            JSON.stringify(
                                item
                            )
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    );


                const container =
                    $(listId);


                if (!container) return;


                if (!filtered.length) {

                    renderEmpty(

                        container,

                        "No matching records.",

                        "Try a different search term."

                    );

                    return;

                }


                renderSearchResults(
                    container,
                    filtered,
                    type
                );

            }
        );

    }


    function renderSearchResults(
        container,
        items,
        type
    ) {

        container.innerHTML =
            "";


        items.forEach(item => {

            let title = "";

            let subtitle = "";

            let date = "";

            let icon = "";

            let openFunction;


            if (
                type ===
                "announcement"
            ) {

                title =
                    announcementTitle(
                        item
                    );

                subtitle =
                    announcementBody(
                        item
                    );

                date =
                    formatDate(
                        recordDate(item)
                    );

                icon =
                    "fa-bullhorn";


                openFunction =
                    () => {

                        openAnnouncementFromItem(
                            item
                        );

                    };

            }


            else if (
                type ===
                "activity"
            ) {

                title =
                    firstValue(
                        item?.name,
                        "Untitled Activity"
                    );

                subtitle =
                    firstValue(
                        item?.type,
                        "Activity"
                    );

                date =
                    formatDate(
                        activityDate(item)
                    );

                icon =
                    "fa-calendar-check";


                openFunction =
                    () => {

                        openActivityFromItem(
                            item
                        );

                    };

            }


            else {

                title =
                    notificationTitle(
                        item
                    );

                subtitle =
                    notificationBody(
                        item
                    );

                date =
                    formatDate(
                        recordDate(item)
                    );

                icon =
                    "fa-bell";


                openFunction =
                    () => {

                        openNotificationFromItem(
                            item
                        );

                    };

            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "history-record-row";


            button.innerHTML = `

                <div class="history-record-icon">

                    <i class="fa-solid ${icon}"></i>

                </div>


                <div class="history-record-main">

                    <strong>
                        ${escapeHtml(title)}
                    </strong>

                    <span>
                        ${escapeHtml(subtitle)}
                    </span>

                </div>


                <div class="history-record-date">

                    ${escapeHtml(date)}

                </div>


                <div class="history-record-arrow">

                    <i class="fa-solid fa-chevron-right"></i>

                </div>

            `;


            button.addEventListener(
                "click",
                openFunction
            );


            container.appendChild(
                button
            );

        });

    }


    /* =====================================================
       OPEN FROM SEARCH
    ===================================================== */

    function openAnnouncementFromItem(
        item
    ) {

        setText(

            "adminAnnouncementDetailDate",

            formatDateTime(
                recordDate(item)
            )

        );


        setText(

            "adminAnnouncementDetailTitle",

            announcementTitle(item)

        );


        setText(

            "adminAnnouncementDetailDescription",

            announcementBody(item)

        );


        const image =
            $(
                "adminAnnouncementDetailImage"
            );


        const placeholder =
            $(
                "adminAnnouncementDetailImagePlaceholder"
            );


        const source =
            announcementImage(item);


        if (
            image &&
            source &&
            isImageSource(
                source,
                item
            )
        ) {

            image.src =
                source;

            image.style.display =
                "block";


            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        }

        else {

            if (image) {

                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";

            }


            if (placeholder) {

                placeholder.style.display =
                    "flex";

            }

        }


        showAdminHistoryView(
            "view-history-admin-announcement-detail"
        );

    }


    function openActivityFromItem(
        item
    ) {

        fillActivityDetail(
            item
        );


        showAdminHistoryView(
            "view-history-admin-activity-detail"
        );

    }


    function openNotificationFromItem(
        item
    ) {

        markNotificationRead(item);

        setText(

            "adminNotificationDetailDate",

            formatDateTime(
                recordDate(item)
            )

        );


        setText(

            "adminNotificationDetailTitle",

            notificationTitle(item)

        );


        setText(

            "adminNotificationDetailBody",

            notificationBody(item)

        );


        setText(

            "adminNotificationDetailType",

            notificationType(item)

        );


        showAdminHistoryView(
            "view-history-admin-notification-detail"
        );

    }

    /* =====================================================
   OPEN ANNOUNCEMENT SELECTED FROM ADMIN HOME
===================================================== */

function openSelectedAnnouncementFromHome() {

    const selectedId =
        sessionStorage.getItem(
            "basisSelectedAnnouncementId"
        );

    /*
     * Walang selected announcement.
     * Normal History page lang ang ipakita.
     */
    if (!selectedId) {
        return;
    }

    /*
     * Hanapin ang announcement na pinindot
     * sa Admin Home.
     */
    const selectedAnnouncement =
        historyData.announcements.find(
            item =>
                String(item.id) ===
                String(selectedId)
        );

    /*
     * Burahin agad ang temporary selection
     * para hindi paulit-ulit mag-open
     * kapag ni-refresh ang page.
     */
    sessionStorage.removeItem(
        "basisSelectedAnnouncementId"
    );

    /*
     * Kapag wala na ang announcement,
     * huwag mag-open ng detail.
     */
    if (!selectedAnnouncement) {
        return;
    }

    /*
     * Gamitin ang existing detail function.
     * Ito ang maglalagay ng:
     * - title
     * - message
     * - date
     * - image
     */
    openAnnouncementFromItem(
        selectedAnnouncement
    );

}

    /* =====================================================
       SEARCH INIT
    ===================================================== */

    function setupSearches() {

        setupSearch(

            "adminAnnouncementSearch",

            "adminAnnouncementHistoryList",

            () =>
                historyData.announcements,

            "announcement"

        );


        setupSearch(

            "adminActivitySearch",

            "adminActivityHistoryList",

            () =>
                historyData.activities,

            "activity"

        );


        setupSearch(

            "adminNotificationSearch",

            "adminNotificationHistoryList",

            () =>
                historyData.notifications,

            "notification"

        );

    }


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    async function refreshIfChanged() {

        try {

            const [
                announcements,
                activities,
                notifications

            ] = await Promise.all([

                fetchAnnouncements(),

                fetchActivities(),

                fetchNotifications()

            ]);


            const nextData = {

                announcements:
                    uniqueById(
                        sortNewest(
                            announcements
                        ),
                        "announcement"
                    ),


                activities:
                    uniqueById(
                        sortNewest(
                            activities.filter(isPastDueActivity)
                        ),
                        "activity"
                    ),

                notifications:
                    buildRelevantNotifications(
                        announcements.filter(isAnnouncementActive),
                        notifications
                    )

            };


            const nextSnapshot =
                JSON.stringify({

                    announcements:
                        nextData.announcements
                            .map(item => [

                                item.id,

                                recordDate(item),

                                item.title,

                                item.attachment_data

                            ]),


                    activities:
                        nextData.activities
                            .map(item => [

                                item.id,

                                recordDate(item),

                                item.name,

                                item.description_image

                            ]),


                    notifications:
                        nextData.notifications
                            .map(item => [

                                item.id,

                                recordDate(item),

                                item.title,

                                item.message,

                                item.isRead

                            ])

                });


            if (
                nextSnapshot !==
                lastSnapshot
            ) {

                historyData =
                    nextData;


                lastSnapshot =
                    nextSnapshot;


                renderAdminHistory();

            }

        }

        catch (error) {

            console.warn(
                "History refresh failed:",
                error.message
            );

        }

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            setupSearches();

            $("adminMarkAllReadBtn")?.addEventListener("click", markAllNotificationsRead);


            hideAllViews();


            const main =
                $(
                    "view-history-admin"
                );


            if (main) {

                main.classList.add(
                    "active"
                );

            }

            await loadHistoryData();

            /*
            * If this page was opened by clicking
            * an announcement from Admin Home,
            * automatically show that announcement's
            * detail page.
            */
            openSelectedAnnouncementFromHome();

            setInterval(
                refreshIfChanged,
                5000
            );

        }
    );

})();
