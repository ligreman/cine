'use strict';

//Cargo los módulos que voy a usar y los inicializo
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    mongoose = require('mongoose'),
    serverPort = process.env.OPENSHIFT_NODEJS_PORT || 8080,
    serverHost = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
    mongoHost = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME || 'mongodb://localhost/cine2';

//Configuración de la conexión a Mongo
mongoose.connect(mongoHost, {});

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
    console.log("Mongo conectado");
});
mongoose.set('debug', true);

//Cargo las rutas
require('./routes/routes')(app);

//Controlamos el cierre para desconectar mongo
process.stdin.resume();//so the program will not close instantly
//do something when app is closing, catches ctrl+c event
process.on('exit', exitHandler.bind(null, {closeMongo: true, exit: true, msg: 'exit'}));
process.on('SIGINT', exitHandler.bind(null, {closeMongo: true, exit: true, msg: 'SIGINT'}));
process.on('SIGTERM', exitHandler.bind(null, {closeMongo: true, exit: true, msg: 'SIGTERM'}));


function exitHandler(options, err) {
    console.log('Salgo ' + options.msg + '. Error: ' + err);
    if (options.closeMongo) {
        mongoose.disconnect();
    }
    if (options.exit) {
        process.exit();
    }
}

//Arranco el servidor
server.listen(serverPort, serverHost, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Servidor escuchando en http://%s:%s', host, port);
});
