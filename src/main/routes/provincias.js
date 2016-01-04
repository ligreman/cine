'use strict';

module.exports = function (app) {
    var express = require('express'),
        provinciaRouter = express.Router(),
        utils = require('../modules/utils'),
        models = require('../models/models');

    /**
     * GET /api/provincias
     * Obtiene la lista de provincias y ciudades
     */
    provinciaRouter.get('/provincias', function (req, res, next) {
        models.Provincia
            .find({})
            //.select('-ciudades.cines.urlCartelera -ciudades.cines.actualizado')
            .select('nombre sortfield ciudades._id ciudades.nombre')
            //.populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, provincias) {
                if (error) {
                    console.error(error);
                    utils.error(res, 400, 'errProvinciasList');
                    return;
                }

                res.json({
                    "provincias": provincias,
                    "error": ""
                });
            });
    });

    /**
     * GET /api/provincias/ciudad/idCiudad
     * Obtiene los cines de una ciudad
     */
    provinciaRouter.get('/provincias/ciudad/:id', function (req, res, next) {
        var idCiudad = req.params.id;

        // Saco la ciudad esta que busco
        models.Provincia
            .findOne({"ciudades._id": idCiudad})
            .select('ciudades ciudades.nombre ciudades._id ciudades.cines ciudades.cines._id ciudades.cines.nombre')
            //.select('-ciudades.cines.urlCartelera  -ciudades.cines.actualizado -ciudades.cines.sesiones ')
            //.populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, provincia) {
                if (error || !provincia) {
                    console.error(error);
                    utils.error(res, 400, 'errProvinciasCiudad');
                    return;
                }

                console.log(provincia);

                //Saco la ciudad que busco
                var ciudad = null;
                provincia.ciudades.forEach(function (city) {
                    if (city._id.toString() === idCiudad) {
                        ciudad = city;
                    }
                });

                if (!ciudad) {
                    console.error(error);
                    utils.error(res, 400, 'errCiudad');
                    return;
                }

                //Añadir a la respuesta el idCiudad y nombreciudad
                var cines = ciudad.cines;
                cines.forEach(function (cine) {
                    cine._idCiudad = ciudad._id;
                    cine.nombreCiudad = ciudad.nombre;
                });

                res.json({
                    "cines": cines,
                    "error": ""
                });
            });
    });

    // Asigno los router a sus rutas
    app.use('/api', provinciaRouter);
};
