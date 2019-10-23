const telegram = require('./telegram');

rememberErrors = {
    transmission_session_id: false,
    transmission_get_all: false
};

module.exports.error = function(place, error) {
    console.log('ERROR', place, error);
    if (place === 'transmission_session_id') {
        transmissionSessionIdError(error);
    }
    if (place === 'transmission_get_all') {
        transmissionGetAllError(error);
    }
};

function transmissionSessionIdError(error) {
    if (error && error['Error']) {
        error = error['Error'];
    }

    if (!rememberErrors['transmission_session_id'] && error) {
        telegram.sendError('Проблема с Transmission' + error).then(res => {
            rememberErrors['transmission_session_id'] = res;
        });
    }

    if (rememberErrors['transmission_session_id'] && !error) {
        rememberErrors['transmission_session_id'] = false;
        telegram.sendError('Проблема с Transmission решена');
    }
}

function transmissionGetAllError(error) {
    if (error && error['Error']) {
        error = error['Error'];
    }

    if (!rememberErrors['transmission_get_all'] && error) {
        telegram.sendError('Проблема с Transmission' + error).then(res => {
            rememberErrors['transmission_get_all'] = res;
        });
    }

    if (rememberErrors['transmission_get_all'] && !error) {
        rememberErrors['transmission_get_all'] = false;
        telegram.sendError('Проблема с Transmission решена');
    }
}