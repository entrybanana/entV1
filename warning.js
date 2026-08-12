const params =
    new URLSearchParams(location.search);

const target =
    params.get("target");

const reason =
    params.get("reason");


// URL 표시
document.getElementById("url")
    .textContent =
        target || "알 수 없는 주소";


// 경고 이유 표시
document.getElementById("message")
    .textContent =
        reason ||
        "외부 사이트로 이동하려고 합니다.";


// ========================================
// 해킹 링크 신고
// ========================================

document.getElementById("report")
    .addEventListener(
        "click",
        async () => {

            if (!target) {
                return;
            }

            try {

                const url =
                    new URL(target);

                const data =
                    await chrome.storage.local.get(
                        "reports"
                    );

                const reports =
                    data.reports || {};

                const key =
                    url.origin;

                reports[key] =
                    (reports[key] || 0) + 1;

                await chrome.storage.local.set({
                    reports
                });

                alert(
                    "신고되었습니다.\n\n" +
                    "현재 신고자: " +
                    reports[key] +
                    "명"
                );

            } catch (error) {

                console.error(
                    "신고 오류:",
                    error
                );
            }
        }
    );


// ========================================
// 차단
// ========================================

document.getElementById("block")
    .addEventListener(
        "click",
        async () => {

            if (target) {

                const data =
                    await chrome.storage.local.get(
                        "allowedOnce"
                    );

                const allowedOnce =
                    data.allowedOnce || [];

                await chrome.storage.local.set({

                    allowedOnce:
                        allowedOnce.filter(
                            url =>
                                url !== target
                        )

                });
            }

            // 차단하면 Entry로 이동
            window.location.replace(
                "https://playentry.org/"
            );
        }
    );


// ========================================
// 허용하고 이동
// ========================================

document.getElementById("allow")
    .addEventListener(
        "click",
        async () => {

            if (!target) {
                return;
            }

            const data =
                await chrome.storage.local.get(
                    "allowedOnce"
                );

            const allowedOnce =
                data.allowedOnce || [];

            // 한 번 허용
            if (!allowedOnce.includes(target)) {

                allowedOnce.push(target);

                await chrome.storage.local.set({
                    allowedOnce
                });
            }

            // 실제 사이트로 이동
            window.location.href =
                target;
        }
    );
