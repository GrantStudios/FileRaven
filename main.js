const { app, BrowserWindow, ipcMain, dialog, remote } = require('electron')
const path = require('path')
const fs = require("fs");
const AES = require('crypto-js/aes')
let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            // devTools: false
        },
        // icon: __dirname + '/src/resources/images/icon.png'
    })

    mainWindow.loadFile('src/index.html')
}



app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

let uploadedFilePath;

function promptUpload(options){
    uploadedFilePath = dialog.showOpenDialogSync(mainWindow, options)
}

ipcMain.handle("prompt-file", async (e, args) => {
    await promptUpload(args);
    return uploadedFilePath;
})

function readFile(path){
    const data = fs.readFileSync(path);
    return new Buffer(data).toString('base64')
}

ipcMain.handle("read-file", async (e, args) => {
    return await readFile(args);
})