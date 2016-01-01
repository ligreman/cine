'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


//Colección "peliculas"
var peliculaSchema = new Schema({
    titulo: String,
    estreno: String,
    anno: Number,
    duracion: Number,
    pais: [String],
    genero: [String],
    sinopsis: {type: String, default: ''},
    director: [String],
    reparto: [String],
    imagen: {type: String, default: ''},
    tag: String
});

//Colección "cines"
var sesionSchema = new Schema({
    _idPelicula: {type: mongoose.Schema.Types.ObjectId, ref: 'Pelicula'},
    horarios: [String],
    horarios3D: [String]
});

var cineSchema = new Schema({
    nombre: String,
    urlCartelera: String,
    direccion: String,
    codigoPostal: String,
    telefono: String,
    sesiones: [sesionSchema],
    actualizado: Number //cuando actualicé las sesiones de este cine
});

//Colección "provincias"
var ciudadSchema = new Schema({
    nombre: String,
    cines: [cineSchema]
});

var provinciaSchema = new Schema({
    nombre: String,
    ciudades: [ciudadSchema],
    sortfield: String
});


module.exports = {
    Pelicula: mongoose.model('Pelicula', peliculaSchema),

    Provincia: mongoose.model('Provincia', provinciaSchema),
    Ciudad: mongoose.model('Ciudad', ciudadSchema),

    Cine: mongoose.model('Cine', cineSchema),
    Sesion: mongoose.model('Sesion', sesionSchema)
};
