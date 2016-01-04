'use strict';

var cheerio = require('cheerio'),
    utils = require('../../modules/utils');

/**
 * Recorre la web y extrae las sesiones de ella
 */
var extract = function (body) {
    var $ = cheerio.load(body), sesiones = [];

    $('div.info-line').each(function () {

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
