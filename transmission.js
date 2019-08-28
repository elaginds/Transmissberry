const api = require('./api');
let config = require('./config');
const telegram = require('./telegram');

/* Стартуем модуль и проверяем, что в конфиге есть минимум значений */
module.exports.start = function() {
    if (!verifyConfig()) {
        return false;
    }

    runIntervalRequests();

    return true;
};

/* Запускаем периодическую проверку торрентов, если закачка окончена -
 * удаляем ее и отправляем название через телеграмм */
function runIntervalRequests() {
    setInterval(() => {
        requestAllTorrents()
            .then(torrents => {
                const completed = separateCompletedTorrents(torrents);

                if (completed && completed.ids && completed.ids.length) {
                    api.removeCompletedTorrents(completed.ids)
                        .then(() => {
                            telegram.sendCompleted(completed.names, config.telegramid);
                        });
                }

                telegram.sendInfo(prepareTorrentsNames(torrents), config.telegramid);
            });

    }, parseInt(config.requestInterval));
}

/* Получаем список всех торрентов */
function requestAllTorrents() {
    return new Promise(resolve => {
        api.getAllTorrents(config).then(data => {
            if (data && data.result === 'success' && data.arguments && data.arguments['torrents']) {
                resolve(data.arguments['torrents']);
            }
        });
    })
}

/* Из списка всех торрентов выбираем только завершенные */
function separateCompletedTorrents(torrents) {
    let res = {
        ids: [],
        names: []
    };
    torrents.forEach(function(val){
        if(val['status'] > 5){
            res.ids.push(val.id);
            res.names.push(val.name);
        }
    });
    return res;
}

/* Получаем список всех торрентов для отправки в телеграмм */
function prepareTorrentsNames(torrents) {
    const res = [];

    torrents.forEach(function(val){
        res.push(`${val['name']} - ${parseFloat(val['percentDone']) * 100}%`)
    });

    return res;
}

/* Проверка конфига и подстройка возможных параметров */
function verifyConfig() {
    if (!config) {
        console.error('НЕТ ФАЙЛА КОНФИГУРАЦИИ');
        config = {};
    }

    if (!config.address) {
        config.address = 'localhost';
        console.warn('Нет адреса клиента Transmission, выбран по умолчанию localhost');
    }

    if (!config.port) {
        config.port = '9091';
        console.warn('Нет порта клиента Transmission, выбран по умолчанию 9091');
    }

    if (!config.telegramid) {
        console.warn('Нет ID бота Telegram, он работать не будет');
    }

    if (!config.requestInterval) {
        config.requestInterval = 5000;
    }

    return true;
}