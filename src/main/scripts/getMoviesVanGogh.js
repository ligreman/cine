'use strict';

var mongoose = require('mongoose'),
    mongoHost = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME || 'mongodb://localhost/cine2',
    models = require('../models/models'),
    utils = require('../modules/utils'),
    events = require('events'),
    config = require('../modules/config'),
    request = require('request'),
    Q = require('q'),
    cheerio = require('cheerio'),
    eventEmitter = new events.EventEmitter();


//Configuración de la conexión a Mongo
mongoose.connect(mongoHost, {});

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
    console.log("Mongo conectado");
});
mongoose.set('debug', true);


// VAN GOGH
var urlVanGogh = 'http://cinesvangogh.com/cines/4/cartelera',
    sectionA = 'http://cinesvangogh.com/peliculas/detail/',
    sectionB = '?cines=[4]';

var pelisVan = [];

//Saco la página de cartelera
request(urlVanGogh, function (err, resp, body) {
    if (err || resp.statusCode !== 200) {
        console.log('Se produjo un error: ' + err);
        mongoose.disconnect();
        process.exit(0);
    }

    //Saco el cuerpo
    var $ = cheerio.load(body);

    /*
     <div class="poster-box vandyck vangogh isotope-item" ng-click="lookUpFilm(2515,0)" style="position: absolute; left: 0px; top: 0px; transform: translate3d(159px, 432px, 0px);">
     <img alt="Sufragistas" src="http://s3-eu-west-1.amazonaws.com/disasterdraw.blindcat/peliculas/000/002/515/original/sufragistas.jpg?1450343404">
     </div>
     */
    var tags = [];
    $('div.grid-cartelera div.poster-box').each(function () {

        // Saco el id de la peli
        var id = $(this).attr('ng-click').toString();
        var patron = /(lookUpFilm\()([0-9]+)(,.\))/i;
        id = patron.exec(id);
        id = id[2];

        // Saco el título de la peli y la imagen
        var img = $(this).find('img');
        var titulo = img.attr('alt');
        img = img.attr('src');

        // Calculo el tag de la peli para buscarlo en mongo
        var tagData = utils.getTagPeli(titulo);

        pelisVan[tagData.tag] = {
            titulo: titulo,
            tag: tagData.tag,
            imgSrc: img,
            url: sectionA + id + sectionB
        };

        tags.push(tagData.tag);
    });

    //console.log(tags);

    // Ahora miro a ver en mongo las pelis estas
    models.Pelicula.find({'tag': {$in: tags}})
        .exec(function (error, pelis) {
            if (error) {
                console.log('Se produjo un error 2: ' + err);
                mongoose.disconnect();
                process.exit(0);
            }

            var meFaltan = [];

            // Si no encuentro las pelis en mongoooor
            if (!pelis) {
                //Me faltan todas
                meFaltan = tags;
            } else {
                // Miro a ver qué pelis me faltan en Mongo
                var tengo = [];
                pelis.forEach(function (peli) {
                    tengo.push(peli.tag);
                });

                tags.forEach(function (tt) {
                    if (tengo.indexOf(tt) === -1) {
                        meFaltan.push(tt);
                    }
                });
            }

            // Tengo que recoger las pelis de meFaltan
            if (meFaltan.length === 0) {
                console.log("Tengo todas");
                mongoose.disconnect();
                process.exit();
            } else {
                eventEmitter.emit('#getpelis', {meFaltan: meFaltan});
            }
        });
});

// Cojo pelis de la web
eventEmitter.on('#getpelis', function (data) {
    var faltan = data.meFaltan;

    //Quito duplicados
    faltan = faltan.filter(function (elem, pos) {
        return faltan.indexOf(elem) == pos;
    });

    var promises = [];

    faltan.forEach(function (falta) {
        promises.push(getMovie(pelisVan[falta]));
    });

    Q.allSettled(promises)
        .then(function (results) {
            var resultado = true, razon = '', guardar = [];

            results.forEach(function (result) {
                if (result.state !== "fulfilled") {
                    resultado = false;
                    razon = result.reason;
                    console.log("Error: " + result.reason);
                } else {
                    guardar.push(result.value);
                    console.log("completo: " + result.value.titulo);
                }
            });

            if (resultado !== true) {
                console.error(razon);
                mongoose.disconnect();
                process.exit();
            } else {
                //eventEmitter.emit('#guardamongo', {peliculas: guardar})

                //Si se completó... lo guardo en mongooool
                models.Pelicula.create(guardar, function (err) {
                    if (err) {
                        console.error("Error al guardar en mongo las pelis:" + err);
                    }

                    console.log("Fin");
                    mongoose.disconnect();
                    process.exit();
                });
            }
        });
});
/*
 eventEmitter.on('#guardamongo', function (data) {
 var pelis = data.peliculas;

 //Meto los nuevos valores
 models.Pelicula.create(pelis, function (err, peliculas) {
 if (err) {
 console.error("Error al guardar en mongo las pelis:" + err);
 }

 mongoose.disconnect();
 process.exit();
 });

 /!*pelis.forEach(function (peli) {
 var peliObject = new models.Pelicula(peli);

 });*!/
 });*/

/**
 * Saca de la web la info de la peli y actualiza mongoooor
 */
function getMovie(peli) {
    var defer = Q.defer();

    // Saco la web de la peli
    console.log(peli);
    request(peli.url, function (err, resp, body) {
        if (err || resp.statusCode !== 200) {
            console.log('Se produjo un error 3: ' + err);
            defer.reject(err);
        }

        //Saco el cuerpo
        var $ = cheerio.load(body);

        //noinspection JSValidateTypes
        var data = $('div#film-data').children('h5').text();
        data = data.split('-');
        var pais = [limpia(data[0])];
        var anno = parseInt(limpia(data[1]));
        var duracion = parseInt(limpia(data[2]));

        var technical = [];
        $('div.technical-desc dd').each(function () {
            technical.push($(this).text());
        });

        var director = [limpia(technical[0])];
        var estreno = reverse(limpia(technical[1]));

        var reparto = [];
        $('div.artist h5').each(function () {
            reparto.push(limpia($(this).text()));
        });

        var sinopsis = limpia($('div.sinopsis span').text());

        console.log(pais[0] + ' # ' + anno + ' # ' + duracion + ' # ' + director[0] + ' # ' + estreno + ' ## ' + sinopsis);
        console.log(reparto);
        //console.log(par.text());

        //Descargo la imagen como base64
        downloadImageAsBase64(peli.imgSrc, function (err, img) {
            // Una vez descargada resuelvo el promise
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve({
                    titulo: sin3D(peli.titulo),
                    estreno: estreno,
                    anno: anno,
                    duracion: duracion,
                    pais: pais,
                    genero: [],
                    sinopsis: sinopsis,
                    director: director,
                    reparto: reparto,
                    tag: peli.tag,
                    imagen: img
                });
            }
        });
    });

    return defer.promise;
}

function limpia(text) {
    text = text.replace('\\n', '');
    text = text.replace('min.', '');
    return text.trim();
}

function reverse(date) {
    date = date.split('-');
    return date[2] + '-' + date[1] + '-' + date[0];
}

function sin3D(text) {
    return text.replace(' (3D)', '');
}

//Descarga una imagen como base64
var downloadImageAsBase64 = function (imagen, callback) {
    var imageFileSizeLimit = 100000;

    console.log("Descargo thumb");
    request(
        {url: imagen, encoding: 'binary'},
        function onImageResponse(error, imageResponse, imageBody) {
            if (error) {
                callback(error);
                //throw error;
            }

            var imageType = imageResponse.headers['content-type'],
                size = imageResponse.headers['content-length'];

            //Compruebo que la imagen no sobrepasa los límites
            if (size > imageFileSizeLimit) {
                callback(null, config.CONSTANTS.NO_MOVIE_DEFAULT_IMAGE);
            } else {
                var base64 = new Buffer(imageBody, 'binary').toString('base64');
                var imagen64 = 'data:' + imageType + ';base64,' + base64;

                //Devuelvo la imagen en base 64
                callback(null, imagen64); // First param indicates error, null=> no error
            }
        }
    );
};
