'use strict';

module.exports = function (app) {
    var express = require('express'),
        peliculaRouter = express.Router(),
        utils = require('../modules/utils'),
        models = require('../models/models');

    /**
     * GET /api/peliculas
     * Obtiene la lista peliculas
     */
    peliculaRouter.get('/peliculas', function (req, res, next) {
        models.Pelicula
            .find({})
            //.select('-ciudades.cines.urlCartelera -ciudades.cines.actualizado')
            //.select('nombre sortfield ciudades._id ciudades.nombre')
            //.populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, peliculas) {
                if (error) {
                    console.error(error);
                    utils.error(res, 400, 'errPeliculasList');
                    return;
                }

                res.json({
                    "peliculas": peliculas,
                    "error": ""
                });
            });
    });

    /**
     * GET /api/peliculas/idPelicula
     * Obtiene una peli
     */
    peliculaRouter.get('/peliculas/:id', function (req, res, next) {
        var idCine = req.params.id;

        models.Provincia
            .findOne({"ciudades.cines._id": idCine})
            .select('-ciudades.cines.urlCartelera -ciudades.cines.actualizado')
            //.select('nombre sortfield ciudades._id ciudades.nombre')
            .populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, provincia) {
                if (error) {
                    console.error(error);
                    utils.error(res, 400, 'errCineCiudad');
                    return;
                }

                //Saco el cine que busco. Primero recorro ciudades
                var cine = null;
                //provincia.ciudades.forEach(function (city) {
                // Busco el cine
                /*city.cines.forEach(function (cinema) {
                 if (cinema._id.toString() === idCine) {
                 cine = cinema;
                 }
                 });*/

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

                res.json({
                    "cine": cine,
                    "error": ""
                });
            });
    });

    // Asigno los router a sus rutas
    app.use('/api', peliculaRouter);
};
