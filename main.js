const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let automationRunning = false;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile("index.html");

    // Remove this in production
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function sendLog(message) {

    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    if (mainWindow.webContents.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send("log", {
        time: new Date().toLocaleTimeString(),
        message
    });

}

function sendStatus(status) {

    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    if (mainWindow.webContents.isDestroyed()) {
        return;
    }

    mainWindow.webContents.send("status", status);

}

ipcMain.handle("start-automation", async (event, config) => {

    if (automationRunning) {
        sendLog("⚠ Automation is already running.");
        return;
    }

    automationRunning = true;

    sendStatus("running");

    sendLog("======================================");
    sendLog("Automation Started");
    sendLog(`Min Amount : ${config.minAmount}`);
    sendLog(`Max Amount : ${config.maxAmount}`);
    sendLog("======================================");

   try {

    const automation = require("./automation");

    await automation(
        mainWindow,
        config,
        sendLog,
        () => automationRunning
    );

    sendLog("Automation Finished");

} catch (err) {

    console.error(err);

    sendLog("ERROR : " + err.message);

} finally {

    automationRunning = false;

    sendStatus("stopped");

}

});

ipcMain.handle("stop-automation", () => {

    if (!automationRunning) return;

    automationRunning = false;

    sendLog("Stopping Automation...");

});