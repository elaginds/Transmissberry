const request = require('request');
const errorService = require('error');

/* Конфиг, должен прийти из transmission.js */
let config = null;

/* ID сессии transmission - получаем запросом */
let sessionId = null;

/* Получить список всех торрентов */
module.exports.getAllTorrents = function(conf) {
    if (!config) {
        config = conf;
    }

    return new Promise(resolve => {

        if (sessionId) {
            resolve(getAll());
        } else {
            requestSessionId().then(() => {
                resolve(getAll());
            });
        }


    })
};

/* Удалить завершенные торренты по их ID */
module.exports.removeCompletedTorrents = function(ids) {
    return new Promise(resolve => {
        request({
            method: 'POST',
            url: createLink(),
            headers: {
                'X-Transmission-Session-Id': sessionId
            },
            body: createBody('remove', ids)
        }, function (error, response, body) {
            resolve(error, response, body);
        });
    });
};

/* Запустить торрент из magnet-ссылки из телеграмма */
module.exports.setMagnet = function(magnet) {
    return new Promise(resolve => {
        request({
            method: 'POST',
            url: createLink(),
            headers: {
                'X-Transmission-Session-Id': sessionId
            },
            body: createBody('magnet', magnet)
        }, function (error, response, body) {
            resolve(JSON.parse(body));
        });
    });
};

/* Получить все */
function getAll() {
    return new Promise(resolve => {
        request({
            method: 'POST',
            url: createLink(),
            headers: {
                'X-Transmission-Session-Id': sessionId
            },
            body: createBody('all')
        }, function (error, response, body) {
            resolve(JSON.parse(body));
        });
    });
}

/* Создаем BODY для различных запросов */
function createBody(type, options) {
    if (type === 'all') {
        return JSON.stringify({
            "method": "torrent-get",
            "arguments": {
                "fields": [
                    "percentDone",
                    "id",
                    "error",
                    "doneDate",
                    "name",
                    "status",
                    "errorString",
                    "eta",
                    "downloadDir"
                ]
            }
        });
    } else if (type === 'remove' && options) {
        return JSON.stringify({
            method: "torrent-remove",
            arguments: {
                ids: options
            }
        })
    } else if (type === 'magnet' && options) {
        return JSON.stringify({
            "method": "torrent-add",
            "arguments": {
                "paused": false,
                "download-dir": (config && config['downloadDir']) ? config['downloadDir'] : null,
                "filename": options
            }
        });
    }
}

/* Получаем ID сессии трансмиссии */
function requestSessionId() {
    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: createLink(),
            headers: {
                'X-Transmission-Session-Id': ''
            },
            body: createBody('all')
        }, function (error, response, bodyk) {
            if(bodyk && typeof bodyk === 'string' && bodyk.indexOf('X-Transmission-Session-Id: ') !== -1){
                sessionId = bodyk.slice(bodyk.indexOf('X-Transmission-Session-Id: ') + 27);
                sessionId = sessionId.substr(0, sessionId.indexOf('</'));

                this.sessionId = sessionId;

                resolve(sessionId);
            } else {
                if (error) {
                    errorService.error('transmission_session_id', error);
                } else {
                    errorService.error('transmission_session_id', response);
                }

                reject(null);
            }
        });
    });

}

/* Создаем ссылку на трансмиссию с помощью конфига */
function createLink() {
    return `http://${config.address}:${config.port}/transmission/rpc`
}