/* BASIS Admin — History notification badge */
(() => {
    "use strict";

    const HISTORY_API = "api/account_api.php?action=announcements";
    const NOTIFICATION_API = "api/activity_api.php?action=notifications";

    async function getJson(url) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Notification request failed");
        const data = await response.json();
        if (data && data.success === false) throw new Error(data.message || "Request failed");
        return data;
    }

    const ANNOUNCEMENT_LIFETIME_DAYS = 14;

    function announcementIsActive(item, now = new Date()) {
        const raw =
            item?.date ||
            item?.published_at ||
            item?.publishedAt ||
            item?.created_at ||
            item?.createdAt ||
            "";

        if (!raw) return false;

        const value = String(raw).trim();
        let published;
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (match) {
            published = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3]),
                0, 0, 0, 0
            );
        } else {
            published = new Date(value);
        }

        if (Number.isNaN(published.getTime())) return false;

        const expires = new Date(published.getTime());
        expires.setDate(expires.getDate() + ANNOUNCEMENT_LIFETIME_DAYS);

        return published <= now && now < expires;
    }

    function isFeedbackOrConcern(item) {
        const text = [
            item?.type, item?.title, item?.message, item?.body,
            item?.description, item?.content, item?.category, item?.subject
        ].join(" ").toLowerCase();
        return text.includes("feedback") || text.includes("concern");
    }

    async function updateHistoryBadge() {
        const badges = document.querySelectorAll("[data-history-notification-badge]");
        if (!badges.length) return;

        try {
            const [announcementData, notificationData] = await Promise.all([
                getJson(HISTORY_API),
                getJson(NOTIFICATION_API)
            ]);

            const announcements = Array.isArray(announcementData.announcements)
                ? announcementData.announcements : [];
            const notifications = Array.isArray(notificationData.notifications)
                ? notificationData.notifications : [];

            const activeAnnouncements = announcements.filter(announcementIsActive);
            const relevantCount = activeAnnouncements.length +
                notifications.filter(isFeedbackOrConcern).length;

            badges.forEach(badge => {
                badge.hidden = relevantCount < 1;
                badge.textContent = relevantCount > 9 ? "9+" : String(relevantCount);
                badge.setAttribute(
                    "aria-label",
                    `${relevantCount} new announcement or feedback/concern notification${relevantCount === 1 ? "" : "s"}`
                );
                badge.title = "New announcement or feedback/concern notification";
            });
        } catch (error) {
            // Fail quietly so the sidebar navigation still works if the API is offline.
            badges.forEach(badge => { badge.hidden = true; });
            console.warn("History notification badge could not load:", error);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateHistoryBadge();
        window.setInterval(updateHistoryBadge, 15000);
    });
})();
