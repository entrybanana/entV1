const params = new URLSearchParams(location.search);

const target = params.get("target");
const reason = params.get("reason");

document.getElementById("url").textContent =
    target || "알 수 없는 주소";

document.getElementById("message").textContent =
    reason || "Entry 사이트가 아닌 외부 사이트로 이동하려고 합니다.";

document.getElementById("block").addEventListener("click", () => {
    window.close();
});

document.getElementById("allow").addEventListener("click", () => {

    if (!target) {
        return;
    }

    location.href = target;
});
