const fileUploadArea = $('#file-upload-area')
const fileUploadButton = $('#file-upload')
const fileUploadLabel = $('#file-upload-label')

const encryptionStrengthOptions = $('#encryption-strength-container .encryption-strength-option')
const encryptionStrengthDescription = $('#encryption-strength-description')

const encryptionStrengthDescriptions = {
    "WEAK": "Quick encryption for less important documents",
    "MEDIUM": "Recommended encryption for normal documents",
    "HIGH": "Strong encryption for important documents"
}

fileUploadButton.on('click', function () {
    fileUploadArea.css('opacity', '0.6')
    window.fs.promptFile({
        properties: ['openFile']
    }).then(result => {
        fileUploadArea.css('opacity', '1')
        if (result != undefined) {
            fileUploadLabel.text(result[0])
        }
    })
})

encryptionStrengthOptions.on('click', function(e){
    const s = $(e.currentTarget)
    encryptionStrengthOptions.removeClass('selected-strength')
    s.addClass('selected-strength')
    encryptionStrengthDescription.show().text(encryptionStrengthDescriptions[s.find('h4').text().trim()])
})