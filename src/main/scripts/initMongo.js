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
        _id: '710f6748d9eebed36297191a508db467',
        nombre: 'León',
        sortfield: 'leon',
        ciudades: [
            {
                _id: '8780c8b47245c858516d3a07ed5291db',
                nombre: 'León',
                cines: [
                    {
                        _id: '3de40e424271a2eba4c0c504920dd662',
                        nombre: 'Van Gogh',
                        urlCartelera: 'http://cinesvangogh.com/cines/4/cartelera',
                        tipo: 'vangogh',
                        direccion: 'San claudio, 5',
                        codigoPostal: '24004',
                        telefono: '987214022',
                        coordLatitud: 42.5917906,
                        coordLongitud: -5.5735533,
                        sesiones: [],
                        actualizado: 0
                    },
                    {
                        _id: '00a3c17b6a10bdc756360307ff188be2',
                        nombre: 'Odeón Multicines',
                        urlCartelera: 'http://odeonmulticines.com/leon/cartelera/',
                        tipo: 'odeon',
                        direccion: 'Centro Comercial Espacio León. Avda. del País Leonés, s/n',
                        codigoPostal: '24010',
                        telefono: '987228182',
                        coordLatitud: 42.61307,
                        coordLongitud: -5.596397,
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
