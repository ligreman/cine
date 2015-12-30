'use strict';

//Cargo los módulos que voy a usar y los inicializo
var express = require('express'),
    app = express(),
    utils = require('./modules/utils');


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

//Arranco el servidor
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Servidor escuchando en http://%s:%s', host, port);
});
