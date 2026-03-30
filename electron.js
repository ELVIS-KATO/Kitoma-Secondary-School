const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const isDev = !app.isPackaged;

let backend;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show the window until it's ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "frontend", "dist", "index.html");
    
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error("CRITICAL: index.html not found at:", indexPath);
    }
    
    // Developer tools are disabled for the final release.
    // win.webContents.openDevTools();
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  // Start the backend process
  if (isDev) {
    // Use -u for unbuffered output in development
    backend = spawn("python", ["-u", "backend/app/main.py"]);
  } else {
    const backendPath = path.join(process.resourcesPath, "backend.exe");
    
    // Set working directory to resourcesPath so database file is created there
    backend = spawn(backendPath, [], {
      cwd: process.resourcesPath,
      env: { ...process.env, DATABASE_URL: "sqlite+aiosqlite:///kitoma_accounts.db" }
    });
  }

  // Log backend output for debugging
  backend.stdout.on('data', (data) => {
    console.log(`Backend STDOUT: ${data.toString()}`);
  });
  backend.stderr.on('data', (data) => {
    console.error(`Backend STDERR: ${data.toString()}`);
  });
  backend.on('error', (err) => {
    console.error(`Failed to start backend: ${err.message}`);
  });
  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (backend) backend.kill();
  if (process.platform !== "darwin") app.quit();
});