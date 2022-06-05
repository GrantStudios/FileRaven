const container = $('.container')

const fileUploadArea = $('#file-upload-area')
const fileUploadButton = $('#file-upload')
const fileUploadLabel = $('#file-upload-label')

const encryptionStrengthContainer = $('#encryption-strength')
const encryptionStrengthOptions = $('.select-option', encryptionStrengthContainer)
const encryptionStrengthDescription = $('#encryption-strength-description')

const advancedOptionsToggle = $('#advanced-options-toggle')
const advancedOptions = $('#advanced-options')
const advancedOptionsToggleIcon = $('#advanced-options-toggle-icon')

const methodSelectContainer = $('#encryption-method')
const methodSelectOptions = $('.select-option', methodSelectContainer)
const methodOptions = $('.method-option')

const passKeyInput = $('#passkey')
const passKeyVisibilityToggle = $('#passkey-visibility-toggle')

const progressContainer = $('#progress-container')
const progressLabel = $('#progress-label', progressContainer)
const progressBarContainer = $('#progress-bar-container', progressContainer)
const progressBar = $('#progress-bar', progressBarContainer)

const version = window.util.getVersion()

/* encryption options */

function generateConfigurationData() {
    const toReturn = {
        advancedUserOptions: {
            algorithm: $('#advanced-option-algorithm').val(),
            encryptionRounds: $('#advanced-option-encryption-rounds').val(),
            encryptionMode: $('#advanced-option-encryption-mode').val()
        },
        encryptionOptions: {
            overwriteOriginalFile: $('#overwrite-original-file').prop('checked'),
            includeEncryptionMetadata: $('#include-encryption-metadata').prop('checked'),
        },
        decryptionOptions: {
            useEncryptionMetadata: $('#use-encryption-metadata').prop('checked')
        }
    }
    if (!advancedOptions.is(":visible")) {
        const userOptions = toReturn.advancedUserOptions;
        const encryptionStrengthConfig = encryptionStrengthConfigs[$('#encryption-strength .selected-option h4').text().trim()]

        userOptions.algorithm = encryptionStrengthConfig.algorithm
        userOptions.encryptionRounds = encryptionStrengthConfig.rounds;
        userOptions.mode = encryptionStrengthConfig.mode
    }
    return toReturn;
}

function generateFileMetadata(configurationData) {
    const userOptions = configurationData.advancedUserOptions
    return `/* Data encrypted using PieCryptor - DO NOT DELETE THE BELOW LINE */\nALG,ROUNDS,MODE|${userOptions.algorithm},${userOptions.encryptionRounds},${userOptions.encryptionMode}`
}

const encryptionStrengthConfigs = {
    "WEAK": {
        color: "rgb(187, 80, 80)",
        description: "Weak: Quick encryption/decryption for less important documents",
        algorithm: "AES",
        mode: "CBC",
        rounds: 10
    },
    "MEDIUM":
    {
        color: "rgb(162, 165, 42)",
        description: "Medium: Recommended encryption/decryption for normal documents",
        algorithm: "AES",
        mode: "CBC",
        rounds: 25
    },
    "HIGH": {
        color: "rgb(80, 187, 80)",
        description: "High: Strong encryption/decryption for important documents",
        algorithm: "AES",
        mode: "CBC",
        rounds: 50
    }
}

let uploadedFilePath;

fileUploadButton.on('click', function () {
    fileUploadArea.css('opacity', '0.6')
    window.fs.promptFile({
        properties: ['openFile']
    }).then(result => {
        fileUploadArea.css('opacity', '1')
        if (result != undefined) {
            uploadedFilePath = result[0]
            fileUploadLabel.text(result[0])
        }
    })
})

$('.select-options').each(function (e) {
    const s = $(this)
    const options = $('.select-option', s)
    options.on('click', function (f) {
        const option = $(f.currentTarget)
        options.removeClass('selected-option')
        option.addClass('selected-option')
    })
})

encryptionStrengthOptions.on('click', function (e) {
    const s = $(e.currentTarget)
    const strengthConfig = encryptionStrengthConfigs[s.find('h4').text().trim()]
    encryptionStrengthDescription.show().text(strengthConfig.description).css('color', strengthConfig.color)
})

methodSelectOptions.on('click', function (e) {
    const s = $(e.currentTarget);
    methodOptions.hide();
    const method = s.find('h4').text().trim()
    methodOptions.filter('[data-method="' + method + '"]').show()
})

advancedOptionsToggle.on('click', function () {
    advancedOptionsToggleIcon.text(advancedOptionsToggleIcon.html().trim() == "add" ? "remove" : "add");
    if (advancedOptions.is(':visible')) {
        advancedOptions.hide();
    } else {
        advancedOptions.css('display', 'table')
    }
    encryptionStrengthDescription.toggle();
    encryptionStrengthContainer.toggle();
})

function validateAndWarnUser() {
    if (uploadedFilePath === undefined) {
        window.dialog.showError('No file uploaded', 'Please upload a file')
        return false
    } else if (passKeyInput.val().length == 0) {
        window.dialog.showError('No passkey entered', 'Please enter a passkey')
        return false;
    } else if ($('#encryption-method .selected-option').length == 0) {
        window.dialog.showError('No method selected', 'Please select a method')
        return false
    } else if ($('#encryption-strength .selected-option').length == 0) {
        if (!$('#advanced-options').is(':visible')) {
            window.dialog.showError('No configuration selected', 'Please select a configuration or use advanced options')
            return false;
        } else {
            const advancedOptionsInputValues = $('#advanced-options .advanced-option-value').map(function () { return this.value }).get()
            if (advancedOptions.some(e => e.trim().length == 0)) {
                window.dialog.showError('Invalid advanced option value', 'The value for one of the advanced options is invalid')
                return false;
            }
        }
    }
    return true;
}

$('#action-encrypt').on('click', function () {
    if (validateAndWarnUser()) {
        const configurationData = generateConfigurationData();
        window.fs.readFile(uploadedFilePath).then(result => {
            const fileContents = window.util.base64.encode(result)
            progressContainer.show();
            progressBarContainer.show();
            container.addClass('processing')
            progressBar.css('width', '0%')
            progressLabel.text('Encrypting...')
            let encryptedResult;
            generateEncryptedResult(fileContents, passKeyInput.val(), configurationData.advancedUserOptions.encryptionMode, configurationData.advancedUserOptions.encryptionRounds, configurationData).then(res => {
                encryptedResult = res
                if (configurationData.encryptionOptions.overwriteOriginalFile) {
                    writeToFile(uploadedFilePath, encryptedResult, configurationData)
                } else {
                    window.fs.promptSave({ path: uploadedFilePath, mode: "ENCRYPT" }).then(result => {
                        if (!result.canceled) {
                            progressBarContainer.hide()
                            progressLabel.text('Writing to file...')
                            writeToFile(result.filePath, encryptedResult, configurationData, false)
                        }
                    })
                }
                progressContainer.hide();
                container.removeClass('processing')
            })
        })
    }
})

function writeToFile(path, data, configurationData, isDecryption) {
    if (configurationData.encryptionOptions.includeEncryptionMetadata && !isDecryption) {
        data = generateFileMetadata(configurationData) + '\n' + data;
    }
    console.log(data)
    console.log(window.util.base64.encode(data))
    window.fs.saveFile({
        path: path,
        data: window.util.base64.encode(data)
    }).then(res => {
        container.removeClass('processing')
        progressContainer.hide();
        if (!res.success) {
            //TODO
        }
    })
}

async function generateEncryptedResult(contents, passkey, mode, rounds) {
    let temp = contents;
    for (let i = 0; i < rounds; i++) {
        const progressPercentage = Math.floor((i + 1) / rounds * 100)
        progressBar.css('width', progressPercentage + '%')
        temp = window.nodeCrypto.AES.encrypt(temp, passkey, mode);
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    return temp;
}

passKeyVisibilityToggle.on('click', function () {
    if (passKeyInput.attr('type') == 'password') {
        passKeyVisibilityToggle.html('visibility')
        passKeyInput.attr('type', 'text')
    } else {
        passKeyVisibilityToggle.html('visibility_off')
        passKeyInput.attr('type', 'password')
    }
})

$('#action-decrypt').on('click', function () {
    window.fs.readFile(uploadedFilePath).then(result => {
        const configurationData = generateConfigurationData();
        const fileContents = window.util.uint8.toString(result)
        const lines = fileContents.split(/\r?\n/);
        const fileMetadata = {
            "ALG": undefined,
            "ROUNDS": undefined,
            "MODE": undefined
        }
        let foundFileMetadata = false;
        let encryptedData;
        if (lines.length > 1) {
            for (let i = 0; i < lines.length; i++) {
                const blocks = lines[i].split("|")
                if (blocks.length > 1) {
                    const propIdentifiers = blocks[0].split(',')
                    const propValues = blocks[1].split(',')
                    propIdentifiers.forEach((e, i) => {
                        if (i in propValues && e in fileMetadata) {
                            fileMetadata[e] = propValues[i]
                        }
                    })
                    if (Object.values(fileMetadata).includes(undefined)) {
                        window.dialog.showError('Incomplete encryption settings metadata', 'The encryption metadata in the file is incomplete for this version. Advanced options must be used.')
                    }
                    foundFileMetadata = true;
                    encryptedData = lines[i + 1]
                }
            }
        } else {
            encryptedData = fileContents;
        }
        if (!foundFileMetadata) {
            if (configurationData.decryptionOptions.useEncryptionMetadata) {
                window.dialog.showError('No encryption settings metadata found', 'Could not find encryption settings metadata. The file may have been corrupted.')
            } else {
                if (encryptedData === undefined) {
                    window.dialog.showError('No encryption data', 'Encryption metadata was found, but no encryption data was')
                } else {
                    const decryptedResult = generateDecryptedResult(encryptedData, passKeyInput.val(), configurationData.advancedUserOptions.encryptionMode, configurationData.advancedUserOptions.encryptionRounds)
                    decryptedResult.then(decResult => {
                        window.fs.promptSave({ path: uploadedFilePath, mode: "DECRYPT" }).then(result => {
                            if (!result.canceled) {
                                progressBarContainer.hide()
                                progressLabel.text('Writing to file...')
                                writeToFile(result.filePath, decResult, configurationData, true)
                            }
                            progressContainer.hide()
                            container.removeClass('processing')
                        })
                    }).catch(err => {
                        window.dialog.showError('An error occured during decryption', 'Could not decrypt file. This may be because the file is corrupted, or the passkey is incorrect.\n\nIf you believe this is a bug, please report this along with the following information:\n' + stringifyExceptionForDianosing(err))
                        progressContainer.hide()
                        container.removeClass('processing')
                    })
                }
            }
        } else {
            if (!configurationData.decryptionOptions.useEncryptionMetadata) {
                window.dialog.showMessageBox({
                    buttons: ["Yes", "No"],
                    message: "Encryption settings metadata found. Use encryption settings metadata in file?"
                }).then(result => {
                    if (result.response == 0) {
                        const decryptedResult = generateDecryptedResult(encryptedData, passKeyInput.val(), configurationData.MODE, fileContents.ROUNDS)
                        decryptedResult.then(decResult => {
                            window.fs.promptSave({ path: uploadedFilePath, mode: "DECRYPT" }).then(result => {
                                if (!result.canceled) {
                                    progressBarContainer.hide()
                                    progressLabel.text('Writing to file...')
                                    writeToFile(result.filePath, decResult, configurationData, true)
                                }
                                progressContainer.hide()
                                container.removeClass('processing')
                            })
                        }).catch(err => {
                            window.dialog.showError('An error occured during decryption', 'Could not decrypt file. This may be because the file is corrupted, or the passkey is incorrect.\n\nIf you believe this is a bug, please report this along with the following information:\n' + stringifyExceptionForDianosing(err))
                            progressContainer.hide()
                            container.removeClass('processing')
                        })
                    } else {
                        const decryptedResult = generateDecryptedResult(encryptedData, passKeyInput.val(), configurationData.advancedUserOptions.encryptionMode, configurationData.advancedUserOptions.encryptionRounds)
                        decryptedResult.then(decResult => {
                            window.fs.promptSave({ path: uploadedFilePath, mode: "DECRYPT" }).then(result => {
                                if (!result.canceled) {
                                    progressBarContainer.hide()
                                    progressLabel.text('Writing to file...')
                                    writeToFile(result.filePath, decResult, configurationData, true)
                                }
                                progressContainer.hide()
                                container.removeClass('processing')
                            })
                        }).catch(err => {
                            window.dialog.showError('An error occured during decryption', 'Could not decrypt file. This may be because the file is corrupted, or the passkey is incorrect.\n\nIf you believe this is a bug, please report this along with the following information:\n' + stringifyExceptionForDianosing(err))
                            progressContainer.hide()
                            container.removeClass('processing')
                        })
                    }
                })
            }
        }
    })
})

async function generateDecryptedResult(contents, passkey, mode, rounds) {
    progressContainer.show();
    progressBarContainer.show();
    container.addClass('processing')
    progressBar.css('width', '0%')
    progressLabel.text('Decrypting...')
    let temp = contents;
    for (let i = 0; i < rounds; i++) {
        const progressPercentage = Math.floor((i + 1) / rounds * 100)
        progressBar.css('width', progressPercentage + '%')
        temp = window.nodeCrypto.AES.decrypt(temp, passkey, mode)
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    return window.util.base64.decode(temp);
}

function stringifyExceptionForDianosing(err) {
    return JSON.stringify({
        "message": err.message,
        "stack": err.stack
    })
}

/* tooltips */

tippy($('#include-encryption-metadata').siblings('.icon')[0], {
    content: `Enabling this means you won't need to remember the encryption settings you used when decrypting - PieCryptor will handle it for you. Take note that this may make the file incompatible with other programs`
})