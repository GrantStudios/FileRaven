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
    return new Buffer(data).toString('base64')
}

ipcMain.handle("read-file", async (e, args) => {
    return await readFile(args);
})

ipcMain.handle("prompt-save", async (e, args) => {
    return await dialog.showSaveDialog(mainWindow, {
        defaultPath: getNameFromPath(args) + '.piec'
    })
})

ipcMain.handle("save-file", async (e, args) => {
    let success = true;
    await fs.writeFile(args.path, args.data, (err) => {
        success = false;
        return err;
    })
    return { success: success }
})

function getNameFromPath(p) {
    const extension = path.extname(p)
    return path.basename(p, extension)
}

function generateFileLines(path) {
    const lines = []
    const interface = lineReader.createInterface({
        input: fs.createReadStream(path)
    })
    interface.on('line', async function (line) {
        lines.push(line)
    })
    return lines;
}

ipcMain.handle("read-file-lines", (e, path) => {
    return generateFileLines(path);
})