const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {

    // Start Automation
    startAutomation: (config) =>
        ipcRenderer.invoke("start-automation", config),

    // Stop Automation
    stopAutomation: () =>
        ipcRenderer.invoke("stop-automation"),

    // Listen for logs
    onLog: (callback) => {

        ipcRenderer.removeAllListeners("log");

        ipcRenderer.on("log", (_, data) => {
            callback(data);
        });

    },

    // Listen for status changes
    onStatus: (callback) => {

        ipcRenderer.removeAllListeners("status");

        ipcRenderer.on("status", (_, status) => {
            callback(status);
        });

    }

});