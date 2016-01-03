'use strict';

var Q = require('q'),
    models = require('../models/models');

/**
 * Comprueba en mongo si la peli existe y saca los datos que pueda de Mongo de la misma
 */
var checkIfMovieExists = function (tag, titulo, horarios, horarios3d) {
    var defer = Q.defer();

    models.Pelicula
        .findOne({"tag": tag})
        .exec(function (error, pelicula) {
            if (error) {
                defer.reject(error);
            }

            if (pelicula) {
                // La tengo en mongo así que puedo generar el objeto sesión
                defer.resolve({
                    mongo: {
                        pelicula: pelicula._id,
                        horarios: horarios,
                        horarios3D: horarios3d
                    },
                    json: {
                        pelicula: {
                            titulo: pelicula.titulo,
                            estreno: pelicula.estreno,
                            anno: pelicula.anno,
                            duracion: pelicula.duracion,
                            pais: pelicula.pais,
                            genero: pelicula.genero,
                            sinopsis: pelicula.sinopsis,
                            director: pelicula.director,
                            reparto: pelicula.reparto,
                            imagen: pelicula.imagen
                        },
                        horarios: horarios,
                        horarios3D: horarios3d
                    }
                });
            } else {
                /*// No la tengo así que tendré que buscar sus datos en la web de nuevo
                 request(cine.urlCartelera, function (err, resp, body) {
                 if (err || resp.statusCode !== 200) {
                 defer.reject(err);
                 }

                 //Saco el cuerpo
                 var $ = cheerio.load(body);
                 });*/

                //No la tengo así que devuelvo lo que puedo
                defer.resolve({
                    mongo: {
                        pelicula: pelicula._id,
                        horarios: horarios,
                        horarios3D: horarios3d
                    },
                    json: {
                        pelicula: {
                            titulo: titulo,
                            estreno: '',
                            anno: 0,
                            duracion: 0,
                            pais: [],
                            genero: [],
                            sinopsis: '',
                            director: [],
                            reparto: [],
                            imagen: ''
                        },
                        horarios: horarios,
                        horarios3D: horarios3d
                    }
                });
            }
        });

    return defer.promise;
};

//Exporto las funciones de la librería utils para que puedan accederse desde fuera
module.exports = {
    checkIfMovieExists: checkIfMovieExists
};
