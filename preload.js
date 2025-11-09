const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("storage", {
  path: ipcRenderer.sendSync("get-file-path"),
  readData: () => ipcRenderer.sendSync("read-data"),
  saveData: (data) => ipcRenderer.sendSync("save-data", data)
});