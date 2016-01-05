'use strict';

var mongoose = require('mongoose'),
    mongoHost = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME || 'mongodb://localhost/cine2',
    Q = require('q'),
    models = require('../models/models');

//Configuración de la conexión a Mongo
mongoose.connect(mongoHost, {});

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
    console.log("Mongo conectado");
});
mongoose.set('debug', true);

// Pone el campo actualizado en Mongo a los cines a 0
models.Provincia.find({},
    function (err, provincias) {
        if (err) {
            console.log("Error actualizando: " + err);
            mongoose.disconnect();
            process.exit();
        }

        var promises = [];

        provincias.forEach(function (provincia) {
            provincia.ciudades.forEach(function (ciudad) {
                ciudad.cines.forEach(function (cine) {
                    cine.actualizado = 0;
                });
            });

            promises.push(provincia.save());
        });

        Q.allSettled(promises)
            .then(function (results) {
                var resultado = true, razon = '';

                results.forEach(function (result) {
                    if (result.state !== "fulfilled") {
                        resultado = false;
                        razon = result.reason;
                    }
                });

                if (resultado !== true) {
                    console.error("ERROR: " + razon);
                } else {
                    console.log("Actualizado");
                }
                mongoose.disconnect();
                process.exit();
            });
    }
);
