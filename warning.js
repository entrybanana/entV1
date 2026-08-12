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
    .addEventListener("click", () => {

        window.history.back();
    });


// 허용하고 이동
document.getElementById("allow")
    .addEventListener("click", async () => {

        if (!target) {
            return;
        }


        // 이 URL은 사용자가 직접 허용했다는 기록
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


        // 실제 사이트로 이동
        window.location.href = target;
    });
