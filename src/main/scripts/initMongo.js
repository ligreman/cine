var mongoose = require('mongoose'),
    mongoHost = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME || 'mongodb://localhost/cine2',
    models = require('../models/models'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();


//Configuración de la conexión a Mongo
mongoose.connect(mongoHost, {});

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
    console.log("Mongo conectado");
});
mongoose.set('debug', true);

// Limpio
mongoose.connection.collections['provincias'].drop(function (err) {
    eventEmitter.emit('crear', {});
});

var provincias = [
    {
        nombre: 'León',
        sortfield: 'leon',
        ciudades: [
            {
                nombre: 'León',
                cines: [
                    {
                        nombre: 'Van Gogh',
                        urlCartelera: 'http://cinesvangogh.com/cines/4/cartelera',
                        direccion: 'San claudio, 5',
                        codigoPostal: '24004',
                        telefono: '987214022',
                        sesiones: [],
                        actualizado: 0
                    },
                    {
                        nombre: 'Odeón Multicines',
                        urlCartelera: 'http://odeonmulticines.com/leon/cartelera/',
                        direccion: 'Centro Comercial Espacio León. Avda. del País Leonés, s/n',
                        codigoPostal: '24010',
                        telefono: '987228182',
                        sesiones: [],
                        actualizado: 0
                    }
                ]
            }
        ]
    }
];

// Creo la estructura base de Mongo
eventEmitter.on('crear', function (data) {
    //Meto los nuevos valores
    models.Provincia.create(provincias, function (err, provincias) {
        console.log('CREADO');

        mongoose.disconnect();
        process.exit();
    });
});