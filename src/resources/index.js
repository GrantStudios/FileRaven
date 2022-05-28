const fileUploadArea = $('#file-upload-area')
const fileUploadButton = $('#file-upload')
const fileUploadLabel = $('#file-upload-label')

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