const ENTRY_HOST = "playentry.org";

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


chrome.webNavigation.onCommitted.addListener(
    async details => {

        // 메인 프레임만 검사
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
        "reports"
    ]);

    const level = data.securityLevel || "strong";
    const reports = data.reports || {};

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

    // Entry는 통과
    if (isEntryURL(parsed)) {
        return;
    }

    const reportCount =
        reports[parsed.origin] || 0;


    /*
     * 강함:
     * 1명 이상 신고 → 자동 차단
     */
    if (
        level === "strong" &&
        reportCount >= 1
    ) {

        await block(
            tabId,
            url,
            `해킹 링크로 신고됨 (${reportCount}명)`
        );

        return;
    }


    /*
     * 약함:
     * 3명 이상 신고 → 자동 차단
     */
    if (
        level === "weak" &&
        reportCount >= 3
    ) {

        await block(
            tabId,
            url,
            `3명 이상이 해킹 링크로 신고함`
        );

        return;
    }


    /*
     * Entry가 아닌 외부 사이트
     * → 사용자 확인
     */
    await askUser(
        tabId,
        url,
        "최종 링크가 Entry 사이트가 아닙니다."
    );
}


function isEntryURL(url) {

    const hostname =
        url.hostname.toLowerCase();

    return (
        hostname === ENTRY_HOST ||
        hostname.endsWith("." + ENTRY_HOST)
    );
}


async function askUser(
    tabId,
    url,
    reason
) {

    const warningURL =
        chrome.runtime.getURL(
            "warning.html"
        ) +
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


async function block(
    tabId,
    url,
    reason
) {

    await saveBlock(
        url,
        reason
    );

    const warningURL =
        chrome.runtime.getURL(
            "warning.html"
        ) +
        "?target=" +
        encodeURIComponent(url) +
        "&reason=" +
        encodeURIComponent(
            "entV1이 이 링크를 차단했습니다."
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
    reason
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
        time: Date.now()
    });

    await chrome.storage.local.set({
        blockedHistory:
            history.slice(-100)
    });
}
