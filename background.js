const ALLOWED_HOSTS = [
    "playentry.org",
    "img.bloupla.net"
];

chrome.runtime.onInstalled.addListener(async () => {

    const data = await chrome.storage.local.get([
        "securityLevel",
        "blockedHistory",
        "reports",
        "allowedOnce"
    ]);

    await chrome.storage.local.set({
        securityLevel: data.securityLevel || "strong",
        blockedHistory: data.blockedHistory || [],
        reports: data.reports || {},
        allowedOnce: data.allowedOnce || []
    });
});


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


async function inspectURL(tabId, url) {

    const data = await chrome.storage.local.get([
        "securityLevel",
        "reports",
        "allowedOnce"
    ]);

    const level =
        data.securityLevel || "strong";

    const reports =
        data.reports || {};

    const allowedOnce =
        data.allowedOnce || [];


    // 보안 기능 해제
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


    // 사용자가 방금 허용한 링크
    if (allowedOnce.includes(url)) {

        const newAllowed =
            allowedOnce.filter(item => item !== url);

        await chrome.storage.local.set({
            allowedOnce: newAllowed
        });

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


    // 외부 사이트
    await askUser(
        tabId,
        url,
        "Entry 사이트가 아닌 외부 사이트입니다."
    );
}


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
        url,
        reason,
        reportCount,
        time: Date.now()
    });

    await chrome.storage.local.set({
        blockedHistory:
            history.slice(-100)
    });
}
