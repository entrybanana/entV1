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
// 같은 사용자는 같은 링크를 한 번만 신고 가능
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
                    await chrome.storage.local.get([
                        "reports",
                        "myReports"
                    ]);

                const reports =
                    data.reports || {};

                const myReports =
                    data.myReports || [];


                // 이미 신고했는지 확인
                if (myReports.includes(url.origin)) {

                    alert(
                        "이 링크는 이미 신고하셨습니다."
                    );

                    return;
                }


                // 신고 횟수 증가
                const key =
                    url.origin;

                reports[key] =
                    (reports[key] || 0) + 1;


                // 이 사용자가 신고한 링크 저장
                myReports.push(key);


                await chrome.storage.local.set({
                    reports,
                    myReports
                });


                // 다시 신고하지 못하도록 버튼 비활성화
                const button =
                    document.getElementById("report");

                button.disabled = true;

                button.textContent =
                    "신고 완료";


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


            // 차단 → Entry
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


            // 한 번만 허용
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


// ========================================
// 페이지를 열었을 때 이미 신고했으면
// 버튼을 비활성화
// ========================================

async function checkAlreadyReported() {

    if (!target) {
        return;
    }

    const data =
        await chrome.storage.local.get(
            "myReports"
        );

    const myReports =
        data.myReports || [];


    try {

        const key =
            new URL(target).origin;


        if (myReports.includes(key)) {

            const button =
                document.getElementById("report");

            button.disabled = true;

            button.textContent =
                "신고 완료";
        }

    } catch {
        // 잘못된 URL이면 무시
    }
}


checkAlreadyReported();
