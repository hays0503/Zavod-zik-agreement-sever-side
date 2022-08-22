const WebSocket = require('ws');
const constants = require("./constants");
const fs = require("fs");
const path = require('path');

const certPath1 = path.join(__dirname, '../SSL/key.crt');//ura
const privateKey = fs.readFileSync(certPath1);
const certPath2 = path.join(__dirname, '../SSL/cert.crt');
const certificate = fs.readFileSync(certPath2);

const sdServerWSConfig = {
    isConnect: false,
    inProcessing: false,
    connect: new WebSocket.Server({
        port: constants.guard.port, host: constants.host, path: constants.guard.path,
        cert: certificate,
        key: privateKey
    }),
    guardError: {
        inProcessing: 'Контроллер еще не обработал предыдущие изменения. Изменения сохранены в базе и будут приняты в течении 10 минут. Если в течение 30 минут нет изменений, обратитесь в ваш отдел IT.',
        isConnect: 'Нет соединения с контроллером. Сохранено в базе. Изменения будут приняты при восстановлении связи. Если в течение 30 минут нет изменений, обратитесь в ваш отдел IT.'
    }
}

module.exports = sdServerWSConfig;