const {
    contextBridge,
    ipcRenderer,
} = require("electron");

const fs = require("fs");
const CryptoJS = require('crypto-js')

contextBridge.exposeInMainWorld('nodeCrypto', {
    "AES": {
        encrypt: (data, passkey, mode) => {
            return CryptoJS.AES.encrypt(data, passkey, { mode: CryptoJS.mode[mode] }).toString()
        },
        decrypt: (data, passkey, mode) => {
            return CryptoJS.AES.decrypt(data, passkey, { mode: CryptoJS.mode[mode] }).toString(CryptoJS.enc.Utf8)
        }
    }
})

contextBridge.exposeInMainWorld('fs', {
    promptFile: async (options) => {
        return await ipcRenderer.invoke("prompt-file", options);
    },

    readFile: (path) => {
        //TODO
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            console.log(data)
        })
    }
})