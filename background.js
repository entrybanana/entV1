const ENTRY_HOST = "playentry.org";

const ALLOWED_HOSTS = [
    "playentry.org",
    "img.bloupla.net"
];

const defaultData = {
    securityLevel: "strong",
    blockedHistory: [],
    reports: {}
};


// 확장 프로그램 설치
chrome.runtime.onInstalled.addListener(async () => {

    const data = await chrome.storage.local.get([
        "securityLevel",
        "blockedHistory",
        "reports"
    ]);

    await chrome.storage.local.set({
        securityLevel: data.securityLevel || "strong",
        blockedHistory: data.blockedHistory || [],
        reports: data.reports || {}
    });
});


// 웹사이트 접속 감지
chrome.webNavigation.onCommitted.addListener(
    async details => {

        if (details.frameId !== 0) {
            return;
        }

        const url = details.url;

        if (!url.startsWith("http")) {
            return;
        }

        await inspectURL(details.tabId, url);
    }
);


// URL 검사
async function inspectURL(tabId, url) {

    const data = await chrome.storage.local.get([
        "securityLevel",
        "reports"
    ]);

    const level =
        data.securityLevel || "strong";

    const reports =
        data.reports || {};


    // 해제
    if (level === "off") {
        return;
    }


    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        return;
    }


    // 허용된 사이트
    if (isAllowedURL(parsed)) {
        return;
    }


    const reportCount =
        reports[parsed.origin] || 0;


    // 강함: 1명 이상 신고
    if (
        level === "strong" &&
        reportCount >= 1
    ) {

        await blockURL(
            tabId,
            url,
            "해킹 링크로 신고됨",
            reportCount
        );

        return;
    }


    // 약함: 3명 이상 신고
    if (
        level === "weak" &&
        reportCount >= 3
    ) {

        await blockURL(
            tabId,
            url,
            "3명 이상이 해킹 링크로 신고함",
            reportCount
        );

        return;
    }


    // Entry가 아닌 사이트
    await askUser(
        tabId,
        url,
        "Entry 사이트가 아닌 외부 사이트입니다."
    );
}


// 허용 사이트 검사
function isAllowedURL(url) {

    const hostname =
        url.hostname.toLowerCase();

    return ALLOWED_HOSTS.some(host => {

        return (
            hostname === host ||
            hostname.endsWith("." + host)
        );
    });
}


// 사용자 확인 페이지
async function askUser(
    tabId,
    url,
    reason
) {

    const warningURL =
        chrome.runtime.getURL("warning.html") +
        "?target=" +
        encodeURIComponent(url) +
        "&reason=" +
        encodeURIComponent(reason);

    await chrome.tabs.update(
        tabId,
        {
            url: warningURL
        }
    );
}


// 링크 차단
async function blockURL(
    tabId,
    url,
    reason,
    reportCount
) {

    await saveBlock(
        url,
        reason,
        reportCount
    );


    const warningURL =
        chrome.runtime.getURL("warning.html") +
        "?target=" +
        encodeURIComponent(url) +
        "&reason=" +
        encodeURIComponent(
            "entV1이 위험한 링크를 차단했습니다."
        );


    await chrome.tabs.update(
        tabId,
        {
            url: warningURL
        }
    );
}


// 차단 기록 저장
async function saveBlock(
    url,
    reason,
    reportCount
) {

    const data =
        await chrome.storage.local.get(
            "blockedHistory"
        );

    const history =
        data.blockedHistory || [];


    history.push({
        url: url,
        reason: reason,
        reportCount: reportCount,
        time: Date.now()
    });


    await chrome.storage.local.set({
        blockedHistory:
            history.slice(-100)
    });
}
