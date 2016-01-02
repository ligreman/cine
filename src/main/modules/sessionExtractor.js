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
                    if (tagData.es3d) {
                        horarios3d.push($(this).text());
                    } else {
                        horarios.push($(this).text());
                    }
                });

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
