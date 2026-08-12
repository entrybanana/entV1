const levels =
    document.querySelectorAll(".level");

const blockedList =
    document.getElementById("blockedList");

const reportURL =
    document.getElementById("reportURL");

const reportButton =
    document.getElementById("reportButton");

const reportMessage =
    document.getElementById("reportMessage");


let currentLevel = "strong";


// ========================================
// 초기 데이터
// ========================================

chrome.storage.local.get(
    [
        "securityLevel",
        "blockedHistory"
    ],
    data => {

        currentLevel =
            data.securityLevel || "strong";

        updateLevelUI();

        displayBlockedHistory(
            data.blockedHistory || []
        );
    }
);


// ========================================
// 보안 단계 변경
// ========================================

levels.forEach(level => {

    level.addEventListener(
        "click",
        async () => {

            currentLevel =
                level.dataset.level;

            await chrome.storage.local.set({
                securityLevel:
                    currentLevel
            });

            updateLevelUI();
        }
    );
});


function updateLevelUI() {

    levels.forEach(level => {

        level.classList.toggle(
            "active",
            level.dataset.level === currentLevel
        );
    });
}


// ========================================
// 링크 신고
// ========================================

reportButton.addEventListener(
    "click",
    async () => {

        const input =
            reportURL.value.trim();


        if (!input) {

            showReportMessage(
                "신고할 링크를 입력해주세요."
            );

            return;
        }


        let url;


        try {

            url = new URL(input);

        } catch {

            showReportMessage(
                "올바른 링크를 입력해주세요."
            );

            return;
        }


        // HTTP / HTTPS만 허용
        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            showReportMessage(
                "HTTP 또는 HTTPS 링크만 신고할 수 있습니다."
            );

            return;
        }


        const key =
            url.origin;


        const data =
            await chrome.storage.local.get([
                "reports",
                "myReports"
            ]);


        const reports =
            data.reports || {};

        const myReports =
            data.myReports || [];


        // 같은 사용자가 이미 신고했는지 확인
        if (myReports.includes(key)) {

            showReportMessage(
                "이 링크는 이미 신고하셨습니다."
            );

            return;
        }


        // 신고 횟수 증가
        reports[key] =
            (reports[key] || 0) + 1;


        // 이 사용자의 신고 기록
        myReports.push(key);


        await chrome.storage.local.set({
            reports,
            myReports
        });


        reportURL.value = "";


        showReportMessage(
            `신고되었습니다. 현재 신고자: ${reports[key]}명`
        );
    }
);


function showReportMessage(message) {

    reportMessage.textContent =
        message;
}


// ========================================
// 차단 기록
// ========================================

function displayBlockedHistory(history) {

    blockedList.innerHTML = "";


    if (history.length === 0) {

        blockedList.innerHTML =
            `
            <p class="empty">
                차단된 항목이 없습니다.
            </p>
            `;

        return;
    }


    history
        .slice()
        .reverse()
        .forEach(item => {

            const element =
                document.createElement("div");


            element.className =
                "block-item";


            element.innerHTML = `

                <div class="url">
                    ${escapeHTML(item.url)}
                </div>

                <div class="reason">
                    차단 사유:
                    ${escapeHTML(item.reason)}
                </div>

                ${
                    item.reportCount !== undefined
                    ?
                    `
                    <div class="reports">
                        신고자:
                        ${item.reportCount}명
                    </div>
                    `
                    :
                    ""
                }

            `;


            blockedList.appendChild(element);
        });
}


// ========================================
// HTML 문자 처리
// ========================================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
