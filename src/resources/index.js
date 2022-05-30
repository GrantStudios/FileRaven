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

/* encryption options */

function generateConfigurationData(){
    const toReturn = {
        advancedUserOptions:{
            algorithm: $('#advanced-option-algorithm').val(),
            encryptionRounds: $('#advanced-option-encryption-rounds').val(),
            encryptionMode: $('#advanced-option-encryption-mode').val()
        },
        overwriteOriginalFile: $('#overwrite-original-file').prop('checked'),
        includeEncryptionMetadata: $('#include-original-file').prop('checked'),
    }
    if(!advancedOptions.is(":visible")){
        const userOptions = toReturn.advancedUserOptions;
        userOptions.algorithm = $('#encryption-strength .selected-option h4').text().trim();
        userOptions.encryptionRounds = encryptionStrengthConfigs[userOptions.algorithm].rounds;
        userOptions.mode = encryptionStrengthConfigs[userOptions.algorithm].mode
    }
    console.log(toReturn)
    return toReturn;
}

const encryptionStrengthConfigs = {
    "WEAK": {
        color: "rgb(187, 80, 80)",
        description: "Weak: Quick encryption/decryption for less important documents",
        mode: "CBC",
        rounds: 10
    },
    "MEDIUM":
    {
        color: "rgb(162, 165, 42)",
        description: "Medium: Recommended encryption/decryption for normal documents",
        mode: "CBC",
        rounds: 25
    },
    "HIGH": {
        color: "rgb(80, 187, 80)",
        description: "High: Strong encryption/decryption for important documents",
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
    if(advancedOptions.is(':visible')){
        advancedOptions.hide();
    }else{
        advancedOptions.css('display', 'table')
    }
    encryptionStrengthDescription.toggle();
    encryptionStrengthContainer.toggle();
})

let fileContents;

$('#action-encrypt').on('click', function () {
    const configurationData = generateConfigurationData();
    window.fs.readFile(uploadedFilePath).then(result => {
        fileContents = result
        progressContainer.show();
        progressBarContainer.show();
        container.css('opacity', '0.5')
        progressBar.css('width', '0%')
        progressLabel.text('Encrypting...')
        let encryptedResult;
        setTimeout(function () {
            generateEncryptedResult(fileContents, passKeyInput.val(), configurationData.advancedUserOptions.encryptionMode, configurationData.advancedUserOptions.encryptionRounds, configurationData).then(res => {
                encryptedResult = res
                if (configurationData.overwriteOriginalFile) {
                    writeToFile(uploadedFilePath, encryptedResult)
                } else {
                    window.fs.promptSave().then(result => {
                        if (!result.canceled) {
                            progressBarContainer.hide()
                            progressLabel.text('Writing to file...')
                            writeToFile(result.filePath, encryptedResult, configurationData)
                        }
                    })
                }
                progressContainer.hide();
            })
        }, 100)
    })
})

function writeToFile(path, data, configurationData) {
    window.fs.saveFile({
        path: path,
        data: data
    }).then(res => {
        container.css('opacity', '1')
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
        console.log(progressPercentage)
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

/* tooltips */

tippy($('#include-encryption-metadata').siblings('.icon')[0], {
    content: `Enabling this means you won't need to remember the encryption settings you used when decrypting - PieCryptor will handle it for you. Take note that this may make the file incompatible with other programs`
})