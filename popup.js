const levels = document.querySelectorAll(".level");
const blockedList = document.getElementById("blockedList");

let currentLevel = "strong";

chrome.storage.local.get(
    ["securityLevel", "blockedHistory"],
    (data) => {
        currentLevel = data.securityLevel || "strong";

        updateLevelUI();

        displayBlockedHistory(
            data.blockedHistory || []
        );
    }
);

levels.forEach(level => {
    level.addEventListener("click", async () => {

        currentLevel = level.dataset.level;

        await chrome.storage.local.set({
            securityLevel: currentLevel
        });

        updateLevelUI();
    });
});

function updateLevelUI() {
    levels.forEach(level => {
        level.classList.toggle(
            "active",
            level.dataset.level === currentLevel
        );
    });
}

function displayBlockedHistory(history) {

    blockedList.innerHTML = "";

    if (history.length === 0) {
        blockedList.innerHTML =
            '<p class="empty">차단된 항목이 없습니다.</p>';
        return;
    }

    history.slice().reverse().forEach(item => {

        const element = document.createElement("div");

        element.className = "block-item";

        element.innerHTML = `
            <div class="url">${escapeHTML(item.url)}</div>
            <div class="reason">
                차단 사유: ${escapeHTML(item.reason)}
            </div>
            ${
                item.reportCount !== undefined
                ? `<div class="reason">
                    신고자: ${item.reportCount}명
                   </div>`
                : ""
            }
        `;

        blockedList.appendChild(element);
    });
}

function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
