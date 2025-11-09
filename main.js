const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let filePath;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  filePath = path.join(__dirname, "itineraries.json"); // save at itineraries.json
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
  createWindow();
});

ipcMain.on("get-file-path", (event) => {
  event.returnValue = filePath;
});

ipcMain.on("read-data", (event) => {
  try {
    const raw = fs.readFileSync(filePath);
    event.returnValue = JSON.parse(raw);
  } catch {
    event.returnValue = [];
  }
});

ipcMain.on("save-data", (event, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    event.returnValue = { success: true };
  } catch {
    event.returnValue = { success: false };
  }
});