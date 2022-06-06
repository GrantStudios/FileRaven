$('a[data-external-link]').on('click', function (e) {
    const t = $(e.currentTarget)
    window.util.openExternalLink(t.attr("href"))
    e.preventDefault()
})