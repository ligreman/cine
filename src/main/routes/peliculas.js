'use strict';

module.exports = function (app) {
    var express = require('express'),
        peliculaRouter = express.Router(),
        utils = require('../modules/utils'),
        config = require('../modules/config'),
        models = require('../models/models');

    /**
     * GET /api/peliculas
     * Obtiene la lista peliculas
     */
    peliculaRouter.get('/peliculas', function (req, res, next) {
        //var returnPhotos = utils.checkKey(req.get(config.CONSTANTS.KEY_HEADER));

        models.Pelicula
            .find({})
            //.select('-ciudades.cines.urlCartelera -ciudades.cines.actualizado')
            .select('titulo')
            //.populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, peliculas) {
                if (error) {
                    console.error(error);
                    utils.error(res, 400, 'errPeliculasList');
                    return;
                }

                //Miro a ver si tengo que devolver la imagen real o no
                /*if (!returnPhotos) {
                 peliculas.forEach(function (pelicula) {
                 pelicula.imagen = config.CONSTANTS.NO_MOVIE_DEFAULT_IMAGE;
                 });
                 }*/

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
        var idCine = req.params.id,
            returnPhotos = utils.checkKey(req.get(config.CONSTANTS.KEY_HEADER));

        models.Pelicula
            .findById(idCine)
            //.select('-ciudades.cines.urlCartelera -ciudades.cines.actualizado')
            //.select('nombre sortfield ciudades._id ciudades.nombre')
            //.populate('ciudades.cines.sesiones._idPelicula')
            .exec(function (error, pelicula) {
                if (error) {
                    console.error(error);
                    utils.error(res, 400, 'errPeliculasId');
                    return;
                }

                if (!returnPhotos) {
                    pelicula.imagen = config.CONSTANTS.NO_MOVIE_DEFAULT_IMAGE;
                }

                res.json({
                    "pelicula": pelicula,
                    "error": ""
                });
            });
    });

    // Asigno los router a sus rutas
    app.use('/api', peliculaRouter);
};
