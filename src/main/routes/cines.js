'use strict';

module.exports = function (app) {
    var express = require('express'),
        cineRouter = express.Router(),
        request = require('request'),
        cheerio = require('cheerio'),
        utils = require('../modules/utils'),
        Q = require('q'),
        prometeo = require('../modules/promises'),
        models = require('../models/models');

    /**
     * GET /api/cines/idCine
     * Obtiene un cine
     */
    cineRouter.get('/cines/:id', function (req, res, next) {
        var idCine = req.params.id;

        models.Provincia
            .findOne({"ciudades.cines._id": idCine})
            .populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, provincia) {
                if (error || !provincia) {
                    console.error(error);
                    utils.error(res, 400, 'errCineCiudad');
                    return;
                }

                //Saco el cine que busco. Primero recorro ciudades
                var cine = null;
                // Busco el cine
                provincia.ciudades.some(function (city) {
                    city.cines.some(function (cinema) {
                        if (cinema._id.toString() === idCine) {
                            cine = cinema;
                            // Devuelvo true para romper el bucle
                            return true;
                        }
                        // Devuelvo false para continuar el bucle
                        return false;
                    });

                    return (cine !== null);
                });


                if (!cine) {
                    console.error(error);
                    utils.error(res, 400, 'errCine');
                    return;
                }

                // Compruebo si el cine está actualizado
                if (utils.isUpdated(cine.actualizado)) {
                    // Ta actualizado, censuro y devuelvo
                    var censored = cine;
                    censored.urlCartelera = null;
                    delete censored.urlCartelera;
                    censored.actualizado = null;
                    delete censored.actualizado;

                    res.json({
                        "cine": censored,
                        "error": ""
                    });
                } else {
                    // Lo actualizo antes de devolverlo. He de parsear su web
                    request(cine.urlCartelera, function (err, resp, body) {
                        if (err || resp.statusCode !== 200) {
                            console.log('Se produjo un error: ' + err);
                            utils.error(res, 500, 'errUpdateCine');
                            return;
                        }

                        //Saco el cuerpo
                        var $ = cheerio.load(body);

                        //Saco las sesiones
                        var sesiones = [], promises = [];
                        $('div.info-line').each(function () {
                            var titulo = $(this).find('h5').text();
                            var horarios = [], horarios3d = [];

                            // Genero el tag de la peli
                            var tagData = utils.getTagPeli(titulo);

                            $(this).find('p.subtitle a').each(function () {
                                if (tagData.es3d) {
                                    horarios.push($(this).text());
                                } else {
                                    horarios3d.push($(this).text());
                                }
                            });

                            // Añado el promise a la lista
                            promises.push(prometeo.checkIfMovieExists(tagData.tag, titulo, horarios, horarios3d));
                        });

                        // Compruebo si se resuelven todos los promise
                        Q.allSettled(promises)
                            .then(function (results) {
                                var resultado = true, razon;
                                results.forEach(function (result) {
                                    if (result.state !== "fulfilled") {
                                        resultado = result.value;
                                        razon = result.reason;
                                    }
                                });

                                if (resultado !== true) {
                                    console.error(razon);
                                    process.exit();
                                }

                                console.log('Partidas que estaban RESUELTAS las CIERRO y creo las nuevas si eran recursivas');
                                eventEmitter.emit('gameFridayContinue');
                            });
                    });


                    var censored = cine;
                    censored.urlCartelera = null;
                    delete censored.urlCartelera;
                    censored.actualizado = null;
                    delete censored.actualizado;

                    res.json({
                        "cine": cine,
                        "error": ""
                    });
                }
            });
    });

    // Asigno los router a sus rutas
    app.use('/api', cineRouter);
};
