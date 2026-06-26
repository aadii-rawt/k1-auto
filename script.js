const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

const minAmountInput = document.getElementById("minAmount");
const maxAmountInput = document.getElementById("maxAmount");

const status = document.getElementById("status");
const logs = document.getElementById("logs");
const clearLogs = document.getElementById("clearLogs");

function addLog(log) {

    const div = document.createElement("div");

    div.className = "log-item";

    div.innerHTML = `
        <span class="log-time">[${log.time}]</span>
        <span class="log-message">${log.message}</span>
    `;

    logs.appendChild(div);

    logs.scrollTop = logs.scrollHeight;

}

function setStatus(running) {

    if (running) {

        status.innerHTML = "🟢 Running";
        status.classList.remove("stopped");
        status.classList.add("running");

        startBtn.disabled = true;
        stopBtn.disabled = false;

    } else {

        status.innerHTML = "🔴 Stopped";
        status.classList.remove("running");
        status.classList.add("stopped");

        startBtn.disabled = false;
        stopBtn.disabled = true;

    }

}

startBtn.addEventListener("click", async () => {


    const mpin = document.getElementById("mpin").value.trim();

    if (mpin.length !== 4) {

        alert("Please enter a valid 4-digit MPIN.");

        return;
    }

    const minAmount = Number(minAmountInput.value);
    const maxAmount = Number(maxAmountInput.value);

    if (minAmount <= 0 || maxAmount <= 0) {

        alert("Please enter valid amounts.");

        return;

    }

    if (minAmount > maxAmount) {

        alert("Minimum amount cannot be greater than Maximum amount.");

        return;

    }

    logs.innerHTML += `
        <div class="log-item">
            -----------------------------
        </div>
    `;

    await window.electron.startAutomation({

        minAmount,
        maxAmount,
        mpin

    });

});

stopBtn.addEventListener("click", async () => {

    await window.electron.stopAutomation();

});

clearLogs.addEventListener("click", () => {

    logs.innerHTML = "";

});

window.electron.onLog((log) => {

    addLog(log);

});

window.electron.onStatus((state) => {

    if (state === "running") {

        setStatus(true);

    } else {

        setStatus(false);

    }

});

// Initial State
setStatus(false);



// instruction modal steps
const instructionBtn =
document.getElementById("instructionBtn");

const instructionModal =
document.getElementById("instructionModal");

const closeInstruction =
document.getElementById("closeInstruction");

instructionBtn.addEventListener("click", () => {

    instructionModal.classList.add("show");

});

closeInstruction.addEventListener("click", () => {

    instructionModal.classList.remove("show");

});

instructionModal.addEventListener("click", (e) => {

    if (e.target === instructionModal) {

        instructionModal.classList.remove("show");

    }

});