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


// Odeon
var urlOdeon = 'http://odeonmulticines.com/leon/cartelera/';

var pelisOde = [];

//Saco la página de cartelera
request(urlOdeon, function (err, resp, body) {
    if (err || resp.statusCode !== 200) {
        console.log('Se produjo un error: ' + err);
        mongoose.disconnect();
        process.exit(0);
    }

    //Saco el cuerpo
    var $ = cheerio.load(body);

    /*
     <div class="entry_content">

     <p>
     <a href="http://www.compraentradas.com/PeliculaCine/060/odeon-multicines-leon/6573/de-padres-a-hijas/0">
     <img class="alignleft wp-image-6217 size-medium" src="http://odeonmulticines.com/naron/wp-content/uploads/2015/12/DE-PADRES-A-HIJAS-210x300.jpg" alt="PADRES HIJAS" width="210" height="300">
     </a>
     <strong>GÉNERO</strong>: Drama<br>
     <strong>DIRECTOR</strong>: GABRIELE MUCCINO<br>
     <strong>REPARTO</strong>: RUSSELL CROWE, DIANE KRUGER, AMANDA SEYFRIED, AARON PAUL
     </p>

     <p><strong>SINOPSIS</strong><br>
     Un novelista ganador de un premio Pulitzer deberá lidiar con la educación de su hija de 5 años cuando su mujer muere.
     </p>

     <p><img class="alignleft size-full wp-image-610" src="http://odeonmulticines.com/naron/wp-content/uploads/2013/02/ICONOS-discapa-52x52.png" alt="Acceso Discapacitados" width="52" height="52"> <img class="alignleft size-full wp-image-614" src="http://odeonmulticines.com/naron/wp-content/uploads/2013/02/ICONOS-12-44x52.png" alt="Mayores de 12 años" width="44" height="52"> <a href="https://www.youtube.com/watch?v=DwSA0blLIR0" class="fancybox-youtube"><img class="alignleft size-full wp-image-649" src="http://odeonmulticines.com/naron/wp-content/uploads/2013/02/ICONOS-trailer-48x52.png" alt="Ver trailer" width="48" height="52"></a> <a href="http://www.compraentradas.com/PeliculaCine/060/odeon-multicines-leon/6573/de-padres-a-hijas/0"><img class="alignleft wp-image-489 size-full" src="http://odeonmulticines.com/leon/wp-content/uploads/2013/02/ICONOS-compra-52.png" alt="Compra tu entrada" width="52" height="52"></a></p>

     </div>
     */

    var tags = [];
    $('article.category-carteleras').each(function () {
        var titulo = $(this).find('h2.entry-title').text();

        // Calculo el tag de la peli para buscarlo en mongo
        var tagData = utils.getTagPeli(titulo);

        // Decoro el título
        titulo = utils.capitalize(titulo);

        var ps = $(this).find('div.entry_content p');

        // Si no tiene 3 elementos malo
        if (ps.length !== 3) {
            return;
        }

        // El primer p contiene la imagen y genero, director y reparto
        var img = $(ps[0]).find('img').attr('src');

        // genero director y reparto
        var data = $(ps[0]).text(), genero = [], director = [], reparto = [];
        data = data.split('\n');

        data.forEach(function (dato) {
            var tagInterno = utils.getTagPeli(dato);

            // Saco los posibles géneros si es el trozo de texto de generos
            if (tagInterno.tag.indexOf('genero') !== -1) {
                dato = dato.split(':');
                genero = cleanArray(dato[1].split(','));
            }

            if (tagInterno.tag.indexOf('director') !== -1) {
                dato = dato.split(':');
                director = cleanArray(dato[1].split(','));
            }

            if (tagInterno.tag.indexOf('reparto') !== -1) {
                dato = dato.split(':');
                reparto = cleanArray(dato[1].split(','));
            }
        });

        // Sinopsis, es el segundo p
        data = $(ps[1]).text();
        var sinopsis = data.replace('SINOPSIS\n', '');


        pelisOde[tagData.tag] = {
            titulo: titulo,
            tag: tagData.tag,
            imgSrc: img,
            genero: genero,
            director: director,
            reparto: reparto,
            sinopsis: sinopsis
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
        promises.push(getMovie(pelisOde[falta]));
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

/**
 * Saca info de la peli y actualiza mongoooor
 */
function getMovie(peli) {
    var defer = Q.defer();

    // Saco la imagen de la peli como base64
    downloadImageAsBase64(peli.imgSrc, function (err, img) {
        // Una vez descargada resuelvo el promise
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve({
                titulo: sin3D(peli.titulo),
                estreno: '',
                anno: 0,
                duracion: 0,
                pais: [],
                genero: peli.genero,
                sinopsis: peli.sinopsis,
                director: peli.director,
                reparto: peli.reparto,
                tag: peli.tag,
                imagen: img
            });
        }
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


function cleanArray(arr) {
    var arraynuevo = [];
    arr.forEach(function (uno) {
        arraynuevo.push(utils.titleCase(uno));
    });
    return arraynuevo;
}
