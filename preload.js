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
    promptSave: async () => {
        return ipcRenderer.invoke("prompt-save");
    },
    readFile: async (path) => {
        return await ipcRenderer.invoke("read-file", path);
    },
    saveFile: async(config) => {
        return await ipcRenderer.invoke("save-file", config);
    }
})