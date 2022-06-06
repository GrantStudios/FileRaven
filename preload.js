const {
    contextBridge,
    ipcRenderer,
    shell
} = require("electron");

var pjson = require('./package.json');
const fs = require("fs");
const CryptoJS = require('crypto-js')

contextBridge.exposeInMainWorld('nodeCrypto', {
    "AES": {
        encrypt: (data, passkey, mode) => {
            return CryptoJS.AES.encrypt(data, passkey, { mode: CryptoJS.mode[mode] }).toString()
        },
        decrypt: (data, passkey, mode) => {
            return CryptoJS.AES.decrypt(data, passkey, { mode: CryptoJS.mode[mode] }).toString(CryptoJS.enc.Utf8)
        },
        stringify(data) {
            return data.toString(CryptoJS.enc.Utf8)
        },
        hexParse(data) {
            return CryptoJS.enc.Hex.parse(data)
        }
    },
})

contextBridge.exposeInMainWorld('util', {
    "base64": {
        encode: (data) => {
            return Buffer.from(data).toString('base64')
        },
        decode: (data) => {
            return Buffer.from(data, 'base64').toString("binary")
        }
    },
    "uint8": {
        toString: (data) => {
            return Buffer.from(data).toString()
        }
    },
    getVersion: () => {
        return pjson.version;
    },
    openExternalLink : (href) => {
        shell.openExternal(href)
    }
})

contextBridge.exposeInMainWorld('windows', {
    showAbout: () => {
        ipcRenderer.invoke("show-about-page")
    }
})

contextBridge.exposeInMainWorld('dialog', {
    showMessageBox: async (options) => {
        return await ipcRenderer.invoke("show-message-box", options)
    },
    showError: (title, content) => {
        ipcRenderer.invoke("show-error", {
            title: title,
            content: content
        })
    }
})

contextBridge.exposeInMainWorld('fs', {
    promptFile: async (options) => {
        return await ipcRenderer.invoke("prompt-file", options);
    },
    promptSave: async (path) => {
        return ipcRenderer.invoke("prompt-save", path);
    },
    readFile: async (path) => {
        return await ipcRenderer.invoke("read-file", path);
    },
    saveFile: async (config) => {
        return await ipcRenderer.invoke("save-file", config);
    },

})
CryptoJS.enc.Base64