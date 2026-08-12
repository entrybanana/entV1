const ENTRY_HOST = "playentry.org";

const defaultData = {
    securityLevel: "strong",
    blockedHistory: [],
    reports: {}
};

chrome.runtime.onInstalled.addListener(async () => {

    const data = await chrome.storage.local.get(
        Object.keys(defaultData)
    );

    const newData = {};

    for (const key in defaultData) {
        if (data[key] === undefined) {
            newData[key] = defaultData[key];
        }
    }

    if (Object.keys(newData).length > 0) {
        await chrome.storage.local.set(newData);
    }
});


/*
 * 사용자가 사이트에 접근할 때 실행
 */
chrome.webNavigation.onCommitted.addListener(
    async details => {

        if (details.frameId !== 0) {
            return;
        }

        const url = details.url;

        if (!url.startsWith("http")) {
            return;
        }

        await inspectURL(url);
    }
);


/*
 * URL 검사
 */
async function inspectURL(url) {

    const data = await chrome.storage.local.get([
        "securityLevel",
        "reports"
    ]);

    const level = data.securityLevel || "strong";
    const reports = data.reports || {};

    const parsed = new URL(url);

    /*
     * Entry는 정상 통과
     */
    if (isEntryURL(parsed)) {
        return;
    }

    /*
     * 신고된 링크 검사
     */
    const reportCount = reports[parsed.origin] || 0;

    if (level === "off") {
        return;
    }

    if (level === "strong" && reportCount >= 1) {

        await blockURL(
            url,
            "해킹 링크로 신고됨",
            reportCount
        );

        return;
    }

    if (level === "weak" && reportCount >= 3) {

        await blockURL(
            url,
            "3명 이상이 해킹 링크로 신고함",
            reportCount
        );

        return;
    }
}


/*
 * playentry.org 및 하위 링크인지 확인
 */
function isEntryURL(url) {

    const hostname = url.hostname.toLowerCase();

    return (
        hostname === ENTRY_HOST ||
        hostname.endsWith("." + ENTRY_HOST)
    );
}


/*
 * 차단 기록 저장
 */
async function blockURL(
    url,
    reason,
    reportCount
) {

    const data = await chrome.storage.local.get(
        ["blockedHistory"]
    );

    const history = data.blockedHistory || [];

    history.push({
        url,
        reason,
        reportCount,
        time: Date.now()
    });

    /*
     * 기록이 너무 커지지 않도록
     * 최근 100개만 유지
     */
    const limitedHistory =
        history.slice(-100);

    await chrome.storage.local.set({
        blockedHistory: limitedHistory
    });

    /*
     * 현재 탭에 경고 페이지를 띄우는 방식은
     * 다음 단계에서 구현
     */
}
