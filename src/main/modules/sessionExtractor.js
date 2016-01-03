'use strict';

var cheerio = require('cheerio'),
    utils = require('../modules/utils');

var extractSessionsFromCine = function (body, queCine) {
    var $ = cheerio.load(body);

    var sesiones = [];

    switch (queCine) {
        case 'vangogh':
            $('div.info-line').each(function () {
                var titulo = $(this).find('h5').text();
                var horarios = [], horarios3d = [];

                // Genero el tag de la peli
                var tagData = utils.getTagPeli(titulo);

                $(this).find('p.subtitle a').each(function () {
                    console.log("Miro el tag de " + tagData.tag);
                    if (tagData.es3d) {
                        console.log("    es 3D");
                        horarios3d.push($(this).text());
                    } else {
                        console.log("    es normal");
                        horarios.push($(this).text());
                    }
                });

                console.log("Horarios normales");
                console.log(horarios);
                console.log("Horarios 3D");
                console.log(horarios3d);

                sesiones.push({
                    tag: tagData.tag,
                    titulo: titulo,
                    horarios: horarios,
                    horarios3d: horarios3d
                });
            });
            break;

        case 'odeon':
            break;
    }

    return sesiones;
};

module.exports = {
    extract: extractSessionsFromCine
};
