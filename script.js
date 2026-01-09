/* LOADER */
const loader = document.getElementById("loader");
const progress = document.getElementById("loaderProgress");
const app = document.getElementById("app");

let value = 0;
const loading = setInterval(() => {
    value += 10;
    progress.style.width = value + "%";

    if (value >= 100) {
        clearInterval(loading);
        setTimeout(() => {
            loader.classList.add("hide");
            app.classList.remove("hidden");
        }, 400);
    }
}, 120);

/* TABS */
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    });
});

/* STATUS DATA */
const statusData = [
    { name: "Modelle", progress: 0 },
    { name: "Gleislegung", progress: 20 },
    { name: "Haltestellen", progress: 0 }
];

const statusList = document.getElementById("statusList");

statusData.forEach(item => {
    const el = document.createElement("div");
    el.className = "status-item";
    el.innerHTML = `
        <strong>${item.name}</strong>
        <div class="progress">
            <div class="progress-bar" style="width:${item.progress}%"></div>
        </div>
    `;
    statusList.appendChild(el);
});


