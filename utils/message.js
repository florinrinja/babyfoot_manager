const formatMessage = (username, text) => ({
    username,
    text,
    time: (new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
});

module.exports = formatMessage;