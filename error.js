const telegram = require('./telegram');

module.exports.error = function(place, error) {
    if (place === 'transmission_session_id') {
        transmissionSessionIdError(error);
    }
};

function transmissionSessionIdError(error) {
    telegram.sendError('Проблема с Transmission', error);
}