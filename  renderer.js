console.log("Renderer Loaded");

const startBtn = document.getElementById("start");

const logs = document.getElementById("logs");

startBtn.addEventListener("click", async () => {

    console.log("Button Clicked");

    await window.electron.startAutomation({

        minAmount: 1000,

        maxAmount: 9000

    });

});

window.electron.onLog((message) => {

    logs.innerHTML += `<div>${message}</div>`;

});