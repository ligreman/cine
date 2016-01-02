'use strict';

module.exports = function (app) {
    var express = require('express'),
        cineRouter = express.Router(),
        request = require('request'),
    //cheerio = require('cheerio'),
        utils = require('../modules/utils'),
        sessionExtractor = require('../modules/sessionExtractor'),
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
            .populate('ciudades.cines.sesiones.pelicula')
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
                    console.log("Ta updated");
                    res.json({
                        "cine": {
                            nombre: cine.nombre,
                            urlCartelera: null,
                            direccion: cine.direccion,
                            codigoPostal: cine.codigoPostal,
                            telefono: cine.telefono,
                            sesiones: cine.sesiones,
                            actualizado: null
                        },
                        "error": ""
                    });
                } else {
                    console.log("Tengo que actualizar");
                    // Lo actualizo antes de devolverlo. He de parsear su web
                    request(cine.urlCartelera, function (err, resp, body) {
                        if (err || resp.statusCode !== 200) {
                            console.log('Se produjo un error: ' + err);
                            utils.error(res, 500, 'errUpdateCine');
                            return;
                        }

                        //Saco el cuerpo
                        //var $ = cheerio.load(body);

                        //Saco las sesiones
                        var sesionesCine = sessionExtractor.extract(body, cine.tipo),
                            promises = [];

                        /******************************************/
                        /*$('div.info-line').each(function () {
                         var titulo = $(this).find('h5').text();
                         var horarios = [], horarios3d = [];

                         // Genero el tag de la peli
                         var tagData = utils.getTagPeli(titulo);

                         $(this).find('p.subtitle a').each(function () {
                         if (tagData.es3d) {
                         horarios3d.push($(this).text());
                         } else {
                         horarios.push($(this).text());
                         }
                         });

                         // Añado el promise a la lista
                         promises.push(prometeo.checkIfMovieExists(tagData.tag, titulo, horarios, horarios3d));
                         });*/
                        /******************************************/

                        sesionesCine.forEach(function (ss) {
                            // Añado el promise a la lista
                            promises.push(prometeo.checkIfMovieExists(
                                ss.tag, ss.titulo, ss.horarios, ss.horarios3d
                            ));
                        });

                        // Compruebo si se resuelven todos los promise
                        Q.allSettled(promises)
                            .then(function (results) {
                                var resultado = true, razon = '', sesionesMongo = [], sesionesJSON = [];
                                results.forEach(function (result) {
                                    if (result.state !== "fulfilled") {
                                        resultado = false;
                                        razon = result.reason;
                                    } else {
                                        sesionesMongo.push(result.value.mongo);
                                        sesionesJSON.push(result.value.json);
                                    }
                                });

                                if (resultado !== true) {
                                    console.error(razon);
                                    process.exit();
                                }

                                res.json({
                                    "cine": {
                                        nombre: cine.nombre,
                                        urlCartelera: null,
                                        direccion: cine.direccion,
                                        codigoPostal: cine.codigoPostal,
                                        telefono: cine.telefono,
                                        sesiones: sesionesJSON,
                                        actualizado: null
                                    },
                                    "error": ""
                                });

                                //guardar en mongo las sesiones y actualizado
                                var ahora = new Date();
                                ahora = ahora.getTime();
                                cine.actualizado = ahora;
                                cine.sesiones = sesionesMongo;

                                provincia.save(function (error) {
                                    if (error) {
                                        console.error("Error salvando en Mongo: " + error);
                                    }
                                });

                                /*
                                 // Esto también creo que funcionaría
                                 models.Provincia
                                 .findOneAndUpdate({"ciudades.cines._id": idCine},
                                 {
                                 "$set": {
                                 //"ciudades.$.cines.$.sesiones": sesiones
                                 "ciudades.$.cines.$.actualizado": ahora
                                 }
                                 },
                                 function (error, doc) {
                                 if (error) {
                                 console.error("Error salvando en Mongo: " + error);
                                 }
                                 }
                                 );*/
                            });
                    });
                }
            });
    });

    // Asigno los router a sus rutas
    app.use('/api', cineRouter);
};
