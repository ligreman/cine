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

//Creo los modelos de Mongo. Sólo he de hacerlo una vez
//require('./models/createModels')(mongoose);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
    console.log("Mongo conectado");
});
mongoose.set('debug', true);

//Cargo las rutas
require('./routes/routes')(app);

/*
 //Método /api/hola del servicio REST que devuelve un JSON
 app.get('/api/hola', function (req, res) {
 var respuesta = {
 "info": utils.getRespuesta('Pepe'),
 "error": null
 };

 res.set('Content-Type', 'application/json');
 res.json(respuesta);
 });

 //Cualquier otra ruta a la que se acceda, devuelve error
 app.get('/*', function (req, res) {
 res.status(404).send('Aquí no hay nada');
 });
 */

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
