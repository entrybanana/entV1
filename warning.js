const params =
    new URLSearchParams(location.search);

const target =
    params.get("target");

const reason =
    params.get("reason");

document.getElementById("url").textContent =
    target || "알 수 없는 주소";

document.getElementById("message").textContent =
    reason ||
    "외부 사이트로 이동하려고 합니다.";


// 차단
document.getElementById("block")
    .addEventListener("click", async () => {

        // 이전에 허용했던 기록이 있다면 제거
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
                        url => url !== target
                    )
            });
        }

        // 차단 후 Entry로 이동
        window.location.replace(
            "https://playentry.org/"
        );
    });


// 허용하고 이동
document.getElementById("allow")
    .addEventListener("click", async () => {

        if (!target) {
            return;
        }

        const data =
            await chrome.storage.local.get(
                "allowedOnce"
            );

        const allowedOnce =
            data.allowedOnce || [];

        if (!allowedOnce.includes(target)) {

            allowedOnce.push(target);

            await chrome.storage.local.set({
                allowedOnce
            });
        }

        window.location.href = target;
    });
