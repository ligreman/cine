'use strict';

var cheerio = require('cheerio'),
    utils = require('../../modules/utils');

/**
 * Recorre la web y extrae las sesiones de ella
 */
var extract = function (body) {
    var $ = cheerio.load(body), sesiones = [];

    $('div.info-line').each(function () {
        var titulo = $(this).find('h5').text();
        var horarios = [], horarios3d = [];

        // Genero el tag de la peli
        var tagData = utils.getTagPeli(titulo);

        $(this).find('p.subtitle a').each(function () {
            if (tagData.es3d) {
                console.log("    es 3D");
                horarios3d.push($(this).text());
            } else {
                console.log("    es normal");
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

    return sesiones;
};

module.exports = {
    extract: extract
};
