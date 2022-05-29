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

const encryptionStrengthConfigs = {
    "WEAK": {
        color: "rgb(187, 80, 80)",
        description: "Weak: Quick encryption/decryption for less important documents"
    },
    "MEDIUM":
    {
        color: "rgb(162, 165, 42)",
        description: "Medium: Recommended encryption/decryption for normal documents"
    },
    "HIGH": {
        color: "rgb(80, 187, 80)",
        description: "High: Strong encryption/decryption for important documents"
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

$('.select-options').each(function(e){
    const s = $(this)
    const options = $('.select-option', s)
    options.on('click', function(f){
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

methodSelectOptions.on('click', function(e){
    const s = $(e.currentTarget);
    methodOptions.hide();
    const method = s.find('h4').text().trim()
    methodOptions.filter('[data-method="'+method+'"]').show()
})

advancedOptionsToggle.on('click', function () {
    advancedOptionsToggleIcon.text(advancedOptionsToggleIcon.html().trim() == "add" ? "remove" : "add");
    advancedOptions.toggle();
    encryptionStrengthDescription.toggle();
    encryptionStrengthContainer.toggle();
})

let fileContents;

$('#action-encrypt').on('click', function(){
    window.fs.readFile(uploadedFilePath).then(result => {
        fileContents = result
        let encryptedResult = window.nodeCrypto.AES.encrypt(fileContents, passKeyInput.val(), "CBC");
        console.log(encryptedResult)
    })
})