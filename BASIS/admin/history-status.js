/* Admin unread notification indicator */
(() => {
    "use strict";

    const API = "api/account_api.php?action=notifications";

    async function updateHistoryBadge() {
        const badges = document.querySelectorAll("[data-history-notification-badge]");
        if (!badges.length) return;

        try {
            const response = await fetch(API, {
                credentials: "same-origin",
                cache: "no-store",
                headers: { Accept: "application/json" }
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Notifications could not be loaded.");

            const unreadCount = (Array.isArray(data.notifications) ? data.notifications : [])
                .filter(item => !Number(item.isRead)).length;
            badges.forEach(badge => {
                badge.hidden = unreadCount === 0;
                badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
                badge.setAttribute("aria-label", `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`);
                badge.title = `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`;
            });
        } catch (error) {
            console.warn("History notification badge could not load:", error);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateHistoryBadge();
        document.addEventListener("basis-notifications-updated", updateHistoryBadge);
        window.setInterval(updateHistoryBadge, 15000);
    });
})();
