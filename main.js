const { app, BrowserWindow, ipcMain, dialog, remote } = require('electron')
const path = require('path')
const fs = require('fs');
const lineReader = require('readline');
const { promises } = require('dns');
const { resolve } = require('path');
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

process.on('uncaughtException', function (error, origin) {
    console.log('error start')
    console.log(error.stack)
    console.log('error end')
    dialog.showErrorBox('An error has occured',
        `An error occured. PieCryptor may no longer function properly. Try restarding to fix this error. Otherwise, report this error to the developer.\n\nTo report this error, send this data to the developer: ` + JSON.stringify({
            error: {
                name: error.name,
                message: error.message,
                cause: error.cause,
                stack: error.stack.replaceAll('\n   ', ' ')
            },
            origin: origin
        }
        ))
    process.exit(1);
})

let uploadedFilePath;

function promptUpload(options) {
    uploadedFilePath = dialog.showOpenDialogSync(mainWindow, options)
}

ipcMain.handle("prompt-file", async (e, args) => {
    await promptUpload(args);
    return uploadedFilePath;
})

async function readFile(path) {
    const data = fs.readFileSync(path);
    return data;
}

ipcMain.handle("read-file", async (e, args) => {
    return await readFile(args);
})

ipcMain.handle("prompt-save", async (e, args) => {
    const filePathData = getFilePathData(args.path)
    return await dialog.showSaveDialog(mainWindow, {
        defaultPath: args.mode == "ENCRYPT" ? filePathData.name + '.piec' : filePathData.name + '_decrypted'
    })
})

ipcMain.handle("save-file", async (e, args) => {
    let success = true;
    let decodedData = Buffer.from(args.data, 'base64').toString("binary")
    await fs.writeFile(args.path, decodedData, (err) => {
        success = false;
        return err;
    })
    return { success: success }
})

function getFilePathData(p) {
    const extension = path.extname(p)
    return {
        name: path.basename(p, extension),
        extension: extension
    }
}

ipcMain.handle("show-message-box", async (e, args) => {
    return await dialog.showMessageBox(mainWindow, args)
})

ipcMain.handle("show-error", (e, args) => {
    dialog.showErrorBox(args.title, args.content)
})